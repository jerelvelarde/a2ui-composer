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

test.describe('Scenario Player Simulated Playback', () => {
  test('drives the connected preview iframe through successive RENDER_A2UI frames', async ({
    page,
  }, testInfo) => {
    // 1. Boot the shell against the basic-catalog renderer so a real preview
    //    frame is connected and the catalog handshake completes.
    await page.goto('/?renderer=http://localhost:3456');
    await expect(page.locator('.workspace-container')).toBeVisible();
    await expect(page.locator('.header-title')).toContainText('my_basic_catalog');

    // 2. Navigate to the Scenario Player view.
    const playerLink = page.getByRole('link', {name: 'Scenario Player'});
    await expect(playerLink).toBeVisible();
    await playerLink.click();
    await page.waitForURL('**/scenario-player');

    await expect(page.locator('.scenario-player-container')).toBeVisible();
    const previewFrame = page.locator('a2ui-composer-rendered-frame iframe');
    await expect(previewFrame).toBeVisible();

    // Nothing has been streamed yet.
    await expect(page.getByTestId('playback-state')).toHaveText('stopped');

    // 3. Start playback. Successive ticks stream the surface, the component
    //    tree, then two data-model updates into the connected renderer.
    await page.getByRole('button', {name: 'Play'}).click();

    const iframe = page.frameLocator('a2ui-composer-rendered-frame iframe.preview-iframe');

    // Component tree tick renders the static heading.
    await expect(iframe.getByText('Scenario Player')).toBeVisible({timeout: 15000});

    // Final data-model tick resolves the bound status text.
    await expect(iframe.getByText('Playback complete')).toBeVisible({timeout: 15000});

    // 4. Playback auto-completes once the final frame is emitted.
    await expect(page.getByTestId('playback-state')).toHaveText('completed', {timeout: 15000});

    const screenshotBuffer = await page.screenshot();
    await testInfo.attach('scenario-player-playback-success', {
      body: screenshotBuffer,
      contentType: 'image/png',
    });
  });
});
