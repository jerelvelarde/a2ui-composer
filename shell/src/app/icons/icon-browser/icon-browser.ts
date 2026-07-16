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

import {ChangeDetectionStrategy, Component, computed, signal} from '@angular/core';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import {MatIconModule} from '@angular/material/icon';
import {MATERIAL_ICON_NAMES, iconSnippet} from './icon-catalog';
import {Badge, Button, EmptyState} from '../../shared/ui';

/**
 * Read-only icon browser. Renders the curated Material Icons set as a
 * filterable grid; typing narrows the visible glyphs case-insensitively, and
 * selecting an icon exposes its copyable A2UI `Icon` snippet. The view never
 * mutates persistent state.
 */
@Component({
  selector: 'a2ui-composer-icon-browser',
  standalone: true,
  imports: [MatFormFieldModule, MatInputModule, MatIconModule, Badge, Button, EmptyState],
  templateUrl: './icon-browser.ng.html',
  styleUrl: './icon-browser.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IconBrowser {
  /** The full curated icon set, used for the total count display. */
  protected readonly allIcons = MATERIAL_ICON_NAMES;

  private readonly _query = signal('');
  /** The raw filter query as typed, bound back to the input field. */
  protected readonly query = this._query.asReadonly();

  private readonly _selectedIcon = signal<string | null>(null);
  /** The currently selected icon name, or null when none is selected. */
  protected readonly selectedIcon = this._selectedIcon.asReadonly();

  /** The icon names matching the current query (case-insensitive substring). */
  protected readonly filteredIcons = computed<readonly string[]>(() => {
    const q = this.query().trim().toLowerCase();
    if (!q) {
      return this.allIcons;
    }
    return this.allIcons.filter(name => name.toLowerCase().includes(q));
  });

  /** How many icons match the current filter/search. */
  protected readonly resultCount = computed<number>(() => this.filteredIcons().length);

  /**
   * Human-readable summary of the current match count. Reads as a total
   * ("128 icons") when unfiltered and as a result count ("12 results") once a
   * query is active, with correct singular/plural agreement.
   */
  protected readonly resultCountLabel = computed<string>(() => {
    const count = this.resultCount();
    const filtered = this.query().trim().length > 0;
    if (filtered) {
      return `${count} ${count === 1 ? 'result' : 'results'}`;
    }
    return `${count} ${count === 1 ? 'icon' : 'icons'}`;
  });

  /** The copyable A2UI `Icon` snippet for the selected icon, or null. */
  protected readonly selectedSnippet = computed<string | null>(() => {
    const name = this.selectedIcon();
    return name ? iconSnippet(name) : null;
  });

  /**
   * Updates the filter query from the search input event. The raw text is kept
   * as typed; case-insensitive matching is applied in `filteredIcons` so the
   * input field never fights the user's keystrokes.
   *
   * @param event The input event from the filter field.
   */
  protected onFilter(event: Event): void {
    this._query.set((event.target as HTMLInputElement).value ?? '');
  }

  /**
   * Selects an icon, surfacing its identifier and copyable snippet.
   *
   * @param name The Material Icon name to select.
   */
  protected selectIcon(name: string): void {
    this._selectedIcon.set(name);
  }

  /**
   * Copies the selected icon's A2UI snippet to the system clipboard.
   */
  protected copySnippet(): void {
    const snippet = this.selectedSnippet();
    if (!snippet) {
      return;
    }
    if (!navigator.clipboard) {
      console.error('Clipboard API is not available in this environment.');
      return;
    }
    navigator.clipboard.writeText(snippet).catch(err => {
      console.error('Failed to copy A2UI icon snippet to clipboard: ', err);
    });
  }
}
