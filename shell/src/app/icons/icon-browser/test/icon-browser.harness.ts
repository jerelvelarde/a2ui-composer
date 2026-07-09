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

import {ComponentHarness} from '@angular/cdk/testing';
import {MatInputHarness} from '@angular/material/input/testing';

/**
 * Harness for interacting with the IconBrowser component in unit tests.
 */
export class IconBrowserHarness extends ComponentHarness {
  /** The CSS selector used to locate the host element. */
  static hostSelector = 'a2ui-composer-icon-browser';

  private readonly getCards = this.locatorForAll('.icon-card');
  private readonly getFilterInput = this.locatorFor(MatInputHarness);
  private readonly getEmptyState = this.locatorForOptional('.empty-state');
  private readonly getSelectedName = this.locatorForOptional('.selected-name');
  private readonly getSelectedSnippet = this.locatorForOptional('.selected-snippet');
  private readonly getCopyButton = this.locatorForOptional('.copy-snippet-button');

  /** Returns the number of icon cards currently visible in the grid. */
  async getIconCount(): Promise<number> {
    const cards = await this.getCards();
    return cards.length;
  }

  /** Returns the visible icon name labels in grid order. */
  async getIconNames(): Promise<string[]> {
    const cards = await this.getCards();
    return Promise.all(
      cards.map(async card => {
        const label = await card.getAttribute('data-icon-name');
        return label ?? '';
      }),
    );
  }

  /**
   * Types a query into the filter input, narrowing the visible grid.
   *
   * @param query The filter text to enter.
   */
  async setFilter(query: string): Promise<void> {
    const input = await this.getFilterInput();
    await input.setValue(query);
  }

  /**
   * Clicks the visible icon card at the given index.
   *
   * @param index Zero-based index of the card to select.
   */
  async clickIconAt(index: number): Promise<void> {
    const cards = await this.getCards();
    const card = cards[index];
    if (!card) {
      throw new Error(`No icon card at index ${index}`);
    }
    await card.click();
  }

  /** Whether the empty-result state message is shown. */
  async hasEmptyState(): Promise<boolean> {
    const empty = await this.getEmptyState();
    return empty !== null;
  }

  /** Whether the selection panel is currently shown. */
  async hasSelection(): Promise<boolean> {
    const name = await this.getSelectedName();
    return name !== null;
  }

  /** The selected icon's name label text, or null when nothing is selected. */
  async getSelectedNameText(): Promise<string | null> {
    const name = await this.getSelectedName();
    return name ? name.text() : null;
  }

  /** The selected icon's copyable snippet text, or null when unselected. */
  async getSelectedSnippetText(): Promise<string | null> {
    const snippet = await this.getSelectedSnippet();
    return snippet ? snippet.text() : null;
  }

  /** Clicks the copy-snippet button in the selection panel. */
  async clickCopy(): Promise<void> {
    const button = await this.getCopyButton();
    if (!button) {
      throw new Error('Copy button not found; is an icon selected?');
    }
    await button.click();
  }
}
