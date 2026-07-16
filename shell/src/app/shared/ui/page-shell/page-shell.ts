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

import {ChangeDetectionStrategy, Component, input} from '@angular/core';

/**
 * Standard route scaffold: a page header (title + description + an actions
 * slot) above a single scrollable content region with consistent padding
 * and a max content width. Later phases wrap each route's body in this so
 * every screen shares the same rhythm and scroll behaviour.
 *
 * Usage:
 *   <a2ui-composer-page-shell title="Widget Gallery" description="Browse saved widgets.">
 *     <a2ui-composer-button slot="actions" variant="primary">New</a2ui-composer-button>
 *     …page content…
 *   </a2ui-composer-page-shell>
 *
 * Set `fluid=true` to let content span the full width (e.g. split-pane
 * workspaces) instead of the default centred max-width column.
 */
@Component({
  selector: 'a2ui-composer-page-shell',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (title() || description()) {
      <header class="cpk-page__header">
        <div class="cpk-page__titles">
          @if (title()) {
            <h1 class="cpk-page__title">{{ title() }}</h1>
          }
          @if (description()) {
            <p class="cpk-page__description">{{ description() }}</p>
          }
        </div>
        <div class="cpk-page__actions">
          <ng-content select="[slot=actions]"></ng-content>
        </div>
      </header>
    }
    <div class="cpk-page__body" [class.cpk-page__body--fluid]="fluid()">
      <ng-content></ng-content>
    </div>
  `,
  styleUrl: './page-shell.scss',
})
export class PageShell {
  /** Page title rendered as the h1. */
  readonly title = input<string>('');
  /** Optional supporting description under the title. */
  readonly description = input<string>('');
  /** When true, content spans full width instead of a centred column. */
  readonly fluid = input(false);
}
