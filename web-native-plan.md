# RxPharmily — Making the Web View Feel Web-Native

A concrete, sequenced plan for the 10 items below. No code yet — this is the
plan to work from once you're ready to start.

## Guiding principle

Every item here is additive on top of the existing mobile behavior, not a
replacement for it. The pattern already established this session — branch
on `Platform.OS === "web"` (or a viewport-width check, see Phase 1) and keep
the native path byte-for-byte untouched — should hold for all of these.
Native regressions are the main risk to actively guard against throughout.

---

## Suggested order and why

Phase 1 is infrastructure the rest of the plan leans on — building the
structural items before that foundation exists means redoing work.
Phase 2 is low-risk, high-visibility polish that can happen in parallel
with Phase 1, any time, in any order. Phase 3 is the real structural
rework and is the highest-risk phase, so it comes last, after the
foundation and the safe wins are in place. Phase 4 is a small, isolated
change that can slot in anywhere.

```
Phase 1 (foundation)     →  Phase 3 (structural, depends on Phase 1)
Phase 2 (polish)         →  independent, any time
Phase 4 (toast)          →  independent, any time
```

---

## Phase 1 — Foundation

### 1. Viewport-width breakpoints (not just web vs. native)

**Why first:** almost everything else below — the max-width wrapper, the
grid, deciding when to drop a per-screen titlebar — needs to know the
*actual* viewport width, not just "is this web." A `Platform.OS === "web"`
check treats a narrow, split-screen browser window the same as an
ultrawide monitor, which is wrong for anything width-sensitive.

**Approach:**
- A small shared hook, something like `useViewportWidth()` or
  `useBreakpoint()`, built on React Native's `useWindowDimensions()` (this
  already updates on resize, on both web and native, with no extra
  listener wiring needed).
- Define 2–3 named breakpoints up front rather than inventing pixel
  numbers ad hoc per screen — e.g. `compact` (phone-width/split-screen),
  `regular` (a typical laptop window), `wide` (large monitor). Exact pixel
  values are a design decision, not an engineering one — worth picking
  with actual screenshots of the sidebar shell at a few widths rather than
  guessing.
- This hook becomes the single source of truth every other web-specific
  layout decision reads from, instead of each screen re-deriving its own
  logic.

**Touches:** one new shared hook. No existing files change yet — this is
pure setup.

**Risk:** low. Purely additive, nothing consumes it yet.

---

### 2. Shared max-width wrapper

**Why here:** this is the single biggest fix for the "stretched phone app"
look, and every other layout item (titlebar removal, the grid) should be
built to sit inside it rather than each screen picking its own value.

**Approach:**
- One shared layout component — something like `WebPageContainer` or
  `MaxWidthLayout` — that takes a `size` prop (`narrow` / `standard` /
  `wide`) mapping to the tiers decided in item 1, centers its children, and
  is a no-op passthrough on native (so native call sites are never touched
  even if a screen adopts it early).
- Suggested tiers to start from, adjustable once you see it rendered: a
  **narrow** tier for forms and single-column reading (roughly phone-tablet
  width, comfortable line length) — think the `720px` card built earlier
  for the RFQ form redesign — a **standard** tier for most detail/browse
  screens, and a **wide** tier for anything dashboard- or table-like that
  genuinely benefits from more horizontal room.
- This is what item 6 (multi-column grid) and item 5 (titlebar removal)
  will both sit inside once they land — plan the prop shape with those two
  in mind now, even though they're built later, so this component doesn't
  need a breaking change when they arrive.

**Touches:** one new shared component. Existing screens adopt it
incrementally later (in Phase 3), not all at once here.

**Risk:** low on its own. Risk shows up later, in Phase 3, when screens
actually start using it.

---

### 3. Sidebar collapse state persistence

**Why here:** independent of everything else, low-risk, and a good early
win — no dependency on the breakpoint hook or the wrapper.

**Approach:**
- Whatever holds the sidebar's collapsed/expanded boolean today (local
  state in `WebAppShell` or similar) needs to survive a reload/navigation.
  On web this usually means writing the value somewhere that persists
  across a full page load — this app already has an established pattern
  for durable client-side preferences (theme mode is the closest
  precedent) worth reusing rather than introducing a second mechanism.
- Read the persisted value on mount before first paint if possible, to
  avoid a visible "expanded, then snaps to collapsed" flash on load — the
  same class of issue chased down earlier this session with the chat
  screens' safe-area timing, worth keeping in mind here too.

**Touches:** the sidebar shell component and wherever its collapse state
currently lives.

**Risk:** low. Self-contained, no other screens depend on this behavior.

