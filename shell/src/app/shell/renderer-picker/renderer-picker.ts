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

import {Component, inject} from '@angular/core';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatSelectModule} from '@angular/material/select';
import {StartupResolution} from '../startup-resolution/startup-resolution';
import {CatalogManagement} from '../../storage/catalog-management/catalog-management';

/**
 * A curated renderer entry offered by the picker.
 */
export interface CuratedRenderer {
  /** Human-readable label shown in the picker. */
  readonly label: string;
  /** Renderer dev-server URL activated when the entry is selected. */
  readonly rendererUrl: string;
}

/**
 * Curated renderer catalogs available for local development and end-to-end
 * runs. These are the sample dev-server URLs started by the workspace; there
 * is no config file enumerating renderer catalogs, so the list is defined
 * here. If such a config is introduced, this should source from it instead.
 */
export const CURATED_RENDERERS: readonly CuratedRenderer[] = [
  {label: 'Basic (Angular)', rendererUrl: 'http://localhost:3456'},
  {label: 'Basic (Lit)', rendererUrl: 'http://localhost:3457'},
  {label: 'Basic (React)', rendererUrl: 'http://localhost:3458'},
  {label: 'Flight / Dashboard', rendererUrl: 'http://localhost:3459'},
];

/**
 * Header control letting the user switch the active preview renderer between
 * curated catalogs. Selecting an entry updates the shared renderer URL source
 * of truth and re-triggers the catalog discovery handshake against it.
 */
@Component({
  selector: 'a2ui-composer-renderer-picker',
  standalone: true,
  imports: [MatFormFieldModule, MatSelectModule],
  templateUrl: './renderer-picker.ng.html',
  styleUrl: './renderer-picker.scss',
})
export class RendererPicker {
  private readonly startupResolution = inject(StartupResolution);
  private readonly catalogManagement = inject(CatalogManagement);

  protected readonly renderers = CURATED_RENDERERS;

  /** The renderer URL currently driving the preview surface. */
  protected readonly activeRendererUrl = this.startupResolution.resolvedUrl;

  /** Whether the host locked the renderer, disabling picker overrides. */
  protected readonly isLocked = this.startupResolution.isLockedContext;

  /**
   * Activates the selected renderer: tears down the previous handshake/surface,
   * points the shared source of truth at the new URL (which reloads the preview
   * iframe), and lets the reloaded renderer re-run catalog discovery.
   *
   * @param rendererUrl URL of the curated entry to activate.
   */
  protected selectRenderer(rendererUrl: string): void {
    if (!rendererUrl || rendererUrl === this.startupResolution.getResolvedRendererUrl()) {
      return;
    }
    this.catalogManagement.prepareForRendererSwitch();
    this.startupResolution.setResolvedRendererUrl(rendererUrl);
  }
}
