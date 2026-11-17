# CLAUDE.md — Ma Retraite Franco-Suisse

> Mémoire du projet. À relire au début de chaque session, à mettre à jour à chaque phase.
> Phase en cours : **3 · Onboarding et rapport** (livré, en attente de validation).

## 1. Vision

- **Produit** : application web de planification retraite suisse, rapport dynamique, très visuel, succinct, recalculé instantanément (< 50 ms) à chaque changement de critère.
- **Promesse (hero)** : « Votre retraite suisse, claire en 2 minutes. »
- **Persona** : résident ou frontalier en Suisse, 45–64 ans, non technicien. Questions : combien par mois ? ça suffit / jusqu'à quel âge ? rente ou capital ? partir à 63/65/67 ou progressivement ? payer moins d'impôts sur les retraits ? garder la maison ? partir à l'étranger ?
- **Ton** : rassurant, précis, zéro jargon non expliqué (info-bulle d'une phrase pour chaque terme : RAM, taux de conversion, déduction de coordination…).
- **Moins, mais mieux** : un message principal par écran ; bloc = 1 KPI + 1 visuel + 1 phrase ; puces ≤ 12 mots.

## 2. Règles de travail

1. Travail par phases (§12). À chaque ✅ point de contrôle : résumé ≤ 5 lignes + URL de preview, puis **attendre la validation**.
2. **Ne jamais inventer un paramètre légal.** Tout chiffre légal vit dans `src/engine/params/*` avec `meta { year, verifiedOn, sources[] }`. Doute → `// TODO: VERIFY` + signaler à l'utilisateur.
3. **Moteur testé avant l'UI** : aucun chiffre affiché qui ne sorte d'une fonction pure testée (Vitest, couverture ≥ 90 %).
4. Skills design à invoquer avant chaque phase UI s'ils existent : `/apple-design`, `/build-awwwards-quality-sites`, `/animate-ui`, `/find-animation-opportunities`, `/landing-page-design`. **État au 16.11.2026 : aucun n'est installé** → appliquer §8–9 et le signaler en une ligne.
5. Langue : UI en français (Suisse romande) ; code, noms et commentaires en anglais.
6. Montants : `Intl.NumberFormat('fr-CH')` → `CHF 1'250` (apostrophe). Toujours `tabular-nums`.
7. Confidentialité (nLPD) : aucune donnée hors du navigateur. Pas de backend, tracking, cookies tiers, CDN de polices. État dans le hash d'URL (jamais envoyé au serveur) + localStorage (try/catch). Pied de page : « Vos données restent sur votre appareil. »

## 3. Stack (imposée)

| Besoin | Choix |
|---|---|
| Build | Vite + React 19 + TypeScript `strict` |
| Style | Tailwind CSS v4 + variables CSS (`src/styles/tokens.css`) |
| Animations | Motion (`motion/react`), `prefers-reduced-motion` → fondus 100 ms |
| Graphiques | Recharts (standards) ; SVG + `d3-scale`/`d3-shape` (jauges, frise, crossover) |
| Carte | `d3-geo` + `topojson-client` + `world-atlas` 110m embarqué localement |
| État | Zustand, sérialisé dans le hash URL + localStorage |
| Calcul | `src/engine/` TS pur, sans React, mémoïsé (Web Worker pour l'optimiseur si besoin) |
| Tests | Vitest (moteur ≥ 90 %), Playwright (3 parcours e2e, mobile + desktop, `--trace off`) |
| PWA | `vite-plugin-pwa` (installable, hors ligne, maskable icons) |
| Export | CSS d'impression → `window.print()` |
| Hébergement | Netlify : `netlify.toml`, SPA redirect, CSP stricte, HSTS, previews de branche |
| Qualité | ESLint + Prettier, Lighthouse CI ≥ 95 (mobile, 4 catégories) |

Budgets : JS initial < 180 ko gzip (carte + Recharts en lazy), LCP < 2 s en 4G, recalcul < 50 ms.

## 4. Arborescence

```
CLAUDE.md  README.md  netlify.toml  index.html  vite.config.ts  tsconfig*.json
brand/
  logo.png  logo.webp            # fourni (1715×2000) — ne jamais déformer/recolorer
  logo.svg                       # vectorisation fidèle (même cadrage que le PNG, fond blanc)
  logo-stacked.svg               # empilé, fond transparent, recadré
  logo-mark.svg                  # rond seul (favicon, PWA, filigrane)
  logo-horizontal.svg            # rond + texte à droite (en-tête)
public/
  icons/ (favicon, apple-touch, pwa-192/512, maskable)  og-image.png  fonts/
scripts/
  demo-cli.ts                     # Phase 2 : tableau console du profil test
  gen-logo.mjs                    # régénère brand/*.svg (opentype.js + Literata, texte vectorisé)
  gen-icons.mjs                   # icônes PWA + OG (Playwright) depuis brand/*.svg
src/
  main.tsx  App.tsx  router.tsx
  engine/                         # PUR, aucun import React
    params/
      types.ts                    # LegalParams, CantonTaxData
      ch-2026.ts  ch-2027.ts      # §5, meta { year, verifiedOn, sources }
      cantons.ts                  # 26 cantons, chef-lieu, points AFC
      ifd.ts                      # barèmes LIFD art. 36 (seul / couple) par année
      index.ts                    # getParams(year)
    money.ts                      # arrondis, nominal↔réel
    avs.ts  lpp.ts  pillar3.ts  tax.ts  housing.ts
    capitalVsAnnuity.ts  scenarios.ts  cashflow.ts  withdrawalOptimizer.ts
    advice.ts  profile.ts (types d'entrée + profil exemple)  index.ts
    __tests__/                    # un fichier par module + recette §11
  data/
    countries.ts  regimeTemplates.ts  world-110m.json
  state/
    store.ts  urlCodec.ts  persistence.ts
  features/
    landing/  onboarding/  report/ (9 blocs)  scenarios/  map/  advice/  settings/  method/
  components/
    ui/       # Button Slider Segmented Stepper Sheet Card Kpi Tooltip Badge Toggle Accordion
    charts/   # ChartFrame (filigrane logo 8 %), Gauge, Donut, StackedBar, Crossover, Timeline…
    brand/    # Logo (horizontal compact), Marmot (SVG animé < 30 ko)
  lib/        # format.ts (fr-CH), a11y, haptics, reducedMotion
  styles/     tokens.css  print.css  fonts.css
  dev/UiPage.tsx                  # storybook interne /ui
e2e/          # Playwright : onboarding, ajustement critère (<100 ms), carte
```

## 5. Paramètres légaux (source de vérité = `src/engine/params/`)

### 5.1 Valeurs (2027 confirmées : fiche OFAS du 02.10.2026 ; LPP 2 % : CF 04.11.2026)

| Paramètre | 2026 | 2027 |
|---|---|---|
| Rente AVS min / mois | 1'260 | 1'280 |
| Rente AVS max / mois | 2'520 | 2'560 |
| Plafond couple (150 %) / mois | 3'780 | 3'840 |
| 13e rente | 1/12 de la rente annuelle, 1er versement déc. 2026 | idem |
| Seuil d'entrée LPP | 22'680 | 23'040 |
| Déduction de coordination | 26'460 | 26'880 |
| Salaire LPP max | 90'720 | 92'160 |
| Salaire coordonné min / max | 3'780 / 64'260 | 3'840 / 65'280 |
| 3a avec LPP | 7'258 | 7'373 |
| 3a sans LPP (20 %, max) | 36'288 | 36'864 |
| Taux de conversion LPP min (oblig.) | 6,8 % | 6,8 % |
| Taux d'intérêt min LPP | 1,25 % | **2,00 %** |

### 5.2 AVS 21
- Âge de référence 65. Femmes transitoires : 1961 → 64a3m ; 1962 → 64a6m ; 1963 → 64a9m ; ≥ 1964 → 65.
- Anticipation dès 63 (62 génération transitoire), totale ou partielle : −6,8 %/an, −13,6 % pour 2 ans, à vie. `TODO: VERIFY` ≥ 2027.
- Ajournement 1–5 ans : +5,2 / +10,8 / +17,1 / +24,0 / +31,5 %. `TODO: VERIFY` ≥ 2027.
- Badge « taux à confirmer » si année ≥ 2027 et taux non mis à jour (`params.avs.flexRatesConfirmed === false`).
- Pas de 13e rente si rente entièrement ajournée. Supplément transitoire femmes hors 13e (simplifiable v1).
- Formule art. 34 LAVS : `RAM ≤ 36·min → 0.74·min + 13/600·RAM`, sinon `1.04·min + 8/600·RAM`, bornée [min, max]. Rente partielle × années/44 (dès l'année suivant les 20 ans). Couple ≤ 150 % du max.
- Contrôles : 2026 RAM 15'120 → 1'260 ; RAM 90'720 → 2'520 (vérifiés à la main : continuité au point 45'360 = 1'915.20).
- Tables officielles mois par mois (mémento 3.04, état 1.1.2026) : anticipation 0,6 %…13,6 % ; ajournement par trimestre 5,2 %…31,5 %.
- Cotisations AVS des non-actifs (mémento 2.03) : 530 fr. < 350'000, +106 fr. par 50'000 jusqu'à 1,75 mio, puis +159 fr., max 26'500 (2027 : min 541, paliers 2026).

### 5.3 Fiscalité (état 16.11.2026)
- Capital 2e/3e piliers : imposé séparément ; IFD = 1/5 du barème ordinaire (art. 38 LIFD). Hausse du programme d'allègement 2027 rejetée (mars 2026).
- Retraits du couple la même année additionnés pour le taux.
- Rachat LPP déductible ; blocage 3 ans avant tout capital (art. 79b al. 3 LPP) → alerte moteur.
- 3a : retrait 60 → 70 (si activité). Rachats 3a rétroactifs dès 2026 pour lacunes nées dès 2025.
- Valeur locative supprimée au 01.01.2029 (logement occupé : fin de la déduction des intérêts ; locatif : intérêts toujours déductibles). Moteur : avant 2029 / dès 2029.
- IFD : barème officiel (2026 : Form. 58c AFC ; 2027 : OPFr du 22.09.2026, art. 2), impôt = min(barème, 11,5 % du revenu), revenu arrondi à 100 fr., impôt arrondi à 5 ct. inférieurs, réduction par enfant 263/264 fr.
- ICC : grille générée depuis le **calculateur officiel AFC** (année fiscale 2026, commune chef-lieu, sans impôt ecclésiastique) par `scripts/fetch-cantonal-tax.mjs` → `src/engine/params/cantonal-tax-2026.json` (revenu 10k→1M, fortune 50k→5M, capital 25k→3M ; seul/marié). Interpolation log-linéaire, « estimation ±10 % ». L'app n'appelle jamais ce service.
- Années futures : barèmes supposés indexés à l'inflation (compensation de la progression à froid) → montants déflatés vers l'année du barème, taxés, ré-inflatés.

### 5.4 Hypothèses par défaut (panneau « Hypothèses »)
Inflation 1,0 % (0–3) · rendements prudent 1,5 / équilibré 3,0 / dynamique 4,5 % nets · liquidités 0,5 % · progression salariale réelle 0,5 % · AVS indexée = inflation (simplification de l'indice mixte) · LPP non indexée · espérance de vie à 65 : ≈ 20 H / ≈ 23 F (`TODO: VERIFY` OFS) · horizon par défaut 95 ans · baisse dépenses retraite −10 %, −15 % après 80 (option) · tenue des charges : 5 % théorique + 1 % entretien + amortissement ≤ 33 % · réduction taux de conversion anticipé −0,2 pt/an · survivant LPP 60 %.

### 5.4 bis Hypothèses de modélisation (moteur, modifiables)
Revenu imposable ≈ salaire × (1 − 20 %) − 3a − rachats ; rentes × (1 − 8 %) ; rendement imposable = 40 % du rendement des placements + intérêts ; valeur fiscale de l'immobilier 70 % ; valeur locative 2,5 % de la valeur vénale (jusqu'en 2028), entretien forfaitaire 20 % ; cotisations sociales salariales 6,4 % ; part salariale LPP = 50 % des bonifications ; LPP créditée au taux minimal ; 3a versé au maximum par défaut ; ordre de décaissement liquidités → placements → 3b ; excédent au-delà de 12 mois de dépenses placé.

### 5.5 Sources (meta.sources + page Méthode)
OFAS (bsv.admin.ch), ahv-iv.ch (mémentos), AFC/ESTV (charge fiscale, barèmes IFD, liste CDI), OFS (espérance de vie), fedlex (LAVS, LPP, LIFD, OPP2, OPP3).

## 6. Registre `TODO: VERIFY` (à lever avec accord explicite)

| # | Élément | Statut |
|---|---|---|
| V1 | Valeurs 2027 (§5.1) | ✅ confirmé — fiche OFAS « Montants valables à partir du 1.1.2027 » (CF 02.10.2026) |
| V2 | Taux d'intérêt minimal LPP 2027 | ✅ 2 % — CF 04.11.2026 |
| V3 | Taux d'anticipation/ajournement AVS ≥ 2027 (espérance de vie) | ⏳ non publiés au 16.11.2026 → taux 2026, `flexRatesConfirmed: false`, badge « taux à confirmer » |
| V4 | Taux réduits d'anticipation des femmes de la génération transitoire (bas revenus) + supplément de rente | ⏳ non modélisés en v1 (taux standards) — à valider |
| V5 | Espérance de vie à 65 ans | ✅ OFS 2024 : 20,4 (H) / 23,0 (F) (2025 hommes 20,7 publié ; femmes 2025 non confirmé) |
| V6 | Barèmes IFD 2026 et 2027 | ✅ Form. 58c 2026 (reconstitué et testé ligne à ligne) ; OPFr 2027 art. 2 |
| V7 | Charge fiscale cantonale (26 chefs-lieux) | ✅ calculateur AFC, année fiscale 2026 (les données 2027 du calculateur semblent provisoires : IFD 2'688 ≠ 2'668 officiel à 100k) |
| V8 | Liste OFAS des conventions de sécurité sociale | Phase 4 |
| V9 | Conventions « limitées » (Chine, Inde, Japon, Corée du Sud) | Phase 4 |
| V10 | Liste des CDI en vigueur (SFI) | Phase 4 |
| V11 | France : imposition des capitaux LPP/3a — fiche pays uniquement | Phase 4 |
| V12 | Portugal : fin du RNH → IFICI | Phase 4 |
| V13 | Arrondis de l'échelle 44 (tables) vs formule continue | ouvert (écart < 1 CHF/mois) |
| V14 | Rattrapage des cotisations AVS sur 5 ans (art. 16 al. 1 LAVS) | à confirmer sur fedlex |
| V15 | Paliers 2027 des cotisations AVS des non-actifs | ⏳ seule la cotisation minimale 541 fr. est publiée |
| V16 | Hypothèses de modélisation (§5.4 bis) | à valider par l'utilisateur |

## 7. Moteur (résumé de spécification)

- Fonctions pures, CHF nominaux + réels (interrupteur « francs d'aujourd'hui »), pas annuel, de l'année courante à l'horizon.
- `avs.ts` : rente mensuelle/annuelle (13e incluse), partielle, couple plafonné, anticipation/ajournement (partiels), courbe 63→70.
- `lpp.ts` : mode certificat (interpolation) / mode calcul (bonifications 7/10/15/18 %), taux enveloppant, rente/capital/mixte 0–100 %, retraite partielle ≤ 3 tranches, rachats + blocage 3 ans, survivant 60 %.
- `pillar3.ts` : ≤ 5 comptes 3a, versements plafonnés, retraits 60–65 (70), 3b (impôt fortune/rendement).
- `capitalVsAnnuity.ts` : âge d'équilibre, âge d'épuisement × 3 profils, transmissible à 85/95, données crossover.
- `scenarios.ts` : ordinaire / anticipée / partielle / différée → revenu net mensuel, taux de remplacement, impôts cumulés, patrimoine 85/95, épuisement.
- `tax.ts` : IFD (barème), ICC (interpolation AFC), capital (1/5 IFD + ICC, couple cumulé), fortune, taux marginal.
- `withdrawalOptimizer.ts` : exhaustif si ≤ 6 retraits × ≤ 11 ans, sinon glouton ; respecte le blocage ; invariant testé : échelonné ≤ tout la même année.
- `housing.ts` : tenue des charges aujourd'hui / retraite, LTV 2/3 en 15 ans, verdict amortissement avant/dès 2029.
- `cashflow.ts` : tableau annuel, ordre de décaissement liquidités → placements → 3b, événements.
- `advice.ts` : 4 conseils obligatoires (rente/capital, inflation, horizon/réserves, 3 seaux) + ≤ 3 contextuels, action « Appliquer ».

## 8. Design system « Alpine clarity »

Couleurs (pipette sur `brand/logo.png`, 16.11.2026) :

```css
--navy:    #1A2A49;  /* texte, contours, en-tête */
--blue-fr: #0055A3;  /* France, actions principales, LPP */
--red-ch:  #DA281B;  /* Suisse, alertes, AVS */
--sky:     #E6F0F8;  /* fonds de section, fond carte */
--alp:     #C7D8E9;  /* secondaires, liquidités */
--meadow:  #A3C67D;  /* positif, 3e pilier — jamais en texte sur clair */
--marmot:  #9B6B40;  /* accent rare, placements */
--paper:   #FCFBF8;  /* fond principal */
```
- Graphiques : AVS rouge · LPP bleu · 3a/3b vert · placements marmotte · liquidités alp. Couleur jamais seule porteuse d'info (icônes ✅ ⚠️ ❌).
- WCAG AA vérifié par couple (texte vert/alp → variantes foncées dédiées). Mode sombre prévu dans les tokens.
- Cartes 20 px, ombres multi-couches douces, beaucoup d'air.
- Typo : titres Fraunces (ou Literata) auto-hébergée, UI Inter, `tabular-nums` pour les montants, échelle fluide `clamp()`.
- Logo : en-tête (version horizontale compacte), favicon/PWA (rond recadré), splash, filigrane graphiques (8 %, bas droite), en-tête/pied PDF, OG 1200×630, carte, fiches pays. Zone de protection = 1/4 de la hauteur.
- Marmotte : onboarding (salue), états vides, écran « rapport prêt ». **Jamais dans le rapport.**

## 9. Motion

- Explique un changement, ne décore pas. 150–400 ms, ressort `stiffness 300 / damping 30`, uniquement `transform` + `opacity`, 60 fps.
- Imposé : compteurs roulants, morphing des courbes, crossover qui suit le curseur, `layoutId` scénario → rapport, onboarding fluide + autofocus, carte (tracé 900 ms, vagues, pulsation CH, arc grand cercle, zoom), conseils en cascade (IntersectionObserver) + coche « Appliquer », hero parallaxe montagnes.
- `prefers-reduced-motion` → fondus 100 ms.

## 10. UX & IA

- Onboarding ≤ 90 s, 4 écrans (Vous · Revenus/dépenses · Prévoyance · Patrimoine), bouton « Essayer avec un exemple ».
- Modes Simple (défaut) / Expert.
- Desktop ≥ 1024 px : panneau critères 360 px à gauche + rapport live. Mobile : tab bar iOS (Rapport · Scénarios · Monde · Conseils), bottom sheet « Ajuster », mini-barre KPI collante.
- En-tête : logo + nom + « Exporter PDF » + « Partager » (avertit : « le lien contient vos chiffres »).
- Rapport = 9 blocs : Synthèse · Aujourd'hui · 3 piliers · Rente ou capital ? · Quand partir ? · Plan dans le temps · Impôts · Logement · Conseils.
- Mobile : 360/390/430 px, safe-area, cibles ≥ 44 px, `inputmode="decimal"`, pas de scroll horizontal.
- Avertissement : « Simulation indicative fondée sur des hypothèses et des paramètres légaux 2027 simplifiés. Ne constitue pas un conseil financier, fiscal ou juridique personnalisé. Les montants exacts dépendent de votre caisse de pension, de votre commune et de votre situation. »

## 11. Profil de recette « Marc et Sophie » (VD, Lausanne, mariés)

Marc 1966, 125'000, LPP 420'000 (projeté 65 : 610'000), TC caisse 5,6 %, rachat possible 90'000, 3a 85'000 / 2 comptes. Sophie 1968, 60'000 à 80 %, LPP 180'000, 3a 40'000. Épargne 150'000, placements 200'000. Villa 1'300'000, hypothèque 650'000 à 1,6 %. Dépenses 9'500/mois.

Tests : AVS 2026 (15'120 → 1'260 ; 90'720 → 2'520), couple 2027 = 3'840 ; anticipation 2 ans −13,6 % ; ajournement 5 ans +31,5 % ; rachat N + capital N+2 → alerte ; optimiseur ≤ même année ; inflation 0 → réel = nominal ; mobile 390 px onboarding ≤ 12 taps ; KPI hero < 100 ms après changement.

## 12. Phases

| Phase | Contenu | Statut |
|---|---|---|
| 0 | Cadrage : CLAUDE.md, arborescence, TODO VERIFY, questions, logo vectoriel | ✅ validé (16.11.2026) |
| 1 | Fondations, tokens, polices, logo/PWA/OG, composants UI, page `/ui`, déploiement Netlify | ✅ validé |
| 2 | Moteur complet + Vitest ≥ 90 % + CLI démo | ✅ validé |
| 3 | Onboarding + rapport 9 blocs + URL/localStorage | ✅ livré, en attente de validation |
| 4 | Carte du monde + fiches + liste | — |
| 5 | Conseils, export PDF, partage, landing, Méthode | — |
| 6 | Finitions motion, a11y, Lighthouse ≥ 95, e2e, relecture | — |

## 13. Décisions de cadrage (16.11.2026)

- **URL de production** : https://swiss-retirement-planning.netlify.app — l'utilisateur relie lui-même le dépôt GitHub à Netlify (pas de déploiement depuis le conteneur, pas de jeton Netlify).
- **Dépôt GitHub** : `Fede74570/planification-retraite-suisse` (branche `main`), relié à Netlify par l'utilisateur.
- **Frontaliers** : l'imposition à la source des frontaliers n'est **pas** modélisée. Le moteur fiscal couvre les résidents en Suisse ; la France est traitée dans la carte du monde.
- **Logo** : pas de source vectorielle fournie → vectorisation produite (`brand/*.svg`, texte en Literata vectorisé). La marmotte animée de l'onboarding dérivera de `#mrfs-marmot`.

## 14. Conventions techniques (Phase 1)

- Routage par chemin (`/`, `/ui`) sans librairie ; le **hash est réservé à l'état** de simulation.
- Motion : `LazyMotion` + composants `m.*` (mode `strict`), fonctionnalités chargées en différé (`src/lib/motionFeatures.ts`) ; `MotionConfig reducedMotion="user"`.
- Tokens CSS préfixés `--fs-*` (tailles), `--r-*` (rayons), `--sh-*` (ombres) pour ne pas entrer en collision avec le thème Tailwind ; exposés via `@theme inline` dans `src/styles/index.css`.
- Polices : Inter (UI) et Literata (titres, comme le logo), sous-ensemble latin, auto-hébergées (`src/styles/fonts.css`).
- Format des montants : `src/lib/format.ts` impose l'apostrophe ASCII (`CHF 1'250`) quel que soit l'ICU du navigateur.
- `vite preview` applique la CSP de `netlify.toml` (détection locale des violations).
- Contraste : `src/styles/tokens.test.ts` vérifie AA pour chaque couple texte/fond.
- Bundle initial Phase 1 : ~110 ko gzip (React 19 + Motion core).

## 15. Moteur — API et conventions (Phase 2)

- Point d'entrée : `computeReport(profile, assumptions, strategy?, chf?)` (`src/engine/index.ts`) → plan annuel, 4 scénarios, rente/capital, optimiseur, logement, rachat, courbe AVS, conseils. ~12 ms pour le profil test.
- `Profile` (qui je suis), `Assumptions` (hypothèses), `Strategy` (décisions : âges, part capital, retraits 3a, rachats, amortissement) — `src/engine/profile.ts`. `defaultStrategy()` dans `strategy.ts`.
- `simulatePlan()` (`cashflow.ts`) : boucle annuelle, montants nominaux, `deflator` pour les francs d'aujourd'hui. La synthèse se lit la 1re année où tout le ménage est retraité (+1 an, après les retraits en capital).
- Tests : `src/engine/__tests__/` (123 tests, couverture moteur ≈ 98 %, seuils 90/85/90/90 dans `vite.config.ts`).
- Démo : `npm run demo` (sortie de référence dans `docs/demo-marc-sophie.txt`).
- Données cantonales : `npm run fetch:cantons 2026` régénère le JSON (≈ 1'500 requêtes, ~6 min).

## 16. Application — conventions (Phase 3)

- Routes : `/` accueil (provisoire), `/app` application (chargée en différé), `/ui` storybook. `/app#exemple` charge Marc et Sophie. Un lien `#s=…` ouvre directement le rapport.
- État : `src/state/store.ts` (Zustand) = `profile` + `assumptions` + `choices` + `mode` (+ UI : onglet, francs d'aujourd'hui). `startPersistence()` (appelé par la route `/app`) écrit l'état dans le hash (`replaceState`, base64url JSON versionné, `urlCodec.ts`) et dans localStorage (`mrfs:v1`), dès le démarrage puis 250 ms après chaque changement.
- Choix utilisateur → stratégie : `src/engine/choices.ts` (`buildStrategy`, `applyAdviceAction`), pur et testé.
- `useReport()` recalcule `computeReport` (mémoïsé) : mise à jour du KPI hero mesurée à 56–79 ms en e2e (objectif < 100 ms).
- **Graphiques : SVG sur mesure + d3-scale/d3-shape pour tous les graphiques** (donut, barre empilée, courbe AVS, crossover, aire empilée, barres annuelles, jauges). Écart assumé avec « Recharts pour les graphiques standards » : morphing des chemins via Motion, ~0 ko ajouté contre ~100 ko pour Recharts. Chaque graphique est dans `ChartFrame` (filigrane du logo à 8 % + tableau de données masqué).
- Blocs du rapport : `features/report/Block.tsx` (titre ≤ 6 mots, 1 phrase, « Voir le détail »), apparition en cascade (`whileInView`) ; à l'impression, opacité et transformation forcées (`index.css`).
- Mobile < 1024 px : barre d'onglets (Rapport · Scénarios · Monde · Conseils), bouton flottant « Ajuster » → bottom sheet avec le panneau de critères, mini-barre KPI collante au-dessus de la sheet. Desktop : panneau 360 px collant + rapport.
- Glossaire des info-bulles : `src/lib/glossary.ts` + composant `Term`.
- E2E : `npm run e2e` (Playwright 1.63 = version du Chromium préinstallé ; build + `vite preview` avec CSP de production). 3 tests : onboarding mobile ≤ 12 taps sans scroll horizontal, KPI < 100 ms, lien partagé restauré.
- Budgets : JS initial 112 ko gzip (accueil) ; route `/app` +48 ko en différé.

## 17. Environnement

- Session cloud sur l'environnement « ma-retraite-franco-suisse » : sites officiels autorisés (bsv, ahv-iv, estv, swisstaxcalculator.estv, fedlex, bfs, sif, news.admin.ch, admin.ch + sites FR). npm OK. `api.netlify.com` bloqué (inutile).
- Conteneur éphémère : pousser régulièrement sur GitHub.
- Skills design listés au §2.4 : non installés.
