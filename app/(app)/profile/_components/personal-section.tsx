"use client"

import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { savePersonalInfo } from "@/lib/profile/actions"
import type { ProfileRow } from "@/lib/profile/queries"

import { ActionForm, Labeled, SubmitButton } from "./form-kit"
import { SectionCard } from "./section-card"

export function PersonalSection({ profile }: { profile: ProfileRow }) {
  const links = (profile.links ?? {}) as Record<string, string>

  return (
    <SectionCard
      id="personal"
      title="Personal info"
      description="Your name, headline, and how employers reach you."
    >
      {/* key on updated_at: after a save, remount so uncontrolled inputs treat
          the fresh values as their initial state, not a changed default. */}
      <ActionForm
        key={profile.updated_at}
        action={savePersonalInfo}
        successMessage="Personal info saved"
        className="grid gap-4 sm:grid-cols-2"
      >
        {({ state }) => (
          <>
            <Labeled label="Full name" htmlFor="full_name" error={state.fieldErrors?.full_name}>
              <Input id="full_name" name="full_name" defaultValue={profile.full_name ?? ""} />
            </Labeled>
            <Labeled label="Headline" htmlFor="headline" error={state.fieldErrors?.headline}>
              <Input
                id="headline"
                name="headline"
                placeholder="Senior Frontend Engineer"
                defaultValue={profile.headline ?? ""}
              />
            </Labeled>
            <Labeled label="Email" htmlFor="email" error={state.fieldErrors?.email}>
              <Input id="email" name="email" type="email" defaultValue={profile.email ?? ""} />
            </Labeled>
            <Labeled label="Phone" htmlFor="phone" error={state.fieldErrors?.phone}>
              <Input id="phone" name="phone" defaultValue={profile.phone ?? ""} />
            </Labeled>
            <Labeled label="Location" htmlFor="location" error={state.fieldErrors?.location}>
              <Input
                id="location"
                name="location"
                placeholder="Berlin, Germany"
                defaultValue={profile.location ?? ""}
              />
            </Labeled>
            <Labeled
              label="LinkedIn"
              htmlFor="link_linkedin"
              error={state.fieldErrors?.link_linkedin}
            >
              <Input
                id="link_linkedin"
                name="link_linkedin"
                placeholder="https://linkedin.com/in/…"
                defaultValue={links.linkedin ?? ""}
              />
            </Labeled>
            <Labeled label="GitHub" htmlFor="link_github" error={state.fieldErrors?.link_github}>
              <Input
                id="link_github"
                name="link_github"
                placeholder="https://github.com/…"
                defaultValue={links.github ?? ""}
              />
            </Labeled>
            <Labeled
              label="Website"
              htmlFor="link_website"
              error={state.fieldErrors?.link_website}
            >
              <Input
                id="link_website"
                name="link_website"
                placeholder="https://…"
                defaultValue={links.website ?? ""}
              />
            </Labeled>
            <Labeled
              label="Summary"
              htmlFor="summary"
              error={state.fieldErrors?.summary}
              className="sm:col-span-2"
            >
              <Textarea
                id="summary"
                name="summary"
                rows={4}
                placeholder="A short professional summary in your own words."
                defaultValue={profile.summary ?? ""}
              />
            </Labeled>
            <div className="sm:col-span-2">
              <SubmitButton>Save personal info</SubmitButton>
            </div>
          </>
        )}
      </ActionForm>
    </SectionCard>
  )
}
