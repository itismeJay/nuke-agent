# /ui-review

Target:

$ARGUMENTS

Purpose: perform a focused visual/product-UI review without automatically rewriting the page.

Inspect the actual implementation and, when available, the rendered page/screenshot.

Read:

- `docs/design/UI_SYSTEM.md`
- `docs/design/MOTION_SYSTEM.md`
- `docs/design/COMPONENT_PATTERNS.md`
- `docs/design/PAGE_PATTERNS.md`

## Review categories

### 1. Product hierarchy
- Is the main task obvious?
- Is the primary CTA clear?
- Is content ordered by importance?

### 2. Visual hierarchy
- typography
- contrast
- spacing
- grouping
- alignment
- density

### 3. Design-system consistency
- tokens
- radius
- borders
- shadows
- components
- iconography
- color use

### 4. SaaS polish
- empty states
- loading states
- status feedback
- hover/focus/active states
- detail density
- perceived quality

### 5. Motion quality
- does motion explain or provide feedback?
- is anything over-animated?
- are timings coherent?
- reduced-motion support?

### 6. Responsiveness
Review likely behavior at:
- mobile
- tablet
- desktop
- wide desktop

### 7. Accessibility
- contrast
- keyboard navigation
- focus
- labels
- semantic structure
- target sizes
- reduced motion

### 8. Functional risk
Identify any styling/layout change that could break:
- forms
- auth
- scrolling
- modals
- navigation
- data tables
- overflow
- long text
- localization

## Findings

Use:

- MUST FIX
- SHOULD FIX
- OPTIONAL POLISH

For each:
- location
- observation
- UX impact
- recommended direction

End with:

## Visual Verdict
- POLISHED
- GOOD BUT NEEDS POLISH
- NOT READY

## Top 3 Improvements

## Patterns Worth Preserving

Do not modify files unless explicitly asked.
