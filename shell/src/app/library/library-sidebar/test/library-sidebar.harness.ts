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
import {MatListHarness} from '@angular/material/list/testing';

/**
 * Test harness for the `LibrarySidebar` component. Exposes the rendered list of
 * saved widgets and the "Save current draft" control so specs can assert real
 * DOM behavior rather than implementation details.
 */
export class LibrarySidebarHarness extends ComponentHarness {
  static hostSelector = 'a2ui-composer-library-sidebar';

  private readonly getList = this.locatorForOptional(MatListHarness);
  // The "Save current draft" control is the shared kit button
  // (`<a2ui-composer-button>`), which renders an inner native <button>. Locate
  // that inner element so disabled state and clicks act on the real control.
  private readonly getSaveButton = this.locatorFor('a2ui-composer-button.save-draft-button button');

  /** Human-readable names of every widget currently rendered in the list. */
  async getWidgetNames(): Promise<string[]> {
    const list = await this.getList();
    if (!list) {
      return [];
    }
    const items = await list.getItems();
    return Promise.all(items.map(item => item.getFullText()));
  }

  /** Number of widget entries currently rendered in the list. */
  async getWidgetCount(): Promise<number> {
    return (await this.getWidgetNames()).length;
  }

  /** Clicks the "Save current draft" control. */
  async clickSave(): Promise<void> {
    const button = await this.getSaveButton();
    await button.click();
  }

  /** Whether the "Save current draft" control is disabled. */
  async isSaveDisabled(): Promise<boolean> {
    const button = await this.getSaveButton();
    return button.getProperty<boolean>('disabled');
  }
}
