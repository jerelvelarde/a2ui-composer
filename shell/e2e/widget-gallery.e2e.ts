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

test.describe('Widget Gallery User Journey', () => {
  test.beforeEach(async ({page}) => {
    await page.addInitScript(() => {
      try {
        localStorage.setItem('a2ui_composer_force_1p', 'true');
      } catch (e) {}
    });
  });

  test('renders finished-widget cards and mounts a sandboxed preview on open', async ({
    page,
  }, testInfo) => {
    // 1. Navigate to home with a valid renderer to trigger the catalog handshake.
    await page.goto('/?renderer=http://localhost:3456');
    await expect(page.locator('.workspace-container')).toBeVisible();

    const workspaceIframe = page.locator('.workspace-container iframe');
    await expect(workspaceIframe).toBeVisible();

    // Wait for the catalog handshake to complete (indicated by header title updating).
    await expect(page.locator('.header-title')).toContainText('my_basic_catalog');

    // 2. Navigate to the widget gallery via the sidebar link.
    const galleryLink = page.getByRole('link', {name: 'Widget Gallery'});
    await expect(galleryLink).toBeVisible();
    await galleryLink.click();

    // 3. Redirected to /widget-gallery and the responsive grid loads.
    await page.waitForURL('**/widget-gallery');
    await expect(page.locator('.widget-gallery-container')).toBeVisible();

    // 4. Grid renders one card per finished-widget preset (N >= 1).
    const cards = page.locator('.widget-card');
    await expect(cards.first()).toBeVisible();
    const cardCount = await cards.count();
    expect(cardCount).toBeGreaterThanOrEqual(1);

    // 5. Preview frame is NOT mounted before a card is opened.
    await expect(page.locator('a2ui-composer-rendered-frame')).toHaveCount(0);

    // 6. Intercept the RENDER_A2UI payload at the host-communication boundary
    //    (the exact array forwarded to the iframe via postMessage).
    await page.evaluate(() => {
      const w = window as unknown as {
        a2uiHostCommunication?: {sendRenderA2UI: (p: unknown[]) => void};
        __renderCaptures?: unknown[][];
      };
      const hc = w.a2uiHostCommunication;
      if (!hc) {
        throw new Error('HostCommunication was not registered on window');
      }
      w.__renderCaptures = [];
      const original = hc.sendRenderA2UI.bind(hc);
      hc.sendRenderA2UI = (payload: unknown[]) => {
        w.__renderCaptures!.push(payload);
        original(payload);
      };
    });

    // 7. Open the first card.
    await cards.first().click();

    // 8. Assert the sandboxed preview iframe is mounted.
    const renderedFrame = page.locator('a2ui-composer-rendered-frame');
    await expect(renderedFrame).toBeVisible();
    const iframe = renderedFrame.locator('iframe');
    await expect(iframe).toBeVisible();

    // 9. Assert the intercepted payload is exactly the two v0.9 commands, in order.
    await expect
      .poll(async () => {
        return page.evaluate(() => {
          const w = window as unknown as {__renderCaptures?: unknown[][]};
          const caps = w.__renderCaptures || [];
          if (caps.length === 0) {
            return {error: 'no payload captured'};
          }
          const payload = caps[caps.length - 1] as Array<Record<string, unknown>>;
          if (!Array.isArray(payload) || payload.length !== 2) {
            return {error: `expected 2 commands, got ${payload && payload.length}`};
          }
          const createSurface = payload[0]['createSurface'] as Record<string, unknown> | undefined;
          const updateComponents = payload[1]['updateComponents'] as
            | Record<string, unknown>
            | undefined;
          const components = updateComponents?.['components'];
          return {
            command0Version: payload[0]['version'],
            hasCreateSurface: typeof createSurface === 'object' && createSurface !== null,
            catalogIdIsString: typeof createSurface?.['catalogId'] === 'string',
            command1Version: payload[1]['version'],
            hasUpdateComponents: typeof updateComponents === 'object' && updateComponents !== null,
            componentsIsArray: Array.isArray(components),
          };
        });
      })
      .toEqual({
        command0Version: 'v0.9',
        hasCreateSurface: true,
        catalogIdIsString: true,
        command1Version: 'v0.9',
        hasUpdateComponents: true,
        componentsIsArray: true,
      });

    const screenshotBuffer = await page.screenshot();
    await testInfo.attach('widget-gallery-user-journey-success', {
      body: screenshotBuffer,
      contentType: 'image/png',
    });
  });
});
