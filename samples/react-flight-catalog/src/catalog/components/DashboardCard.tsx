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
import {DashboardCardApi} from '../apis';
import {c} from './utils';

export const DashboardCard = createComponentImplementation(
  DashboardCardApi,
  ({props, buildChild}) => {
    return (
      <div
        style={{
          background: c.card,
          borderRadius: '12px',
          border: `1px solid ${c.border}`,
          padding: '20px',
          boxShadow: c.shadow,
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          // Self-declare flex behavior so multiple DashboardCards in a Row
          // distribute evenly. `minWidth: 0` prevents content (e.g. a chart)
          // from blowing past the allocated flex basis.
          flex: '1 1 0',
          minWidth: 0,
        }}
      >
        <div>
          {/* `title` and `subtitle` are `DynString` — resolved to strings by the
              binder, but cast defensively for numeric / boolean data-model values. */}
          <div style={{fontWeight: 600, fontSize: '0.9rem', color: c.cardFg}}>
            {String(props.title ?? '')}
          </div>
          {props.subtitle != null && (
            <div style={{fontSize: '0.75rem', color: c.muted, marginTop: '2px'}}>
              {String(props.subtitle)}
            </div>
          )}
        </div>
        {props.child ? buildChild(props.child) : null}
      </div>
    );
  },
);
