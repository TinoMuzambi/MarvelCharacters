# Marvel Characters

Using the Marvel API to pull details about Marvel characters.

Marvel request signing happens in the serverless `api/characters.js` endpoint so
the private key is never included in the browser bundle. Copy `.env.example` to
an ignored local environment file and provide both values through your host.

The frontend uses Vite and React 19. Use `vercel dev` when testing the frontend
and serverless function together, or `yarn dev` when working on the UI alone.

## Verification

```bash
yarn build
```
