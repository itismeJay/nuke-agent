# Nook — Motion System

Motion is part of product feedback, not decoration.

Nook should feel polished and alive without feeling busy.

---

# Principles

Use motion to:

- reinforce hierarchy
- explain state changes
- connect cause and effect
- make navigation feel coherent
- provide tactile feedback
- tell product stories on marketing pages

Do not use motion simply because a library makes it easy.

---

# Default Tooling

## CSS / Tailwind transitions

Use for:

- hover
- focus
- button press
- color
- opacity
- border
- small transforms
- sidebar/control state

## Motion library

Use the project's approved React motion library for:

- orchestrated entrance sequences
- layout/shared-layout transitions
- scroll reveals
- animated tabs/indicators
- significant panel transitions
- product-story animations
- selected list reordering/state changes

Do not import a motion library for a simple hover.

---

# Timing Guidance

These are defaults, not hardcoded universal laws.

## Micro interaction
~120–180ms

Examples:
button hover, icon feedback, subtle card response

## Menus / popovers / small overlays
~160–220ms

## Dialog / drawer / panel
~180–280ms

## Page section entrance
~250–450ms

## Marketing hero sequence
~400–700ms total orchestration

Avoid multi-second interface animations.

---

# Easing

Entrances:
ease-out style

Exits:
faster ease-in style

Springs:
only where a physical/layout interaction benefits from them

Avoid overly bouncy springs for professional SaaS UI.

---

# Marketing Motion

Landing pages may be more expressive.

Good candidates:

- staggered hero content
- product preview reveal
- scrolling workflow visualization
- subtle parallax
- masked screenshot/product transitions
- animated connection between Profile → Match → Resume → Apply
- counters only where metrics are real

Avoid:
- constant floating everywhere
- huge background blob animations
- autoplay effects that distract from reading
- fake metrics

---

# Product/App Motion

Authenticated workspace motion should be restrained.

Use:

- sidebar active-state transitions
- tabs
- dialogs
- command menus
- toasts
- loading/success
- list insertion/removal
- status transitions
- subtle hover response

Avoid scroll-triggered entrance animations on every dashboard card.

The app should feel fast before it feels cinematic.

---

# Suggested Page-Load Sequence for Marketing Hero

Example:

0ms      navigation
80ms     eyebrow/context
140ms    headline
220ms    supporting copy
300ms    CTA group
420ms    product visual

Keep sequence quick enough that the user does not wait for content.

---

# Card Interaction

If a card is clickable:

Possible hover behavior:
- border strengthens slightly
- translateY approximately -1px to -2px if appropriate
- shadow/depth increases subtly

Do not make every card visibly jump.

---

# Reduced Motion

Respect:

`prefers-reduced-motion`

When reduced motion is requested:

- remove non-essential transforms
- disable parallax
- minimize orchestration
- keep state changes understandable through opacity/color or immediate transitions

---

# Performance

Prefer transform and opacity animations.

Avoid expensive layout-thrashing animations.

Do not ship a large animation dependency for one trivial effect.

---

# Motion Rule

If the user cannot explain what an animation communicates, consider removing it.
