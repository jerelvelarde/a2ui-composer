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
import {describe, it, expect, beforeEach, afterEach, vi} from 'vitest';
import {WidgetGallery} from './widget-gallery';
import {WidgetGalleryHarness} from './test/widget-gallery.harness';
import {WIDGET_GALLERY_PRESETS} from './widget-gallery-presets';
import {CatalogManagement} from '../../storage/catalog-management/catalog-management';
import {Catalog} from '../../storage/models/catalog-storage.model';
import {HostCommunication} from '../../shell/host-communication/host-communication';
import {StartupResolution} from '../../shell/startup-resolution/startup-resolution';
import {ChatState} from '../../chat/chat-state/chat-state';

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
});
