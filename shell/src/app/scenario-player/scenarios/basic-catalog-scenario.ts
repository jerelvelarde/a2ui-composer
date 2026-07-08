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
 * A single simulated playback step. Each tick carries the exact
 * `RENDER_A2UI` payload dispatched to {@link HostCommunication.sendRenderA2UI}
 * when the cursor reaches it, mirroring one frame in a captured A2UI stream.
 */
export interface ScenarioTick {
  /** Human-readable summary of the frame surfaced in the player timeline. */
  readonly label: string;
  /** The ordered array of v0.9 A2UI frames sent as one `RENDER_A2UI` message. */
  readonly payload: readonly unknown[];
}

/**
 * A named, ordered list of playback ticks replayed by the Scenario Player.
 */
export interface Scenario {
  /** Stable identifier for the scenario. */
  readonly id: string;
  /** Display title surfaced in the player header. */
  readonly title: string;
  /** The ordered ticks advanced through during playback. */
  readonly ticks: readonly ScenarioTick[];
}

const SURFACE_ID = 'scenario-surface';
const CATALOG_ID = 'https://a2ui.org/specification/v0_9/basic_catalog.json';

/**
 * A minimal, self-contained scenario that renders on the basic catalog
 * (`ng-basic-catalog`). It streams a surface, a component tree, and two
 * successive data-model updates as four ordered frames — enough to observe
 * ordered, incremental playback without any external transport.
 */
export const BASIC_CATALOG_SCENARIO: Scenario = {
  id: 'basic-catalog-status',
  title: 'Basic Catalog Status Stream',
  ticks: [
    {
      label: 'Create surface',
      payload: [
        {
          version: 'v0.9',
          createSurface: {
            surfaceId: SURFACE_ID,
            catalogId: CATALOG_ID,
            sendDataModel: true,
          },
        },
      ],
    },
    {
      label: 'Render component tree',
      payload: [
        {
          version: 'v0.9',
          updateComponents: {
            surfaceId: SURFACE_ID,
            components: [
              {
                id: 'root',
                component: 'Column',
                align: 'center',
                justify: 'center',
                children: ['heading', 'status'],
              },
              {
                id: 'heading',
                component: 'Text',
                variant: 'h1',
                text: 'Scenario Player',
              },
              {
                id: 'status',
                component: 'Text',
                text: {path: '/status'},
              },
            ],
          },
        },
      ],
    },
    {
      label: 'Data model: streaming',
      payload: [
        {
          version: 'v0.9',
          updateDataModel: {
            surfaceId: SURFACE_ID,
            value: {status: 'Streaming frames...'},
          },
        },
      ],
    },
    {
      label: 'Data model: complete',
      payload: [
        {
          version: 'v0.9',
          updateDataModel: {
            surfaceId: SURFACE_ID,
            value: {status: 'Playback complete'},
          },
        },
      ],
    },
  ],
};
