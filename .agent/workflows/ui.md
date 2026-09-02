# /ui

Target page/component:

$ARGUMENTS

Purpose: design or redesign a production-quality UI while preserving application behavior.

This workflow is for implementation, not vague visual brainstorming.

## First: inspect before changing UI

Read:

- `docs/design/UI_SYSTEM.md`
- `docs/design/MOTION_SYSTEM.md`
- `docs/design/COMPONENT_PATTERNS.md`
- `docs/design/PAGE_PATTERNS.md`
- `docs/design/references/README.md`
- `docs/project/CURRENT_STATE.md`
- relevant feature specification
- current page/component implementation
- existing design tokens/global styles
- existing shared UI components
- existing responsive behavior

If screenshots or visual references are supplied in the conversation, inspect them and extract **patterns**, not branding to clone.

Do not copy another product pixel-for-pixel.

## Component Library Requirement

Use shadcn/ui as the default component library (this repo uses the Base UI variant).

Before creating custom UI primitives, inspect the existing `components/ui`
directory and determine whether an appropriate shadcn/ui component already exists.

If the required shadcn component is not installed, add it with the shadcn CLI
(`npx shadcn add <name>`) rather than rebuilding the primitive manually.

Prefer composition and customization of shadcn components over custom replacements.
Only build a custom primitive when shadcn cannot reasonably provide the required
behavior, or the behavior is genuinely product-specific.

## Preserve functionality

Before editing identify:

- current routes
- forms
- actions
- loading/error states
- auth/session behavior
- data fetching
- accessibility semantics
- tests

Do not break working business/auth/database logic for visual polish.

## Design objective

The result should feel like a modern, premium SaaS product:

- minimalist
- intentional
- responsive
- highly readable
- subtle depth
- strong hierarchy
- polished interaction feedback
- restrained motion
- coherent with the rest of the product

Avoid:

- generic "AI purple gradient" styling
- excessive glassmorphism
- giant rounded cards everywhere
- random shadows
- excessive empty space
- tiny content floating in huge canvases
- animation on every element
- decorative complexity with no UX value

## Inspiration model

For Nook, treat references approximately like:

- Linear → app shell, sidebar, density, interaction restraint
- Attio → data-heavy product views, record/detail pages, agent panels
- Framer → landing-page storytelling and motion
- Clerk → auth hierarchy and account flows
- Resend/Vercel → typography, spacing, visual restraint

These are inspiration sources only.

## Implementation process

### 1. Establish hierarchy

Identify:

- primary user task
- primary CTA
- secondary actions
- page title/context
- sections
- empty/loading/error states

### 2. Reuse before inventing

Prefer existing:

- design tokens
- Button
- Input
- Card
- Badge
- Dialog
- Dropdown
- Tabs
- Sidebar
- PageHeader
- EmptyState
- Skeleton

If a reusable pattern does not exist and will be reused, create it carefully.

Do not abstract one-off trivial markup.

### 3. Responsive design

Verify at minimum:

- ~320px
- ~375–390px
- tablet
- desktop
- wide desktop where relevant

Avoid fixed widths that overflow.
Navigation must remain usable.
Touch targets should generally be at least ~44px where practical.

### 4. Motion

Use CSS/Tailwind transitions for simple states.

Use the project's approved motion library only for interactions that actually benefit from orchestration, layout animation, scroll reveal, or shared transitions.

Follow `MOTION_SYSTEM.md`.

Motion must:
- reinforce hierarchy
- communicate state
- provide feedback
- remain fast

Respect reduced-motion preferences.

### 5. Accessibility

Check:

- semantic headings
- labels
- keyboard navigation
- visible focus
- contrast
- screen-reader errors/status
- reduced motion
- logical tab order
- touch target size

### 6. States

Every meaningful interactive surface should account for relevant:

- default
- hover
- focus-visible
- active
- disabled
- loading
- empty
- error
- success

### 7. Visual consistency

Check against `COMPONENT_PATTERNS.md`:

- radius
- border
- typography
- spacing
- button hierarchy
- input height
- card treatment
- table density
- badge treatment
- icon sizing
- shadows
- colors

## Verification

Run relevant:

- lint
- typecheck
- targeted tests
- production build

If browser/screenshot tooling is available, visually inspect the changed page at mobile and desktop sizes.

Do not claim visual verification if you did not actually inspect the result.

## Final report

Return:

- design goal
- files changed
- reusable components created/updated
- motion added
- responsive behavior
- accessibility improvements
- functionality preserved
- tests/checks run
- any design-system changes that should be captured

If a new reusable visual pattern was established, recommend `/capture-ui`.

Do not start unrelated feature work.
