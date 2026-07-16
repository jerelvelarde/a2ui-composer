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

import {test, expect} from '@playwright/test';

test.beforeEach(async ({page}) => {
  page.on('pageerror', err => {
    console.error(`Unhandled page error: ${err.message}`);
  });
});

test.describe('Widget Library Sidebar User Journey', () => {
  test.beforeEach(async ({page}) => {
    await page.addInitScript(() => {
      try {
        localStorage.setItem('a2ui_composer_force_1p', 'true');
      } catch (e) {}
    });
  });

  test('saves the current draft and persists it across a reload', async ({page}) => {
    // 1. Load the workspace with a live renderer so the catalog handshake
    //    completes and StateSync seeds a non-empty active draft.
    await page.goto('/?renderer=http://localhost:3456');
    await expect(page.locator('.workspace-container')).toBeVisible();
    await expect(page.locator('.header-catalog-chip')).toContainText('my_basic_catalog');

    // 2. The library section is present and starts empty for a fresh session.
    const sidebar = page.locator('a2ui-composer-library-sidebar');
    await expect(sidebar).toBeVisible();
    await expect(sidebar.locator('.library-item')).toHaveCount(0);

    // 3. Saving the current draft is enabled and persists a widget.
    const saveButton = sidebar.getByRole('button', {name: 'Save current draft'});
    await expect(saveButton).toBeEnabled();
    await saveButton.click();

    // 4. The saved widget appears in the sidebar list.
    await expect(sidebar.locator('.library-item')).toHaveCount(1);

    // 5. Reloading the page re-hydrates the library from IndexedDB, proving the
    //    record was durably persisted rather than held in memory.
    await page.reload();
    await expect(page.locator('.workspace-container')).toBeVisible();
    const reloadedSidebar = page.locator('a2ui-composer-library-sidebar');
    await expect(reloadedSidebar.locator('.library-item')).toHaveCount(1);
  });
});
