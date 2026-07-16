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
import {signal} from '@angular/core';
import {IDBFactory} from 'fake-indexeddb';
import {describe, it, expect, beforeEach, afterEach, vi} from 'vitest';
import {WidgetGallery} from './widget-gallery';
import {WidgetGalleryHarness} from './test/widget-gallery.harness';
import {WIDGET_GALLERY_PRESETS} from './widget-gallery-presets';
import {CatalogManagement} from '../../storage/catalog-management/catalog-management';
import {Catalog} from '../../storage/models/catalog-storage.model';
import {HostCommunication} from '../../shell/host-communication/host-communication';
import {StartupResolution} from '../../shell/startup-resolution/startup-resolution';
import {ChatState} from '../../chat/chat-state/chat-state';
import {WidgetLibrary} from '../../storage/widget-library/widget-library';
import {WidgetRecord} from '../../storage/models/widget-storage.model';

const KNOWN_CATALOG_ID = 'https://a2ui.org/specification/v0_9/basic_catalog.json';

class MockCatalogManagement {
  readonly activeCatalog = signal<Catalog | null>({
    catalogId: KNOWN_CATALOG_ID,
    components: {Text: {type: 'object'}, Column: {type: 'object'}, Card: {type: 'object'}},
  });
  readonly catalogError = signal<string | null>(null);
}

class MockHostCommunication {
  sendRenderA2UI = vi.fn();
  registerIframeElement = vi.fn();
  registerIframe = vi.fn();
}

class MockStartupResolution {
  readonly resolvedUrl = signal<string | null>('http://localhost/renderer');
  getResolvedRendererUrl = vi.fn(() => 'http://localhost/renderer');
}

class MockChatState {
  readonly isProgrammaticStreamActive = signal<boolean>(false);
}

