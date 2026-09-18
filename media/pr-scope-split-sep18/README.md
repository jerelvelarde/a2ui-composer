# Scope-split recordings

Actual production-browser recordings; no live model calls or API keys.

- Workspace: `ba142f0429d7d5c97292bea4c7cc12e1e587916e`. Compact window, usable preview controls, saved selected panel restored after navigation and reload.
- Settings: `af5033c6f0ec7fdcf530f681371863ba6c3b5b04`. Desktop and mobile layouts, light/dark themes.

MP4 files preserve full-resolution playback; GIF files are embedded in PR descriptions.

- Theme: `a797f3be1133e3c7b1aa23132cd42e0a548b456d`. Shared light/dark styling and live renderer controls; saved layout places the assistant in an inactive tab. Input and action survive theme toggles. No source/CSS/DOM overrides.

## Theme review follow-up

`theme-review.gif` and `theme-review.mp4` show the production UI at `7341d5261a1799dddfb9e1ea9c77625b637de134`: softer light surfaces, dark/light theme switching, and a working renderer action with its input preserved. Recorded in Google Chrome at 1280×800 with no API key or live model request. The panel arrangement is a saved workspace layout, with no CSS or DOM overrides.

`gallery-review.gif` and `gallery-review.mp4` show Gallery at `6ce8034c0489b28a7e90d12978b3ff6ae90d1198`, using Material typography/colors: open a real Text example, edit its text, expand JSON, and switch themes while preserving the draft. Recorded from the production build in Chrome at 1280×800 without an API key, live model call, or source/DOM/CSS override.

`settings-review-desktop.*` and `settings-review-mobile.*` show the current Settings layout at `f13f004644115ac18c4ec6bc0fe75e15e60ff6c8`: Material surfaces/card defaults and monospace diagnostics, with desktop and 390px mobile light/dark views. Both production captures completed without browser errors or a configured API key.
