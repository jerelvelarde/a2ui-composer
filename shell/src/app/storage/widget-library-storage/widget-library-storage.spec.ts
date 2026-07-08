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

import {TestBed} from '@angular/core/testing';
import {IDBFactory} from 'fake-indexeddb';
import {describe, it, expect, beforeEach, afterEach} from 'vitest';
import {WidgetLibraryStorage} from './widget-library-storage';
import {IndexedDbStorage} from '../indexed-db-storage/indexed-db-storage';
import {WidgetRecord} from '../models/widget-storage.model';
import {CachedCatalogRecord} from '../models/catalog-storage.model';

const DB_NAME = 'a2ui_composer_db';

/**
 * Opens the shared database at the legacy v1 schema and populates the
 * `catalogs` store, faithfully reproducing the on-disk state of an existing
 * user before the widget-library migration exists.
 */
function seedLegacyV1Database(record: CachedCatalogRecord): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = globalThis.indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      db.createObjectStore('catalogs', {keyPath: 'rendererUrl'});
    };
    request.onsuccess = () => {
      const db = request.result;
      const tx = db.transaction('catalogs', 'readwrite');
      tx.objectStore('catalogs').put(record);
      tx.oncomplete = () => {
        db.close();
        resolve();
      };
      tx.onerror = () => reject(tx.error);
    };
    request.onerror = () => reject(request.error);
  });
}

/** Reads a single catalog record directly from an open database connection. */
function readCatalogRecord(
  db: IDBDatabase,
  rendererUrl: string,
): Promise<CachedCatalogRecord | undefined> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction('catalogs', 'readonly');
    const req = tx.objectStore('catalogs').get(rendererUrl);
    req.onsuccess = () => resolve(req.result as CachedCatalogRecord | undefined);
    req.onerror = () => reject(req.error);
  });
}

