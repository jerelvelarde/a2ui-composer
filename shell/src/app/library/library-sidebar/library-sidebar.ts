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

import {Component, OnInit, computed, inject} from '@angular/core';
import {MatListModule} from '@angular/material/list';
import {WidgetLibrary} from '../../storage/widget-library/widget-library';
import {WidgetRecord} from '../../storage/models/widget-storage.model';
import {StateSync} from '../../chat/state-sync/state-sync';
import {CatalogManagement} from '../../storage/catalog-management/catalog-management';
import {SectionLabel} from '../../shared/ui/section-label/section-label';
import {EmptyState} from '../../shared/ui/empty-state/empty-state';
import {Button, Feedback} from '../../shared/ui';

/**
 * Sidebar section that lists the author's persisted widget library and offers a
 * one-click "Save current draft" action. The list is a pure reflection of the
 * {@link WidgetLibrary} signal, so it stays in sync as widgets are added or
 * removed anywhere in the app. Saving reads the active draft as a snapshot and
 * never mutates it.
 */
@Component({
  selector: 'a2ui-composer-library-sidebar',
  standalone: true,
  imports: [MatListModule, Button, SectionLabel, EmptyState],
  templateUrl: './library-sidebar.ng.html',
  styleUrl: './library-sidebar.scss',
})
export class LibrarySidebar implements OnInit {
  private readonly library = inject(WidgetLibrary);
  private readonly stateSync = inject(StateSync);
  private readonly catalogManagement = inject(CatalogManagement);
  private readonly feedback = inject(Feedback);

  /** Live view of the persisted widget collection. */
  readonly widgets = this.library.widgets;

  /**
   * Whether the active draft holds meaningful content worth persisting. An
   * empty or whitespace-only draft yields `false`, disabling the save action.
   */
  readonly canSave = computed(() => this.stateSync.activeDraft().trim().length > 0);

  ngOnInit(): void {
    // Hydrate the reactive collection from durable storage so previously saved
    // widgets are visible on load. Storage may be unavailable (e.g. SSR or a
    // restricted context), so failures are logged rather than left as an
    // unhandled rejection; the list simply stays empty in that case.
    this.library.getAll().catch((err: unknown) => {
      console.error('[LibrarySidebar] Failed to load persisted widgets.', err);
    });
  }

  /**
   * Persists the current draft as a new library record. A no-op when the draft
   * is empty or absent so an empty draft can never create a phantom record.
   */
  async saveCurrentDraft(): Promise<void> {
    const draft = this.stateSync.activeDraft();
    if (draft.trim().length === 0) {
      return;
    }

    const now = Date.now();
    const record: WidgetRecord = {
      id: crypto.randomUUID(),
      catalogId: this.resolveCatalogId(draft),
      name: this.resolveName(draft),
      definition: draft,
      createdAt: now,
      updatedAt: now,
    };
    await this.library.add(record);
    this.feedback.success('Saved to library');
  }

  /**
   * Resolves the catalog id for a saved widget, preferring the active catalog
   * and falling back to the identifier embedded in the draft itself.
   */
  private resolveCatalogId(draft: string): string {
    const catalog = this.catalogManagement.activeCatalog();
    const fromCatalog = catalog?.catalogId ?? catalog?.$id;
    if (fromCatalog) {
      return fromCatalog;
    }
    return this.catalogIdFromDraft(draft) ?? '';
  }

  /**
   * Derives a human-readable label for the widget, preferring the draft's
   * surface id and falling back to a timestamped default.
   */
  private resolveName(draft: string): string {
    const surfaceId = this.surfaceIdFromDraft(draft);
    if (surfaceId) {
      return surfaceId;
    }
    return `Widget ${new Date().toLocaleString()}`;
  }

  private catalogIdFromDraft(draft: string): string | null {
    return this.readCreateSurfaceField(draft, 'catalogId');
  }

  private surfaceIdFromDraft(draft: string): string | null {
    return this.readCreateSurfaceField(draft, 'surfaceId');
  }

  /**
   * Scans the JSON Lines draft for the first `createSurface` block and returns
   * the requested string field, or null when the draft is malformed or absent.
   */
  private readCreateSurfaceField(draft: string, field: 'catalogId' | 'surfaceId'): string | null {
    for (const line of draft.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed) {
        continue;
      }
      try {
        const parsed = JSON.parse(trimmed) as {createSurface?: Record<string, unknown>};
        const value = parsed.createSurface?.[field];
        if (typeof value === 'string' && value.length > 0) {
          return value;
        }
      } catch {
        // Ignore conversational or malformed lines.
      }
    }
    return null;
  }
}
