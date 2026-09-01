# Nook — Component Patterns

This file is intentionally a registry, not a giant CSS specification.

`/capture-ui` updates it when a successful reusable pattern is established.

---

# Brand Wordmark

**Purpose:** lightweight Nook identity in auth, marketing, app shell.

- text: `nook`
- lowercase
- understated weight
- tight but readable tracking
- no decorative logo required initially

---

# Primary Button

**Use for:** the single most important action in a region.

Pattern:
- Nook blue surface
- high-contrast text
- medium radius
- clear focus ring
- subtle hover darkening
- slight press feedback
- loading state preserves width where practical

Avoid:
- multiple primary buttons competing next to each other

---

# Secondary Button

**Use for:** meaningful alternative action.

Pattern:
- neutral surface
- subtle border
- dark/light semantic text
- same physical dimensions as equivalent primary button

---

# Auth Form

**Use for:** sign in, sign up, reset password.

Pattern:
- constrained readable width
- clear heading/subcopy
- OAuth action near top
- simple divider
- label + input + inline error
- primary submit
- low-emphasis footer link
- no giant floating form card unless layout needs it
- mobile first

---

# App Sidebar

**Use for:** authenticated navigation.

Pattern:
- compact width
- subtle border/background separation
- simple line icons
- clear active state
- restrained hover
- primary product sections first
- settings/account secondary
- responsive drawer on small screens

---

# Page Header

Pattern:
- title
- one-line context where useful
- actions aligned to right on desktop
- stack actions on narrow screens
- avoid huge marketing-style headings inside app pages

---

# Data Row / Job Row

Pattern:
- clear primary label/title
- secondary company/location metadata
- match/status aligned consistently
- hover state if actionable
- no unnecessary card around every row
- responsive priority: title → company → status/match → secondary metadata

---

# Status Badge

Use only for semantic state.

Examples:
- APPLIED
- INTERVIEW
- FAILED
- 92% MATCH

Pattern:
- small
- restrained color
- high readability
- consistent capitalization convention

---

# Empty State

Pattern:
- short explanation
- one next action
- optional subtle icon
- no oversized illustration by default

---

# Modal / Dialog

Pattern:
- focused task
- clear title
- concise explanation
- primary/secondary actions
- escape/close behavior
- focus trap
- mobile-safe
- avoid putting entire complex pages in dialogs

---

# New patterns

When a component becomes a repeated visual language element:

run `/capture-ui <component>`.

Record stable rules here instead of copy-pasting arbitrary class lists.
