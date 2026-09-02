import { Client } from "pg"
import { afterAll, describe, expect, it } from "vitest"

/**
 * Tenant-isolation proof for the Career Profile schema (D-018).
 *
 * Runs against a real Postgres — the local Supabase stack by default
 * (`supabase start` → 127.0.0.1:54322), or whatever `SUPABASE_DB_URL` points
 * at in CI. Every assertion runs inside a transaction that is rolled back, so
 * the database is left untouched.
 *
 * It connects as the `postgres` superuser and uses `SET LOCAL ROLE` +
 * `request.jwt.claims` to impersonate `authenticated` / `anon` exactly as
 * PostgREST does — so it exercises the same RLS policies and foreign keys the
 * app hits, without needing the auth server. If no database is reachable the
 * suite skips loudly rather than passing silently.
 */

const CONNECTION_STRING =
  process.env.SUPABASE_DB_URL ??
  "postgresql://postgres:postgres@127.0.0.1:54322/postgres"

const USER_A = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa"
const USER_B = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb"

const client = new Client({ connectionString: CONNECTION_STRING })

let reachable = false
try {
  await client.connect()
  reachable = true
} catch {
  console.warn(
    `[db-tests] no database at ${CONNECTION_STRING} — run \`supabase start\` ` +
      `or set SUPABASE_DB_URL. Skipping tenant-isolation suite.`,
  )
}

afterAll(async () => {
  if (reachable) await client.end()
})

/** Run `body` in a rolled-back transaction with two fresh tenants seeded. */
async function withTenants(
  body: (ctx: {
    profileA: string
    profileB: string
    asUser: (id: string) => Promise<void>
    asAnon: () => Promise<void>
  }) => Promise<void>,
) {
  await client.query("BEGIN")
  try {
    await client.query(
      `insert into auth.users (id, instance_id, aud, role, email, encrypted_password, created_at, updated_at)
       values
         ($1,'00000000-0000-0000-0000-000000000000','authenticated','authenticated','tenant-a@example.test','x',now(),now()),
         ($2,'00000000-0000-0000-0000-000000000000','authenticated','authenticated','tenant-b@example.test','x',now(),now())`,
      [USER_A, USER_B],
    )
    const { rows } = await client.query<{ user_id: string; id: string }>(
      `select user_id, id from public.profile where user_id = any($1::uuid[])`,
      [[USER_A, USER_B]],
    )
    const profileA = rows.find((r) => r.user_id === USER_A)?.id
    const profileB = rows.find((r) => r.user_id === USER_B)?.id
    if (!profileA || !profileB) {
      throw new Error("handle_new_user trigger did not seed both profiles")
    }

    const applyClaims = async (claims: Record<string, string>, role: string) => {
      await client.query("RESET ROLE")
      await client.query(`SET LOCAL ROLE ${role}`)
      await client.query("SELECT set_config('request.jwt.claims', $1, true)", [
        JSON.stringify(claims),
      ])
    }

    await body({
      profileA,
      profileB,
      asUser: (id) => applyClaims({ sub: id, role: "authenticated" }, "authenticated"),
      asAnon: () => applyClaims({ role: "anon" }, "anon"),
    })
  } finally {
    await client.query("ROLLBACK")
  }
}

/**
 * Assert a query fails with a specific SQLSTATE. A failed statement poisons the
 * surrounding transaction, so wrap it in a savepoint we can roll back to.
 */
async function expectSqlState(
  code: string,
  run: () => Promise<unknown>,
): Promise<void> {
  await client.query("SAVEPOINT s")
  let error: { code?: string } | undefined
  try {
    await run()
  } catch (caught) {
    error = caught as { code?: string }
  }
  await client.query("ROLLBACK TO SAVEPOINT s")
  expect(error, "expected the query to fail").toBeDefined()
  expect(error?.code).toBe(code)
}

const suite = reachable ? describe : describe.skip

