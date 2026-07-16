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
 * Composer design-system UI kit.
 *
 * Standalone, signal-based, Material-friendly building blocks that every
 * later phase reuses. All styling flows through the `--cpk-*` token layer
 * in `global_styles.scss`, so components theme correctly in light and dark.
 */
export {Button} from './button/button';
export {Card} from './card/card';
export {PageShell} from './page-shell/page-shell';
export {EmptyState} from './empty-state/empty-state';
export {Badge} from './badge/badge';
export {StatusChip} from './status-chip/status-chip';
export {SectionLabel} from './section-label/section-label';
export {Feedback} from './feedback/feedback';
