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

import {Injectable} from '@angular/core';
import {WidgetRecord} from '../models/widget-storage.model';
import {
  COMPOSER_DB_NAME,
  COMPOSER_DB_VERSION,
  WIDGETS_STORE_NAME,
  provisionComposerDatabaseSchema,
} from '../composer-database/composer-database';

@Injectable({
  providedIn: 'root',
})
/**
 * Low-level asynchronous storage access for the widget-library object store.
 * Wraps the raw IndexedDB API in promises, applies the shared v2 schema
 * migration, and surfaces (rather than swallows) storage errors so callers can
 * react. Safe to construct under SSR: the database is only touched lazily on
 * the first operation.
 */
export class WidgetLibraryStorage {
  private readonly dbName = COMPOSER_DB_NAME;
  private readonly dbVersion = COMPOSER_DB_VERSION;
  private readonly storeName = WIDGETS_STORE_NAME;

  private dbPromise: Promise<IDBDatabase> | null = null;

  openDatabase(): Promise<IDBDatabase> {
    if (this.dbPromise) {
      return this.dbPromise;
    }

    this.dbPromise = new Promise((resolve, reject) => {
      if (typeof globalThis.indexedDB === 'undefined') {
        this.dbPromise = null;
        reject(new Error('IndexedDB is not supported in this environment.'));
        return;
      }

      const request = globalThis.indexedDB.open(this.dbName, this.dbVersion);

      request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
        const db = (event.target as IDBOpenDBRequest).result;
        provisionComposerDatabaseSchema(db);
      };

      request.onsuccess = (event: Event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        // Release the cached connection if another tab upgrades the schema so
        // a stale connection cannot block future migrations.
        db.onversionchange = () => {
          db.close();
          this.dbPromise = null;
        };
        resolve(db);
      };

      request.onerror = (event: Event) => {
        this.dbPromise = null;
        reject((event.target as IDBOpenDBRequest).error);
      };
    });

    return this.dbPromise;
  }

  private async executeTransaction<T>(
    mode: IDBTransactionMode,
    operation: (store: IDBObjectStore) => IDBRequest<T> | void,
  ): Promise<T | void> {
    const db = await this.openDatabase();
    return new Promise<T | void>((resolve, reject) => {
      const tx = db.transaction(this.storeName, mode);
      const store = tx.objectStore(this.storeName);

      let requestResult: T | void = undefined;
      let operationRequest: IDBRequest<T> | null = null;

      try {
        const res = operation(store);
        if (res && 'onsuccess' in res) {
          operationRequest = res as IDBRequest<T>;
        }
      } catch (err) {
        reject(err);
        return;
      }

      tx.oncomplete = () => resolve(requestResult);
      tx.onabort = () => reject(tx.error);
      tx.onerror = () => reject(tx.error);

      if (operationRequest) {
        operationRequest.onsuccess = () => {
          requestResult = operationRequest!.result;
        };
        operationRequest.onerror = () => {
          reject(operationRequest!.error);
        };
      }
    });
  }

  /** Persists (inserts or replaces) a single widget record. */
  async add(record: WidgetRecord): Promise<void> {
    await this.executeTransaction<void>('readwrite', store => {
      store.put(record);
    });
  }

  /** Retrieves a single widget record by id, or null when absent. */
  async get(id: string): Promise<WidgetRecord | null> {
    const result = await this.executeTransaction<WidgetRecord | undefined>('readonly', store =>
      store.get(id),
    );
    return result ?? null;
  }

  /** Retrieves all persisted widget records. */
  async getAll(): Promise<WidgetRecord[]> {
    const result = await this.executeTransaction<WidgetRecord[]>('readonly', store =>
      store.getAll(),
    );
    return result || [];
  }

  /** Removes a single widget record by id. */
  async delete(id: string): Promise<void> {
    await this.executeTransaction<void>('readwrite', store => {
      store.delete(id);
    });
  }
}
