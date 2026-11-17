/** One-sentence explanations of technical terms (§1: every term has a tooltip). */
export const GLOSSARY = {
  ram: [
    'RAM',
    'Revenu annuel moyen déterminant : la moyenne de vos revenus soumis à l’AVS, qui fixe votre rente.',
  ],
  conversion: [
    'Taux de conversion',
    'Le pourcentage de votre avoir LPP versé chaque année sous forme de rente.',
  ],
  coordination: [
    'Déduction de coordination',
    'La part du salaire déjà couverte par l’AVS, retirée avant de calculer la LPP.',
  ],
  reference: [
    'Âge de référence',
    'L’âge auquel la rente AVS est versée sans réduction ni supplément (65 ans).',
  ],
  buyIn: [
    'Rachat LPP',
    'Un versement volontaire dans votre caisse de pension, déductible des impôts.',
  ],
  replacement: [
    'Taux de remplacement',
    'Votre revenu net à la retraite comparé à votre revenu net actuel.',
  ],
  p3a: ['3e pilier A', 'Épargne retraite liée, déductible des impôts, retirable dès 60 ans.'],
  p3b: [
    '3e pilier B',
    'Épargne libre (assurance-vie, placements), sans avantage fiscal à l’entrée.',
  ],
  affordability: [
    'Tenue des charges',
    'Les frais théoriques du logement (5 % d’intérêts, 1 % d’entretien) comparés au revenu.',
  ],
  avsGap: [
    'Lacunes AVS',
    'Les années sans cotisations, qui réduisent la rente d’environ 1/44 chacune.',
  ],
  certificate: [
    'Certificat de prévoyance',
    'Le document annuel de votre caisse de pension, avec vos avoirs et rentes projetés.',
  ],
  breakEven: [
    'Âge d’équilibre',
    'L’âge à partir duquel la somme des rentes nettes dépasse le capital net.',
  ],
  drawdown: [
    'Épargne consommée',
    'Le retrait régulier de votre épargne pour qu’elle dure jusqu’à l’horizon.',
  ],
  realValues: [
    'Francs d’aujourd’hui',
    'Les montants futurs corrigés de l’inflation, pour comparer avec vos dépenses actuelles.',
  ],
  imputedRent: [
    'Valeur locative',
    'Un revenu fictif imposé aux propriétaires ; supprimée dès 2029.',
  ],
} as const satisfies Record<string, readonly [string, string]>;

export type GlossaryKey = keyof typeof GLOSSARY;
