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
 * Catalog identifier used when the live handshake has not yet resolved an
 * active catalog. Matches the connected `ng-basic-catalog` renderer so the
 * ported widgets render against it.
 */
export const BASIC_CATALOG_ID = 'https://a2ui.org/specification/v0_9/basic_catalog.json';

/**
 * A single A2UI component node within a finished-widget layout. The shape is
 * intentionally open (`unknown` values) because it mirrors the catalog's
 * component schema, which varies per component type.
 */
export type WidgetComponentNode = Readonly<Record<string, unknown>>;

/**
 * A curated, read-only finished-widget preset. Ported from the React
 * widget-builder gallery (`v09/generated.ts`) and adapted to inline literal
 * values so each widget renders against the basic catalog using only the
 * `createSurface` + `updateComponents` commands (no data model required).
 */
export interface WidgetGalleryPreset {
  /** Stable identifier used for tracking and selection. */
  readonly id: string;
  /** Human-readable widget name shown on the card. */
  readonly name: string;
  /** Short description of what the widget demonstrates. */
  readonly description: string;
  /** Suggested preview height in pixels, carried over from the source gallery. */
  readonly height: number;
  /** The A2UI component tree; the entry node has `id: 'root'`. */
  readonly components: readonly WidgetComponentNode[];
}

/**
 * The curated subset of finished widgets surfaced by the read-only gallery.
 */
