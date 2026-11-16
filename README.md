# Ma retraite Franco-Suisse

Planification retraite suisse (AVS, LPP, 3e pilier, impôts, logement, départ à l'étranger) :
un rapport visuel, recalculé en direct, **100 % dans le navigateur** (aucun backend, aucun tracking).

Production : https://swiss-retirement-planning.netlify.app · Design system : `/ui`

## Lancer

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # tsc + build de production dans dist/
npm run preview    # sert dist/ avec la CSP de production (lue dans netlify.toml)
```

Node ≥ 22.

## Tester

```bash
npm test           # Vitest (moteur, formatage, contraste des tokens)
npm run coverage   # couverture (objectif moteur ≥ 90 %)
npm run lint
```

## Identité visuelle

- `brand/logo.png` : logo fourni. `brand/*.svg` : vectorisation (texte converti en tracés, police Literata).
- `npm run gen:logo` régénère les SVG ; `npm run gen:icons` régénère favicons, icônes PWA et `public/og-image.png`
  (utilise Chromium/Playwright ; les fichiers générés sont versionnés).

## Mettre à jour les paramètres annuels

Les paramètres légaux vivent dans `src/engine/params/ch-AAAA.ts` (Phase 2), chacun avec
`meta { year, verifiedOn, sources[] }`. Chaque année :

1. Copier le fichier de l'année précédente en `ch-AAAA.ts` et reporter les valeurs publiées par l'OFAS
   (rentes AVS, seuils LPP, plafonds 3a) et l'AFC (barème IFD).
2. Mettre à jour `verifiedOn` et `sources`. Toute valeur non confirmée garde `// TODO: VERIFY`.
3. `npm test` : les tests de recette doivent rester verts.

## Déploiement

Netlify est relié au dépôt GitHub (branche `main` → production, autres branches → previews).
Configuration : `netlify.toml` (redirection SPA, CSP stricte, HSTS, cache des assets).

## Confidentialité

Aucune donnée ne quitte l'appareil : état dans le hash de l'URL (jamais envoyé au serveur) et dans
`localStorage`. Polices auto-hébergées, aucun appel réseau tiers.
