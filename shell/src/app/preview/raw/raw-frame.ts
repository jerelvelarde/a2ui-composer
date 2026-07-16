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
  Component,
  inject,
  signal,
  DestroyRef,
  effect,
  untracked,
  WritableSignal,
} from '@angular/core';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import {FormsModule} from '@angular/forms';
import {Subject} from 'rxjs';
import {debounceTime, filter, map} from 'rxjs/operators';
import {IS_EXTENSION_MODE} from '../../shell/environment-tokens/environment-tokens';
import {HostCommunication} from '../../shell/host-communication/host-communication';
import {CatalogManagement} from '../../storage/catalog-management/catalog-management';
import {StateSync} from '../../chat/state-sync/state-sync';
import {ChatState} from '../../chat/chat-state/chat-state';
import {tryParseJsonArray} from '../../utils/json';
import {Button} from '../../shared/ui';

/**
 * Hosts the raw JSON view of active surface models, allowing direct source editing
 * and displaying real-time parsing error indicators.
 */
@Component({
  selector: 'a2ui-composer-raw-frame',
  standalone: true,
  imports: [MatFormFieldModule, MatInputModule, FormsModule, Button],
  templateUrl: './raw-frame.ng.html',
  styleUrl: './raw-frame.scss',
})
export class RawFrame {
  protected readonly isExtensionMode = inject(IS_EXTENSION_MODE);
  protected readonly layoutJson: WritableSignal<string>;
  protected readonly isJsonInvalid: WritableSignal<boolean> = signal(false);

  readonly TEST_ONLY = {
    layoutJson: () => this.layoutJson,
    isJsonInvalid: () => this.isJsonInvalid,
  };

  private readonly hostCommunication = inject(HostCommunication);
  private readonly catalogManagement = inject(CatalogManagement);
  private readonly stateSync = inject(StateSync);
  private readonly chatState = inject(ChatState);
  private readonly destroyRef = inject(DestroyRef);
  private readonly layoutInput$ = new Subject<string>();

  /**
   * Tracks the last value this editor itself pushed into shared draft state.
   * When an incoming `activeDraft` update matches it, the change originated
   * from the user's own keystrokes, so we leave the buffer exactly as typed
   * (no reformatting). Any other update is treated as an external source
   * (e.g. a completed LLM stream) and is pretty-printed on arrival.
   */
  private lastPushedDraft: string | null = null;

  /** Public lock indicator preventing typing deadlocks during generative LLM stream turns. */
  protected readonly isLocked = this.chatState.isProgrammaticStreamActive;

  constructor() {
    // Initialize backing editor layout state Signal dynamically from the volatile
    // session cache, pretty-printed so the authoring surface never renders a
    // run-on string.
    this.layoutJson = signal(this.formatLayout(this.stateSync.hydrateActiveDraft()));
    effect(() => {
      const catalog = this.catalogManagement.activeCatalog();
      if (catalog) {
        const currentLayout = untracked(() => this.layoutJson());
        try {
          const payload = this.parseLayoutString(currentLayout);
          if (payload !== null) {
            this.hostCommunication.sendRenderA2UI(payload);
          }
        } catch (err) {
          // Ignore initial parse errors
        }
      }
    });

    // Sync back changes in StateSync activeDraft to editor layoutJson (e.g. from LLM stream completed updates)
    effect(() => {
      const activeDraftVal = this.stateSync.activeDraft();
      untracked(() => {
        // Self-originated edits are left exactly as the user typed them so the
        // caret and in-progress text are never disturbed.
        if (activeDraftVal === this.lastPushedDraft) {
          return;
        }
        // External updates are pretty-printed (2-space indent) for readability.
        const formatted = this.formatLayout(activeDraftVal);
        if (this.layoutJson() !== formatted) {
          queueMicrotask(() => {
            this.layoutJson.set(formatted);

            // Run live render updating matching activeDraft commits
            try {
              const payload = this.parseLayoutString(formatted);
              if (payload !== null) {
                this.isJsonInvalid.set(false);
                this.hostCommunication.sendRenderA2UI(payload);
              } else {
                this.isJsonInvalid.set(true);
              }
            } catch (err) {
              this.isJsonInvalid.set(true);
            }
          });
        }
      });
    });

    this.layoutInput$
      .pipe(
        debounceTime(300),
        map((value: string): unknown[] | null => {
          try {
            const payload = this.parseLayoutString(value);
            if (payload !== null) {
              this.isJsonInvalid.set(false);
              return payload;
            }
            this.isJsonInvalid.set(true);
            return null;
          } catch (err) {
            this.isJsonInvalid.set(true);
            return null;
          }
        }),
        filter((payload): payload is unknown[] => payload !== null),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((payload: unknown[]) => {
        this.hostCommunication.sendRenderA2UI(payload);
      });
  }

  protected onLayoutChange(value: string): void {
    this.layoutJson.set(value);
    this.lastPushedDraft = value;
    this.layoutInput$.next(value);
    this.stateSync.updateDraft(value);
  }

  /**
   * Pretty-prints the current buffer in place (2-space indent), routing the
   * result through the normal edit path so it round-trips and re-renders.
   * Invalid JSON is left untouched.
   */
  protected formatDocument(): void {
    const formatted = this.formatLayout(this.layoutJson());
    if (formatted !== this.layoutJson()) {
      this.onLayoutChange(formatted);
    }
  }

  /**
   * Returns a pretty-printed (2-space indented) JSON-array rendering of a raw
   * layout string. Accepts both the JSON-array and JSON-Lines input formats
   * the editor supports and normalises to the canonical array form. If the
   * value cannot be parsed it is returned unchanged so partial/invalid edits
   * are never destroyed.
   */
  private formatLayout(value: string): string {
    try {
      if (!value.trim()) {
        return value;
      }
      const parsed = this.parseLayoutString(value);
      if (parsed === null) {
        return value;
      }
      return JSON.stringify(parsed, null, 2);
    } catch {
      return value;
    }
  }

  /**
   * Parses the raw layout configuration string into an array of message objects.
   *
   * It supports two input formats:
   * 1. A standard JSON array (e.g. `[ { "createSurface": ... }, ... ]`),
   *    detected if it starts with `[`.
   * 2. JSON Lines (JSONL) format, where each non-empty line represents a
   *    standalone JSON object.
   *
   * If parsing fails, it throws a SyntaxError (which callers are expected to catch).
   *
   * @param value The raw layout string to parse.
   * @returns An array of parsed JSON objects (or empty array if input is empty).
   */
  private parseLayoutString(value: string): unknown[] | null {
    const trimmed = value.trim();
    if (!trimmed) {
      return [];
    }
    // Format 1: Standard JSON Array format
    if (trimmed.startsWith('[')) {
      const parsed = tryParseJsonArray(trimmed);
      if (parsed === null) {
        throw new SyntaxError('Invalid JSON Array');
      }
      return parsed;
    }
    // Format 2: JSON Lines (JSONL) format. Parse each line independently.
    const lines = trimmed
      .split('\n')
      .map(l => l.trim())
      .filter(l => l.length > 0);
    return lines.map(line => JSON.parse(line));
  }
}