suite("Career Profile tenant isolation", () => {
  it("a tenant can create its own profile children", async () => {
    await withTenants(async ({ profileA, asUser }) => {
      await asUser(USER_A)
      const exp = await client.query(
        `insert into public.experience (user_id, profile_id, company, title)
         values ($1, $2, 'ACME', 'Engineer') returning id`,
        [USER_A, profileA],
      )
      expect(exp.rows).toHaveLength(1)
      await client.query(
        `insert into public.experience_achievement (user_id, experience_id, content)
         values ($1, $2, 'Shipped it')`,
        [USER_A, exp.rows[0].id],
      )
      await client.query(
        `insert into public.certification (user_id, profile_id, name)
         values ($1, $2, 'AWS SAA')`,
        [USER_A, profileA],
      )
    })
  })

  it("a tenant cannot read, update or delete another tenant's rows", async () => {
    await withTenants(async ({ profileA, asUser }) => {
      await asUser(USER_A)
      const { rows } = await client.query(
        `insert into public.experience (user_id, profile_id, company, title)
         values ($1, $2, 'ACME', 'Engineer') returning id`,
        [USER_A, profileA],
      )
      const expA = rows[0].id

      await asUser(USER_B)
      const seen = await client.query(
        `select * from public.experience where id = $1`,
        [expA],
      )
      expect(seen.rows).toHaveLength(0)
      expect(
        (await client.query(`update public.experience set title = 'x' where id = $1`, [expA]))
          .rowCount,
      ).toBe(0)
      expect(
        (await client.query(`delete from public.experience where id = $1`, [expA])).rowCount,
      ).toBe(0)
    })
  })

  it("a composite FK rejects a child pointing at another tenant's parent", async () => {
    await withTenants(async ({ profileA, asUser }) => {
      await asUser(USER_A)
      const { rows } = await client.query(
        `insert into public.experience (user_id, profile_id, company, title)
         values ($1, $2, 'ACME', 'Engineer') returning id`,
        [USER_A, profileA],
      )
      const expA = rows[0].id

      await asUser(USER_B)

      // B's user_id + A's profile_id
      await expectSqlState("23503", () =>
        client.query(
          `insert into public.certification (user_id, profile_id, name) values ($1, $2, 'x')`,
          [USER_B, profileA],
        ),
      )
      // B's user_id + A's experience_id
      await expectSqlState("23503", () =>
        client.query(
          `insert into public.experience_achievement (user_id, experience_id, content) values ($1, $2, 'x')`,
          [USER_B, expA],
        ),
      )
      // profile_skill onto A's profile
      await expectSqlState("23503", () =>
        client.query(
          `insert into public.profile_skill (user_id, profile_id, skill_id)
           values ($1, $2, (select id from public.skill limit 1))`,
          [USER_B, profileA],
        ),
      )
    })
  })

  it("RLS WITH CHECK blocks inserting a row owned by another tenant", async () => {
    await withTenants(async ({ profileB, asUser }) => {
      await asUser(USER_B)
      await expectSqlState("42501", () =>
        client.query(
          `insert into public.certification (user_id, profile_id, name) values ($1, $2, 'x')`,
          [USER_A, profileB],
        ),
      )
    })
  })

  it("anon sees no private rows and no skill catalog", async () => {
    await withTenants(async ({ profileA, asUser, asAnon }) => {
      await asUser(USER_A)
      await client.query(
        `insert into public.experience (user_id, profile_id, company, title)
         values ($1, $2, 'ACME', 'Engineer')`,
        [USER_A, profileA],
      )
      await asAnon()
      expect(
        (await client.query(`select count(*)::int as n from public.experience`)).rows[0].n,
      ).toBe(0)
      expect(
        (await client.query(`select count(*)::int as n from public.skill`)).rows[0].n,
      ).toBe(0)
    })
  })

  it("an authenticated tenant can read the shared skill catalog", async () => {
    await withTenants(async ({ asUser }) => {
      await asUser(USER_A)
      expect(
        (await client.query(`select count(*)::int as n from public.skill`)).rows[0].n,
      ).toBeGreaterThan(0)
    })
  })

  it("the skill catalog is append-only for an authenticated user", async () => {
    await withTenants(async ({ asUser }) => {
      await asUser(USER_A)

      // insert a new skill — allowed
      await client.query(
        `insert into public.skill (slug, name) values ('brand-new-xyz', 'Brand New XYZ')`,
      )
      // insert-ignore an existing slug — no-op, not an error
      await client.query(
        `insert into public.skill (slug, name) values ('typescript', 'typescript')
         on conflict (slug) do nothing`,
      )
      // update / delete — blocked (no policy), so 0 rows affected
      expect(
        (await client.query(`update public.skill set name = 'x' where slug = 'typescript'`))
          .rowCount,
      ).toBe(0)
      expect(
        (await client.query(`delete from public.skill where slug = 'brand-new-xyz'`)).rowCount,
      ).toBe(0)
    })
  })
})
