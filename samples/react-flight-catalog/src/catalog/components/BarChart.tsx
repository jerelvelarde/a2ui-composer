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

import {
  Bar,
  BarChart as RechartsBar,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {createComponentImplementation} from '@a2ui/react/v0_9';
import {BarChartApi} from '../apis';
import {c} from './utils';

interface BarDatum {
  label: string;
  value: number;
}

export const BarChart = createComponentImplementation(BarChartApi, ({props}) => {
  // `props.data` is `DynamicValue` — once the binder resolves a `{path}`
  // binding we get either an array (happy path) or a non-array fallback.
  // Guard at runtime so the chart never blows up on a malformed data model.
  const data: BarDatum[] = Array.isArray(props.data) ? (props.data as BarDatum[]) : [];

  // Optional unit decoration — e.g. the Sales Dashboard monthly revenue
  // chart passes `"$"` + `"K"` so a raw value of `305` renders as `$305K`
  // on both the Y axis and the hover tooltip. Leave the values themselves
  // untouched so Recharts still scales/aligns them correctly.
  const prefix = props.valuePrefix ?? '';
  const suffix = props.valueSuffix ?? '';
  const formatValue = (value: unknown) => (value == null ? '' : `${prefix}${value}${suffix}`);

  return (
    <div style={{width: '100%', height: 200}}>
      <ResponsiveContainer>
        <RechartsBar data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke={c.divider} />
          <XAxis dataKey="label" tick={{fontSize: 11, fill: c.muted}} />
          <YAxis tick={{fontSize: 11, fill: c.muted}} tickFormatter={formatValue} />
          <Tooltip formatter={value => formatValue(value)} />
          <Bar dataKey="value" fill={props.color ?? '#3b82f6'} radius={[4, 4, 0, 0]} />
        </RechartsBar>
      </ResponsiveContainer>
    </div>
  );
});
