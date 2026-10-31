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

## Roadmap

- [x] Location search, hourly chart, temperature and rain heatmaps (hour × day)
- [ ] Historical calendar heatmap, climate comparison
- [ ] Wind rose, UV / sun arc, 7-day range bars
- [ ] Light/dark theme, URL-shareable location
