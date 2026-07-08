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

import {ComponentHarness, TestElement} from '@angular/cdk/testing';
import {MatSelectHarness} from '@angular/material/select/testing';

/**
 * Test harness for interacting with the `RendererPicker` component through the
 * Material select control it hosts. Options are located via the document-root
 * locator with a plain option selector rather than `MatOptionHarness`, which
 * the current CDK/jsdom stack mis-queries.
 */
export class RendererPickerHarness extends ComponentHarness {
  static hostSelector = 'a2ui-composer-renderer-picker';

  private getSelect = this.locatorFor(MatSelectHarness);
  private getOptionElements = this.documentRootLocatorFactory().locatorForAll('.mat-mdc-option');

  /**
   * Opens the picker and selects the curated entry whose label matches the
   * provided text, driving the same code path a user click would.
   *
   * @param label Visible label of the curated renderer entry to select.
   */
  async selectRenderer(label: string): Promise<void> {
    const select = await this.getSelect();
    await select.open();
    const option = await this.findOptionByLabel(label);
    if (!option) {
      throw new Error(`Renderer option not found: ${label}`);
    }
    await option.click();
  }

  /** Returns the label text currently displayed in the picker trigger. */
  async getSelectedLabel(): Promise<string> {
    const select = await this.getSelect();
    return select.getValueText();
  }

  /** Returns the labels of every curated entry offered by the picker. */
  async getOptionLabels(): Promise<string[]> {
    const select = await this.getSelect();
    await select.open();
    const options = await this.getOptionElements();
    const labels = await Promise.all(options.map(option => option.text()));
    await select.close();
    return labels.map(label => label.trim());
  }

  /** Reports whether the picker is disabled (e.g. in a locked context). */
  async isDisabled(): Promise<boolean> {
    const select = await this.getSelect();
    return select.isDisabled();
  }

  private async findOptionByLabel(label: string): Promise<TestElement | null> {
    const options = await this.getOptionElements();
    for (const option of options) {
      const text = (await option.text()).trim();
      if (text === label) {
        return option;
      }
    }
    return null;
  }
}
