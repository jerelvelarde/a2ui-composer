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
import {MatIconModule} from '@angular/material/icon';

/**
 * Centred empty / zero-data placeholder: Material icon + title +
 * description + an optional projected action. Replaces the large ad-hoc
 * blank areas scattered through the app (galleries, library, player).
 *
 * Usage:
 *   <a2ui-composer-empty-state
 *     icon="widgets"
 *     title="No widgets yet"
 *     description="Saved widgets from the composer will appear here.">
 *     <a2ui-composer-button variant="primary" slot="action">New widget</a2ui-composer-button>
 *   </a2ui-composer-empty-state>
 */
@Component({
  selector: 'a2ui-composer-empty-state',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIconModule],
  template: `
    @if (icon()) {
      <mat-icon class="cpk-empty__icon" aria-hidden="true">{{ icon() }}</mat-icon>
    }
    <h2 class="cpk-empty__title">{{ title() }}</h2>
    @if (description()) {
      <p class="cpk-empty__description">{{ description() }}</p>
    }
    <div class="cpk-empty__action">
      <ng-content select="[slot=action]"></ng-content>
    </div>
  `,
  styleUrl: './empty-state.scss',
})
export class EmptyState {
  /** Optional Material icon ligature shown above the title. */
  readonly icon = input<string>('');
  /** Primary headline (required). */
  readonly title = input.required<string>();
  /** Optional supporting sentence. */
  readonly description = input<string>('');
}
