# React Flight & Dashboard Catalog

Sample application showing how to integrate a React-based renderer for a
_differentiated_ custom catalog into the A2UI Composer.

Unlike `react-basic-catalog` (which advertises the standard basic catalog),
this renderer ships an 11-component **flight / dashboard** catalog built for
rich data widgets: flight-result cards, KPI metrics, dashboard cards, badges,
data tables, and pie / bar charts (via [recharts](https://recharts.org/)).

Point the Composer at this renderer with `?renderer=http://localhost:3459`.
