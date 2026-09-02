"use client"

import { PlusIcon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { deleteProject, saveProject } from "@/lib/profile/actions"
import type { ProjectWithSkills } from "@/lib/profile/queries"

import { formatRange } from "./format"
import { DeleteButton, Labeled, RecordDialog } from "./form-kit"
import { EmptyHint, RecordRow, SectionCard } from "./section-card"

function ProjectFields({
  project,
  fieldErrors,
}: {
  project?: ProjectWithSkills
  fieldErrors?: Record<string, string>
}) {
  return (
    <>
      {project ? <input type="hidden" name="id" value={project.id} /> : null}
      <Labeled label="Project name" htmlFor="name" error={fieldErrors?.name}>
        <Input id="name" name="name" defaultValue={project?.name ?? ""} required />
      </Labeled>
      <div className="grid gap-4 sm:grid-cols-2">
        <Labeled label="Your role" htmlFor="role">
          <Input id="role" name="role" defaultValue={project?.role ?? ""} />
        </Labeled>
        <Labeled label="URL" htmlFor="url" error={fieldErrors?.url}>
          <Input id="url" name="url" placeholder="https://…" defaultValue={project?.url ?? ""} />
        </Labeled>
        <Labeled label="Start date" htmlFor="start_date" error={fieldErrors?.start_date}>
          <Input
            id="start_date"
            name="start_date"
            type="date"
            defaultValue={project?.start_date ?? ""}
          />
        </Labeled>
        <Labeled label="End date" htmlFor="end_date" error={fieldErrors?.end_date}>
          <Input
            id="end_date"
            name="end_date"
            type="date"
            defaultValue={project?.end_date ?? ""}
          />
        </Labeled>
      </div>
      <Labeled label="Description" htmlFor="description">
        <Textarea
          id="description"
          name="description"
          rows={3}
          defaultValue={project?.description ?? ""}
        />
      </Labeled>
      <Labeled
        label="Skills used"
        htmlFor="skill_names"
        hint="Comma-separated. New skills are added to your catalog."
      >
        <Input
          id="skill_names"
          name="skill_names"
          defaultValue={project?.skills.map((s) => s.name).join(", ") ?? ""}
          placeholder="React, TypeScript, PostgreSQL"
        />
      </Labeled>
    </>
  )
}

export function ProjectsSection({ projects }: { projects: ProjectWithSkills[] }) {
  return (
    <SectionCard
      id="projects"
      title="Projects"
      description="Things you've built — work, side projects, open source."
      action={
        <RecordDialog
          title="Add project"
          triggerLabel={
            <>
              <PlusIcon className="size-4" /> Add
            </>
          }
          action={saveProject}
        >
          {({ state }) => <ProjectFields fieldErrors={state.fieldErrors} />}
        </RecordDialog>
      }
    >
      {projects.length === 0 ? (
        <EmptyHint>No projects yet.</EmptyHint>
      ) : (
        <div>
          {projects.map((project) => (
            <RecordRow
              key={project.id}
              title={
                project.url ? (
                  <a
                    href={project.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline-offset-4 hover:underline"
                  >
                    {project.name}
                  </a>
                ) : (
                  project.name
                )
              }
              meta={
                [project.role, formatRange(project.start_date, project.end_date)]
                  .filter(Boolean)
                  .join(" · ") || undefined
              }
              actions={
                <RecordDialog
                  title="Edit project"
                  triggerLabel="Edit"
                  triggerVariant="ghost"
                  action={saveProject}
                  onDelete={<DeleteButton action={deleteProject} id={project.id} />}
                >
                  {({ state }) => (
                    <ProjectFields project={project} fieldErrors={state.fieldErrors} />
                  )}
                </RecordDialog>
              }
            >
              {project.description ? (
                <p className="text-sm text-muted-foreground">{project.description}</p>
              ) : null}
              {project.skills.length > 0 ? (
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {project.skills.map((skill) => (
                    <Badge key={skill.id} variant="outline" className="font-normal">
                      {skill.name}
                    </Badge>
                  ))}
                </div>
              ) : null}
            </RecordRow>
          ))}
        </div>
      )}
    </SectionCard>
  )
}
