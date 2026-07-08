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

import {Cell, Pie, PieChart as RechartsPie, ResponsiveContainer, Tooltip} from 'recharts';
import {createComponentImplementation} from '@a2ui/react/v0_9';
import {PieChartApi} from '../apis';

const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#6366f1'];

interface PieDatum {
  label: string;
  value: number;
  color?: string;
}

export const PieChart = createComponentImplementation(PieChartApi, ({props}) => {
  // `props.data` is `DynamicValue` — once the binder resolves a `{path}`
  // binding we get either an array (happy path) or a non-array fallback.
  // Guard at runtime so the chart never blows up on a malformed data model.
  const data: PieDatum[] = Array.isArray(props.data) ? (props.data as PieDatum[]) : [];
  return (
    <div style={{width: '100%', height: 200}}>
      <ResponsiveContainer>
        <RechartsPie>
          <Pie
            data={data}
            dataKey="value"
            nameKey="label"
            cx="50%"
            cy="50%"
            innerRadius={props.innerRadius ?? 40}
            outerRadius={80}
            paddingAngle={2}
          >
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.color ?? COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
        </RechartsPie>
      </ResponsiveContainer>
    </div>
  );
});
