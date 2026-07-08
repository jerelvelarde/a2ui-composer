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
 * Database record schema representing a single saved widget in the local
 * widget library. Records are persisted one-per-widget so authors can build
 * a reusable collection of components sourced from different catalogs.
 */
export interface WidgetRecord {
  /** Stable unique identifier for the widget; the object store key. */
  id: string;
  /** Identifier of the catalog the widget definition originates from. */
  catalogId: string;
  /** Human-readable label shown to the author in the library. */
  name: string;
  /** Serialized A2UI component definition for the widget. */
  definition: string;
  /** Epoch milliseconds when the record was first created. */
  createdAt: number;
  /** Epoch milliseconds when the record was last modified. */
  updatedAt: number;
}
