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

import {ChangeDetectionStrategy, Component, computed, effect, inject, signal} from '@angular/core';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {MatButtonModule} from '@angular/material/button';
import {MatCardModule} from '@angular/material/card';
import {PreviewBridgeMessageType} from 'a2ui-bridge';
import {RenderedFrame} from '../../preview/rendered/rendered-frame';
import {HostCommunication} from '../../shell/host-communication/host-communication';
import {CatalogManagement} from '../../storage/catalog-management/catalog-management';
import {WidgetLibrary} from '../../storage/widget-library/widget-library';
import {WidgetRecord} from '../../storage/models/widget-storage.model';
import {
  BASIC_CATALOG_ID,
  WIDGET_GALLERY_PRESETS,
  WidgetGalleryPreset,
} from './widget-gallery-presets';

/** Surface identifier used for the read-only widget preview. */
const WIDGET_GALLERY_SURFACE_ID = 'widget-gallery-preview';

/**
 * Read-only gallery of finished A2UI widgets. Renders one card per curated
 * preset in a responsive grid; opening a card mounts a sandboxed preview frame
 * and dispatches the widget layout via the existing `createSurface` +
 * `updateComponents` render path. The view never mutates persistent state.
 */
@Component({
  selector: 'a2ui-composer-widget-gallery',
  standalone: true,
  imports: [MatButtonModule, MatCardModule, RenderedFrame],
  templateUrl: './widget-gallery.ng.html',
  styleUrl: './widget-gallery.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WidgetGallery {
  private readonly hostCommunication = inject(HostCommunication);
  private readonly catalogManagement = inject(CatalogManagement);
  private readonly widgetLibrary = inject(WidgetLibrary);

  /** The curated finished-widget presets rendered as grid cards. */
  protected readonly presets = WIDGET_GALLERY_PRESETS;

  private readonly _selectedPreset = signal<WidgetGalleryPreset | null>(null);
  /** The currently opened widget preset, or null when none is open. */
  protected readonly selectedPreset = this._selectedPreset.asReadonly();

  /**
   * Resolves the catalog identifier for the preview surface, preferring the
   * live handshake's active catalog and falling back to the basic catalog id
   * so the ported widgets always render against the connected renderer.
   */
  protected readonly catalogId = computed<string>(() => {
    const catalog = this.catalogManagement.activeCatalog();
    return (catalog?.catalogId || catalog?.$id) ?? BASIC_CATALOG_ID;
  });

  constructor() {
    // Reactively (re)dispatch whenever the open preset or active catalog
    // changes. When the preview frame is already attached this delivers
    // immediately.
    effect(() => {
      const preset = this.selectedPreset();
      if (!preset) {
        return;
      }
      this.dispatchPreview(preset);
    });

    // The preview iframe is mounted lazily when a card is opened, so the
    // reactive dispatch above can run before the iframe has registered with
    // HostCommunication. Re-dispatch when the freshly mounted sandbox signals
    // it is ready, guaranteeing first-open delivery. Guarded because unit test
    // doubles may not expose the message stream.
    const messageStream$ = this.hostCommunication.messageStream$;
    if (messageStream$) {
      messageStream$.pipe(takeUntilDestroyed()).subscribe(envelope => {
        if (envelope?.type !== PreviewBridgeMessageType.RENDERER_READY) {
          return;
        }
        const preset = this.selectedPreset();
        if (preset) {
          this.dispatchPreview(preset);
        }
      });
    }
  }

  /**
   * Opens a widget card, mounting its sandboxed preview and dispatching the
   * render payload.
   *
   * @param preset The finished-widget preset to preview.
   */
  protected openCard(preset: WidgetGalleryPreset): void {
    this._selectedPreset.set(preset);
  }

  /**
   * Clones a finished-widget preset into the persistent widget library as a new
   * editable record. The clone receives a fresh `crypto.randomUUID()` identity,
   * the resolved catalog id, and a deep copy of the preset's component tree
   * (serialized via `JSON.stringify`, which cannot share references with the
   * source). The source preset is read only and never mutated, so repeated
   * clones always yield distinct records.
   *
   * The originating pointer event is stopped so cloning from a card does not
   * also open its read-only preview.
   *
   * @param event The originating activation event from the card action.
   * @param preset The finished-widget preset to clone.
   */
  protected async cloneToLibrary(event: Event, preset: WidgetGalleryPreset): Promise<void> {
    event.stopPropagation();

    const now = Date.now();
    const record: WidgetRecord = {
      id: crypto.randomUUID(),
      catalogId: this.catalogId(),
      name: `${preset.name} (Copy)`,
      definition: JSON.stringify(preset.components),
      createdAt: now,
      updatedAt: now,
    };

    await this.widgetLibrary.add(record);
  }

  /**
   * Dispatches the read-only render payload for a preset using the shared
   * `createSurface` + `updateComponents` render path.
   *
   * @param preset The finished-widget preset to render.
   */
  private dispatchPreview(preset: WidgetGalleryPreset): void {
    const catalogId = this.catalogId();
    const payload: unknown[] = [
      {
        version: 'v0.9',
        createSurface: {
          surfaceId: WIDGET_GALLERY_SURFACE_ID,
          catalogId,
        },
      },
      {
        version: 'v0.9',
        updateComponents: {
          surfaceId: WIDGET_GALLERY_SURFACE_ID,
          components: preset.components,
        },
      },
    ];
    this.hostCommunication.sendRenderA2UI(payload);
  }
}
