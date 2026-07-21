# Composer Theme Improvement + Workspace Panel-Setup Switcher — Design

**Date:** 2026-07-21
**Branch:** `jerel/ux-update` (rebased fresh onto Google upstream `origin/main` @ `ec76b5d`)
**Status:** Approved (design decisions confirmed with jerel)

## Goal

Give Google's current A2UI Composer the CopilotKit visual identity, and add a
workspace panel-setup switcher with three presets — layered additively on top of
Google's modern Dockview + Monaco + Material M3 base, without reverting any of it.

## Context

`jerel/ux-update` was renamed from `jerel/ux-overhaul` (the full 5-phase overhaul,
preserved at tag `v0.1.0` and `fork/jerel/ux-overhaul` @ `a1cb9bc`) and reset onto
Google's `ec76b5d`. Google independently converged on most of the original overhaul
(collapsible nav rail, Monaco JSON editor, full dark mode, rebalanced settings,
Dockview layout). What remains genuinely ours and is in scope here:

1. **Theme identity** — Google ships a generic Material M3 *violet* theme (Roboto).
   Our `--cpk-*` token system (CopilotKit "dojo" aesthetic) is portable and is the
   real differentiator.
2. **Workspace panel-setup switcher** — a new capability Google does not have.

The original per-feature port (gallery auto-select, rendered-frame loading/error
states, repair badge, icon browser, scenario player, renderer picker, flight-catalog)
is **deferred**, and **custom catalogue** + **theater** are future features to be
scoped separately once jerel provides context.

## Global Constraints

- **Angular 22.0.6** — do NOT downgrade. Keep `dockview@7.0.2`, `monaco-editor`,
  `@angular/material@22.0.4`, and Google's `mat.define-theme` M3 mechanism intact.
- Node **v24.16.0** via nvm; `corepack yarn`; rebuild `bridge` after install.
- **Layer on top** of Google's chrome (nav, Dockview, Monaco, Material theme) —
  additive only; never revert upstream modernizations.
- Both **light and dark** themes must be fully styled (dark is stamped as
  `.dark-theme` on `<body>`; Dockview uses `dockview-theme-dark/light` classes).
- **Preserve** Google's freeform Dockview-layout persistence
  (`localStorage['composer_dockview_layout']`).
- **Fork-only.** Nothing pushes to `origin` (Google) without jerel's explicit
  approval. Pushing to `fork` (github.com/jerelvelarde) is allowed.
- Tests green via `vitest run` before each commit.

---

## Feature A — Theme Improvement

### Decisions (confirmed)
- **Reach:** brand everything (palette + fonts, including Dockview tab/border
  retint); apply frost-glass + blur circles to the shell chrome and non-workspace
  routes (nav rail, top bar, gallery, settings). **Dockview panel bodies stay solid**
  — glass would not show over Dockview/Monaco and hurts legibility.

### Components / files

1. **`shell/src/index.html`** — swap the Google Fonts `<link>` from `Roboto` to
   `Plus Jakarta Sans:wght@300;400;500;600;700` + `Spline Sans Mono:wght@400;500;600`.
   Keep the Material Icons link.

2. **`shell/src/global_styles.scss`** — after Google's existing Material theme block,
   append (ported from `a1cb9bc:shell/src/global_styles.scss`):
   - The full **`--cpk-*` token layer** for both `:root` (light) and `.dark-theme`
     (dark): surface/glass, blur circles, line, text, accent (indigo `#4355b9`),
     status, spacing, radius, elevation, typography, `--cpk-content-max`.
   - **Retint the brand-relevant `--mat-sys-*` tokens** in both themes so Material
     components (buttons, tabs, active states) and chrome pick up CopilotKit colors:
     `--mat-sys-primary`, `--mat-sys-on-primary`, `--mat-sys-primary-container`,
     `--mat-sys-background`, `--mat-sys-on-background`, `--mat-sys-surface`,
     `--mat-sys-on-surface`, and the `surface-container*` steps to the lavender-gray
     ramp. These override Google's `mat.theme-overrides` output via a later `:root` /
     `.dark-theme` block (CSS custom-property cascade).
   - Set `html, body` to `--cpk-page-bg` + `--cpk-font-body`; `code/pre/kbd/samp` to
     `--cpk-font-mono`. Optionally set Material's font tokens to Plus Jakarta for
     full type consistency.
   - The `.cpk-snackbar` block is **out of scope** here (the Feedback service is not
     being ported); do not add it.

3. **`shell/src/app/shell/composer-shell/composer-shell.{ng.html,scss}`** — add a
   decorative **blur-circle background layer** behind the router-outlet content
   region (an absolutely-positioned, `pointer-events:none`, `aria-hidden` element
   using the `--cpk-blur-*` tokens). Must sit behind content in both themes and not
   intercept clicks. Retint the shell chrome (top bar, nav rail) surfaces/borders via
   `--cpk-*` tokens for the frost-glass look.

4. **`shell/src/app/shell/composer-workspace/composer-workspace.scss`** — retint
   **Dockview chrome** by mapping the relevant `--dv-*` CSS variables to `--cpk-*`
   tokens under `.dockview-theme-light` and `.dockview-theme-dark`: tab container
   background, active/inactive tab background + text, group border/separator, and the
   panel content background (kept solid, tokenized to `--cpk-surface-elevated`).