export const WIDGET_GALLERY_PRESETS: readonly WidgetGalleryPreset[] = [
  {
    id: 'flight-status',
    name: 'Flight Status',
    description: 'Flight route summary with departure and arrival times.',
    height: 240,
    components: [
      {id: 'root', component: 'Card', child: 'main-column'},
      {
        id: 'main-column',
        component: 'Column',
        children: ['header-row', 'route-row', 'divider', 'times-row'],
        align: 'stretch',
      },
      {
        id: 'header-row',
        component: 'Row',
        children: ['header-left', 'date'],
        justify: 'spaceBetween',
        align: 'center',
      },
      {
        id: 'header-left',
        component: 'Row',
        children: ['flight-indicator', 'flight-number'],
        align: 'center',
      },
      {id: 'flight-indicator', component: 'Icon', name: 'send'},
      {id: 'flight-number', component: 'Text', text: 'UA 482', variant: 'h3'},
      {id: 'date', component: 'Text', text: 'Thu, Jun 12', variant: 'caption'},
      {
        id: 'route-row',
        component: 'Row',
        children: ['origin', 'arrow', 'destination'],
        align: 'center',
        justify: 'spaceBetween',
      },
      {id: 'origin', component: 'Text', text: 'SFO', variant: 'h2'},
      {id: 'arrow', component: 'Icon', name: 'arrowForward'},
      {id: 'destination', component: 'Text', text: 'JFK', variant: 'h2'},
      {id: 'divider', component: 'Divider', axis: 'horizontal'},
      {
        id: 'times-row',
        component: 'Row',
        children: ['depart', 'arrive'],
        justify: 'spaceBetween',
      },
      {id: 'depart', component: 'Text', text: 'Departs 8:30 AM', variant: 'body'},
      {id: 'arrive', component: 'Text', text: 'Arrives 5:15 PM', variant: 'body'},
    ],
  },
  {
    id: 'product-card',
    name: 'Product Card',
    description: 'Merchandise card with title, price, and an add-to-cart action.',
    height: 320,
    components: [
      {id: 'root', component: 'Card', child: 'product-column'},
      {
        id: 'product-column',
        component: 'Column',
        children: ['product-image', 'product-title', 'product-price', 'add-button'],
        align: 'stretch',
      },
      {
        id: 'product-image',
        component: 'Image',
        url: 'https://gstatic.com/images/branding/googlelogo/svg/googlelogo_clr_74x24px.svg',
        description: 'Wireless Headphones Pro',
      },
      {
        id: 'product-title',
        component: 'Text',
        text: 'Wireless Headphones Pro',
        variant: 'h3',
      },
      {id: 'product-price', component: 'Text', text: '$299.99', variant: 'h4'},
      {
        id: 'add-button',
        component: 'Button',
        child: 'add-label',
        action: {event: {name: 'addToCart'}},
      },
      {id: 'add-label', component: 'Text', text: 'Add to cart'},
    ],
  },
  {
    id: 'user-profile',
    name: 'User Profile',
    description: 'Profile summary with avatar, bio, and a follow action.',
    height: 300,
    components: [
      {id: 'root', component: 'Card', child: 'profile-column'},
      {
        id: 'profile-column',
        component: 'Column',
        children: ['profile-header', 'profile-divider', 'bio', 'follow-button'],
        align: 'stretch',
      },
      {
        id: 'profile-header',
        component: 'Row',
        children: ['avatar', 'name-column'],
        align: 'center',
      },
      {id: 'avatar', component: 'Icon', name: 'accountCircle'},
      {
        id: 'name-column',
        component: 'Column',
        children: ['profile-name', 'profile-handle'],
      },
      {id: 'profile-name', component: 'Text', text: 'Sarah Chen', variant: 'h4'},
      {id: 'profile-handle', component: 'Text', text: '@sarahchen', variant: 'caption'},
      {id: 'profile-divider', component: 'Divider', axis: 'horizontal'},
      {
        id: 'bio',
        component: 'Text',
        text: 'Product designer. Coffee enthusiast. Building delightful interfaces.',
        variant: 'body',
      },
      {
        id: 'follow-button',
        component: 'Button',
        child: 'follow-label',
        action: {event: {name: 'follow'}},
      },
      {id: 'follow-label', component: 'Text', text: 'Follow'},
    ],
  },
  {
    id: 'account-balance',
    name: 'Account Balance',
    description: 'Balance overview with transfer and pay-bill actions.',
    height: 260,
    components: [
      {id: 'root', component: 'Card', child: 'balance-column'},
      {
        id: 'balance-column',
        component: 'Column',
        children: ['balance-header', 'amount', 'actions'],
        align: 'stretch',
      },
      {
        id: 'balance-header',
        component: 'Row',
        children: ['balance-icon', 'balance-label'],
        align: 'center',
      },
      {id: 'balance-icon', component: 'Icon', name: 'payment'},
      {
        id: 'balance-label',
        component: 'Text',
        text: 'Checking account',
        variant: 'caption',
      },
      {id: 'amount', component: 'Text', text: '$4,280.55', variant: 'h1'},
      {
        id: 'actions',
        component: 'Row',
        children: ['transfer-btn', 'pay-btn'],
        justify: 'spaceBetween',
      },
      {
        id: 'transfer-btn',
        component: 'Button',
        child: 'transfer-label',
        action: {event: {name: 'transfer'}},
      },
      {id: 'transfer-label', component: 'Text', text: 'Transfer'},
      {
        id: 'pay-btn',
        component: 'Button',
        child: 'pay-label',
        action: {event: {name: 'payBill'}},
      },
      {id: 'pay-label', component: 'Text', text: 'Pay bill'},
    ],
  },
  {
    id: 'notification-permission',
    name: 'Notification Permission',
    description: 'Permission prompt with allow and dismiss actions.',
    height: 280,
    components: [
      {id: 'root', component: 'Card', child: 'notif-column'},
      {
        id: 'notif-column',
        component: 'Column',
        children: ['notif-icon', 'notif-title', 'notif-body', 'notif-actions'],
        align: 'center',
      },
      {id: 'notif-icon', component: 'Icon', name: 'notifications'},
      {
        id: 'notif-title',
        component: 'Text',
        text: 'Enable notifications',
        variant: 'h3',
      },
      {
        id: 'notif-body',
        component: 'Text',
        text: 'Get notified about important updates and account activity.',
        variant: 'body',
      },
      {
        id: 'notif-actions',
        component: 'Row',
        children: ['accept-btn', 'decline-btn'],
        justify: 'spaceBetween',
      },
      {
        id: 'accept-btn',
        component: 'Button',
        child: 'accept-label',
        action: {event: {name: 'accept'}},
      },
      {id: 'accept-label', component: 'Text', text: 'Allow'},
      {
        id: 'decline-btn',
        component: 'Button',
        child: 'decline-label',
        action: {event: {name: 'decline'}},
      },
      {id: 'decline-label', component: 'Text', text: 'Not now'},
    ],
  },
];
