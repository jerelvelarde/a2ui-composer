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
 * Frost-glass surface container for the composer design system.
 * Provides the standard glass background, border, radius and padding so
 * later phases stop hand-rolling card chrome per screen.
 *
 * Usage:
 *   <a2ui-composer-card>…content…</a2ui-composer-card>
 *   <a2ui-composer-card [interactive]="true" [padding]="false">…</a2ui-composer-card>
 *
 * Set `interactive` for hover feedback on clickable cards; set
 * `padding=false` when the content manages its own insets (e.g. media).
 */
@Component({
  selector: 'a2ui-composer-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<ng-content></ng-content>`,
  host: {
    '[class.cpk-card--interactive]': 'interactive()',
    '[class.cpk-card--flush]': '!padding()',
  },
  styleUrl: './card.scss',
})
export class Card {
  /** Adds hover elevation/wash feedback for clickable cards. */
  readonly interactive = input(false);
  /** Whether the card applies its default inner padding. */
  readonly padding = input(true);
}
