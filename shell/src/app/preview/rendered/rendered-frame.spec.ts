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
import {RenderedFrame} from './rendered-frame';
import {TestbedHarnessEnvironment} from '@angular/cdk/testing/testbed';
import {RenderedFrameHarness} from './test/rendered-frame.harness';
import {describe, it, expect, beforeEach, vi} from 'vitest';
import {StartupResolution} from '../../shell/startup-resolution/startup-resolution';
import {HostCommunication} from '../../shell/host-communication/host-communication';
import {ChatState, LlmLogEntry, LlmLogType} from '../../chat/chat-state/chat-state';
import {CatalogManagement} from '../../storage/catalog-management/catalog-management';
import {Catalog} from '../../storage/models/catalog-storage.model';
import {Feedback} from '../../shared/ui';
import {signal, WritableSignal} from '@angular/core';

class MockFeedback {
  success = vi.fn();
  error = vi.fn();
}

class MockChatState {
  readonly isProgrammaticStreamActive = signal<boolean>(false);
  readonly latestLlmLog = signal<LlmLogEntry | null>(null);
  readonly llmHistory = signal<LlmLogEntry[]>([]);
  addRawLlmLog(type: LlmLogType, payload: unknown): void {
    const entry = {type, timestamp: Date.now(), payload};
    this.latestLlmLog.set(entry);
    this.llmHistory.update(h => [...h, entry].slice(-50));
  }
  clearRawLlmHistory(): void {
    this.latestLlmLog.set(null);
    this.llmHistory.set([]);
  }
}

/** Minimal CatalogManagement stand-in exposing only the load-lifecycle signals. */
class MockCatalogManagement {
  readonly activeCatalog = signal<Catalog | null>(null);
  readonly catalogError = signal<string | null>(null);
  readonly watchdogFired = signal<boolean>(false);
  readonly isHandshakeInProgress = signal<boolean>(false);
  prepareForRendererSwitch = vi.fn(() => {
    this.catalogError.set(null);
    this.activeCatalog.set(null);
  });
}

