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

import {createComponentImplementation} from '@a2ui/react/v0_9';
import {MetricApi} from '../apis';
import {c} from './utils';

const TREND_COLORS: Record<string, string> = {
  up: '#059669',
  down: '#dc2626',
  neutral: c.muted,
};

const TREND_ICONS: Record<string, string> = {
  up: '↑',
  down: '↓',
  neutral: '→',
};

export const Metric = createComponentImplementation(MetricApi, ({props}) => {
  // `label`, `value`, and `trendValue` are all `DynString` — the binder has
  // already resolved any `{ path }` bindings, but cast defensively.
  const label = String(props.label ?? '');
  const value = String(props.value ?? '');
  const trendValue = props.trendValue != null ? String(props.trendValue) : '';
  return (
    <div style={{display: 'flex', flexDirection: 'column', gap: '4px'}}>
      <span
        style={{
          fontSize: '0.75rem',
          color: c.muted,
          fontWeight: 500,
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
        }}
      >
        {label}
      </span>
      <div style={{display: 'flex', alignItems: 'baseline', gap: '8px'}}>
        <span
          style={{
            fontSize: '1.5rem',
            fontWeight: 700,
            color: c.cardFg,
            letterSpacing: '-0.02em',
          }}
        >
          {value}
        </span>
        {props.trend && trendValue && (
          <span
            style={{
              fontSize: '0.8rem',
              fontWeight: 500,
              color: TREND_COLORS[props.trend] ?? c.muted,
            }}
          >
            {TREND_ICONS[props.trend]} {trendValue}
          </span>
        )}
      </div>
    </div>
  );
});
