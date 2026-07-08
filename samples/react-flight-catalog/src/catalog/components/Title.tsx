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

import {type CSSProperties} from 'react';
import {createComponentImplementation} from '@a2ui/react/v0_9';
import {TitleApi} from '../apis';
import {c} from './utils';

const SIZES: Record<string, string> = {
  h1: '1.75rem',
  h2: '1.25rem',
  h3: '1rem',
};

export const Title = createComponentImplementation(TitleApi, ({props}) => {
  const level = props.level ?? 'h2';
  const style: CSSProperties = {
    margin: 0,
    fontWeight: 600,
    fontSize: SIZES[level],
    color: c.cardFg,
    letterSpacing: '-0.01em',
  };
  // `props.text` is `DynString` — the binder resolves `{ path }` bindings
  // to strings before we see them, but cast defensively to tolerate numeric
  // or boolean values that the data model might yield.
  const text = String(props.text ?? '');
  if (level === 'h1') return <h1 style={style}>{text}</h1>;
  if (level === 'h3') return <h3 style={style}>{text}</h3>;
  return <h2 style={style}>{text}</h2>;
});
