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

import {ChangeDetectionStrategy, Component, input} from '@angular/core';

/**
 * Compact inline pill for labelling a value (e.g. the active catalog in the
 * top bar, counts, tags). Tone `neutral` (default) uses glass chrome; tone
 * `accent` tints with the brand colour. For success/warning/critical
 * meaning use `<a2ui-composer-status-chip>` instead.
 *
 * Usage:
 *   <a2ui-composer-badge>my_basic_catalog</a2ui-composer-badge>
 *   <a2ui-composer-badge tone="accent">beta</a2ui-composer-badge>
 */
@Component({
  selector: 'a2ui-composer-badge',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<ng-content></ng-content>`,
  host: {
    '[class.cpk-badge--accent]': "tone() === 'accent'",
  },
  styleUrl: './badge.scss',
})
export class Badge {
  /** Colour treatment of the badge. */
  readonly tone = input<'neutral' | 'accent'>('neutral');
}
