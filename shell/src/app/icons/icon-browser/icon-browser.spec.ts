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

import {ComponentFixture, TestBed} from '@angular/core/testing';
import {provideNoopAnimations} from '@angular/platform-browser/animations';
import {TestbedHarnessEnvironment} from '@angular/cdk/testing/testbed';
import {describe, it, expect, beforeEach, afterEach, vi} from 'vitest';
import {IconBrowser} from './icon-browser';
import {IconBrowserHarness} from './test/icon-browser.harness';
import {MATERIAL_ICON_NAMES, iconSnippet} from './icon-catalog';

describe('IconBrowser Component', () => {
  let fixture: ComponentFixture<IconBrowser>;
  let harness: IconBrowserHarness;
  let setItemSpy: ReturnType<typeof vi.spyOn>;
  let writeTextSpy: ReturnType<typeof vi.fn>;
  let originalClipboard: typeof navigator.clipboard;

  beforeEach(async () => {
    // Read-only guard: intercept every localStorage write for the whole test.
    setItemSpy = vi.spyOn(Storage.prototype, 'setItem');

    await TestBed.configureTestingModule({
      imports: [IconBrowser],
      providers: [provideNoopAnimations()],
    }).compileComponents();

    fixture = TestBed.createComponent(IconBrowser);
    fixture.detectChanges();
    harness = await TestbedHarnessEnvironment.harnessForFixture(fixture, IconBrowserHarness);

    writeTextSpy = vi.fn().mockResolvedValue(undefined);
    originalClipboard = navigator.clipboard;
    Object.defineProperty(navigator, 'clipboard', {
      value: {writeText: writeTextSpy},
      configurable: true,
      writable: true,
    });
  });

  afterEach(() => {
    if (originalClipboard) {
      Object.defineProperty(navigator, 'clipboard', {value: originalClipboard});
    }
    setItemSpy.mockRestore();
    vi.clearAllMocks();
  });

  it('renders the full curated icon set as a grid (N >= 1)', async () => {
    expect(MATERIAL_ICON_NAMES.length).toBeGreaterThanOrEqual(1);
    const count = await harness.getIconCount();
    expect(count).toBe(MATERIAL_ICON_NAMES.length);
  });

  it('narrows the visible grid to the exact matching subset when a query is typed', async () => {
    const expected = MATERIAL_ICON_NAMES.filter(n => n.includes('cloud'));
    // Guard the fixture: the query must be a strict, non-trivial subset.
    expect(expected.length).toBeGreaterThanOrEqual(1);
    expect(expected.length).toBeLessThan(MATERIAL_ICON_NAMES.length);

    await harness.setFilter('cloud');
    fixture.detectChanges();

    expect(await harness.getIconCount()).toBe(expected.length);
    const names = await harness.getIconNames();
    expect(names.sort()).toEqual([...expected].sort());
    // Every visible name really contains the query.
    expect(names.every(n => n.includes('cloud'))).toBe(true);
  });

  it('narrows to a single most-specific match', async () => {
    const expected = MATERIAL_ICON_NAMES.filter(n => n.includes('wifi'));
    expect(expected.length).toBe(1);

    await harness.setFilter('wifi');
    fixture.detectChanges();

    expect(await harness.getIconCount()).toBe(1);
    expect(await harness.getIconNames()).toEqual(['wifi']);
  });

  it('filters case-insensitively', async () => {
    const expected = MATERIAL_ICON_NAMES.filter(n => n.includes('cloud'));

    await harness.setFilter('CLOUD');
    fixture.detectChanges();

    expect(await harness.getIconCount()).toBe(expected.length);
  });

  it('restores the full set when the query is cleared', async () => {
    await harness.setFilter('cloud');
    fixture.detectChanges();
    expect(await harness.getIconCount()).toBeLessThan(MATERIAL_ICON_NAMES.length);

    await harness.setFilter('');
    fixture.detectChanges();
    expect(await harness.getIconCount()).toBe(MATERIAL_ICON_NAMES.length);
  });

  it('shows the empty-result state and no cards for a non-matching query', async () => {
    await harness.setFilter('zzz-no-such-icon');
    fixture.detectChanges();

    expect(await harness.getIconCount()).toBe(0);
    expect(await harness.hasEmptyState()).toBe(true);
  });

  it('has no selection and no empty-state on initial render', async () => {
    expect(await harness.hasSelection()).toBe(false);
    expect(await harness.hasEmptyState()).toBe(false);
  });

  it('exposes the expected identifier and snippet when an icon is selected', async () => {
    // Narrow to a single deterministic icon, then select it.
    await harness.setFilter('wifi');
    fixture.detectChanges();
    await harness.clickIconAt(0);
    fixture.detectChanges();

    expect(await harness.hasSelection()).toBe(true);
    expect(await harness.getSelectedNameText()).toBe('wifi');
    expect(await harness.getSelectedSnippetText()).toBe('{"component":"Icon","name":"wifi"}');
    expect(await harness.getSelectedSnippetText()).toBe(iconSnippet('wifi'));
  });

  it('copies the exact selected snippet to the clipboard on demand', async () => {
    await harness.setFilter('wifi');
    fixture.detectChanges();
    await harness.clickIconAt(0);
    fixture.detectChanges();

    await harness.clickCopy();

    expect(writeTextSpy).toHaveBeenCalledTimes(1);
    expect(writeTextSpy).toHaveBeenCalledWith('{"component":"Icon","name":"wifi"}');
  });

  it('logs an error to the console when the clipboard write rejects', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    writeTextSpy.mockRejectedValue(new Error('Clipboard error'));

    await harness.setFilter('wifi');
    fixture.detectChanges();
    await harness.clickIconAt(0);
    fixture.detectChanges();
    await harness.clickCopy();
    // Allow the rejected promise's catch handler to run.
    await Promise.resolve();

    expect(consoleErrorSpy).toHaveBeenCalled();
    consoleErrorSpy.mockRestore();
  });

  it('logs an error and skips copying when the clipboard API is unavailable', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    Object.defineProperty(navigator, 'clipboard', {value: undefined, configurable: true});

    await harness.setFilter('wifi');
    fixture.detectChanges();
    await harness.clickIconAt(0);
    fixture.detectChanges();
    await harness.clickCopy();

    expect(writeTextSpy).not.toHaveBeenCalled();
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Clipboard API is not available in this environment.',
    );
    consoleErrorSpy.mockRestore();
  });

  it('is strictly read-only: filtering and selecting perform no localStorage writes', async () => {
    setItemSpy.mockClear();

    await harness.setFilter('cloud');
    fixture.detectChanges();
    await harness.clickIconAt(0);
    fixture.detectChanges();
    await harness.clickCopy();

    expect(setItemSpy).not.toHaveBeenCalled();
  });
});
