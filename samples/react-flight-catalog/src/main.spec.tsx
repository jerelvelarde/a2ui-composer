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

import {describe, it, expect, beforeEach, afterEach, vi} from 'vitest';
import {act} from 'react';
import {createRoot, Root} from 'react-dom/client';
import {App} from './App';
import {PreviewBridgeMessageType} from 'a2ui-bridge';
import {FLIGHT_CATALOG_URL} from './catalog/index';

describe('React Flight & Dashboard Catalog Sandbox Integration', () => {
  let container: HTMLDivElement | null = null;
  let root: Root | null = null;

  beforeEach(() => {
    container = document.createElement('div');
    container.id = 'app-root';
    document.body.appendChild(container);
  });

  afterEach(() => {
    act(() => {
      root?.unmount();
    });
    container?.remove();
    container = null;
    root = null;
    vi.restoreAllMocks();
  });

  it('dispatches RENDERER_READY handshake upon mounting', async () => {
    const postSpy = vi.spyOn(window.parent, 'postMessage');

    await act(async () => {
      if (container) {
        root = createRoot(container);
        root.render(<App />);
      }
    });

    expect(postSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        type: PreviewBridgeMessageType.RENDERER_READY,
      }),
      '*',
    );
  });

  it('renders loading placeholder initially before blueprints arrive', async () => {
    await act(async () => {
      if (container) {
        root = createRoot(container);
        root.render(<App />);
      }
    });

    expect(container?.innerHTML).toContain('Waiting for RENDER_A2UI payloads...');
  });

  it('renders a FlightCard from a RENDER_A2UI payload', async () => {
    await act(async () => {
      if (container) {
        root = createRoot(container);
        root.render(<App />);
      }
    });

    const payload = [
      {
        version: 'v0.9',
        createSurface: {
          surfaceId: 'surf-1',
          catalogId: FLIGHT_CATALOG_URL,
        },
      },
      {
        version: 'v0.9',
        updateComponents: {
          surfaceId: 'surf-1',
          components: [
            {
              id: 'root',
              component: 'FlightCard',
              airline: 'United Airlines',
              airlineLogo: '',
              flightNumber: 'UA 482',
              origin: 'SFO',
              destination: 'JFK',
              date: 'Jul 14, 2026',
              departureTime: '08:15',
              arrivalTime: '16:42',
              duration: '5h 27m',
              status: 'On Time',
              price: '$342',
              action: {
                event: {
                  name: 'book_flight',
                  context: {},
                },
              },
            },
          ],
        },
      },
    ];

    await act(async () => {
      window.dispatchEvent(
        new MessageEvent('message', {
          source: window,
          data: {
            type: PreviewBridgeMessageType.RENDER_A2UI,
            payload,
          },
        }),
      );
    });

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(container?.innerHTML).toContain('United Airlines');
    expect(container?.innerHTML).toContain('SFO');
    expect(container?.innerHTML).toContain('JFK');
    expect(container?.innerHTML).toContain('$342');
    // Empty airlineLogo must NOT emit an <img> element (broken-URL fallback).
    expect(container?.querySelector('img')).toBeNull();
    // The Select CTA is rendered.
    expect(container?.querySelector('button')).not.toBeNull();
  });

  it('pipes FlightCard action clicks upward to the parent frame', async () => {
    const postSpy = vi.spyOn(window.parent, 'postMessage');

    await act(async () => {
      if (container) {
        root = createRoot(container);
        root.render(<App />);
      }
    });

    const payload = [
      {
        version: 'v0.9',
        createSurface: {
          surfaceId: 'surf-1',
          catalogId: FLIGHT_CATALOG_URL,
        },
      },
      {
        version: 'v0.9',
        updateComponents: {
          surfaceId: 'surf-1',
          components: [
            {
              id: 'root',
              component: 'FlightCard',
              airline: 'United Airlines',
              airlineLogo: '',
              flightNumber: 'UA 482',
              origin: 'SFO',
              destination: 'JFK',
              date: 'Jul 14, 2026',
              departureTime: '08:15',
              arrivalTime: '16:42',
              duration: '5h 27m',
              status: 'On Time',
              price: '$342',
              action: {
                event: {
                  name: 'book_flight',
                  context: {},
                },
              },
            },
          ],
        },
      },
    ];

    await act(async () => {
      window.dispatchEvent(
        new MessageEvent('message', {
          source: window,
          data: {
            type: PreviewBridgeMessageType.RENDER_A2UI,
            payload,
          },
        }),
      );
    });

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    const btn = container?.querySelector('button') as HTMLButtonElement;
    expect(btn).not.toBeNull();

    await act(async () => {
      btn.click();
    });

    expect(postSpy).toHaveBeenLastCalledWith(
      expect.objectContaining({
        type: PreviewBridgeMessageType.SEND_TO_SERVER,
        payload: expect.objectContaining({
          action: expect.objectContaining({
            name: 'book_flight',
            sourceComponentId: 'root',
          }),
        }),
      }),
      '*',
    );
  });
});
