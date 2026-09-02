import { writeFileSync } from "node:fs"
import { execSync } from "node:child_process"

// Regenerate lib/supabase/database.types.ts from the LOCAL supabase stack when
// it is running, else fall back to the linked remote project.
// Usage: node scripts/gen-types.mjs  (wired as `npm run gen:types`)

const OUT = "lib/supabase/database.types.ts"
const PROJECT_REF = "lemtlbepgrkltkmjbmqy"

function run(cmd) {
  return execSync(cmd, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] })
}

let types
try {
  types = run("npx supabase gen types typescript --local")
  console.log("Generated types from the local Supabase stack.")
} catch {
  types = run(`npx supabase gen types typescript --project-id ${PROJECT_REF}`)
  console.log("Local stack unavailable — generated types from the remote project.")
}

writeFileSync(OUT, types)
console.log(`Wrote ${OUT}`)
