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

/**
 * Shared identity and schema definition for the composer's IndexedDB database.
 *
 * Multiple root services (catalog caching and the widget library) open the
 * same physical database. Centralizing the name, version, and schema here
 * guarantees every opener agrees on a single version and provisions the
 * complete set of object stores, which prevents `VersionError` conflicts and
 * missing-store failures regardless of which service opens the database first.
 */
export const COMPOSER_DB_NAME = 'a2ui_composer_db';

/**
 * Current schema version. v1 contained only the `catalogs` store; v2 adds the
 * `widgets` store while preserving `catalogs` and its data.
 */
export const COMPOSER_DB_VERSION = 2;

/** Object store caching remote component catalogs, keyed by renderer URL. */
export const CATALOGS_STORE_NAME = 'catalogs';

/** Object store persisting saved widget-library records, keyed by widget id. */
export const WIDGETS_STORE_NAME = 'widgets';

/**
 * Idempotently provisions the full v2 object-store schema on the given
 * database. Safe to run from any opener's `onupgradeneeded`: existing stores
 * (and their data) are left untouched, and only missing stores are created.
 */
export function provisionComposerDatabaseSchema(db: IDBDatabase): void {
  if (!db.objectStoreNames.contains(CATALOGS_STORE_NAME)) {
    db.createObjectStore(CATALOGS_STORE_NAME, {keyPath: 'rendererUrl'});
  }
  if (!db.objectStoreNames.contains(WIDGETS_STORE_NAME)) {
    db.createObjectStore(WIDGETS_STORE_NAME, {keyPath: 'id'});
  }
}
