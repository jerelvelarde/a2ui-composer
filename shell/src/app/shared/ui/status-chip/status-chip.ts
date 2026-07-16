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
 * Status pill carrying semantic meaning via the design-system status
 * tokens (success / warning / critical / info). A leading dot reinforces
 * the state without relying on colour alone.
 *
 * Usage:
 *   <a2ui-composer-status-chip status="success">Connected</a2ui-composer-status-chip>
 *   <a2ui-composer-status-chip status="critical">Handshake failed</a2ui-composer-status-chip>
 */
@Component({
  selector: 'a2ui-composer-status-chip',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<span class="cpk-status-chip__dot" aria-hidden="true"></span
    ><ng-content></ng-content>`,
  host: {
    '[attr.data-status]': 'status()',
  },
  styleUrl: './status-chip.scss',
})
export class StatusChip {
  /** Semantic status the chip communicates. */
  readonly status = input<'success' | 'warning' | 'critical' | 'info'>('info');
}
