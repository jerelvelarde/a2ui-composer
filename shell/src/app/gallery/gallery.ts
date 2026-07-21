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

import {ChangeDetectionStrategy, Component, inject} from '@angular/core';
import {
  A2uiRendererService,
  A2UI_RENDERER_CONFIG,
  BasicCatalog,
  provideMarkdownRenderer,
  SurfaceComponent,
} from '@a2ui/angular/v0_9';
import {GALLERY_WIDGETS} from './gallery-widgets.generated';

/**
 * Gallery — a masonry showcase of composed example widgets, each rendered live
 * on its own native surface via the `@a2ui/angular` BasicCatalog (no iframe).
 *
 * The widget definitions are the A2UI spec's `catalogs/basic/examples/`
 * (see `gallery-widgets.generated.ts`). The `BasicCatalog` is provided at
 * component scope and shared between the renderer config and this component so
 * `createSurface` references the exact catalog id the renderer registered.
 */
@Component({
  selector: 'a2ui-composer-gallery',
  standalone: true,
  imports: [SurfaceComponent],
  templateUrl: './gallery.ng.html',
  styleUrl: './gallery.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    A2uiRendererService,
    BasicCatalog,
    provideMarkdownRenderer(),
    {
      provide: A2UI_RENDERER_CONFIG,
      useFactory: (catalog: BasicCatalog) => ({
        catalogs: [catalog],
        actionHandler: (action: unknown) => console.info('[gallery] action dispatched', action),
      }),
      deps: [BasicCatalog],
    },
  ],
})
export class Gallery {
  private readonly renderer = inject(A2uiRendererService);
  private readonly catalog = inject(BasicCatalog);

  protected readonly widgets = GALLERY_WIDGETS;

  constructor() {
    const catalogId = this.catalog.id;
    const built = new Set<string>();
    for (const {widget} of this.widgets) {
      if (built.has(widget.id)) continue;
      // createSurface + updateComponents (+ data) MUST go in one batch for the
      // native renderer to populate the surface root (see Theater fix).
      const messages: unknown[] = [
        {createSurface: {surfaceId: widget.id, catalogId}},
        {updateComponents: {surfaceId: widget.id, components: widget.components}},
      ];
      const data = widget.dataStates?.[0]?.data;
      if (data !== undefined) {
        messages.push({updateDataModel: {surfaceId: widget.id, path: '/', op: 'replace', value: data}});
      }
      this.renderer.processMessages(messages as never);
      built.add(widget.id);
    }
  }
}
