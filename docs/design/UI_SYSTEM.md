# Nook — UI System

This file is the visual source of truth for Nook.

External screenshots and websites are **references**, not specifications.
If a reference conflicts with this file, follow this file unless a design decision explicitly updates it.

---

## Brand

Product name:

`nook`

Use lowercase in normal product branding.

Nook should feel like a calm, intelligent, premium workspace for a user's career.

### Personality

- modern
- minimal
- calm
- premium
- trustworthy
- focused
- intelligent
- warm enough for a consumer product
- disciplined enough for serious SaaS

### Avoid

- generic AI-purple branding
- crypto/Web3 aesthetic
- excessive gradients
- heavy glassmorphism
- cartoonish illustrations everywhere
- huge border radii on every surface
- excessive drop shadows
- visual noise
- tiny content floating inside enormous unused space
- over-animated dashboards

---

# Visual Inspiration

Nook does not clone these products.

Use them as quality bars:

- **Linear** — app shell, sidebar, density, interaction restraint
- **Attio** — records, tables, details, agent/workflow surfaces
- **Framer** — marketing storytelling and polished motion
- **Clerk** — authentication form hierarchy
- **Resend / Vercel** — typography and restraint

The goal is:

Nook identity
+
best-in-class SaaS interaction quality

---

# Color System

Use semantic design tokens instead of scattering hardcoded colors through components.

## Light

Page background:
warm neutral / near-white

Surface:
white

Primary text:
near-black

Secondary text:
neutral gray

Muted text:
lighter neutral gray

Border:
subtle neutral

Muted surface:
soft warm/neutral gray

Primary action:
Nook blue

Recommended initial blue:
`#3B6FE8`

Hover:
a slightly darker derived blue

Focus ring:
primary blue with accessible contrast

Success:
restrained green

Warning:
restrained amber

Danger:
restrained red

Do not use semantic colors decoratively.

## Dark

Dark mode should not simply invert light mode.

Use:
- near-black background
- slightly elevated neutral surfaces
- subtle borders
- softened white text
- reduced shadow dependence

Preserve the same semantic hierarchy.

---

# Typography

Preferred font:
Geist or another approved high-quality modern sans-serif through `next/font`.

Do not introduce multiple unrelated font families.

## Hierarchy

Display / landing hero:
large, confident, tight tracking

Page H1:
clear and strong, not oversized

Section heading:
compact

Body:
comfortable reading size

Labels:
small but never tiny

Captions:
muted but accessible

Avoid 11px/12px text for important information.

---

# Spacing

Use a consistent spacing scale.

Prefer intentional grouping:

- tighter spacing inside a conceptual group
- larger spacing between unrelated sections

Do not use whitespace as decoration if it weakens information density.

Authenticated product surfaces should generally be denser than marketing pages.

---

# Radius

Use restrained radius.

General guidance:

- inputs/buttons: medium radius
- cards/panels: medium radius
- modals: slightly larger
- pills only for actual pill-like controls/statuses

Do not turn every rectangle into a large rounded blob.

---

# Borders & Depth

Primary depth strategy:

1. background contrast
2. subtle border
3. only then subtle shadow where necessary

Do not use heavy shadows as the default surface separator.

---

# Buttons

Use clear hierarchy:

## Primary
Main action on the page.

## Secondary
Alternative but meaningful action.

## Ghost
Low-emphasis toolbar/navigation action.

## Destructive
Only destructive behavior.

Buttons should include:

- default
- hover
- focus-visible
- active
- disabled
- loading

Avoid multiple visually competing primary buttons in one section.

---

# Inputs

Inputs should feel precise and calm.

Expected:

- accessible label
- helper text where useful
- error text near field
- visible focus
- sufficient hit area
- valid autocomplete attributes
- loading/disabled state

Authentication inputs should feel premium and uncluttered.

---

# Cards / Panels

Cards are not mandatory for every group.

Use a card when the content benefits from a distinct surface.

Prefer:
- subtle border
- minimal shadow
- clear header/body hierarchy
- consistent padding

Avoid dashboards made from dozens of floating cards with no information hierarchy.

---

# Navigation

## Marketing navigation

Minimal.

Brand left.
Small number of meaningful actions right.

## Application sidebar

Inspired by disciplined productivity tools:

- compact
- clear active state
- simple iconography
- low visual noise
- grouped secondary items
- account/settings at bottom where appropriate

Navigation should not dominate content.

---

# Tables / Lists

For jobs, applications, admin, agent runs:

- compact but readable
- sticky headers only when useful
- status represented consistently
- row hover
- keyboard/focus behavior where interactive
- sensible empty state
- filters separated from data
- avoid unnecessary card wrapping around every row

---

# Status / Badges

Badges are semantic.

Examples:
- match score
- application status
- run state
- automation state

Use restrained color coding.

Do not turn every metadata label into a colored pill.

---

# Icons

Use the project's approved icon library consistently.

Prefer:
- small
- aligned to text baseline
- meaning-supporting

Do not use icons purely to fill space.

---

# Empty States

Good empty state:

- explains why the space is empty
- tells user what to do next
- uses one clear CTA when appropriate

Bad empty state:

"Nothing here."

---

# Loading

Prefer skeletons when layout is known.

Use spinners for:
- short actions
- buttons
- small unknown-duration operations

Do not block entire pages unnecessarily.

---

# Error States

User-facing errors must be useful.

Show:
- what failed in user-safe language
- recovery/retry when possible

Do not display raw provider/database exceptions.

---

# Responsive Rules

Design mobile deliberately.

Do not merely shrink desktop.

Consider:
- sidebar → drawer/bottom pattern
- tables → responsive list or horizontal strategy
- filters → sheet/popover
- large split layouts → stack
- dense data → prioritize key fields

No horizontal page overflow at ordinary mobile widths.

---

# Accessibility

Required:

- semantic HTML
- keyboard support
- visible focus
- sufficient contrast
- labels
- logical headings
- screen-reader statuses/errors
- reduced motion
- reasonable touch targets

Accessibility is part of quality, not optional polish.

---

# Design Rule

When creating a new page:

Reuse existing Nook patterns first.

If a genuinely new reusable pattern is introduced and accepted, run:

`/capture-ui`

so the design system evolves intentionally.
