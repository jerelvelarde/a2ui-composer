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
import {describe, it, expect, beforeEach, afterEach, vi} from 'vitest';
import {Subject} from 'rxjs';
import {PreviewBridgeMessageType} from 'a2ui-bridge';
import {RendererPicker} from './renderer-picker';
import {RendererPickerHarness} from './test/renderer-picker.harness';
import {HostCommunication, MessageEnvelope} from '../host-communication/host-communication';
import {CatalogManagement} from '../../storage/catalog-management/catalog-management';
import {StartupResolution} from '../startup-resolution/startup-resolution';
import {IndexedDbStorage} from '../../storage/indexed-db-storage/indexed-db-storage';
import {LocalStorageInteractions} from '../../storage/local-storage-interactions/local-storage-interactions';
import {LocalStorageKey} from '../../storage/models/local-storage-keys';

const BASIC_ANGULAR_URL = 'http://localhost:3456';
const FLIGHT_URL = 'http://localhost:3459';
const FLIGHT_CATALOG_ID = 'https://copilotkit.ai/a2ui/catalogs/flight-dashboard.json';

/**
 * These specs assert REAL behavior: selecting a curated entry drives the same
 * source of truth the preview iframe reads (StartupResolution) and re-triggers
 * the actual catalog discovery handshake in the real CatalogManagement engine.
 * Only the cross-frame transport (HostCommunication), persistence
 * (LocalStorageInteractions) and IndexedDB are faked; the picker, startup
 * resolution and catalog management collaborate for real.
 */