describe('WidgetLibraryStorage', () => {
  let service: WidgetLibraryStorage;

  beforeEach(() => {
    // A fresh in-memory IndexedDB factory isolates every test's database state.
    Object.defineProperty(globalThis, 'indexedDB', {
      value: new IDBFactory(),
      writable: true,
      configurable: true,
    });

    TestBed.configureTestingModule({});
    service = TestBed.inject(WidgetLibraryStorage);
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('creates the widget object store with a keyPath of "id"', async () => {
    const db = await service.openDatabase();
    expect(db.objectStoreNames.contains('widgets')).toBe(true);

    const tx = db.transaction('widgets', 'readonly');
    const store = tx.objectStore('widgets');
    expect(store.keyPath).toBe('id');
  });

  it('opens the database at schema version 2', async () => {
    const db = await service.openDatabase();
    expect(db.version).toBe(2);
  });

  it('migrates a populated v1 database to v2 without losing catalog data', async () => {
    const legacyCatalog: CachedCatalogRecord = {
      rendererUrl: 'http://legacy-renderer:4200',
      catalogString: '{"components":{"button":{}}}',
      checksumHash: 'legacy-hash',
      lastAccessed: 1234,
    };
    await seedLegacyV1Database(legacyCatalog);

    // Opening through the service performs the real onupgradeneeded migration.
    const db = await service.openDatabase();

    expect(db.version).toBe(2);
    expect(db.objectStoreNames.contains('catalogs')).toBe(true);
    expect(db.objectStoreNames.contains('widgets')).toBe(true);

    const preserved = await readCatalogRecord(db, legacyCatalog.rendererUrl);
    expect(preserved).toBeDefined();
    expect(preserved).toEqual(legacyCatalog);
  });

  it('round-trips a widget record through write, close and reopen', async () => {
    const record: WidgetRecord = {
      id: 'widget-1',
      catalogId: 'catalog-abc',
      name: 'Primary Button',
      definition: '{"type":"button","label":"Go"}',
      createdAt: 100,
      updatedAt: 200,
    };

    await service.add(record);

    // Close the writing connection to force a genuine reopen from persistence.
    const writeConnection = await service.openDatabase();
    writeConnection.close();

    // A brand-new instance must read the record back from the persisted store.
    const reopened = new WidgetLibraryStorage();
    const fetched = await reopened.get('widget-1');
    expect(fetched).toEqual(record);
    expect(fetched?.catalogId).toBe('catalog-abc');

    const all = await reopened.getAll();
    expect(all).toContainEqual(record);
  });

  it('persists one record per widget keyed by id', async () => {
    const first: WidgetRecord = {
      id: 'widget-a',
      catalogId: 'catalog-1',
      name: 'A',
      definition: '{}',
      createdAt: 1,
      updatedAt: 1,
    };
    const second: WidgetRecord = {
      id: 'widget-b',
      catalogId: 'catalog-1',
      name: 'B',
      definition: '{}',
      createdAt: 2,
      updatedAt: 2,
    };
    await service.add(first);
    await service.add(second);

    // Overwriting by the same id must replace, not duplicate.
    await service.add({...first, name: 'A-updated'});

    const all = await service.getAll();
    expect(all).toHaveLength(2);
    expect((await service.get('widget-a'))?.name).toBe('A-updated');
  });

  it('deletes a widget record by id', async () => {
    const record: WidgetRecord = {
      id: 'widget-del',
      catalogId: 'catalog-1',
      name: 'Removable',
      definition: '{}',
      createdAt: 1,
      updatedAt: 1,
    };
    await service.add(record);
    expect(await service.get('widget-del')).toEqual(record);

    await service.delete('widget-del');
    expect(await service.get('widget-del')).toBeNull();
  });

  it('surfaces the error when IndexedDB is unavailable (SSR-safe)', async () => {
    Object.defineProperty(globalThis, 'indexedDB', {
      value: undefined,
      writable: true,
      configurable: true,
    });

    await expect(service.openDatabase()).rejects.toThrow('IndexedDB is not supported');
  });

  it('recovers from a transient open failure by clearing the cached promise', async () => {
    // First instance opens successfully, proving reuse of the cached promise.
    const db = await service.openDatabase();
    expect(db).toBeTruthy();

    // Removing IndexedDB after a successful open must not corrupt the cache.
    const second = await service.openDatabase();
    expect(second).toBe(db);
  });

  it('coexists with the catalog store service on the same v2 database', async () => {
    // Regression guard: both services open the shared database. If they
    // requested different versions a VersionError would break the second
    // opener on reload. Opening one then the other (in both orders) must
    // succeed and expose both object stores.
    const catalogStorage = new IndexedDbStorage();
    const widgetStorage = new WidgetLibraryStorage();

    const catalogDb = await catalogStorage.openDatabase();
    const widgetDb = await widgetStorage.openDatabase();

    expect(catalogDb.version).toBe(2);
    expect(widgetDb.version).toBe(2);
    expect(catalogDb.objectStoreNames.contains('catalogs')).toBe(true);
    expect(catalogDb.objectStoreNames.contains('widgets')).toBe(true);
    expect(widgetDb.objectStoreNames.contains('widgets')).toBe(true);

    // A fresh factory with the widget service opening first must also fully
    // provision the schema so the catalog store is usable.
    Object.defineProperty(globalThis, 'indexedDB', {
      value: new IDBFactory(),
      writable: true,
      configurable: true,
    });
    const widgetFirst = new WidgetLibraryStorage();
    const catalogSecond = new IndexedDbStorage();
    await widgetFirst.openDatabase();
    await catalogSecond.saveCatalogRecord({
      rendererUrl: 'http://renderer:4200',
      catalogString: '{}',
      checksumHash: 'h',
      lastAccessed: 1,
    });
    expect(await catalogSecond.getCatalogRecord('http://renderer:4200')).not.toBeNull();
  });
});
