# Composer Theme + Workspace Panel-Setup Switcher — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give Google's composer (`ec76b5d`) the CopilotKit visual identity and add a three-preset workspace panel-setup switcher, additively on the Dockview + Monaco + Material M3 base.

**Architecture:** Pure CSS/token layering for the theme (no change to Google's `mat.define-theme` structure); the switcher extracts Google's inline Dockview layout code into per-preset builders and drives them from a `mat-button-toggle-group` in a new workspace toolbar.

**Tech Stack:** Angular 22.0.6 (zoneless, signals), Angular Material 22.0.4 (M3), Dockview 7.0.2, Monaco, SCSS, vitest. Node v24.16.0 via nvm, `corepack yarn`.

## Global Constraints

- Angular **22.0.6** — do NOT downgrade; keep Dockview/Monaco/Material intact.
- Layer additively on Google's chrome; never revert upstream modernizations.
- Both **light** and **dark** themes fully styled (`.dark-theme` on `<body>`; `dockview-theme-dark/light` on the dockview root).
- Preserve Google's freeform Dockview persistence (`localStorage['composer_dockview_layout']`).
- Fork-only; **no push to `origin`** without jerel's approval.
- `vitest run` green before every commit. Run from `shell/`.
- Ported theme values come verbatim from `a1cb9bc:shell/src/global_styles.scss` (tag `v0.1.0`); adaptations are called out per step.

## File Structure

- `shell/src/index.html` — font `<link>` (Task 1)
- `shell/src/global_styles.scss` — `--cpk-*` token layer + `--mat-sys-*` retint (Task 1)
- `shell/src/app/shell/composer-shell/composer-shell.{ng.html,scss}` — blur background + chrome retint (Task 2)
- `shell/src/app/shell/composer-workspace/composer-workspace.scss` — Dockview `--dv-*` retint (Task 3), toolbar styles (Task 5)
- `shell/src/app/shell/composer-workspace/composer-workspace.ts` — presets + `applyPreset` (Task 4)
- `shell/src/app/shell/composer-workspace/composer-workspace.spec.ts` — preset tests (Task 4)
- `shell/src/app/shell/composer-workspace/composer-workspace.ng.html` — toolbar UI (Task 5)

---

### Task 1: Theme foundation — fonts + `--cpk-*` tokens + `--mat-sys-*` retint

**Files:**
- Modify: `shell/src/index.html`
- Modify: `shell/src/global_styles.scss`
- Source of truth for ported values: `a1cb9bc:shell/src/global_styles.scss`

**Interfaces:**
- Produces: the `--cpk-*` token names (surface/glass/blur/line/text/accent/status/space/radius/shadow/font) consumed by Tasks 2, 3, 5.

- [ ] **Step 1: Swap fonts in `index.html`.** Replace the Roboto Google-Fonts `<link href=...>` with:
  `https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700&family=Spline+Sans+Mono:wght@400;500;600&display=swap`
  Keep the `preconnect` links and the Material Icons link unchanged.

- [ ] **Step 2: Append the `--cpk-*` token layer to `global_styles.scss`.** After Google's existing theme blocks (i.e. after the `.dark-theme { ... }` Material block, before or merging with the `html, body` rule), paste the CopilotKit token layer verbatim from `a1cb9bc:shell/src/global_styles.scss` — both the `:root { --cpk-* ... }` block and the `.dark-theme { --cpk-* ... }` block, plus the `code/pre/kbd/samp { font-family: var(--cpk-font-mono); }` rule. Update the existing `html, body` rule to use `background-color: var(--cpk-page-bg)` and `font-family: var(--cpk-font-body)` (keep `height/margin/padding`). Do NOT include the `.cpk-snackbar` block (out of scope).

- [ ] **Step 3: Retint brand `--mat-sys-*` tokens.** The ported `:root`/`.dark-theme` cpk blocks already set `--mat-sys-background/on-background/on-surface`. Extend BOTH blocks to also set, so Material components adopt the indigo/lavender identity:
  ```scss
  /* light (:root) */
  --mat-sys-primary: #4355b9;
  --mat-sys-on-primary: #ffffff;
  --mat-sys-primary-container: #dee0ff;
  --mat-sys-on-primary-container: #00105c;
  --mat-sys-surface: #{'#fefbff'};
  --mat-sys-surface-container-low: #f3f3fc;
  --mat-sys-surface-container: #edecf6;
  ```
  ```scss
  /* dark (.dark-theme) */
  --mat-sys-primary: #bac3ff;
  --mat-sys-on-primary: #08218a;
  --mat-sys-primary-container: #293ca0;
  --mat-sys-on-primary-container: #dee0ff;
  --mat-sys-surface: #16151b;
  --mat-sys-surface-container-low: #1c1b22;
  --mat-sys-surface-container: #201f27;
  ```
  These live in the same `:root`/`.dark-theme` cpk blocks, which appear AFTER Google's `mat.theme-overrides` output and win by cascade order.

- [ ] **Step 4: Verify build + type + lint.** Run: `corepack yarn exec ng build` (or `vitest run` if faster) — expected: compiles clean, no SCSS errors.

- [ ] **Step 5: Visual check both themes.** Start the dev server, load `/`, toggle dark; confirm page bg is lavender-gray (light) / near-black (dark), body type is Plus Jakarta Sans, primary buttons/tabs are indigo. (See Task 6 for the shared verification recipe.)

- [ ] **Step 6: Commit.**
  ```bash
  git add shell/src/index.html shell/src/global_styles.scss
  git commit -m "feat(theme): apply CopilotKit token identity over Material base"
  ```

---

### Task 2: Shell chrome + blur-circle background

**Files:**
- Modify: `shell/src/app/shell/composer-shell/composer-shell.ng.html`
- Modify: `shell/src/app/shell/composer-shell/composer-shell.scss`

**Interfaces:**
- Consumes: `--cpk-blur-*`, `--cpk-glass-*`, `--cpk-border`, `--cpk-surface*` (Task 1).

- [ ] **Step 1: Read the current shell.** Read both files to locate the content/router-outlet region and the top-bar + `mat-nav-list` markup.

- [ ] **Step 2: Add the blur-background layer.** In `composer-shell.ng.html`, add a decorative element in the content region (behind `<router-outlet>`), e.g. `<div class="cpk-bg-blurs" aria-hidden="true"></div>`. In `composer-shell.scss` style it: absolutely positioned, `inset: 0`, `pointer-events: none`, `z-index: 0`; content above it (`position: relative; z-index: 1`). Render 2–4 large, heavily-blurred radial circles using `--cpk-blur-warm/cool/bright/gold` (port the treatment from `a1cb9bc:shell/src/app/shell/composer-shell/composer-shell.scss`). Must read correctly in both themes (tokens already theme-swap).

- [ ] **Step 3: Retint chrome surfaces.** Give the top bar and nav rail the frost-glass look via `--cpk-glass-bg`, `--cpk-glass-border`, `--cpk-border`, `--cpk-shadow-*`, keeping Google's layout/structure. Do not alter nav routes or the hamburger/theme-toggle behavior.

- [ ] **Step 4: Verify** build + visual in both themes; confirm the blur layer does not intercept clicks (nav + toggles still work).

- [ ] **Step 5: Commit.**
  ```bash
  git add shell/src/app/shell/composer-shell/
  git commit -m "feat(theme): frost-glass shell chrome + blur-circle background"
  ```

---

### Task 3: Dockview chrome retint

**Files:**
- Modify: `shell/src/app/shell/composer-workspace/composer-workspace.scss`

**Interfaces:**
- Consumes: `--cpk-*` tokens; targets Dockview's `--dv-*` variables + `.dockview-theme-light/dark`.

- [ ] **Step 1: Map `--dv-*` to tokens.** Under `.dockview-theme-light` and `.dockview-theme-dark` (or scoped to `.dockview-root`), set the key Dockview variables:
  ```scss
  --dv-background-color: var(--cpk-surface-elevated);
  --dv-group-view-background-color: var(--cpk-surface-elevated);
  --dv-tabs-and-actions-container-background-color: var(--cpk-page-bg);
  --dv-activegroup-visiblepanel-tab-background-color: var(--cpk-surface-elevated);
  --dv-activegroup-visiblepanel-tab-color: var(--cpk-text-primary);
  --dv-inactivegroup-visiblepanel-tab-color: var(--cpk-text-secondary);
  --dv-separator-border: var(--cpk-border);
  --dv-paneview-header-border-color: var(--cpk-border);
  --dv-tab-divider-color: var(--cpk-divider);
  ```
  (Confirm exact variable names against `node_modules/dockview/dist/styles/dockview.css`; adjust to whatever that build exposes.)

- [ ] **Step 2: Verify** the workspace tabs/borders/headers read as CopilotKit-themed in both light and dark; panel bodies remain solid and legible over Monaco/preview.

- [ ] **Step 3: Commit.**
  ```bash
  git add shell/src/app/shell/composer-workspace/composer-workspace.scss
  git commit -m "feat(theme): retint Dockview chrome via cpk tokens"
  ```

---

### Task 4: Panel-switcher — component logic (TDD)

**Files:**
- Modify: `shell/src/app/shell/composer-workspace/composer-workspace.ts`
- Modify: `shell/src/app/shell/composer-workspace/composer-workspace.spec.ts`

**Interfaces:**
- Produces: `export type WorkspacePreset = 'chat' | 'chat-preview' | 'full';`, `activePreset: Signal<WorkspacePreset>`, `applyPreset(preset: WorkspacePreset): void`, and private `buildChatLayout()`, `buildChatPreviewLayout()`, `buildFullLayout()`. Consumed by Task 5's template.
- Consumes: existing `ComposerPanelId` enum, `this.dockviewApi` (`DockviewComponent`).

- [ ] **Step 1: Read the current spec + component.** Read `composer-workspace.spec.ts` to reuse Google's Dockview test setup (how `dockviewApi` is constructed/mocked in jsdom, how panels are asserted). Read the `ngAfterViewInit` layout block to copy panel definitions exactly.

- [ ] **Step 2: Write failing tests.** In `composer-workspace.spec.ts` add, following the existing setup:
  ```ts
  it('applyPreset("chat") leaves only the Chat panel', () => {
    component.applyPreset('chat');
    const ids = component['dockviewApi'].panels.map(p => p.id);
    expect(ids).toEqual([ComposerPanelId.Chat]);
    expect(component.activePreset()).toBe('chat');
  });

  it('applyPreset("chat-preview") yields Chat + Rendered', () => {
    component.applyPreset('chat-preview');
    const ids = component['dockviewApi'].panels.map(p => p.id).sort();
    expect(ids).toEqual([ComposerPanelId.Chat, ComposerPanelId.Rendered].sort());
    expect(component.activePreset()).toBe('chat-preview');
  });

  it('applyPreset("full") yields the full panel set', () => {
    component.applyPreset('full');
    const ids = component['dockviewApi'].panels.map(p => p.id);
    expect(ids).toContain(ComposerPanelId.Chat);
    expect(ids).toContain(ComposerPanelId.Rendered);
    expect(ids).toContain(ComposerPanelId.Raw);
    expect(ids).toContain(ComposerPanelId.DataModel);
  });

  it('persists the applied preset to localStorage', () => {
    component.applyPreset('chat');
    expect(localStorage.getItem('composer_workspace_preset')).toBe('chat');
  });
  ```
  (Adjust `component['dockviewApi'].panels` to the accessor the real `DockviewComponent` exposes — confirm in Step 1; `dockviewApi.panels` returns `IDockviewPanel[]`.)

- [ ] **Step 3: Run tests to verify they fail.** `corepack yarn exec vitest run composer-workspace` — expected: FAIL (`applyPreset`/`activePreset` undefined).

- [ ] **Step 4: Implement.** In `composer-workspace.ts`:
  - Add `export type WorkspacePreset = 'chat' | 'chat-preview' | 'full';` and `const WORKSPACE_PRESET_KEY = 'composer_workspace_preset';`.
  - Add field `readonly activePreset = signal<WorkspacePreset>('chat-preview');`.
  - Extract three builders from the current inline layout (copy panel defs verbatim):
    - `buildChatLayout()` → `addPanel({id: Chat, component: Chat, title: 'Gemini Assistant'})`.
    - `buildChatPreviewLayout()` → Chat, then Rendered `{direction:'right', referencePanel: Chat}`.
    - `buildFullLayout()` → the exact current default block (Chat │ Rendered │ Raw; DataModel/Events/Errors/RawMessages `within` DataModel below Rendered; MockRules when `showMockRules()`).
  - `applyPreset(preset)`:
    ```ts
    applyPreset(preset: WorkspacePreset): void {
      if (!this.isDockviewInitialized()) return;
      this.dockviewApi.clear();
      if (preset === 'chat') this.buildChatLayout();
      else if (preset === 'chat-preview') this.buildChatPreviewLayout();
      else this.buildFullLayout();
      this.activePreset.set(preset);
      localStorage.setItem(WORKSPACE_PRESET_KEY, preset);
    }
    ```
  - In `ngAfterViewInit`, replace the inline default-layout block: when `!layoutRestored`, call `this.buildChatPreviewLayout()` (new default). After init, restore the toggle: `const saved = localStorage.getItem(WORKSPACE_PRESET_KEY) as WorkspacePreset | null; if (saved) this.activePreset.set(saved);`.

- [ ] **Step 5: Run tests to verify they pass.** `corepack yarn exec vitest run composer-workspace` — expected: PASS. Then full `vitest run` to confirm no regressions in the shared spec.

- [ ] **Step 6: Commit.**
  ```bash
  git add shell/src/app/shell/composer-workspace/composer-workspace.ts shell/src/app/shell/composer-workspace/composer-workspace.spec.ts
  git commit -m "feat(workspace): panel-setup preset builders + applyPreset"
  ```

---

### Task 5: Panel-switcher — toolbar UI + styling

**Files:**
- Modify: `shell/src/app/shell/composer-workspace/composer-workspace.ng.html`
- Modify: `shell/src/app/shell/composer-workspace/composer-workspace.ts` (imports)
- Modify: `shell/src/app/shell/composer-workspace/composer-workspace.scss`

**Interfaces:**
- Consumes: `activePreset()`, `applyPreset()` (Task 4); `--cpk-*` tokens (Task 1).

- [ ] **Step 1: Add Material imports.** In `composer-workspace.ts` `@Component.imports`, add `MatButtonToggleModule`, `MatIconModule`, `MatTooltipModule` (import from `@angular/material/button-toggle`, `/icon`, `/tooltip`).

- [ ] **Step 2: Add the toolbar.** In `composer-workspace.ng.html`, wrap the existing `dockview-root` so the container is a flex column with a toolbar above:
  ```html
  <div class="workspace-container" [class.extension-mode]="isExtension()">
    <div class="workspace-toolbar">
      <mat-button-toggle-group
        class="preset-switcher"
        [value]="activePreset()"
        (change)="applyPreset($event.value)"
        aria-label="Workspace layout preset"
        hideSingleSelectionIndicator
      >
        <mat-button-toggle value="chat" matTooltip="Chat only">
          <mat-icon aria-hidden="true">forum</mat-icon><span>Chat</span>
        </mat-button-toggle>
        <mat-button-toggle value="chat-preview" matTooltip="Chat + live preview">
          <mat-icon aria-hidden="true">preview</mat-icon><span>Chat + Preview</span>
        </mat-button-toggle>
        <mat-button-toggle value="full" matTooltip="Chat, preview, JSON editor + data/engine panels">
          <mat-icon aria-hidden="true">dashboard</mat-icon><span>Code &amp; Engine</span>
        </mat-button-toggle>
      </mat-button-toggle-group>
    </div>
    <div
      #dockviewRoot
      class="dockview-root mat-m3-dockview-tabs"
      [class.dockview-theme-dark]="isDarkTheme()"
      [class.dockview-theme-light]="!isDarkTheme()"
    ></div>
  </div>
  ```

- [ ] **Step 3: Style it.** In `composer-workspace.scss`: `.workspace-container { display:flex; flex-direction:column; height:100%; }`, `.workspace-toolbar { flex:0 0 auto; display:flex; align-items:center; gap:var(--cpk-space-3); padding:var(--cpk-space-2) var(--cpk-space-3); }`, `.dockview-root { flex:1 1 auto; min-height:0; }`. Token-style the toggle group. Ensure the existing `dockviewApi.layout(...)` still fills the reduced height (the ResizeObserver already handles it).

- [ ] **Step 4: Verify** in the dev server: the three toggles appear; clicking each rebuilds the layout (Chat only → Chat+Rendered → full); the active toggle highlights; dragging panels then reloading restores the freeform layout (Google behavior preserved). Run `vitest run` to confirm template binding compiles.

- [ ] **Step 5: Commit.**
  ```bash
  git add shell/src/app/shell/composer-workspace/
  git commit -m "feat(workspace): preset switcher toolbar UI"
  ```

---

### Task 6: Integration verification + proof

**Files:** none (verification only).

- [ ] **Step 1: Start the dev server.** Use a launch config that serves this worktree's `shell` with the `ng-basic-catalog` built (mirror the `cks-shell` config pattern; port :4200). Resolve a renderer (localStorage `a2ui_composer_renderer_url` or the config default) so the workspace is not gated by the startup guard.
- [ ] **Step 2: Theme — light.** Load `/`; confirm lavender-gray page, Plus Jakarta type, indigo primary, frost-glass nav/top-bar, blur circles behind content, themed Dockview tabs. Screenshot.
- [ ] **Step 3: Theme — dark.** Toggle dark; confirm the near-black page + brand glows + legible Dockview chrome. Screenshot.
- [ ] **Step 4: Switcher.** Click each preset; confirm panel sets (Chat / Chat+Rendered / full). Drag a panel, reload; confirm freeform layout restored. Screenshot the three states.
- [ ] **Step 5: Green + summary.** Final `vitest run` green. Report the commit range and attach screenshots.

---

## Self-Review

- **Spec coverage:** Theme (fonts, tokens, mat-sys retint, shell glass+blur, Dockview retint) → Tasks 1–3. Switcher (3 presets, quick-arrange persistence, default chat-preview, toolbar) → Tasks 4–5. Integration/both-theme verification → Task 6. All spec sections mapped.
- **Placeholders:** none — the switcher code is spelled out; theme values cite the exact source ref `a1cb9bc:shell/src/global_styles.scss` with the new mat-sys additions inlined.
- **Type consistency:** `WorkspacePreset`, `activePreset`, `applyPreset`, `buildChatLayout`/`buildChatPreviewLayout`/`buildFullLayout`, `WORKSPACE_PRESET_KEY` used consistently across Tasks 4–5. `ComposerPanelId` reused from Google's enum. Preset localStorage key distinct from Google's `composer_dockview_layout`.
