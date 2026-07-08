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
import {signal} from '@angular/core';
import {describe, it, expect, beforeEach, afterEach, vi} from 'vitest';
import {ScenarioPlayer, SCENARIO_TICK_INTERVAL_MS} from './scenario-player';
import {BASIC_CATALOG_SCENARIO} from './scenarios/basic-catalog-scenario';
import {HostCommunication} from '../shell/host-communication/host-communication';
import {StartupResolution} from '../shell/startup-resolution/startup-resolution';
import {ChatState} from '../chat/chat-state/chat-state';

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

/** All per-tick payloads in scenario order, as sent to sendRenderA2UI. */
const orderedPayloads = BASIC_CATALOG_SCENARIO.ticks.map(tick => [...tick.payload]);
const TOTAL_TICKS = orderedPayloads.length;

describe('ScenarioPlayer', () => {
  let fixture: ComponentFixture<ScenarioPlayer>;
  let component: ScenarioPlayer;
  let host: MockHostCommunication;

  beforeEach(async () => {
    vi.useFakeTimers();

    await TestBed.configureTestingModule({
      imports: [ScenarioPlayer],
      providers: [
        provideNoopAnimations(),
        {provide: HostCommunication, useClass: MockHostCommunication},
        {provide: StartupResolution, useClass: MockStartupResolution},
        {provide: ChatState, useClass: MockChatState},
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ScenarioPlayer);
    component = fixture.componentInstance;
    fixture.detectChanges();

    host = TestBed.inject(HostCommunication) as unknown as MockHostCommunication;
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  it('starts at cursor 0 in the stopped state with no emissions', () => {
    expect(component.cursor()).toBe(0);
    expect(component.playbackState()).toBe('stopped');
    expect(host.sendRenderA2UI).not.toHaveBeenCalled();
  });

  it('advances through the ticks emitting each per-tick payload in exact order', () => {
    component.play();
    expect(component.playbackState()).toBe('playing');

    vi.advanceTimersByTime(SCENARIO_TICK_INTERVAL_MS * TOTAL_TICKS);

    expect(host.sendRenderA2UI).toHaveBeenCalledTimes(TOTAL_TICKS);
    orderedPayloads.forEach((payload, index) => {
      expect(host.sendRenderA2UI.mock.calls[index][0]).toEqual(payload);
    });

    // Playback auto-completes once the final tick is emitted.
    expect(component.cursor()).toBe(TOTAL_TICKS);
    expect(component.playbackState()).toBe('completed');
  });

  it('emits ticks one at a time as the timer fires', () => {
    component.play();

    vi.advanceTimersByTime(SCENARIO_TICK_INTERVAL_MS);
    expect(host.sendRenderA2UI).toHaveBeenCalledTimes(1);
    expect(host.sendRenderA2UI.mock.calls[0][0]).toEqual(orderedPayloads[0]);
    expect(component.cursor()).toBe(1);

    vi.advanceTimersByTime(SCENARIO_TICK_INTERVAL_MS);
    expect(host.sendRenderA2UI).toHaveBeenCalledTimes(2);
    expect(host.sendRenderA2UI.mock.calls[1][0]).toEqual(orderedPayloads[1]);
    expect(component.cursor()).toBe(2);
  });

  it('pause halts further emissions while preserving the cursor', () => {
    component.play();
    vi.advanceTimersByTime(SCENARIO_TICK_INTERVAL_MS * 2);
    expect(host.sendRenderA2UI).toHaveBeenCalledTimes(2);

    component.pause();
    expect(component.playbackState()).toBe('paused');
    const cursorAtPause = component.cursor();

    vi.advanceTimersByTime(SCENARIO_TICK_INTERVAL_MS * 5);
    expect(host.sendRenderA2UI).toHaveBeenCalledTimes(2);
    expect(component.cursor()).toBe(cursorAtPause);
  });

  it('resumes from the paused cursor without re-emitting prior ticks', () => {
    component.play();
    vi.advanceTimersByTime(SCENARIO_TICK_INTERVAL_MS);
    component.pause();
    host.sendRenderA2UI.mockClear();

    component.play();
    vi.advanceTimersByTime(SCENARIO_TICK_INTERVAL_MS);
    expect(host.sendRenderA2UI).toHaveBeenCalledTimes(1);
    expect(host.sendRenderA2UI.mock.calls[0][0]).toEqual(orderedPayloads[1]);
  });

  it('reset returns the cursor to 0, stops emitting, and itself emits nothing', () => {
    component.play();
    vi.advanceTimersByTime(SCENARIO_TICK_INTERVAL_MS * 2);
    expect(host.sendRenderA2UI).toHaveBeenCalledTimes(2);

    host.sendRenderA2UI.mockClear();
    component.reset();

    // Reset performs no emission of its own.
    expect(host.sendRenderA2UI).not.toHaveBeenCalled();
    expect(component.cursor()).toBe(0);
    expect(component.playbackState()).toBe('stopped');

    // And no timer keeps firing after reset.
    vi.advanceTimersByTime(SCENARIO_TICK_INTERVAL_MS * 5);
    expect(host.sendRenderA2UI).not.toHaveBeenCalled();
  });

  it('replays from the start when play is invoked after completion', () => {
    component.play();
    vi.advanceTimersByTime(SCENARIO_TICK_INTERVAL_MS * TOTAL_TICKS);
    expect(component.playbackState()).toBe('completed');
    expect(host.sendRenderA2UI).toHaveBeenCalledTimes(TOTAL_TICKS);

    host.sendRenderA2UI.mockClear();
    component.play();
    expect(component.cursor()).toBe(0);

    vi.advanceTimersByTime(SCENARIO_TICK_INTERVAL_MS);
    expect(host.sendRenderA2UI).toHaveBeenCalledTimes(1);
    expect(host.sendRenderA2UI.mock.calls[0][0]).toEqual(orderedPayloads[0]);
  });

  it('double play does not start a second timer or double-emit', () => {
    component.play();
    component.play();

    vi.advanceTimersByTime(SCENARIO_TICK_INTERVAL_MS);
    expect(host.sendRenderA2UI).toHaveBeenCalledTimes(1);
  });

  it('cleans up the timer on destroy so no further emissions occur (no leak)', () => {
    component.play();
    vi.advanceTimersByTime(SCENARIO_TICK_INTERVAL_MS);
    expect(host.sendRenderA2UI).toHaveBeenCalledTimes(1);

    fixture.destroy();
    expect(vi.getTimerCount()).toBe(0);

    vi.advanceTimersByTime(SCENARIO_TICK_INTERVAL_MS * 5);
    expect(host.sendRenderA2UI).toHaveBeenCalledTimes(1);
  });
});