---

## Phase 2 — Interaction polish (independent, any order, any time)

### 4. Hover states

**Approach:**
- NativeWind supports `hover:` the same way it already supports the
  `active:` classes used throughout this codebase — this is additive
  className work on existing components, not a new system.
- Priority order: primary action buttons first (submit buttons, FABs),
  then list/card rows that navigate somewhere on tap, then secondary
  controls (icon buttons, chips). Don't need to hit every `Pressable` in
  the app in one pass — the ones that matter most are the ones a user's
  mouse will hover before clicking with real intent.
- Native `active:opacity-*` styling stays exactly as-is; `hover:` is a
  pure addition alongside it, invisible on native.

**Touches:** many small className edits, spread across shared components
first (buttons, cards) for the highest leverage per change — fixing a
shared `SubmitButton`-style component once covers every screen that uses
it, same as the loading-state work done on that component earlier.

**Risk:** very low, easy to review incrementally, easy to revert per-file
if something looks off.

---

### 5. Cursor styles

**Approach:**
- Same shared-component-first strategy as hover states — a `cursor-pointer`
  utility class (or the RN Web `style.cursor` equivalent) added to the
  same interactive elements getting hover states, ideally in the same pass
  since they're testing the same thing (does this look clickable?).
- Worth explicitly checking the inverse too: disabled buttons should show
  a cursor that reads as "not clickable" (`cursor-not-allowed` or default),
  not the pointer — several buttons fixed earlier this session for
  feedback (`isSubmitting` states) are exactly the ones that need this,
  since they're disabled during a real, meaningful window.

**Touches:** same components as item 4, likely the same PRs/commits.

**Risk:** very low.

---

### 6. Text selection — only where it makes sense

**Approach:**
- Default browser behavior makes most text selectable; the actual work
  here is the opposite of what it sounds like — identifying the places
  that should turn selection *off*, not turning it on everywhere.
- Turn selection off (`userSelect: "none"` equivalent) on: button/link
  labels, nav items, tab labels, badge/pill text, icon-adjacent labels —
  anything that's UI chrome rather than content.
- Leave selection on (the default) for: post/comment bodies, RFQ/donation/
  job descriptions, chat messages, form field values, anything a user
  might reasonably want to copy.
- A reasonable implementation shape: a shared "label" text style/variant
  used by chrome elements that sets this off by default, rather than
  hunting down and annotating every individual `Text` element by hand —
  most of the app's `Text` usage for buttons and nav already goes through
  a small number of shared patterns, so this is more centralized than it
  first sounds.

**Touches:** a shared text/label styling convention, applied where chrome
text is rendered.

**Risk:** low, but needs a real pass over the app to sort chrome from
content correctly — worth a first draft plus a review pass rather than
getting it perfect in one shot.

---

## Phase 3 — Structural (higher risk, depends on Phase 1)

### 7. BottomSheet → modal/dialog on web

**Why this is the biggest lift:** this is a generalization of the fix
already built and shipped this session for the picker components (the
`WebDropdown` work) — that established the actual technical pattern
(React Native's own `Modal`, not a hand-rolled overlay, since `Modal`
portals correctly on both platforms and avoids the exact stacking-context
bug hit and fixed earlier). This item is applying that same proven pattern
to every other `BottomSheet` usage in the app, not inventing a new one.

**Known `BottomSheet` call sites from this session's work** (not
necessarily exhaustive — worth a fresh search before starting, since more
may exist elsewhere):
- Confirm/action-style sheets: `donation-claim-sheet.tsx`,
  `mediscope-response-sheet.tsx`, `apply-sheet.tsx` (currently dead code,
  worth confirming still-dead before touching), the chat screens' link/
  attach sheets.
- Picker-style sheets: already converted (`my-facility-picker.tsx`,
  `categories-multiselect.tsx`, `incoterm-selector.tsx`, the calendar in
  `date-picker.tsx`) — these don't need to be touched again, just kept as
  the reference implementation.

**Approach:**
- Rather than a bespoke web variant per screen, worth extracting a second
  shared primitive alongside `WebDropdown` — something like `WebActionSheet`
  or `WebModal` — that wraps RN `Modal`, handles the backdrop/dismiss
  behavior once, and lets each screen supply just its content. This keeps
  the fix in one place instead of 6+ near-duplicate implementations.
- Native `BottomSheet` usage stays completely untouched at every call
  site — same `Platform.OS === "web"` branch pattern as everywhere else.

**Touches:** one new shared primitive, then each `BottomSheet` call site
gets a web branch added (not rewritten) around it.

