# Gallery Masonry + Basic Catalog Split — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:executing-plans (inline). Steps use checkbox (`- [ ]`) syntax.

**Goal:** Gallery = native masonry of 33 example widgets; the old grouped reference becomes the Basic Catalog page.

**Tech Stack:** Angular 22 (zoneless, signals, standalone, OnPush), `@a2ui/angular/v0_9` (BasicCatalog), Node ESM codegen.

## Global Constraints

- Node v24.16.0 via nvm; `corepack yarn`; tests from `shell/`.
- Apache-2.0 header on new files; generated file gets header + `/* eslint-disable */`.
- zod pinned `3.25.76`; nothing to `origin` without approval; `fork` push OK.
- Coverage thresholds: lines 90 / functions 90 / branches 75 / statements 85.

---

### Task 1: Move reference → Basic Catalog

**Files:** `shell/src/app/gallery/` → `shell/src/app/basic-catalog/` (+ file renames), `app.routes.ts`.

- [ ] **Step 1:** `git mv shell/src/app/gallery shell/src/app/basic-catalog`; `git mv` the four `basic-catalog/gallery.{ts,ng.html,scss,spec.ts}` → `basic-catalog.*`.
- [ ] **Step 2:** In `basic-catalog.ts`: class `Gallery`→`BasicCatalogView`, selector `a2ui-composer-gallery`→`a2ui-composer-basic-catalog`, templateUrl/styleUrl → `./basic-catalog.*`. In `basic-catalog.spec.ts`: import `./basic-catalog`, class refs, keep MonacoEditor stub override.
- [ ] **Step 3:** `app.routes.ts`: change the `gallery` route to `path: 'basic-catalog'`, `loadComponent` → `./basic-catalog/basic-catalog` `m.BasicCatalogView`, title "A2UI Basic Catalog".
- [ ] **Step 4:** `corepack yarn exec vitest run src/app/basic-catalog` — green. Commit.

### Task 2: Gallery widgets codegen + generated data

**Files:** `shell/scripts/generate-gallery-widgets.mjs`, `shell/src/app/gallery/gallery-widgets.generated.ts`.

- [ ] **Step 1:** Write the codegen: read the widget-builder clone's `.../data/gallery/v09/generated.ts`, slice from the first `const ` block, prepend composer preamble (license + `/* eslint-disable */` + banner + local `DataState`/`A2UIComponent`/`Widget`/`GalleryEntry` types), and rename the export `V09_GALLERY_WIDGETS` → `GALLERY_WIDGETS`. Resolve clone path (default `../../private_a2ui_demo` from worktree; else error).
- [ ] **Step 2:** Add `generate:gallery-widgets` npm script; run it; verify 33 entries with non-empty `components`.
- [ ] **Step 3:** `corepack yarn lint` — clean (generated ignored). Commit.

### Task 3: Masonry Gallery component

**Files:** `shell/src/app/gallery/gallery.{ts,ng.html,scss,spec.ts}`.

**Consumes:** `GALLERY_WIDGETS`, `@a2ui/angular/v0_9` (`A2uiRendererService`, `A2UI_RENDERER_CONFIG`, `SurfaceComponent`, `BasicCatalog`).

- [ ] **Step 1:** Write failing spec: exposes all `GALLERY_WIDGETS`; after `whenStable`, `surfaceGroup.getSurface(widgets[0].widget.id)` truthy; data-integrity: every entry has non-empty `components` incl. a `root` component.
- [ ] **Step 2:** Implement: providers `A2uiRendererService` + `A2UI_RENDERER_CONFIG` factory `{catalogs:[new BasicCatalog()]}`; read `catalog.id`; constructor builds each widget once (createSurface+updateComponents+updateDataModel in one batch, `builtSurfaces` Set); `widgets = GALLERY_WIDGETS`.
- [ ] **Step 3:** Template: CSS-columns masonry; per card caption `widget.name` + `<a2ui-v09-surface [surfaceId]="widget.id">` sized to `height`.
- [ ] **Step 4:** SCSS with `--cpk-*` + `columns` + `break-inside: avoid`.
- [ ] **Step 5:** Run spec — green. Commit.

### Task 4: Route + nav wiring

**Files:** `app.routes.ts`, `composer-shell.ng.html`, `composer-shell.spec.ts`.

- [ ] **Step 1:** Add `gallery` route → `./gallery/gallery` `m.Gallery`, title "A2UI Gallery", no guard.
- [ ] **Step 2:** Nav: rename the existing Gallery entry → "Basic Catalog" (`/basic-catalog`, icon `widgets`); add new "Gallery" entry (`/gallery`, icon `grid_view`) above it.
- [ ] **Step 3:** composer-shell.spec: nav items 6→7; aria-hidden icons 8→9; update labels/icons/aria/order arrays.
- [ ] **Step 4:** composer-shell.spec green. Commit.

### Task 5: Full suite + browser verify + push

- [ ] **Step 1:** `corepack yarn lint` + `corepack yarn exec vitest run` — green, coverage met.
- [ ] **Step 2:** Browser-verify :4215 — Gallery masonry renders live widgets; Basic Catalog unchanged; both themes; no console errors. Screenshot.
- [ ] **Step 3:** Push `fork/jerel/ux-update`. Update memory.

## Self-Review

- Spec coverage: move (T1), data (T2), masonry (T3), nav (T4), verify (T5). ✓
- Type consistency: `GALLERY_WIDGETS`/`GalleryEntry` (T2) consumed in T3. ✓
- No placeholders. ✓
