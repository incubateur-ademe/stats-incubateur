# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Projet

Dashboard de statistiques des startups incubées par l'ADEME. Agrège les KPIs de chaque startup via leurs endpoints stats respectifs et les affiche sous forme de graphiques.

## Commandes

```bash
yarn dev          # Dev server (Turbopack) sur http://localhost:3000
yarn build        # Build production (Turbopack)
yarn lint         # ESLint (flat config)
yarn start        # Serveur de production
```

## Stack

- **Next.js 16** App Router, React 19, React Compiler activé
- **TypeScript 5.9** strict, path alias `@/*` → `src/*`
- **DSFR** (@codegouvfr/react-dsfr) + **MUI v7** avec thème DSFR
- **Tailwind CSS v4** + **SCSS modules** pour le styling composant
- **Yarn 4**, Node 24

## Architecture

### Sources de données

1. **GitHub Gist** (Octokit) : stocke la config des startups (liste, groupes, noms custom). Lecture via `GistConfigClient` dans `src/lib/db/gist/`.
2. **API beta.gouv.fr** : métadonnées des startups (nom, site, stats_url). Fetch dans `src/lib/fetchBetaStartup.ts` avec cache 1h.
3. **Endpoints stats individuels** : chaque startup expose un endpoint JSON (date/value). Appelé via la server action `fetchStats()` avec ISR 8h.

### Flux principal

- `src/app/_stats/utils.ts` : `getOrderedStartups()` récupère la config Gist + enrichit avec les données beta.gouv.fr (React.cache pour déduplication par requête)
- `src/app/_stats/action.ts` : server action `fetchStats(startupId, input)` — valide avec Zod, appelle l'endpoint stats, calcule les variations
- `src/app/_stats/GlobalForm.tsx` : formulaire client (periodicité + since), synchronisé avec les search params URL
- `src/app/_stats/StartupCard.tsx` : affiche les graphiques via React Query (useQuery)

### Admin

- `src/app/admin/` : panneau d'administration pour editer la config Gist
- Auth via formulaire `/admin/login` + cookie session (1h), route group `(protected)` pour le guard
- Auth legacy HTTP Basic toujours disponible via `/admin/auth` (compatibilite)
- Server actions protegees par `assertAuth()` (verification cookie)

### Patterns clés

- **Server Actions** (`"use server"`) pour les appels API côté serveur
- **React Query** (TanStack v5) côté client pour le cache et le fetching
- **Zod v4** pour la validation (locales françaises : `z.locales.fr()`)
- **`ServerActionResponse<T>`** : type union `{ ok: true; data?: T } | { ok: false; error: string }`
- **`server-only`** : empêche l'import accidentel de modules serveur dans le bundle client

## Conventions ESLint

- **Pas d'import React par défaut** (géré par Next.js)
- **`import type` inline** obligatoire (`consistent-type-imports`)
- **Pas de default export** sauf fichiers Next.js (page, layout, route, etc.)
- **Tri automatique** : imports, exports, enums, objets (perfectionist)
- **Prettier** intégré : 120 chars, double quotes, trailing comma
- **Lodash** : import par membre uniquement (`import { get } from "lodash"`)

## Variables d'environnement

Requises : `GIST_CONFIG_TOKEN`, `GIST_CONFIG_ID`, `ADMIN_LOGIN`, `ADMIN_PASSWORD`, `AIRTABLE_API_KEY`, `AIRTABLE_BASE_ID`, `ESPACE_MEMBRE_API_KEY`

Avec défauts : `BETA_GOUV_URL`, `NEXT_PUBLIC_SITE_URL`, `GIST_CONFIG_FILENAME`, `MAINTENANCE_MODE`

Générer les types : `yarn generateEnvDeclaration`
