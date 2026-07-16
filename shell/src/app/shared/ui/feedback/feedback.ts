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

import {Injectable, inject} from '@angular/core';
import {MatSnackBar, MatSnackBarConfig} from '@angular/material/snack-bar';

/** How long a confirmation toast stays visible before auto-dismissing. */
const SUCCESS_DURATION_MS = 3000;
/** Errors linger longer so the user can read the reason before it dismisses. */
const ERROR_DURATION_MS = 6000;

/**
 * Single shared feedback helper for lightweight, consistent action
 * confirmations across every journey. Wraps Angular Material's
 * {@link MatSnackBar} so the whole app confirms actions through one uniform,
 * token-themed treatment (see `.cpk-snackbar` in `global_styles.scss`) rather
 * than each screen inventing its own — a save, a clone, or a failed renderer
 * switch all read the same.
 *
 * The overlay the snackbar mounts into lives at the document body, where the
 * `dark-theme` class is stamped, so the `--cpk-*` tokens resolve correctly in
 * both light and dark mode.
 */
@Injectable({providedIn: 'root'})
export class Feedback {
  private readonly snackBar = inject(MatSnackBar);

  /**
   * Confirms a completed action (e.g. "Saved to library").
   *
   * @param message Human-readable confirmation copy.
   */
  success(message: string): void {
    this.open(message, 'cpk-snackbar--success', SUCCESS_DURATION_MS);
  }

  /**
   * Surfaces a recoverable failure (e.g. a renderer that failed to load) with a
   * dismiss affordance so it never silently disappears mid-read.
   *
   * @param message Human-readable failure copy.
   */
  error(message: string): void {
    this.open(message, 'cpk-snackbar--error', ERROR_DURATION_MS, 'Dismiss');
  }

  private open(message: string, variant: string, duration: number, action?: string): void {
    const config: MatSnackBarConfig = {
      duration,
      horizontalPosition: 'right',
      verticalPosition: 'bottom',
      panelClass: ['cpk-snackbar', variant],
    };
    this.snackBar.open(message, action, config);
  }
}
