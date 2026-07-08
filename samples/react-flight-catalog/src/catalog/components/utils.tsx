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
 * Flight & Dashboard catalog — shared style tokens (`const c`) and the
 * `ActionButton` helper. Every renderer in this catalog reads theme tokens
 * from `c`, and `ActionButton` backs both the generic `Button` renderer and
 * `FlightCard`'s "Select" CTA. Theme tokens are CSS custom properties so the
 * host shell can restyle the whole catalog without touching this code.
 */
import React, {useState} from 'react';

export const c = {
  card: 'var(--card)',
  cardFg: 'var(--card-foreground)',
  border: 'var(--border)',
  muted: 'var(--muted-foreground)',
  divider: 'color-mix(in srgb, var(--border) 50%, var(--card))',
  shadow: '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)',
  btnBg: 'color-mix(in srgb, var(--muted) 40%, var(--card))',
  btnDoneBg: 'color-mix(in srgb, #22c55e 10%, var(--card))',
};

export function ActionButton({
  label,
  doneLabel,
  action,
  children: child,
}: {
  label: string;
  doneLabel: string;
  action: unknown;
  children?: React.ReactNode;
}) {
  const [done, setDone] = useState(false);
  const fn = typeof action === 'function' ? (action as () => void) : undefined;
  return (
    <button
      disabled={done}
      style={{
        width: '100%',
        padding: '10px 16px',
        borderRadius: '10px',
        border: done ? '1px solid #bbf7d0' : `1px solid ${c.border}`,
        background: done ? c.btnDoneBg : c.btnBg,
        color: done ? '#059669' : c.cardFg,
        fontSize: '0.85rem',
        fontWeight: 500,
        cursor: done ? 'default' : 'pointer',
        transition: 'all 0.2s ease',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '6px',
      }}
      onClick={() => {
        if (done) return;
        fn?.();
        setDone(true);
      }}
    >
      {done && (
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#059669"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="20 6 9 17 4 12" />
        </svg>
      )}
      {done ? doneLabel : (child ?? label)}
    </button>
  );
}
