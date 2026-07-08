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
import {DataTableApi} from '../apis';
import {c} from './utils';

export const DataTable = createComponentImplementation(DataTableApi, ({props}) => {
  const cols = props.columns ?? [];
  const rows = props.rows ?? [];
  return (
    <div style={{overflowX: 'auto', width: '100%'}}>
      <table
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontSize: '0.8rem',
        }}
      >
        <thead>
          <tr>
            {cols.map(col => (
              <th
                key={col.key}
                style={{
                  textAlign: 'left',
                  padding: '8px 12px',
                  borderBottom: `2px solid ${c.border}`,
                  color: c.muted,
                  fontWeight: 600,
                  fontSize: '0.7rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} style={{borderBottom: `1px solid ${c.divider}`}}>
              {cols.map(col => (
                <td key={col.key} style={{padding: '8px 12px', color: c.cardFg}}>
                  {String(row[col.key] ?? '')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
});
