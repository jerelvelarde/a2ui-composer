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

import {Injectable, Signal, WritableSignal, inject, signal} from '@angular/core';
import {WidgetLibraryStorage} from '../widget-library-storage/widget-library-storage';
import {WidgetRecord} from '../models/widget-storage.model';

/**
 * Reactive facade over the persisted widget library. Exposes the current set
 * of saved widgets as a readonly signal that updates after every mutation,
 * while delegating durable storage to {@link WidgetLibraryStorage}. Storage
 * errors are propagated to callers rather than swallowed.
 */
@Injectable({
  providedIn: 'root',
})
export class WidgetLibrary {
  private readonly storage = inject(WidgetLibraryStorage);

  private readonly _widgets: WritableSignal<readonly WidgetRecord[]> = signal<
    readonly WidgetRecord[]
  >([]);
  /**
   * Current collection of persisted widgets. Reflects the durable store as of
   * the most recent successful mutation or {@link getAll} call.
   */
  readonly widgets: Signal<readonly WidgetRecord[]> = this._widgets.asReadonly();

  /** Persists a widget and refreshes the reactive collection. */
  async add(record: WidgetRecord): Promise<void> {
    await this.storage.add(record);
    await this.refresh();
  }

  /** Retrieves a single widget by id, or null when absent. */
  get(id: string): Promise<WidgetRecord | null> {
    return this.storage.get(id);
  }

  /** Reads all persisted widgets and syncs them into the reactive signal. */
  async getAll(): Promise<WidgetRecord[]> {
    const all = await this.storage.getAll();
    this._widgets.set(all);
    return all;
  }

  /** Removes a widget by id and refreshes the reactive collection. */
  async delete(id: string): Promise<void> {
    await this.storage.delete(id);
    await this.refresh();
  }

  private async refresh(): Promise<void> {
    this._widgets.set(await this.storage.getAll());
  }
}
