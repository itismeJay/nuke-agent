import type { CareerProfileData } from "@/lib/profile/queries"

import { AnswersSection } from "./answers-section"
import { CertificationsSection } from "./certifications-section"
import { EducationSection } from "./education-section"
import { ExperienceSection } from "./experience-section"
import { PersonalSection } from "./personal-section"
import { PreferencesSection } from "./preferences-section"
import { ProjectsSection } from "./projects-section"
import { SectionNav } from "./section-nav"
import { SkillsSection } from "./skills-section"

export function ProfileWorkspace({ data }: { data: CareerProfileData }) {
  return (
    <div className="grid gap-8 lg:grid-cols-[220px_1fr]">
      <aside className="order-first hidden lg:block">
        <SectionNav completeness={data.completeness} />
      </aside>

      <div className="flex min-w-0 flex-col gap-6">
        <div className="lg:hidden">
          <SectionNav completeness={data.completeness} />
        </div>

        <PersonalSection profile={data.profile} />
        <ExperienceSection experiences={data.experiences} />
        <SkillsSection skills={data.skills} catalog={data.catalog} />
        <ProjectsSection projects={data.projects} />
        <EducationSection education={data.education} />
        <CertificationsSection certifications={data.certifications} />
        <PreferencesSection preferences={data.preferences} />
        <AnswersSection answers={data.answers} />
      </div>
    </div>
  )
}
