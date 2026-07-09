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

import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnDestroy,
  Signal,
  signal,
  WritableSignal,
} from '@angular/core';
import {MatCardModule} from '@angular/material/card';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {MatListModule} from '@angular/material/list';
import {MatProgressBarModule} from '@angular/material/progress-bar';
import {RenderedFrame} from '../preview/rendered/rendered-frame';
import {HostCommunication} from '../shell/host-communication/host-communication';
import {BASIC_CATALOG_SCENARIO, Scenario} from './scenarios/basic-catalog-scenario';

/** Interval between simulated stream frames, in milliseconds. */
export const SCENARIO_TICK_INTERVAL_MS = 800;

/** Lifecycle of the simulated playback cursor. */
export type PlaybackState = 'stopped' | 'playing' | 'paused' | 'completed';

/**
 * Simulated Theater playback view. Replays a static, ordered scenario over the
 * existing `HostCommunication.sendRenderA2UI` apply path: each tick dispatches
 * that tick's `RENDER_A2UI` payload to the connected preview frame, in order.
 *
 * This is intentionally a simulator — it replays a bundled scenario fixture and
 * does not import or transport a real captured stream.
 */
@Component({
  selector: 'a2ui-composer-scenario-player',
  standalone: true,
  imports: [
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatListModule,
    MatProgressBarModule,
    RenderedFrame,
  ],
  templateUrl: './scenario-player.ng.html',
  styleUrl: './scenario-player.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ScenarioPlayer implements OnDestroy {
  private readonly hostCommunication = inject(HostCommunication);

  /** The static scenario replayed by this player. */
  readonly scenario: Scenario = BASIC_CATALOG_SCENARIO;

  private readonly _cursor: WritableSignal<number> = signal(0);
  /** Index of the next tick to emit; equals tick count once playback finishes. */
  readonly cursor: Signal<number> = this._cursor.asReadonly();

  private readonly _playbackState: WritableSignal<PlaybackState> = signal('stopped');
  /** Current playback lifecycle state. */
  readonly playbackState: Signal<PlaybackState> = this._playbackState.asReadonly();

  /** Total number of ticks in the active scenario. */
  readonly totalTicks = this.scenario.ticks.length;

  /** Whether the player is actively advancing through ticks. */
  protected readonly isPlaying = computed(() => this._playbackState() === 'playing');

  /** Fractional playback progress (0-100) for the progress bar. */
  protected readonly progress = computed(() =>
    this.totalTicks === 0 ? 0 : (this._cursor() / this.totalTicks) * 100,
  );

  private timerId: ReturnType<typeof setInterval> | null = null;

  /**
   * Begins (or resumes) playback. A no-op when already playing so repeated
   * clicks never stack timers or double-emit. Restarts from the first tick when
   * invoked after playback has completed.
   */
  play(): void {
    if (this._playbackState() === 'playing') {
      return;
    }
    if (this._cursor() >= this.totalTicks) {
      this._cursor.set(0);
    }
    this._playbackState.set('playing');
    this.timerId = setInterval(() => this.emitCurrentTick(), SCENARIO_TICK_INTERVAL_MS);
  }

  /**
   * Halts playback at the current cursor without emitting anything further.
   */
  pause(): void {
    this.clearTimer();
    if (this._playbackState() === 'playing') {
      this._playbackState.set('paused');
    }
  }

  /**
   * Returns the cursor to the first tick and stops playback. Emits nothing.
   */
  reset(): void {
    this.clearTimer();
    this._cursor.set(0);
    this._playbackState.set('stopped');
  }

  private emitCurrentTick(): void {
    const index = this._cursor();
    const tick = this.scenario.ticks[index];
    this.hostCommunication.sendRenderA2UI([...tick.payload]);
    this._cursor.set(index + 1);

    // The timer is always cleared the moment the final tick is emitted, so it
    // never fires again with the cursor past the end of the scenario.
    if (this._cursor() >= this.totalTicks) {
      this.complete();
    }
  }

  private complete(): void {
    this.clearTimer();
    this._playbackState.set('completed');
  }

  private clearTimer(): void {
    if (this.timerId !== null) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
  }

  ngOnDestroy(): void {
    this.clearTimer();
  }
}
