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

  await page.addInitScript(() => {
    try {
      localStorage.setItem('a2ui_composer_force_1p', 'true');
    } catch (e) {}
  });
});

test.describe('Renderer Picker User Journey', () => {
  test('switches the active renderer and re-runs catalog discovery', async ({page}) => {
    // 1. Boot against the Angular basic catalog and wait for the first
    //    handshake to complete (header reflects the discovered catalog id).
    await page.goto('/?renderer=http://localhost:3456');
    await expect(page.locator('.workspace-container')).toBeVisible();
    await expect(page.locator('.header-title')).toContainText('my_basic_catalog');

    const previewIframe = page.locator('.workspace-container iframe.preview-iframe');
    await expect(previewIframe).toHaveAttribute('src', /localhost:3456/);

    // 2. Open the curated renderer picker and select the Flight/Dashboard entry.
    const picker = page.locator('a2ui-composer-renderer-picker mat-select');
    await expect(picker).toBeVisible();
    await picker.click();
    await page.getByRole('option', {name: 'Flight / Dashboard'}).click();

    // 3. The preview surface is rebuilt against the newly selected renderer and
    //    a fresh discovery handshake completes: the header title updates to the
    //    flight catalog id, proving the handshake ran against the new renderer.
    await expect(previewIframe).toHaveAttribute('src', /localhost:3459/);
    await expect(page.locator('.header-title')).toContainText('Dashboard Catalog');
    await expect(page.locator('.header-title')).not.toContainText('my_basic_catalog');
  });
});
