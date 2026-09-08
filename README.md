# Marvel Character Archive

[![CI](https://github.com/TinoMuzambi/MarvelCharacters/actions/workflows/ci.yml/badge.svg)](https://github.com/TinoMuzambi/MarvelCharacters/actions/workflows/ci.yml)

A fast, accessible character browser built with React, Vite and the Marvel API.
Search by the beginning of a name, reverse the index and move through the
complete public roster without exposing Marvel credentials to the browser.

## What changed in version 2

- Moves Marvel request signing into a same-origin Vercel function.
- Returns a small, stable response instead of forwarding the full upstream API
  payload.
- Upgrades the frontend to React 19 and Vite 8.
- Adds responsive archive-inspired presentation, explicit loading, empty and
  error states, keyboard focus styles and reduced-motion support.
- Validates all proxy inputs, upgrades media URLs to HTTPS, times out slow
  upstream requests and caches successful responses at the edge.
- Adds native Node tests, ESLint, CI, Dependabot and baseline browser security
  headers.

## Architecture

```text
browser  ── GET /api/characters ──> Vercel function ── signed request ──> Marvel API
   ▲                                      │
   └──────── minimal character JSON ──────┘
```

Only the function can read `MARVEL_PRIVATE_KEY`. Variables prefixed with
`VITE_` are bundled into browser code and must never be used for these
credentials.

## Run locally

Requirements: Node.js 22.13 or newer, npm, a Marvel developer account and the
[Vercel CLI](https://vercel.com/docs/cli).

```bash
npm install
cp .env.example .env.local
vercel dev
```

Add your credentials to `.env.local`, then open the URL printed by Vercel.
`npm run dev` is also useful for frontend-only work, but its API requests need a
separately running compatible backend.

| Variable | Scope | Purpose |
| --- | --- | --- |
| `MARVEL_PUBLIC_KEY` | Server only | Identifies the Marvel developer account. |
| `MARVEL_PRIVATE_KEY` | Server only | Signs upstream API requests. Treat as a secret. |

## Quality checks

```bash
npm run check
```

This runs ESLint, the API contract tests and a production build. Tests use
mocked upstream responses and do not require real credentials.

## Deploy

This repository was historically deployed with Vercel. Link or create a Vercel
project, configure both variables for Production, Preview and Development, and
deploy from the repository root. The former deployment project no longer
exists, so this repository currently has no live environment.

The original 2021 browser build expected a private key in a `REACT_APP_`
variable. Rotate that Marvel private key before creating a new deployment, even
though the historical deployment URLs now return 404.

## Attribution and license

Data provided by Marvel. Character names and images remain the property of
their respective owners. The application code is available under the
[MIT License](LICENSE).