describe('WidgetGallery Component', () => {
  let fixture: ComponentFixture<WidgetGallery>;
  let harness: WidgetGalleryHarness;
  let hostCommunicationMock: MockHostCommunication;
  let setItemSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(async () => {
    // Real, isolated IndexedDB per test so the (root) WidgetLibrary and its
    // storage back the clone-to-library flow against a genuine store rather
    // than a stub. A fresh factory guarantees no bleed between tests.
    Object.defineProperty(globalThis, 'indexedDB', {
      value: new IDBFactory(),
      writable: true,
      configurable: true,
    });

    // Read-only guard: intercept every localStorage write for the whole test.
    setItemSpy = vi.spyOn(Storage.prototype, 'setItem');

    await TestBed.configureTestingModule({
      imports: [WidgetGallery],
      providers: [
        provideNoopAnimations(),
        {provide: CatalogManagement, useClass: MockCatalogManagement},
        {provide: HostCommunication, useClass: MockHostCommunication},
        {provide: StartupResolution, useClass: MockStartupResolution},
        {provide: ChatState, useClass: MockChatState},
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(WidgetGallery);
    fixture.detectChanges();
    harness = await TestbedHarnessEnvironment.harnessForFixture(fixture, WidgetGalleryHarness);

    hostCommunicationMock = TestBed.inject(HostCommunication) as unknown as MockHostCommunication;
  });

  afterEach(() => {
    setItemSpy.mockRestore();
    vi.clearAllMocks();
  });

  it('renders one card per finished-widget preset as a grid (N >= 1)', async () => {
    expect(WIDGET_GALLERY_PRESETS.length).toBeGreaterThanOrEqual(1);
    const count = await harness.getCardCount();
    expect(count).toBe(WIDGET_GALLERY_PRESETS.length);
  });

  it('does not mount the sandboxed preview frame until a card is opened', async () => {
    expect(await harness.hasRenderedFrame()).toBe(false);
    await harness.clickCard(0);
    fixture.detectChanges();
    expect(await harness.hasRenderedFrame()).toBe(true);
  });

  it('highlights the opened card as selected and opens the side preview panel', async () => {
    expect(await harness.isCardSelected(0)).toBe(false);
    expect(await harness.hasPreviewPanel()).toBe(false);

    await harness.clickCard(0);
    fixture.detectChanges();

    expect(await harness.isCardSelected(0)).toBe(true);
    expect(await harness.hasPreviewPanel()).toBe(true);
  });

  it('closes the preview panel and clears selection via the close action', async () => {
    await harness.clickCard(0);
    fixture.detectChanges();
    expect(await harness.isCardSelected(0)).toBe(true);

    await harness.clickClosePreview();
    fixture.detectChanges();

    expect(await harness.isCardSelected(0)).toBe(false);
    expect(await harness.hasPreviewPanel()).toBe(false);
    expect(await harness.hasRenderedFrame()).toBe(false);
  });

  it('dispatches the two-command v0.9 payload to HostCommunication when a card is opened', async () => {
    await harness.clickCard(0);
    fixture.detectChanges();
    TestBed.flushEffects();

    expect(hostCommunicationMock.sendRenderA2UI).toHaveBeenCalledTimes(1);
    const payload = hostCommunicationMock.sendRenderA2UI.mock.calls[0][0] as Array<
      Record<string, unknown>
    >;

    // Exactly two commands, in order: createSurface then updateComponents.
    expect(Array.isArray(payload)).toBe(true);
    expect(payload).toHaveLength(2);

    const createCmd = payload[0];
    const createSurface = createCmd['createSurface'] as Record<string, unknown>;
    expect(createCmd['version']).toBe('v0.9');
    expect(typeof createSurface).toBe('object');
    expect(typeof createSurface['surfaceId']).toBe('string');
    expect(typeof createSurface['catalogId']).toBe('string');
    expect(createSurface['catalogId']).toBe(KNOWN_CATALOG_ID);

    const updateCmd = payload[1];
    const updateComponents = updateCmd['updateComponents'] as Record<string, unknown>;
    expect(updateCmd['version']).toBe('v0.9');
    expect(typeof updateComponents).toBe('object');
    expect(updateComponents['surfaceId']).toBe(createSurface['surfaceId']);
    expect(Array.isArray(updateComponents['components'])).toBe(true);
    expect(updateComponents['components']).toEqual(WIDGET_GALLERY_PRESETS[0].components);
  });

  it('is strictly read-only: opening a card performs no localStorage writes', async () => {
    setItemSpy.mockClear();
    await harness.clickCard(0);
    fixture.detectChanges();
    TestBed.flushEffects();

    expect(setItemSpy).not.toHaveBeenCalled();
  });

  describe('clone to library', () => {
    let library: WidgetLibrary;

    beforeEach(() => {
      library = TestBed.inject(WidgetLibrary);
    });

    it('exposes one clone-to-library action per finished-widget card', async () => {
      const count = await harness.getCloneButtonCount();
      expect(count).toBe(WIDGET_GALLERY_PRESETS.length);
    });

    it('writes exactly one new WidgetRecord via WidgetLibrary.add per clone', async () => {
      const addSpy = vi.spyOn(library, 'add');

      await harness.clickCloneButton(0);
      await vi.waitFor(() => expect(addSpy).toHaveBeenCalledTimes(1));

      const preset = WIDGET_GALLERY_PRESETS[0];
      const record = addSpy.mock.calls[0][0] as WidgetRecord;

      // Fresh UUID identity, not the source preset id.
      expect(typeof record.id).toBe('string');
      expect(record.id).not.toBe(preset.id);
      expect(record.id.length).toBeGreaterThan(0);

      // Carries the resolved catalog and a "(Copy)" name.
      expect(record.catalogId).toBe(KNOWN_CATALOG_ID);
      expect(record.name).toBe(`${preset.name} (Copy)`);

      // The component tree is copied into the serialized definition.
      expect(JSON.parse(record.definition)).toEqual(preset.components);

      // Timestamps are populated.
      expect(typeof record.createdAt).toBe('number');
      expect(typeof record.updatedAt).toBe('number');
    });

    it('persists the clone so it is retrievable from the real library afterward', async () => {
      const addSpy = vi.spyOn(library, 'add');

      await harness.clickCloneButton(0);
      await vi.waitFor(() => expect(addSpy).toHaveBeenCalledTimes(1));
      const record = addSpy.mock.calls[0][0] as WidgetRecord;

      // Round-trip: the durable store returns the record by id and via getAll.
      const fetched = await library.get(record.id);
      expect(fetched).toEqual(record);

      const all = await library.getAll();
      expect(all).toContainEqual(record);

      // The reactive collection reflects the persisted clone.
      expect(library.widgets().some(w => w.id === record.id)).toBe(true);
    });

    it('leaves the source preset object untouched (deep copy)', async () => {
      const preset = WIDGET_GALLERY_PRESETS[0];
      const snapshot = structuredClone(preset);
      const addSpy = vi.spyOn(library, 'add');

      await harness.clickCloneButton(0);
      await vi.waitFor(() => expect(addSpy).toHaveBeenCalledTimes(1));

      // No shared-reference mutation: the preset (and its component tree) is
      // byte-for-byte identical to the pre-clone snapshot.
      expect(preset).toEqual(snapshot);
      expect(preset.components).toEqual(snapshot.components);
    });

    it('produces distinct records with unique ids across repeated clones', async () => {
      const addSpy = vi.spyOn(library, 'add');

      await harness.clickCloneButton(0);
      await vi.waitFor(() => expect(addSpy).toHaveBeenCalledTimes(1));
      await harness.clickCloneButton(0);
      await vi.waitFor(() => expect(addSpy).toHaveBeenCalledTimes(2));

      const first = addSpy.mock.calls[0][0] as WidgetRecord;
      const second = addSpy.mock.calls[1][0] as WidgetRecord;
      expect(first.id).not.toBe(second.id);

      // Both survive in the durable store without id collision.
      const all = await library.getAll();
      expect(all).toHaveLength(2);
      const ids = new Set(all.map(w => w.id));
      expect(ids.size).toBe(2);
    });

    it('does not open the preview panel when cloning a card', async () => {
      await harness.clickCloneButton(0);
      fixture.detectChanges();
      TestBed.flushEffects();

      expect(await harness.hasRenderedFrame()).toBe(false);
    });
  });
});
