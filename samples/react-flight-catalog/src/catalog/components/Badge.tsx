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
import {BadgeApi} from '../apis';
import {c} from './utils';

const VARIANTS: Record<string, {bg: string; color: string}> = {
  success: {bg: '#dcfce7', color: '#166534'},
  warning: {bg: '#fef3c7', color: '#92400e'},
  error: {bg: '#fee2e2', color: '#991b1b'},
  info: {bg: '#dbeafe', color: '#1e40af'},
  neutral: {bg: 'var(--muted)', color: c.cardFg},
};

export const Badge = createComponentImplementation(BadgeApi, ({props}) => {
  const v = VARIANTS[props.variant ?? 'neutral'] ?? VARIANTS.neutral;
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '2px 8px',
        borderRadius: '9999px',
        fontSize: '0.7rem',
        fontWeight: 500,
        background: v.bg,
        color: v.color,
      }}
    >
      {props.text}
    </span>
  );
});
