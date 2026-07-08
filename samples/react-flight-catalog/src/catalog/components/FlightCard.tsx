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
 * FlightCard — React renderer paired with `FlightCardApi`.
 *
 * ── How rendering works in A2UI v0.9 ───────────────────────────────────────
 * `createComponentImplementation(api, renderFn)` wraps our render function in
 * a `GenericBinder` that subscribes to the live data model. On every data /
 * component-model change, the binder:
 *
 *   1. Walks `api.schema` to find which prop is bound to what.
 *   2. Resolves `{ path: "origin" }` → the string at `/flights[i]/origin`.
 *   3. Resolves `{ event: ... }` actions → pre-wired `() => void` callables.
 *   4. Hands the result to our `renderFn` as a plain `props` object.
 *
 * So by the time this function runs, `props.airline` is **already a string**
 * and `props.action` is **already a function**. We don't resolve anything
 * ourselves — the binder's output is the render-ready view.
 *
 * Scoped bindings: this renderer doesn't know or care that it's one of many.
 * A Row bound to `/flights` expands FlightCard once per element, and the
 * binder automatically scopes each instance's path bindings to `/flights[i]`.
 * Same component code, N instances with different data.
 */
import {createComponentImplementation} from '@a2ui/react/v0_9';
import {FlightCardApi} from '../apis';
import {ActionButton, c} from './utils';

/** Map `status` text → a visual dot color. Bypassed if the agent sets `statusColor`. */
const STATUS_COLORS: Record<string, string> = {
  'On Time': '#22c55e',
  Delayed: '#eab308',
  Cancelled: '#ef4444',
};

export const FlightCard = createComponentImplementation(FlightCardApi, ({props}) => {
  // `props.statusColor` / `props.status` are already resolved strings
  // (literal or the value a `{ path: ... }` binding pointed at).
  const dotColor =
    (typeof props.statusColor === 'string' ? props.statusColor : undefined) ??
    STATUS_COLORS[String(props.status)] ??
    '#22c55e';

  // Airline logo is a bound `DynString`; guard against an empty URL so we
  // never emit `<img src="">` (which browsers treat as a broken image).
  const airlineLogo = String(props.airlineLogo ?? '');

  return (
    <div
      style={{
        border: `1px solid ${c.border}`,
        borderRadius: '16px',
        padding: '20px',
        background: c.card,
        color: c.cardFg,
        minWidth: 260,
        maxWidth: 340,
        flex: '1 1 260px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        boxShadow: c.shadow,
      }}
    >
      {/* Header: airline + price */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
          {airlineLogo && (
            <img
              src={airlineLogo}
              alt={String(props.airline)}
              onError={e => {
                // Hide a broken airline logo (e.g. a blocked favicon host) rather
                // than show the browser broken-image glyph; the airline name stays.
                e.currentTarget.style.display = 'none';
              }}
              style={{
                width: 28,
                height: 28,
                borderRadius: '50%',
                objectFit: 'contain',
              }}
            />
          )}
          <span style={{fontWeight: 600, fontSize: '0.95rem'}}>{String(props.airline)}</span>
        </div>
        <span style={{fontWeight: 700, fontSize: '1.15rem'}}>{String(props.price)}</span>
      </div>

      {/* Meta */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: '0.8rem',
          color: c.muted,
        }}
      >
        <span>{String(props.flightNumber)}</span>
        <span>{String(props.date)}</span>
      </div>

      <hr style={{border: 'none', borderTop: `1px solid ${c.divider}`, margin: 0}} />

      {/* Times */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <span style={{fontWeight: 700, fontSize: '1.1rem'}}>{String(props.departureTime)}</span>
        <span style={{fontSize: '0.75rem', color: c.muted}}>{String(props.duration)}</span>
        <span style={{fontWeight: 700, fontSize: '1.1rem'}}>{String(props.arrivalTime)}</span>
      </div>

      {/* Route */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '0.95rem',
          fontWeight: 600,
        }}
      >
        <span>{String(props.origin)}</span>
        <span style={{color: c.muted}}>→</span>
        <span>{String(props.destination)}</span>
      </div>

      <div
        style={{
          marginTop: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}
      >
        <hr style={{border: 'none', borderTop: `1px solid ${c.divider}`, margin: 0}} />

        {/* Status */}
        <div style={{display: 'flex', alignItems: 'center', gap: '6px'}}>
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: dotColor,
              display: 'inline-block',
            }}
          />
          <span style={{fontSize: '0.8rem', color: c.muted}}>{String(props.status)}</span>
        </div>

        {/*
          `props.action` is already a `() => void` wired by the binder.
          Calling it fires the `book_flight` event declared in the schema
          with `context` paths (flightNumber, origin, destination, price)
          resolved to *this* flight's values.
        */}
        <ActionButton label="Select" doneLabel="Selected" action={props.action} />
      </div>
    </div>
  );
});
