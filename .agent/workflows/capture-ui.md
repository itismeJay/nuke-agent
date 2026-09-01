# /capture-ui

Pattern/page to capture:

$ARGUMENTS

Purpose: preserve a successful visual pattern so future pages remain consistent.

This is not a screenshot dump.

## Inspect

Read:

- current implementation of the supplied component/page
- `docs/design/UI_SYSTEM.md`
- `docs/design/COMPONENT_PATTERNS.md`
- `docs/design/PAGE_PATTERNS.md`

Identify what is truly reusable.

## Capture only stable design rules

Potentially record:

- component purpose
- visual hierarchy
- semantic tokens/classes
- border/radius treatment
- typography
- spacing
- icon sizing
- hover/focus/active states
- loading/empty/error behavior
- motion behavior
- accessibility rules
- when to use
- when not to use

Do NOT capture as a universal rule:

- arbitrary width/height specific to one page
- one-off grid structure
- absolute positioning
- z-index values unless they belong to a documented system
- accidental implementation quirks

## Destination

If it is a component pattern:
update `docs/design/COMPONENT_PATTERNS.md`

If it is a page/layout pattern:
update `docs/design/PAGE_PATTERNS.md`

If it changes the global visual language:
update `docs/design/UI_SYSTEM.md`

If it establishes a reusable motion pattern:
update `docs/design/MOTION_SYSTEM.md`

If it is inspired by an external screenshot/reference:
update `docs/design/references/README.md` with what was borrowed conceptually.

Never copy proprietary branding or claim another product's pattern as Nook's original asset.

## Final report

State:
- pattern captured
- destination file(s)
- rules recorded
- context-dependent details intentionally excluded

Do not change production UI unless explicitly requested.
