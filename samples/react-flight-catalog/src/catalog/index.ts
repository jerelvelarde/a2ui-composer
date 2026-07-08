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
 * Flight & Dashboard catalog — 11 components paired with React renderers,
 * powering the Flight Card and Sales Dashboard examples.
 *
 * Assembled from the published `@a2ui/react/v0_9` component factory
 * (`createComponentImplementation`) plus the shared `BASIC_FUNCTIONS` from
 * `@a2ui/web_core/v0_9/basic_catalog`, so this custom catalog inherits the
 * same path-binding, template-children, and action-dispatch semantics as the
 * basic catalog.
 */
import {Catalog} from '@a2ui/web_core/v0_9';
import {BASIC_FUNCTIONS} from '@a2ui/web_core/v0_9/basic_catalog';
import type {ReactComponentImplementation} from '@a2ui/react/v0_9';

import {Title} from './components/Title';
import {Row} from './components/Row';
import {Column} from './components/Column';
import {DashboardCard} from './components/DashboardCard';
import {Metric} from './components/Metric';
import {PieChart} from './components/PieChart';
import {BarChart} from './components/BarChart';
import {Badge} from './components/Badge';
import {DataTable} from './components/DataTable';
import {Button} from './components/Button';
import {FlightCard} from './components/FlightCard';

/**
 * Public, HTTPS-scheme catalog id. Must match the `catalogId` advertised by
 * the static `/catalog` document this renderer serves (see `public/catalog`).
 */
export const FLIGHT_CATALOG_URL = 'https://copilotkit.ai/a2ui/catalogs/flight-dashboard.json';

const flightComponents: ReactComponentImplementation[] = [
  Title,
  Row,
  Column,
  DashboardCard,
  Metric,
  PieChart,
  BarChart,
  Badge,
  DataTable,
  Button,
  FlightCard,
];

export const flightCatalog = new Catalog<ReactComponentImplementation>(
  FLIGHT_CATALOG_URL,
  flightComponents,
  BASIC_FUNCTIONS,
);

export {
  Title,
  Row,
  Column,
  DashboardCard,
  Metric,
  PieChart,
  BarChart,
  Badge,
  DataTable,
  Button,
  FlightCard,
};
