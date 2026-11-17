# Ma retraite Franco-Suisse

Planification retraite suisse (AVS, LPP, 3e pilier, impôts, logement, départ à l'étranger) :
un rapport visuel, recalculé en direct, **100 % dans le navigateur** (aucun backend, aucun tracking).

Production : https://swiss-retirement-planning.netlify.app · Application : `/app` (exemple : `/app#exemple`) · Méthode : `/methode` · Design system : `/ui`

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
npm run e2e        # Playwright : onboarding, KPI < 100 ms, lien partagé, carte, pages, impression, axe (WCAG 2.2 AA)
npm run lighthouse # Lighthouse mobile ≥ 95 sur /, /app#exemple, /methode (preview sur le port 4173)
```

## Moteur de calcul

`src/engine/` : TypeScript pur (aucun import React), testé.

```bash
npm run demo                 # rapport complet du profil « Marc et Sophie » en console
npm run fetch:cantons 2026   # régénère la grille fiscale des 26 chefs-lieux (calculateur officiel AFC)
```

## Identité visuelle

- `brand/logo.png` : logo fourni. `brand/*.svg` : vectorisation (texte converti en tracés, police Literata).
- `npm run gen:logo` régénère les SVG ; `npm run gen:icons` régénère favicons, icônes PWA, écrans de démarrage iOS et `public/og-image.png`
  (utilise Chromium/Playwright ; les fichiers générés sont versionnés).

## Mettre à jour les paramètres annuels

Les paramètres légaux vivent dans `src/engine/params/ch-AAAA.ts`, chacun avec
`meta { year, verifiedOn, sources[] }`. Chaque année :

1. Copier le fichier de l'année précédente en `ch-AAAA.ts` et reporter les valeurs publiées par l'OFAS
   (rentes AVS, seuils LPP, plafonds 3a) et l'AFC (barème IFD).
2. Mettre à jour `verifiedOn` et `sources`. Toute valeur non confirmée garde `// TODO: VERIFY`.
3. Régénérer les données cantonales : `npm run fetch:cantons AAAA` (puis pointer `params/cantons.ts` sur le nouveau JSON).
4. Ajouter l'année dans `params/index.ts` et des tests de lignes officielles dans `__tests__/tax.test.ts`.
5. `npm test` : les tests de recette doivent rester verts.

## Carte du monde

`npm run gen:countries` régénère les codes pays et la liste des conventions de double imposition (`src/data/`). Régimes de sécurité sociale et surcharges par pays : `src/data/countries.ts` (sources OFAS et SFI, date de vérification).

## Déploiement

Netlify est relié au dépôt GitHub (branche `main` → production, autres branches → previews).
Configuration : `netlify.toml` (redirection SPA, CSP stricte, HSTS, cache des assets).

## Confidentialité

Aucune donnée ne quitte l'appareil : état dans le hash de l'URL (jamais envoyé au serveur) et dans
`localStorage`. Polices auto-hébergées, aucun appel réseau tiers.
