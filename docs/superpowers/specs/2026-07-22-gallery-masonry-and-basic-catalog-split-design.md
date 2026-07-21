# Gallery Masonry + Basic Catalog Split — Design

**Date:** 2026-07-22
**Branch:** `jerel/ux-update` (on Google upstream `ec76b5d`)
**Status:** Approved (design questions answered 2026-07-22)

## Goal

Correct the composer's information architecture to match the reference
widget-builder: **Gallery** is a masonry showcase of composed *example
widgets* rendered live; the per-component reference (grouped sidebar →
preview/usage/props) is the **Basic Catalog** page. Today the composer's
"Gallery" is actually the Basic Catalog reference.

## Decisions (from AskUserQuestion, 2026-07-22)

- **Widget source:** port the widget-builder's own gallery data
  (`V09_GALLERY_WIDGETS`, 33 widgets) from the local `private_a2ui_demo` clone.
- **Rendering:** native `@a2ui/angular` (BasicCatalog), no iframe.

## Restructure

- Move the existing reference component `shell/src/app/gallery/` →
  `shell/src/app/basic-catalog/`. It renders the active catalog's per-component
  reference and is genuinely the Basic Catalog page. Rename the four entry
  files `gallery.*` → `basic-catalog.*`; class `Gallery` → `BasicCatalogView`;
  selector `a2ui-composer-gallery` → `a2ui-composer-basic-catalog`. Its
  `schema/`, `services/`, `test/` sub-packages move with it unchanged (all its
  imports are `../…` at the same depth, so they still resolve; the selector is
  used only via routing, never in a template).
- Route `/gallery` → **`/basic-catalog`** (title "A2UI Basic Catalog").
- New route **`/gallery`** → the masonry `Gallery` component (title
  "A2UI Gallery").
- Nav: the existing "Components Gallery" entry becomes **"Basic Catalog"**
  (`/basic-catalog`, keep icon `widgets`); a new **"Gallery"** entry
  (`/gallery`, icon `grid_view`) is added above it.

## Masonry Gallery

New feature dir `shell/src/app/gallery/` (fresh, replacing the moved-out one):

### Data
- `shell/scripts/generate-gallery-widgets.mjs` — a re-sync codegen that reads
  the widget-builder's
  `private_a2ui_demo/apps/widget-builder/src/data/gallery/v09/generated.ts`
  (33 entries) and emits `shell/src/app/gallery/gallery-widgets.generated.ts`,
  replacing the erasable `import type { Widget } from '@/types/widget'` with a
  local type block + license header + `/* eslint-disable */` + GENERATED
  banner, and renaming the export `V09_GALLERY_WIDGETS` → `GALLERY_WIDGETS`.
  Everything else (the data) is copied verbatim.
  - The clone path is resolved relative to the composer worktree with a
    documented default; if absent, the script errors (re-sync only — the
    generated file is committed, so builds never depend on the clone).
- Local types in the generated file:
  ```ts
  interface DataState { name: string; data: Record<string, unknown>; }
  interface A2UIComponent { id: string; [k: string]: unknown; }
  interface Widget {
    id: string; name: string; description?: string;
    createdAt: Date; updatedAt: Date;
    root: string; components: A2UIComponent[]; dataStates?: DataState[];
  }
  type GalleryEntry = { widget: Widget; height: number };
  export const GALLERY_WIDGETS: GalleryEntry[];
  ```
  (All 33 entries include a `default` `dataState`; each widget's root
  component has `id: 'root'`.)

### Component (`gallery.ts`)
- Component-scoped providers (never root): `A2uiRendererService` +
  `A2UI_RENDERER_CONFIG` with `catalogs: [new BasicCatalog()]` (from
  `@a2ui/angular/v0_9`). The basic catalog id is read from the instance
  (`catalog.id`) for `createSurface`.
- On construction, build every widget's surface once via a `builtSurfaces`
  Set (same proven pattern as Custom Catalog / Theater): for each entry send
  `createSurface(widget.id, catalogId)` + `updateComponents(widget.components)`
  + `updateDataModel(dataStates[0].data)` in one `processMessages` batch
  (batching matters — the native renderer needs createSurface+updateComponents
  together, per the Theater fix).
- `widgets = GALLERY_WIDGETS` exposed to the template.

### Template + layout
- A CSS multi-column masonry (`columns` responsive: ~4 at wide, fewer as it
  narrows) with `break-inside: avoid` per card.
- Each card: a caption (`widget.name`) + a body of fixed `height`
  (`widget.height` px) containing `<a2ui-v09-surface [surfaceId]="widget.id">`,
  styled with the composer card tokens (`--cpk-*`).

## Files

**Move + edit:**
- `shell/src/app/gallery/` → `shell/src/app/basic-catalog/` (git mv); rename
  `gallery.{ts,ng.html,scss,spec.ts}` → `basic-catalog.*`; class/selector/
  templateUrl/styleUrl updates; spec import + class-name updates.
- `shell/src/app/app.routes.ts` — `/gallery` → `/basic-catalog`; add `/gallery`
  (masonry).
- `shell/src/app/shell/composer-shell/composer-shell.ng.html` — rename the
  Gallery nav entry to "Basic Catalog"; add a new "Gallery" entry (icon
  `grid_view`) above it.
- `shell/src/app/shell/composer-shell/composer-shell.spec.ts` — nav counts
  (6→7 items, aria-hidden icons 8→9), labels, icons, aria, order.

**Create:**
- `shell/scripts/generate-gallery-widgets.mjs`
- `shell/src/app/gallery/gallery-widgets.generated.ts` (generated, committed)
- `shell/src/app/gallery/gallery.{ts,ng.html,scss,spec.ts}`

## Testing

- **basic-catalog.spec.ts** — the moved reference spec, updated for the new
  class name / selector / import path; otherwise unchanged (Monaco still
  stubbed).
- **gallery.spec.ts** (masonry) — no Monaco; provides its own renderer:
  exposes all `GALLERY_WIDGETS`; builds a native surface per widget
  (`surfaceGroup.getSurface(widget.id)` truthy after `whenStable`); each card
  carries the widget name; a data-integrity assertion that every entry has a
  non-empty `components` array with a `root`-id component.
- **composer-shell.spec.ts** — nav-count / label / icon / aria bumps.
- Full suite green, coverage met, lint clean.

## Browser verification (:4215 uxo-verify)

Nav → Gallery renders the masonry (Flight Status, User Profile, Recipe Card,
Login Form, … live); nav → Basic Catalog shows the unchanged reference; dark +
light; no console errors.

## Out of scope (future)

- User-created widgets ("Widgets" nav section in the reference) in the Gallery.
- Icons / Create / Workbench / Tutorial pages from the reference nav.

## Global constraints

- Node v24.16.0 via nvm; `corepack yarn`; tests from `shell/`.
- Apache-2.0 header on every new source file; generated file carries the
  header + `/* eslint-disable */`.
- Nothing to `origin` without approval; `fork` push OK. No credentials.
- zod pinned `3.25.76`.
