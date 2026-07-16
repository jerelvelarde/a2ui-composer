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

import {TestBed} from '@angular/core/testing';
import {MatSnackBar, MatSnackBarConfig} from '@angular/material/snack-bar';
import {describe, it, expect, beforeEach, vi} from 'vitest';
import {Feedback} from './feedback';

class MockSnackBar {
  open = vi.fn();
}

describe('Feedback', () => {
  let feedback: Feedback;
  let snackBar: MockSnackBar;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [Feedback, {provide: MatSnackBar, useClass: MockSnackBar}],
    });
    feedback = TestBed.inject(Feedback);
    snackBar = TestBed.inject(MatSnackBar) as unknown as MockSnackBar;
  });

  it('opens a success toast with the themed success panel class and no action', () => {
    feedback.success('Saved to library');

    expect(snackBar.open).toHaveBeenCalledTimes(1);
    const [message, action, config] = snackBar.open.mock.calls[0] as [
      string,
      string | undefined,
      MatSnackBarConfig,
    ];
    expect(message).toBe('Saved to library');
    expect(action).toBeUndefined();
    expect(config.panelClass).toEqual(['cpk-snackbar', 'cpk-snackbar--success']);
    expect(config.duration).toBeGreaterThan(0);
  });

  it('opens an error toast with a dismiss action, the error panel class, and a longer duration', () => {
    feedback.error('The renderer failed to load.');

    expect(snackBar.open).toHaveBeenCalledTimes(1);
    const [message, action, config] = snackBar.open.mock.calls[0] as [
      string,
      string | undefined,
      MatSnackBarConfig,
    ];
    expect(message).toBe('The renderer failed to load.');
    expect(action).toBe('Dismiss');
    expect(config.panelClass).toEqual(['cpk-snackbar', 'cpk-snackbar--error']);
    expect(config.duration).toBeGreaterThan(0);
  });

  it('errors linger longer on screen than success confirmations', () => {
    feedback.success('ok');
    feedback.error('bad');
    const successConfig = snackBar.open.mock.calls[0][2] as MatSnackBarConfig;
    const errorConfig = snackBar.open.mock.calls[1][2] as MatSnackBarConfig;
    expect((errorConfig.duration ?? 0) > (successConfig.duration ?? 0)).toBe(true);
  });
});