describe('RendererPicker', () => {
  let fixture: ComponentFixture<RendererPicker>;
  let harness: RendererPickerHarness;
  let catalogManagement: CatalogManagement;
  let startupResolution: StartupResolution;
  let messageStream$: Subject<MessageEnvelope>;
  let sendMessageSpy: ReturnType<typeof vi.fn>;
  let setItemSpy: ReturnType<typeof vi.fn>;

  const emit = (envelope: Omit<MessageEnvelope, 'timestamp'>): void => {
    messageStream$.next({...envelope, timestamp: Date.now()});
    TestBed.tick();
  };

  beforeEach(async () => {
    vi.spyOn(crypto.subtle, 'digest').mockResolvedValue(new Uint8Array(32).buffer);

    messageStream$ = new Subject<MessageEnvelope>();
    sendMessageSpy = vi.fn();
    setItemSpy = vi.fn();

    const hostCommunicationMock = {
      messageStream$: messageStream$.asObservable(),
      sendMessage: sendMessageSpy,
    };
    const indexedDbStorageMock = {
      getCatalogRecord: vi.fn().mockResolvedValue(null),
      saveCatalogRecord: vi.fn().mockResolvedValue(undefined),
    };
    const localStorageMock = {
      getItem: vi.fn().mockReturnValue(null),
      setItem: setItemSpy,
      removeItem: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [RendererPicker],
      providers: [
        provideNoopAnimations(),
        CatalogManagement,
        StartupResolution,
        {provide: HostCommunication, useValue: hostCommunicationMock},
        {provide: IndexedDbStorage, useValue: indexedDbStorageMock},
        {provide: LocalStorageInteractions, useValue: localStorageMock},
      ],
    }).compileComponents();

    catalogManagement = TestBed.inject(CatalogManagement);
    startupResolution = TestBed.inject(StartupResolution);

    fixture = TestBed.createComponent(RendererPicker);
    fixture.detectChanges();
    harness = await TestbedHarnessEnvironment.harnessForFixture(fixture, RendererPickerHarness);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('offers the curated Basic and Flight/Dashboard renderer entries', async () => {
    const labels = await harness.getOptionLabels();
    expect(labels).toEqual(expect.arrayContaining(['Basic (Angular)', 'Flight / Dashboard']));
  });

  it(
    'sets the active renderer URL and re-triggers the discovery handshake, ' +
      'updating the discovered catalog id when a curated entry is selected',
    async () => {
      expect(catalogManagement.activeCatalogTitle()).toBe('');

      await harness.selectRenderer('Flight / Dashboard');

      // The picker mutated the single source of truth the preview iframe and
      // cross-frame origin validation both read.
      expect(startupResolution.getResolvedRendererUrl()).toBe(FLIGHT_URL);
      expect(setItemSpy).toHaveBeenCalledWith(LocalStorageKey.RENDERER_URL, FLIGHT_URL);

      // The reloaded renderer announces itself; the real engine re-runs the
      // RENDERER_READY -> GET_CATALOG -> A2UI_CATALOG handshake.
      emit({type: PreviewBridgeMessageType.RENDERER_READY, origin: FLIGHT_URL});
      expect(catalogManagement.isHandshakeInProgress()).toBe(true);
      expect(sendMessageSpy).toHaveBeenCalledWith({
        type: PreviewBridgeMessageType.GET_CATALOG,
      });

      emit({
        type: PreviewBridgeMessageType.A2UI_CATALOG,
        origin: FLIGHT_URL,
        payload: {
          catalogId: FLIGHT_CATALOG_ID,
          title: 'Flight & Dashboard Catalog',
          description: 'Flight dashboard catalog',
          components: {},
        },
      });

      // Allow the async hashing / storage promise chain to settle.
      await new Promise(resolve => setTimeout(resolve, 50));

      expect(catalogManagement.isHandshakeInProgress()).toBe(false);
      expect(catalogManagement.catalogError()).toBeNull();
      // The title is HTML-sanitized before storage (the DOM decodes the entity
      // back to '&' on render); the discovered catalog id switched to flight.
      expect(catalogManagement.activeCatalogTitle()).toContain('Dashboard Catalog');
      expect(catalogManagement.activeCatalog()?.['catalogId']).toBe(FLIGHT_CATALOG_ID);
    },
  );

  it('tears down the stale catalog surface immediately when switching renderers', async () => {
    // Establish an active catalog from a first renderer.
    await harness.selectRenderer('Basic (Angular)');
    emit({type: PreviewBridgeMessageType.RENDERER_READY, origin: BASIC_ANGULAR_URL});
    emit({
      type: PreviewBridgeMessageType.A2UI_CATALOG,
      origin: BASIC_ANGULAR_URL,
      payload: {
        catalogId: 'https://a2ui.org/specification/v0_9/basic_catalog.json',
        title: 'my_basic_catalog A2UI Catalog',
        components: {},
      },
    });
    await new Promise(resolve => setTimeout(resolve, 50));
    expect(catalogManagement.activeCatalogTitle()).toBe('my_basic_catalog A2UI Catalog');

    // Switching to another renderer must clear the previous surface right away
    // so no stale catalog leaks across the transition.
    await harness.selectRenderer('Flight / Dashboard');

    expect(startupResolution.getResolvedRendererUrl()).toBe(FLIGHT_URL);
    expect(catalogManagement.activeCatalog()).toBeNull();
    expect(catalogManagement.activeCatalogTitle()).toBe('');
    expect(catalogManagement.isHandshakeInProgress()).toBe(false);
    expect(catalogManagement.catalogError()).toBeNull();
  });

  it(
    'surfaces catalogError instead of hanging when the selected renderer ' +
      'never completes discovery',
    async () => {
      vi.useFakeTimers();
      try {
        await harness.selectRenderer('Flight / Dashboard');
        expect(startupResolution.getResolvedRendererUrl()).toBe(FLIGHT_URL);

        // No RENDERER_READY / A2UI_CATALOG ever arrives (unreachable renderer).
        expect(catalogManagement.catalogError()).toBeNull();
        expect(catalogManagement.watchdogFired()).toBe(false);

        // The discovery watchdog fires rather than leaving the UI hung.
        await vi.advanceTimersByTimeAsync(5000);

        expect(catalogManagement.watchdogFired()).toBe(true);
        expect(catalogManagement.catalogError()).toContain('discovery timeout');
        expect(catalogManagement.isHandshakeInProgress()).toBe(false);
      } finally {
        vi.useRealTimers();
      }
    },
  );
});
