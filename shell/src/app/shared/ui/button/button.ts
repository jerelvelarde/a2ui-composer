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
 * Unified button for the composer design system. Replaces the three
 * inconsistent ad-hoc button treatments the app grew organically.
 *
 * Variants (all themed through `--cpk-*` tokens, light + dark):
 *   - `primary`   filled accent — the single main action on a surface
 *   - `secondary` outlined glass — supporting actions
 *   - `ghost`     text-only — low-emphasis / toolbar actions
 *
 * Usage:
 *   <a2ui-composer-button variant="primary" (click)="save()">Save</a2ui-composer-button>
 *   <a2ui-composer-button variant="secondary" [disabled]="!ready()">Reset</a2ui-composer-button>
 *
 * The click event bubbles from the inner native <button>; bind `(click)`
 * on the host element as usual. Set `type` for form submit/reset buttons.
 */
@Component({
  selector: 'a2ui-composer-button',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button
      class="cpk-btn"
      [class.cpk-btn--primary]="variant() === 'primary'"
      [class.cpk-btn--secondary]="variant() === 'secondary'"
      [class.cpk-btn--ghost]="variant() === 'ghost'"
      [attr.type]="type()"
      [disabled]="disabled()"
    >
      <ng-content></ng-content>
    </button>
  `,
  styleUrl: './button.scss',
})
export class Button {
  /** Visual emphasis level. */
  readonly variant = input<'primary' | 'secondary' | 'ghost'>('secondary');
  /** Native button type. */
  readonly type = input<'button' | 'submit' | 'reset'>('button');
  /** Disables the inner native button. */
  readonly disabled = input(false);
}
