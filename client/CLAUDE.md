# Client — React Web Frontend

React 19 + TypeScript web app built with Vite. Deployed on Vercel as a PWA.

## Commands

```bash
npm run dev       # dev server at http://localhost:5173
npm run build     # type-check + production build
npm run preview   # preview production build locally
npm run lint      # ESLint
```

## Project Structure

```
client/
├── public/           # Static assets
├── src/
│   ├── main.tsx      # React DOM entry point
│   ├── App.tsx       # Router + AuthProvider setup
│   ├── pages/        # Route-level page components
│   ├── components/   # Shared UI components
│   └── context/      # React contexts (AuthContext)
├── index.html
├── vite.config.ts    # Vite + PWA plugin config
├── vercel.json       # Vercel API rewrites
└── Instructions.md   # Detailed feature requirements
```

## Key Patterns

- **Routing:** React Router DOM v6 with file-based page components under `src/pages/`
- **Auth:** `AuthContext` wraps the app; login uses phone + 4-digit OTP via `/homedash/validate-user`
- **API calls:** Base URL from `VITE_API_BASE` (local) or `VITE_API_BASE_DEV` (deployed); set in `.env`
- **Styling:** TailwindCSS 4 utility classes; PostCSS pipeline
- **PWA:** `vite-plugin-pwa` — service worker and manifest auto-generated

## Environment

```
VITE_API_BASE=http://localhost:8000
VITE_API_BASE_DEV=https://<vercel-deployment-url>
```

Only `VITE_`-prefixed variables are exposed to the browser bundle.

## Deployment

Vercel. `vercel.json` rewrites `/api/*` → backend serverless functions. Run `npm run build` to produce `dist/`.