describe('RenderedFrame Live Preview Viewport', () => {
  let fixture: ComponentFixture<RenderedFrame>;
  let harness: RenderedFrameHarness;
  let startupResolutionServiceMock: Partial<StartupResolution>;
  let hostCommunicationServiceMock: Partial<HostCommunication>;
  let resolvedUrlSignal: WritableSignal<string | null>;
  let chatStateMock: MockChatState;
  let catalogManagementMock: MockCatalogManagement;

  beforeEach(async () => {
    resolvedUrlSignal = signal('http://localhost:3000/renderer');
    startupResolutionServiceMock = {
      resolvedUrl: resolvedUrlSignal,
    };

    hostCommunicationServiceMock = {
      registerIframe: vi.fn(),
    };

    catalogManagementMock = new MockCatalogManagement();

    await TestBed.configureTestingModule({
      imports: [RenderedFrame],
      providers: [
        {
          provide: StartupResolution,
          useValue: startupResolutionServiceMock,
        },
        {
          provide: HostCommunication,
          useValue: hostCommunicationServiceMock,
        },
        {
          provide: ChatState,
          useClass: MockChatState,
        },
        {
          provide: CatalogManagement,
          useValue: catalogManagementMock,
        },
        {
          provide: Feedback,
          useClass: MockFeedback,
        },
      ],
    }).compileComponents();

    chatStateMock = TestBed.inject(ChatState) as unknown as MockChatState;
    fixture = TestBed.createComponent(RenderedFrame);
    fixture.detectChanges();
    harness = await TestbedHarnessEnvironment.harnessForFixture(fixture, RenderedFrameHarness);
  });

  it('renders the iframe securely bound to the active renderer URL', async () => {
    expect(await harness.hasIframe()).toBe(true);
    expect(await harness.getIframeSrc()).toBe(
      'http://localhost:3000/renderer?origin=http%3A%2F%2Flocalhost%3A3000',
    );
  });

  it('registers the iframe contentWindow with HostCommunication upon view initialization', () => {
    expect(hostCommunicationServiceMock.registerIframe).toHaveBeenCalled();
  });

  it('renders a placeholder when no renderer URL is resolved', async () => {
    fixture.destroy();
    resolvedUrlSignal.set(null);
    const nullFixture = TestBed.createComponent(RenderedFrame);
    nullFixture.detectChanges();
    const nullHarness = await TestbedHarnessEnvironment.harnessForFixture(
      nullFixture,
      RenderedFrameHarness,
    );

    expect(await nullHarness.hasIframe()).toBe(false);
  });

  it('renders a placeholder when the renderer URL is malformed and fails parsing', async () => {
    fixture.destroy();
    resolvedUrlSignal.set('http://[invalid]');
    const malformedFixture = TestBed.createComponent(RenderedFrame);
    malformedFixture.detectChanges();
    const malformedHarness = await TestbedHarnessEnvironment.harnessForFixture(
      malformedFixture,
      RenderedFrameHarness,
    );

    expect(await malformedHarness.hasIframe()).toBe(false);
  });

  it('correctly handles relative renderer URLs and appends the origin', async () => {
    fixture.destroy();
    resolvedUrlSignal.set('/renderer');
    const relativeFixture = TestBed.createComponent(RenderedFrame);
    relativeFixture.detectChanges();
    const relativeHarness = await TestbedHarnessEnvironment.harnessForFixture(
      relativeFixture,
      RenderedFrameHarness,
    );

    expect(await relativeHarness.hasIframe()).toBe(true);
    expect(await relativeHarness.getIframeSrc()).toBe(
      'http://localhost:3000/renderer?origin=http%3A%2F%2Flocalhost%3A3000',
    );
  });

  it('shows a loading overlay over the iframe while the handshake is pending', async () => {
    expect(await harness.hasIframe()).toBe(true);
    expect(await harness.isLoading()).toBe(true);
    expect(await harness.hasError()).toBe(false);
  });

  it('clears the loading overlay once a catalog handshake resolves', async () => {
    catalogManagementMock.activeCatalog.set({catalogId: 'c1'} as Catalog);
    fixture.detectChanges();

    expect(await harness.isLoading()).toBe(false);
    expect(await harness.hasError()).toBe(false);
    expect(await harness.hasIframe()).toBe(true);
  });

  it('surfaces an error state with a retry action when the catalog handshake fails', async () => {
    catalogManagementMock.catalogError.set('Watchdog timeout: A2UI_CATALOG not received.');
    fixture.detectChanges();

    expect(await harness.hasError()).toBe(true);
    expect(await harness.hasIframe()).toBe(false);
  });

  it('surfaces a failed load through the shared feedback toast, once per failure', async () => {
    const feedback = TestBed.inject(Feedback) as unknown as MockFeedback;
    expect(feedback.error).not.toHaveBeenCalled();

    catalogManagementMock.catalogError.set('Watchdog timeout: A2UI_CATALOG not received.');
    fixture.detectChanges();

    expect(feedback.error).toHaveBeenCalledTimes(1);
    expect(feedback.error).toHaveBeenCalledWith('Watchdog timeout: A2UI_CATALOG not received.');

    // Staying in the error state must not re-fire the toast on every CD tick.
    fixture.detectChanges();
    expect(feedback.error).toHaveBeenCalledTimes(1);
  });

  it('re-attempts discovery and remounts the iframe when retry is pressed', async () => {
    catalogManagementMock.catalogError.set('Renderer discovery timeout.');
    fixture.detectChanges();
    expect(await harness.hasError()).toBe(true);

    await harness.clickRetry();
    fixture.detectChanges();

    expect(catalogManagementMock.prepareForRendererSwitch).toHaveBeenCalled();
    expect(await harness.hasError()).toBe(false);
    expect(await harness.hasIframe()).toBe(true);
    expect(await harness.isLoading()).toBe(true);
  });

  it('visually locks manual preview visual click dispatches during active model stream turns', async () => {
    expect(await harness.isLocked()).toBe(false);

    // Lock active stream
    chatStateMock.isProgrammaticStreamActive.set(true);
    fixture.detectChanges();
    expect(await harness.isLocked()).toBe(true);

    // Release lock
    chatStateMock.isProgrammaticStreamActive.set(false);
    fixture.detectChanges();
    expect(await harness.isLocked()).toBe(false);
  });
});
