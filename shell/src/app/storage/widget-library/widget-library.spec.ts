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
import {describe, it, expect, beforeEach, afterEach, vi} from 'vitest';
import {WidgetLibrary} from './widget-library';
import {WidgetLibraryStorage} from '../widget-library-storage/widget-library-storage';
import {WidgetRecord} from '../models/widget-storage.model';

function makeWidget(id: string, catalogId = 'catalog-1'): WidgetRecord {
  return {
    id,
    catalogId,
    name: `Widget ${id}`,
    definition: `{"id":"${id}"}`,
    createdAt: 1,
    updatedAt: 1,
  };
}

describe('WidgetLibrary', () => {
  describe('with real IndexedDB persistence', () => {
    let service: WidgetLibrary;

    beforeEach(() => {
      Object.defineProperty(globalThis, 'indexedDB', {
        value: new IDBFactory(),
        writable: true,
        configurable: true,
      });

      TestBed.configureTestingModule({});
      service = TestBed.inject(WidgetLibrary);
    });

    afterEach(() => {
      TestBed.resetTestingModule();
    });

    it('exposes an initially empty readonly widgets signal', () => {
      expect(service.widgets()).toEqual([]);
    });

    it('reflects an added record in the widgets signal and persisted store', async () => {
      const record = makeWidget('w1');
      await service.add(record);

      expect(service.widgets()).toContainEqual(record);
      expect(await service.get('w1')).toEqual(record);
      expect(await service.getAll()).toContainEqual(record);
    });

    it('loads persisted records into the signal via getAll', async () => {
      await service.add(makeWidget('w1'));
      await service.add(makeWidget('w2'));

      const all = await service.getAll();
      expect(all).toHaveLength(2);
      expect(service.widgets()).toHaveLength(2);
    });

    it('removes a record and updates the signal on delete', async () => {
      await service.add(makeWidget('w1'));
      await service.add(makeWidget('w2'));
      expect(service.widgets()).toHaveLength(2);

      await service.delete('w1');

      expect(service.widgets()).toHaveLength(1);
      expect(service.widgets().some(w => w.id === 'w1')).toBe(false);
      expect(await service.get('w1')).toBeNull();
    });

    it('provides a genuinely readonly widgets signal', () => {
      const widgets = service.widgets;
      expect('set' in widgets).toBe(false);
      expect('update' in widgets).toBe(false);
    });
  });

  describe('error surfacing', () => {
    let service: WidgetLibrary;
    const failure = new Error('IndexedDB write failed');

    beforeEach(() => {
      const failingStorage: Partial<WidgetLibraryStorage> = {
        add: vi.fn().mockRejectedValue(failure),
        get: vi.fn().mockRejectedValue(failure),
        getAll: vi.fn().mockRejectedValue(failure),
        delete: vi.fn().mockRejectedValue(failure),
      };

      TestBed.configureTestingModule({
        providers: [WidgetLibrary, {provide: WidgetLibraryStorage, useValue: failingStorage}],
      });
      service = TestBed.inject(WidgetLibrary);
    });

    afterEach(() => {
      TestBed.resetTestingModule();
      vi.restoreAllMocks();
    });

    it('surfaces IndexedDB errors from add instead of swallowing them', async () => {
      await expect(service.add(makeWidget('w1'))).rejects.toThrow('IndexedDB write failed');
      expect(service.widgets()).toEqual([]);
    });

    it('surfaces IndexedDB errors from getAll', async () => {
      await expect(service.getAll()).rejects.toThrow('IndexedDB write failed');
    });

    it('surfaces IndexedDB errors from delete', async () => {
      await expect(service.delete('w1')).rejects.toThrow('IndexedDB write failed');
    });
  });
});
