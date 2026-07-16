/**
 * Copyright 2026 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {ComponentFixture, TestBed} from '@angular/core/testing';
import {provideNoopAnimations} from '@angular/platform-browser/animations';
import {TestbedHarnessEnvironment} from '@angular/cdk/testing/testbed';
import {signal, WritableSignal} from '@angular/core';
import {IDBFactory} from 'fake-indexeddb';
import {describe, it, expect, beforeEach, afterEach, vi} from 'vitest';

import {LibrarySidebar} from './library-sidebar';
import {LibrarySidebarHarness} from './test/library-sidebar.harness';
import {WidgetLibrary} from '../../storage/widget-library/widget-library';
import {WidgetRecord} from '../../storage/models/widget-storage.model';
import {StateSync} from '../../chat/state-sync/state-sync';
import {CatalogManagement} from '../../storage/catalog-management/catalog-management';
import {Catalog} from '../../storage/models/catalog-storage.model';
import {Feedback} from '../../shared/ui';

function makeWidget(id: string, catalogId = 'catalog-seed'): WidgetRecord {
  return {
    id,
    catalogId,
    name: `Widget ${id}`,
    definition: `{"id":"${id}"}`,
    createdAt: 1,
    updatedAt: 1,
  };
}

const CATALOG_ID = 'https://a2ui.org/specification/v0_9/basic_catalog.json';

const NON_EMPTY_DRAFT =
  JSON.stringify({
    version: 'v0.9',
    createSurface: {surfaceId: 'my-surface', catalogId: CATALOG_ID, sendDataModel: true},
  }) + '\n';

describe('LibrarySidebar', () => {
  let fixture: ComponentFixture<LibrarySidebar>;
  let harness: LibrarySidebarHarness;
  let library: WidgetLibrary;
  let activeDraft: WritableSignal<string>;
  let activeCatalog: WritableSignal<Catalog | null>;
  let feedback: {success: ReturnType<typeof vi.fn>; error: ReturnType<typeof vi.fn>};

  async function setup(draft: string, catalog: Catalog | null): Promise<void> {
    // Fresh in-memory IndexedDB so the real WidgetLibrary performs a genuine
    // persistence round-trip in every test.
    Object.defineProperty(globalThis, 'indexedDB', {
      value: new IDBFactory(),
      writable: true,
      configurable: true,
    });

    activeDraft = signal(draft);
    activeCatalog = signal(catalog);
    feedback = {success: vi.fn(), error: vi.fn()};

    TestBed.configureTestingModule({
      imports: [LibrarySidebar],
      providers: [
        provideNoopAnimations(),
        {provide: StateSync, useValue: {activeDraft: activeDraft.asReadonly()}},
        {provide: CatalogManagement, useValue: {activeCatalog: activeCatalog.asReadonly()}},
        {provide: Feedback, useValue: feedback},
      ],
    });

    library = TestBed.inject(WidgetLibrary);
    fixture = TestBed.createComponent(LibrarySidebar);
    fixture.detectChanges();
    await fixture.whenStable();
    harness = await TestbedHarnessEnvironment.harnessForFixture(fixture, LibrarySidebarHarness);
  }

  afterEach(() => {
    TestBed.resetTestingModule();
    vi.restoreAllMocks();
  });

  describe('reactive widget list backed by a real WidgetLibrary', () => {
    beforeEach(async () => {
      await setup('', {catalogId: CATALOG_ID});
    });

    it('renders no entries when the library is empty', async () => {
      expect(await harness.getWidgetCount()).toBe(0);
    });

    it('renders one entry per persisted widget and tracks adds reactively', async () => {
      expect(await harness.getWidgetCount()).toBe(0);

      await library.add(makeWidget('w1'));
      fixture.detectChanges();
      await fixture.whenStable();
      expect(await harness.getWidgetCount()).toBe(1);

      await library.add(makeWidget('w2'));
      fixture.detectChanges();
      await fixture.whenStable();
      expect(await harness.getWidgetCount()).toBe(2);

      // The rendered DOM reflects the service signal's actual contents,
      // not merely a static template.
      const names = await harness.getWidgetNames();
      expect(names.join(' ')).toContain('Widget w1');
      expect(names.join(' ')).toContain('Widget w2');
    });

    it('removes an entry reactively when a widget is deleted from the store', async () => {
      await library.add(makeWidget('w1'));
      await library.add(makeWidget('w2'));
      fixture.detectChanges();
      await fixture.whenStable();
      expect(await harness.getWidgetCount()).toBe(2);

      await library.delete('w1');
      fixture.detectChanges();
      await fixture.whenStable();

      expect(await harness.getWidgetCount()).toBe(1);
      const names = await harness.getWidgetNames();
      expect(names.join(' ')).not.toContain('Widget w1');
      expect(names.join(' ')).toContain('Widget w2');
    });
  });

  describe('saving a non-empty draft', () => {
    beforeEach(async () => {
      await setup(NON_EMPTY_DRAFT, {catalogId: CATALOG_ID});
    });

    it('persists a WidgetRecord carrying the resolved catalogId and shows it in the list', async () => {
      expect(await harness.isSaveDisabled()).toBe(false);
      expect((await library.getAll()).length).toBe(0);

      await harness.clickSave();
      await fixture.whenStable();
      fixture.detectChanges();
      await fixture.whenStable();

      const all = await library.getAll();
      expect(all).toHaveLength(1);
      // The saved record must carry the resolved catalog id.
      expect(all[0].catalogId).toBe(CATALOG_ID);
      // The saved definition must be the draft that was read.
      expect(all[0].definition).toBe(NON_EMPTY_DRAFT);
      expect(all[0].id).toBeTruthy();

      // The newly saved widget is retrievable and appears in the rendered list.
      const persisted = await library.get(all[0].id);
      expect(persisted).not.toBeNull();
      expect(await harness.getWidgetCount()).toBe(1);

      // The save confirms itself through the shared feedback helper.
      expect(feedback.success).toHaveBeenCalledWith('Saved to library');
    });

    it('does not mutate the working draft when saving (read-only w.r.t. the draft)', async () => {
      const before = activeDraft();
      await harness.clickSave();
      await fixture.whenStable();
      expect(activeDraft()).toBe(before);
    });
  });

  describe('catalogId resolution and name fallbacks', () => {
    it('falls back to the catalogId embedded in the draft when no catalog is active', async () => {
      await setup(NON_EMPTY_DRAFT, null);

      await harness.clickSave();
      await fixture.whenStable();

      const all = await library.getAll();
      expect(all).toHaveLength(1);
      expect(all[0].catalogId).toBe(CATALOG_ID);
      // The surfaceId in the draft becomes the human-readable name.
      expect(all[0].name).toBe('my-surface');
    });

    it('resolves catalogId from the active catalog $id when catalogId is absent', async () => {
      await setup(NON_EMPTY_DRAFT, {$id: 'catalog-from-id'});

      await harness.clickSave();
      await fixture.whenStable();

      const all = await library.getAll();
      expect(all[0].catalogId).toBe('catalog-from-id');
    });

    it('saves a malformed/plain-text draft with an empty catalogId and a default name', async () => {
      await setup('just some conversational text\nnot json', null);

      expect(await harness.isSaveDisabled()).toBe(false);
      await harness.clickSave();
      await fixture.whenStable();

      const all = await library.getAll();
      expect(all).toHaveLength(1);
      expect(all[0].catalogId).toBe('');
      expect(all[0].name).toContain('Widget');
      expect(all[0].definition).toBe('just some conversational text\nnot json');
    });
  });

  describe('empty or absent draft is a no-op', () => {
    it('disables the save control and writes no record for an empty draft', async () => {
      await setup('', {catalogId: CATALOG_ID});
      const addSpy = vi.spyOn(library, 'add');

      expect(await harness.isSaveDisabled()).toBe(true);

      // Clicking a disabled control does nothing; invoking the handler
      // directly must also be an inert, throw-free no-op.
      await harness.clickSave();
      await expect(fixture.componentInstance.saveCurrentDraft()).resolves.toBeUndefined();
      await fixture.whenStable();

      expect(addSpy).not.toHaveBeenCalled();
      expect(await library.getAll()).toHaveLength(0);
      expect(await harness.getWidgetCount()).toBe(0);
      // A no-op save must not emit a phantom confirmation toast.
      expect(feedback.success).not.toHaveBeenCalled();
    });

    it('treats a whitespace-only draft as absent and writes no record', async () => {
      await setup('   \n  \t', {catalogId: CATALOG_ID});
      const addSpy = vi.spyOn(library, 'add');

      expect(await harness.isSaveDisabled()).toBe(true);
      await expect(fixture.componentInstance.saveCurrentDraft()).resolves.toBeUndefined();
      await fixture.whenStable();

      expect(addSpy).not.toHaveBeenCalled();
      expect(await library.getAll()).toHaveLength(0);
    });
  });
});