**Risk:** medium — this is the item most likely to introduce a subtle
interaction bug (focus handling, dismiss-on-outside-click, keyboard
behavior) if rushed, given how much of this session went into getting the
picker version of this exact pattern right. Worth doing one call site
first, confirming it fully, then rolling out to the rest — not all at
once.

---

### 8. Remove redundant per-screen titlebars

**Approach:**
- Every screen currently renders its own mobile-style header (back arrow +
  centered title), which sits redundantly on top of the persistent
  sidebar on web. This isn't a blanket removal — it's a per-screen
  decision: does this screen genuinely need to *be* a full page (its own
  URL, worth a back button, deep-linkable), or would it work better as a
  layer on top of the current view (a modal/slide-over) once item 7's
  modal primitive exists?
- A reasonable split to start from: **list/browse/detail screens** (RFQ
  marketplace, donation details, job listings) genuinely are pages — keep
  a page-level heading, but drop the mobile back-arrow-and-checkmark
  pattern in favor of something that reads as a page title on web (the
  `FormScreen` web header built earlier for the RFQ form redesign is the
  closest existing reference for what this could look like). **Quick
  create/add flows** (add a donation, post a job) are better candidates
  for becoming a modal on web via item 7's primitive, rather than a full
  page navigation.
- This is the item most dependent on item 2 (the max-width wrapper) being
  in place first, since the new header treatment needs to live inside that
  same layout shell to look coherent rather than introducing a third
  layout pattern.

**Touches:** every screen's header, evaluated individually rather than
batch-converted — this is the largest-surface-area item in the whole
plan, worth treating as its own multi-session effort rather than one
pass.

**Risk:** medium-high, purely from surface area — many screens, each a
small individual judgment call about page vs. modal. Recommend doing a
handful of representative screens first (one from each category above),
getting agreement on the pattern, then rolling out the rest
mechanically.

---

### 9. Multi-column grid for browse/list screens

**Approach:**
- Targets: the marketplace/browse screens already worked on this
  session for stats and filtering — `list-rfqs.tsx`, `list-donations.tsx`,
  `list-mediscope.tsx`, `list-jobs.tsx` — plus the home feed
  (`app/(tabs)/index.tsx` and its now-matching `.web.tsx` sibling).
- Approach: swap the underlying `FlatList`'s single-column layout for a
  `numColumns` value driven by item 1's breakpoint hook (e.g. 1 column at
  `compact`, 2 at `regular`, 3 at `wide`), with the whole thing sitting
  inside item 2's max-width wrapper so columns don't stretch to
  uncomfortable widths on very large monitors.
- Card components themselves likely don't need to change — this is
  primarily a container/layout change, not a rebuild of each card.

**Touches:** the four `list-*.tsx` marketplace screens, the home feed's
web variant, and any shared list-container components they use
(`SectionListContainer`, `HorizontalScrollContainer` if applicable to a
grid context).

**Risk:** medium. `FlatList`'s `numColumns` behavior on web via React
Native Web has some known rough edges worth testing directly (item
heights, key handling) rather than assuming parity with native.

---

## Phase 4 — Independent

### 10. Bottom-right anchored toast, max width

**Approach:**
- Whatever renders the `Toast`/`toast.success()` / `toast.error()` calls
  used throughout this session's work (formulary, ads, jobs, vitals, KYC,
  etc.) needs a web-specific position and width: anchored to the bottom-
  right corner with a fixed max width, rather than the full-width mobile
  banner.
- Since every screen already calls the same `toast.success`/`toast.error`
  API, this is a single-component fix — the call sites never need to
  change, only the shared toast renderer's own layout on web.

**Touches:** one shared component (the toast display, not the `toast.*`
API surface).

**Risk:** low. Fully isolated, visually easy to verify, no dependency on
anything else in this plan.

---

## Rollout checklist

- [ ] **1.** Viewport breakpoint hook
- [ ] **2.** Shared max-width wrapper (tiers decided with real
      screenshots, not guessed)
- [ ] **3.** Sidebar collapse persistence
- [ ] **4.** Hover states (shared components first)
- [ ] **5.** Cursor styles (bundle with item 4)
- [ ] **6.** Text selection pass (chrome off, content on)
- [ ] **7.** `WebActionSheet`/`WebModal` primitive → one call site → confirm
      → roll out to the rest
- [ ] **8.** Titlebar removal — representative screens first, then
      mechanical rollout
- [ ] **9.** Multi-column grid on the four marketplace lists + home feed
- [ ] **10.** Toast repositioning

Items 4–6 and 10 can start immediately and don't block on anything.
Items 1–3 should land before 7–9 begin in earnest.
