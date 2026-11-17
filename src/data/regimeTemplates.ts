import type { Nationality } from '@/engine/profile';
import type { Bullet, PillarKey, Regime } from './countries';

/**
 * Bullet templates per regime (≤ 2 bullets per pillar, ≤ 12 words each), adapted to the user's
 * nationality and to the existence of a double taxation treaty (CDI). Sources: OFAS overview of
 * conventions (1.1.2026), AVS mementos 10.02 and 10.03, SIF treaty list (1.1.2026).
 */
export type Sheet = Record<PillarKey, Bullet[]>;

const p3aTax = (dta: boolean): Bullet =>
  dta
    ? { status: 'warn', text: 'Impôt à la source suisse, récupérable selon la CDI' }
    : { status: 'no', text: 'Impôt à la source non récupérable sans CDI' };

const lppTax = (dta: boolean): Bullet =>
  dta
    ? { status: 'warn', text: 'Impôt à la source sur le capital, récupérable selon la CDI' }
    : { status: 'warn', text: 'Impôt à la source définitif sans CDI' };

const healthOutsideEu: Bullet = {
  status: 'warn',
  text: 'Plus d’assurance maladie suisse : prévoir une couverture locale',
};

/** AVS bullets for countries without a (benefit) convention, by nationality. */
function avsWithoutConvention(nationality: Nationality): Bullet[] {
  if (nationality === 'OTHER') {
    return [
      {
        status: 'no',
        text: 'Autres nationalités : rente non exportée, remboursement des cotisations possible',
      },
      { status: 'warn', text: 'Vérifiez si votre pays d’origine a une convention' },
    ];
  }
  return [
    { status: 'ok', text: 'Suisses et UE/AELE : rente versée partout' },
    { status: 'warn', text: 'AVS facultative : 5 ans d’assurance, inscription dans l’année' },
  ];
}

export function regimeTemplate(regime: Regime, nationality: Nationality, dta: boolean): Sheet {
  switch (regime) {
    case 'CH':
      return {
        avs: [{ status: 'ok', text: 'Rente versée en Suisse, 13e rente comprise' }],
        lpp: [{ status: 'ok', text: 'Rente ou capital selon le règlement de la caisse' }],
        p3a: [{ status: 'ok', text: 'Retrait dès 60 ans, imposé séparément' }],
        p3b: [{ status: 'ok', text: 'Libre' }],
        tip: [{ status: 'ok', text: 'Vous restez assuré à l’assurance maladie suisse' }],
      };
    case 'EU_EFTA':
      return {
        avs:
          nationality === 'OTHER'
            ? [
                {
                  status: 'warn',
                  text: 'Hors Suisses et UE/AELE : export selon votre nationalité',
                },
                { status: 'ok', text: 'Périodes cotisées totalisables entre États' },
              ]
            : [
                { status: 'ok', text: 'Rente versée partout, sans réduction' },
                { status: 'ok', text: 'Périodes cotisées totalisables entre États' },
              ],
        lpp: [
          { status: 'ok', text: 'Rente exportée' },
          { status: 'warn', text: 'Part obligatoire non retirable si assuré dans le nouvel État' },
        ],
        p3a: [{ status: 'ok', text: 'Retrait possible au départ ou dès 60 ans' }, p3aTax(dta)],
        p3b: [{ status: 'ok', text: 'Libre, aucune restriction de sortie' }],
        tip: [
          {
            status: 'ok',
            text: 'Rentier sans rente locale : assurance maladie suisse en principe',
          },
        ],
      };
    case 'BILATERAL':
      return {
        avs:
          nationality === 'OTHER'
            ? [
                { status: 'ok', text: 'Rente exportée pour Suisses et nationaux de ce pays' },
                { status: 'warn', text: 'Autres nationalités : selon la convention' },
              ]
            : [{ status: 'ok', text: 'Rente exportée pour Suisses et nationaux de ce pays' }],
        lpp: [
          { status: 'ok', text: 'Rente exportée' },
          { status: 'ok', text: 'Capital en espèces possible au départ définitif' },
        ],
        p3a: [{ status: 'ok', text: 'Retrait au départ définitif' }, p3aTax(dta)],
        p3b: [{ status: 'ok', text: 'Libre' }],
        tip: [healthOutsideEu],
      };
    case 'BILATERAL_LIMITED':
      return {
        avs: [
          ...avsWithoutConvention(nationality).slice(0, 1),
          { status: 'warn', text: 'Convention limitée aux cotisations, pas aux rentes' },
        ],
        lpp: [
          { status: 'ok', text: 'Capital en espèces possible au départ définitif' },
          lppTax(dta),
        ],
        p3a: [{ status: 'ok', text: 'Retrait au départ définitif' }, p3aTax(dta)],
        p3b: [{ status: 'ok', text: 'Libre' }],
        tip: [healthOutsideEu],
      };
    case 'NONE':
      return {
        avs: avsWithoutConvention(nationality),
        lpp: [
          { status: 'ok', text: 'Capital en espèces possible au départ définitif' },
          lppTax(dta),
        ],
        p3a: [{ status: 'ok', text: 'Retrait au départ définitif' }, p3aTax(dta)],
        p3b: [{ status: 'ok', text: 'Libre' }],
        tip: [healthOutsideEu],
      };
  }
}
