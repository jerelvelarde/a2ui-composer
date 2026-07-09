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

/**
 * Curated set of Material Icons names commonly used in A2UI layouts.
 *
 * A2UI's `Icon` component renders a Material Icon by name, and the connected
 * catalog does not enumerate the available glyphs (icon names are free-form
 * property values, not catalog component keys). This list is therefore a
 * hardcoded, curated subset ported from the React widget-builder icons page.
 * It mirrors the glyphs shipped by the `Material Icons` font already loaded in
 * `index.html`, so every entry renders via `<mat-icon>`.
 *
 * DRIFT RISK: because the set is hardcoded rather than derived from the
 * renderer, it can fall out of sync with the font or catalog over time. Prefer
 * a catalog-driven source if the handshake ever exposes an icon manifest.
 */
export const MATERIAL_ICON_NAMES: readonly string[] = [
  // Navigation & actions.
  'home',
  'menu',
  'close',
  'arrow_back',
  'arrow_forward',
  'chevron_left',
  'chevron_right',
  'expand_more',
  'expand_less',
  'more_vert',
  'more_horiz',
  'refresh',
  'search',
  'settings',

  // Common actions.
  'add',
  'remove',
  'edit',
  'delete',
  'save',
  'done',
  'check',
  'check_circle',
  'cancel',
  'send',
  'share',
  'download',
  'upload',
  'print',
  'content_copy',
  'content_paste',

  // Communication.
  'mail',
  'email',
  'message',
  'chat',
  'phone',
  'call',
  'notifications',
  'notification_important',

  // Media.
  'play_arrow',
  'pause',
  'stop',
  'skip_next',
  'skip_previous',
  'volume_up',
  'volume_off',
  'mic',
  'videocam',
  'photo_camera',
  'image',
  'music_note',

  // People & account.
  'person',
  'people',
  'group',
  'account_circle',
  'face',
  'sentiment_satisfied',

  // Status & info.
  'info',
  'help',
  'warning',
  'error',
  'error_outline',
  'report',
  'verified',
  'star',
  'star_border',
  'favorite',
  'favorite_border',
  'thumb_up',
  'thumb_down',

  // Content & files.
  'folder',
  'folder_open',
  'file_copy',
  'description',
  'article',
  'note',
  'attachment',
  'link',
  'insert_link',
  'cloud',
  'cloud_upload',
  'cloud_download',

  // Time & date.
  'schedule',
  'access_time',
  'today',
  'event',
  'calendar_today',
  'alarm',

  // Location.
  'place',
  'location_on',
  'map',
  'directions',
  'navigation',
  'near_me',

  // Shopping & commerce.
  'shopping_cart',
  'add_shopping_cart',
  'store',
  'payment',
  'credit_card',
  'receipt',

  // Device & hardware.
  'smartphone',
  'laptop',
  'desktop_windows',
  'keyboard',
  'mouse',
  'bluetooth',
  'wifi',

  // Miscellaneous UI.
  'visibility',
  'visibility_off',
  'lock',
  'lock_open',
  'key',
  'security',
  'dashboard',
  'list',
  'view_list',
  'grid_view',
  'table_chart',
  'bar_chart',
];

/**
 * Builds the A2UI `Icon` component snippet for a given icon name. This is the
 * copyable identifier surfaced when an icon is selected, matching the shape
 * consumed by the renderer's `updateComponents` command.
 *
 * @param name The Material Icon name.
 * @return A canonical JSON snippet, e.g. `{"component":"Icon","name":"home"}`.
 */
export function iconSnippet(name: string): string {
  return JSON.stringify({component: 'Icon', name});
}