### Non-goals for A
- No change to Google's `mat.define-theme` structure or the `.dark-theme` toggle
  mechanism. No translucent Dockview panel bodies. No new fonts beyond the two.

---

## Feature B — Workspace Panel-Setup Switcher

### Decisions (confirmed)
- **Persistence:** quick-arrange model. Clicking a preset rebuilds the layout now;
  Google's freeform drag-and-save-across-reload is preserved. The toggle is a fast
  "arrange it this way" control, not a locked mode. The last-applied preset is
  remembered only to highlight the toggle.
- **Default:** on a fresh workspace with no saved layout, open in **Chat + Preview**
  (focus on render) rather than Google's full debug layout.

### The three presets (subsets of Google's existing `ComposerPanelId` panels)

| Preset key     | Label                        | Panels |
|----------------|------------------------------|--------|
| `chat`         | Chat                         | `Chat` only |
| `chat-preview` | Chat + Preview *(default)*   | `Chat` │ `Rendered` (right of Chat) |
| `full`         | Chat + Preview + Code & Engine | `Chat` │ `Rendered` │ `Raw` (JSON editor); `DataModel`/`Events`/`Errors`/`RawMessages` tabbed below `Rendered` (+ `MockRules` when `showMockRules()`) — i.e. Google's existing default layout |

### Components / files

1. **`shell/src/app/shell/composer-workspace/composer-workspace.ts`**
   - Add `export type WorkspacePreset = 'chat' | 'chat-preview' | 'full';`
   - `activePreset = signal<WorkspacePreset>('chat-preview')`.
   - Extract three private builder methods from the current `ngAfterViewInit`
     inline layout code: `buildChatLayout()`, `buildChatPreviewLayout()`,
     `buildFullLayout()`. `buildFullLayout()` IS the current default-layout block,
     moved verbatim.
   - `applyPreset(preset: WorkspacePreset)`: `this.dockviewApi.clear()`, run the
     matching builder, `this.activePreset.set(preset)`, and persist the preset key to
     `localStorage['composer_workspace_preset']`. Dockview's existing debounced
     `onDidLayoutChange` save then records the resulting JSON, so reload restores it.
   - In `ngAfterViewInit`: keep Google's `fromJSON` restore when a saved layout
     exists; when it does not, call `buildChatPreviewLayout()` (new default) instead
     of the old inline full layout. Restore `activePreset` from
     `localStorage['composer_workspace_preset']` (fallback `'chat-preview'`) to set
     the toggle highlight.
   - Add imports for `MatButtonToggleModule`, `MatIconModule`, `MatTooltipModule`.

2. **`shell/src/app/shell/composer-workspace/composer-workspace.ng.html`** — wrap the
   existing `dockview-root` in a flex column and add a slim `.workspace-toolbar`
   above it containing a `mat-button-toggle-group` bound to `activePreset()` with
   `(change)` → `applyPreset($event.value)`, three toggles (icon + label + tooltip).

3. **`shell/src/app/shell/composer-workspace/composer-workspace.scss`** — style
   `.workspace-toolbar` with `--cpk-*` tokens; make the container a flex column so
   the toolbar is auto-height and `dockview-root` takes the remaining space
   (`flex: 1; min-height: 0`).

### Data flow
User clicks a toggle → `applyPreset(key)` → `dockviewApi.clear()` + builder adds the
subset of panels → `onDidLayoutChange` debounced-saves the JSON → `activePreset`
signal updates the toggle highlight and is persisted. Reload → saved JSON restored
(freeform preserved); toggle highlight from persisted preset key.

### Edge cases
- Applying a preset while `showMockRules()` is true: only `buildFullLayout()` includes
  Mock Rules; `chat`/`chat-preview` omit it (expected — those presets hide debug).
- `dockviewApi.clear()` must run before rebuild so panels are not duplicated.
- The unread Events/Errors counters and their title-updating effects must still work
  after a rebuild (the effects read `getGroupPanel(...)` which returns undefined when
  a panel is absent in `chat`/`chat-preview` — already guarded by `if (panel)`).

---

## Testing

- **Feature A:** primarily visual — verify via the dev server (`cks`-style `ng serve`)
  in both light and dark, checking the shell, gallery, settings, and the Dockview
  workspace chrome. Existing `vitest` suite must stay green (theme is CSS-only; no
  unit tests added beyond confirming nothing breaks).
- **Feature B:** unit tests in `composer-workspace.spec.ts` — `applyPreset('chat')`
  leaves only the Chat panel; `applyPreset('chat-preview')` yields Chat + Rendered;
  `applyPreset('full')` yields the full set; `activePreset()` tracks the last applied;
  the preset key round-trips through `localStorage`. Follow Google's existing
  Dockview test setup/mocks in that spec file.

## Out of scope (future, tracked separately)
- **Custom catalogue** and **theater** — jerel's highest-value features; not yet
  built, context to come.
- The deferred per-feature port (gallery auto-select, rendered-frame loading/error,
  repair badge, icon browser, scenario player, renderer picker, react-flight-catalog).
- Porting the `shared/ui` kit and the `Feedback` snackbar service.
