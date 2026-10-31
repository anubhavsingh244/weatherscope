# WeatherScope

A free, visual-first weather app: heatmaps and graphs built on [Open-Meteo](https://open-meteo.com) (free, no API key; non-commercial use).

**Stack:** Vite · React · TypeScript · Apache ECharts · TanStack Query · deployed to GitHub Pages.

## Develop

```bash
npm install
npm run dev        # local dev server
npm run lint && npm run typecheck && npm test && npm run build
```

## Deploy

Pushes to `main` run `.github/workflows/deploy.yml` (lint, typecheck, test, build) and publish `dist/` to GitHub Pages at
`https://anubhavsingh244.github.io/weatherscope/`. One-time setup: repo **Settings → Pages → Source: GitHub Actions**.
For other hosts, set `VITE_BASE=/` when building.

## Features

- Location search; the selected place is stored in the URL (`?lat=&lon=&name=`) so views are shareable
- 7-day temperature range, wind rose, daylight arc and UV index
- Hourly temperature/precipitation chart and hour × day heatmaps (temperature, rain probability)
- History since 2015: calendar heatmap of daily mean temperature and a monthly climate comparison
- Automatic light/dark theme

## Roadmap

- [ ] Code-split ECharts to shrink the initial bundle
- [ ] Map layer (radar / temperature overlay)
- [ ] Precipitation history and units toggle (°C/°F, km/h/mph)
