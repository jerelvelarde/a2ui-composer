# Gallery / Basic Catalog Enhancements — Design

**Date:** 2026-07-21
**Branch:** `jerel/ux-update` (on Google `ec76b5d`)
**Status:** Approved (structure decision confirmed with jerel: enhance the existing gallery as the one reference)

## Goal

Bring the composer's `/gallery` (Components Gallery) up to the widget-builder's
Basic Catalog experience, treating it as THE catalog reference. It already has
grouped nav + iframe preview + usage snippet + properties table, driven by
whatever catalog the active renderer publishes (the basic catalog by default).

## Scope (approved)

1. **Auto-select first component** — when a catalog resolves and nothing is
   selected, preselect the first component so the gallery opens on a populated
   detail view instead of the empty "No Component Selected" screen. Guarded so a
   user's later deselection is respected. Port the effect from
   `v0.1.0:shell/src/app/gallery/gallery.ts` (no `shared/ui` dependency — just
   the effect).

2. **Catalog Definition viewer** — a header segmented toggle (**Components** /
   **Definition**). "Components" is the current reference UI (unchanged).
   "Definition" shows the active catalog's full JSON —
   `catalogManagement.activeCatalog()`, the `ComponentApi` schema contract the
   renderer published — in a read-only `<a2ui-composer-monaco-editor readOnly>`
   pane. This is the composer's honest analogue of the widget-builder's "Catalog
   Definitions" tab.

## Honest constraint (documented, not a gap to fix)

The widget-builder's "Catalog Renderers" source viewer worked because it rendered
in-app. The composer gallery renders **external iframe renderers** whose source it
does not have, so it can show the **Definition** (published catalog) but not
arbitrary renderers' source. The composer's own custom catalog can show both in a
future Catalog-Components slice (we own that source).

## Components / files

- `shell/src/app/gallery/gallery.ts` — add the auto-select `effect` (constructor);
  add `viewMode = signal<'components' | 'definition'>('components')` +
  `catalogJson = computed(() => formatJson(activeCatalog()))`; import
  `MonacoEditor` + `MatButtonToggleModule`.
- `shell/src/app/gallery/gallery.ng.html` — add the header toggle; wrap the
  existing reference UI in `@if (viewMode() === 'components')`; add a
  `@else`/definition branch with the read-only Monaco pane.
- `shell/src/app/gallery/gallery.scss` — style the header toggle + definition pane.
- `shell/src/app/gallery/gallery.spec.ts` — tests: auto-select preselects the
  first component when a catalog resolves; toggling to Definition shows the JSON;
  toggling back restores the reference.

## Keep

- The iframe preview (`<a2ui-composer-rendered-frame>`), the grouped nav, usage
  snippet + copy, and the properties table — all unchanged.

## Testing

- Unit: auto-select behavior + view toggle in `gallery.spec.ts`; full `vitest run`
  green. Visual: gallery opens on a selected component (no empty landing) in
  light + dark; Definition toggle shows the catalog JSON.

## Out of scope (later)

- Native (non-iframe) gallery previews; Catalog Components reference for the custom
  catalog (Preview/Usage/Props + Definitions/Renderers source viewers); Theater.
