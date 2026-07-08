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

import {Component, computed, inject} from '@angular/core';
import {MatIconModule} from '@angular/material/icon';
import {MatTooltipModule} from '@angular/material/tooltip';
import {ChatState} from '../../chat/chat-state/chat-state';

/**
 * Surfaces the count of component-name heals the render pipeline silently
 * applied to the current surface. Hidden entirely when no heals occurred.
 */
@Component({
  selector: 'a2ui-composer-repair-badge',
  standalone: true,
  imports: [MatIconModule, MatTooltipModule],
  templateUrl: './repair-badge.ng.html',
  styleUrl: './repair-badge.scss',
})
export class RepairBadge {
  private readonly chatState = inject(ChatState);

  /** Number of component-name heals applied to the current surface. */
  protected readonly healCount = this.chatState.componentNameHealCount;

  /** Whether any heal was applied, gating badge visibility. */
  protected readonly hasHeals = computed(() => this.healCount() > 0);

  /** Human-readable tooltip describing the silently applied repairs. */
  protected readonly tooltip = computed(() => {
    const count = this.healCount();
    const noun = count === 1 ? 'component name' : 'component names';
    return `Auto-repaired ${count} ${noun} to match the active catalog.`;
  });
}
