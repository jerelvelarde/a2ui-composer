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
import {RenderedFrameHarness} from '../../../preview/rendered/test/rendered-frame.harness';

/**
 * Harness for interacting with the WidgetGallery component in unit tests.
 */
export class WidgetGalleryHarness extends ComponentHarness {
  /** The CSS selector used to locate the host element. */
  static hostSelector = 'a2ui-composer-widget-gallery';

  private readonly getCards = this.locatorForAll('.widget-card');
  private readonly getCloneButtons = this.locatorForAll('.widget-clone-button');
  private readonly getRenderedFrame = this.locatorForOptional(RenderedFrameHarness);

  /**
   * Returns the number of widget cards rendered in the grid.
   */
  async getCardCount(): Promise<number> {
    const cards = await this.getCards();
    return cards.length;
  }

  /**
   * Opens the widget card at the given index by clicking it.
   *
   * @param index Zero-based index of the card to open.
   */
  async clickCard(index: number): Promise<void> {
    const cards = await this.getCards();
    const card = cards[index];
    if (!card) {
      throw new Error(`No widget card at index ${index}`);
    }
    await card.click();
  }

  /**
   * Returns the number of "Clone to library" actions rendered in the grid.
   */
  async getCloneButtonCount(): Promise<number> {
    const buttons = await this.getCloneButtons();
    return buttons.length;
  }

  /**
   * Activates the "Clone to library" action on the card at the given index.
   *
   * @param index Zero-based index of the card whose clone action to click.
   */
  async clickCloneButton(index: number): Promise<void> {
    const buttons = await this.getCloneButtons();
    const button = buttons[index];
    if (!button) {
      throw new Error(`No clone button at index ${index}`);
    }
    await button.click();
  }

  /**
   * Checks whether the sandboxed preview rendered frame is currently mounted.
   */
  async hasRenderedFrame(): Promise<boolean> {
    const frame = await this.getRenderedFrame();
    return !!frame;
  }
}
