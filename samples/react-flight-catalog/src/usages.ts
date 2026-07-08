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

import {type ComponentUsages} from 'a2ui-bridge';

/**
 * Component usages dictionary for the Flight & Dashboard catalog — one
 * self-contained example tree per component, matching the A2UiComponentV09
 * usage spec.
 */
export const COMPONENT_USAGES: ComponentUsages = {
  Title: {
    usage: [
      {
        id: 'root',
        component: 'Title',
        text: 'Sales Dashboard',
        level: 'h1',
      },
    ],
  },
  Row: {
    usage: [
      {
        id: 'root',
        component: 'Row',
        children: ['demo-row-left', 'demo-row-right'],
        justify: 'spaceBetween',
        align: 'center',
        gap: 16,
      },
      {id: 'demo-row-left', component: 'Title', text: 'Left', level: 'h3'},
      {id: 'demo-row-right', component: 'Title', text: 'Right', level: 'h3'},
    ],
  },
  Column: {
    usage: [
      {
        id: 'root',
        component: 'Column',
        children: ['demo-col-title', 'demo-col-metric'],
        gap: 12,
      },
      {id: 'demo-col-title', component: 'Title', text: 'Overview', level: 'h2'},
      {
        id: 'demo-col-metric',
        component: 'Metric',
        label: 'Revenue',
        value: '$1.2M',
        trend: 'up',
        trendValue: '+8%',
      },
    ],
  },
  DashboardCard: {
    usage: [
      {
        id: 'root',
        component: 'DashboardCard',
        title: 'Monthly Revenue',
        subtitle: 'Last 30 days',
        child: 'demo-card-metric',
      },
      {
        id: 'demo-card-metric',
        component: 'Metric',
        label: 'Total',
        value: '$305K',
        trend: 'up',
        trendValue: '+12%',
      },
    ],
  },
  Metric: {
    usage: [
      {
        id: 'root',
        component: 'Metric',
        label: 'Active Users',
        value: '48,215',
        trend: 'up',
        trendValue: '+5.4%',
      },
    ],
  },
  PieChart: {
    usage: [
      {
        id: 'root',
        component: 'PieChart',
        innerRadius: 40,
        data: [
          {label: 'North', value: 45},
          {label: 'South', value: 25},
          {label: 'East', value: 20},
          {label: 'West', value: 10},
        ],
      },
    ],
  },
  BarChart: {
    usage: [
      {
        id: 'root',
        component: 'BarChart',
        color: '#3b82f6',
        valuePrefix: '$',
        valueSuffix: 'K',
        data: [
          {label: 'Jan', value: 240},
          {label: 'Feb', value: 305},
          {label: 'Mar', value: 280},
        ],
      },
    ],
  },
  Badge: {
    usage: [
      {
        id: 'root',
        component: 'Badge',
        text: 'On Time',
        variant: 'success',
      },
    ],
  },
  DataTable: {
    usage: [
      {
        id: 'root',
        component: 'DataTable',
        columns: [
          {key: 'route', label: 'Route'},
          {key: 'flights', label: 'Flights'},
          {key: 'onTime', label: 'On Time'},
        ],
        rows: [
          {route: 'SFO → JFK', flights: '128', onTime: '94%'},
          {route: 'LAX → ORD', flights: '96', onTime: '89%'},
          {route: 'SEA → BOS', flights: '54', onTime: '91%'},
        ],
      },
    ],
  },
  Button: {
    usage: [
      {
        id: 'root',
        component: 'Button',
        child: 'demo-button-child',
        action: {
          event: {
            name: 'refresh',
            context: [{key: 'view', value: 'dashboard'}],
          },
        },
        variant: 'primary',
      },
      {id: 'demo-button-child', component: 'Title', text: 'Refresh', level: 'h3'},
    ],
  },
  FlightCard: {
    usage: [
      {
        id: 'root',
        component: 'FlightCard',
        airline: 'United Airlines',
        airlineLogo: 'https://www.google.com/s2/favicons?domain=united.com&sz=64',
        flightNumber: 'UA 482',
        origin: 'SFO',
        destination: 'JFK',
        date: 'Jul 14, 2026',
        departureTime: '08:15',
        arrivalTime: '16:42',
        duration: '5h 27m',
        status: 'On Time',
        price: '$342',
        action: {
          event: {
            name: 'book_flight',
            context: [
              {key: 'flightNumber', value: 'UA 482'},
              {key: 'origin', value: 'SFO'},
              {key: 'destination', value: 'JFK'},
              {key: 'price', value: '$342'},
            ],
          },
        },
      },
    ],
  },
};
