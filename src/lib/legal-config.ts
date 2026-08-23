import { buildCompanyInfo, buildMediateurInfo, type LegalAppConfig, type LegalDocType } from '@/lib/legal'

/** Documents dont l'acceptation est réellement enregistrée à la connexion (mentions = informatif seul). */
export const ACCEPTABLE_DOC_TYPES: LegalDocType[] = ['cgu', 'cgv', 'confidentialite']

/**
 * Config NIYAMA propre à KOSHA (socle générique `@/lib/legal`, pas éditable directement —
 * toute correction du contenu générique se fait dans `packages/legal/` à la racine du repo
 * purama). aPaiement=true (contributions cagnotte via Stripe), aChatIA=true (assistant Aria).
 */
export const KOSHA_LEGAL_CONFIG: LegalAppConfig = {
  slug: 'kosha',
  nom: 'KOSHA',
  domaine: 'kosha.purama.dev',
  famille: 'karma_wellness',
  company: buildCompanyInfo(),
  mediateur: buildMediateurInfo(),
  descriptionActivite:
    "KOSHA est un réseau social ultra-positif : cagnottes solidaires (dons et projets de vie), missions à impact récompensées en Points, rituels hebdomadaires et assistant IA Aria.",
  aPaiement: true,
  aChatIA: true,
  clausesSpecifiquesCgu: [
    {
      titre: 'Fil de Vie et Score d\'Humanité',
      paragraphes: [
        "Le Fil de Vie retrace, de façon immuable, les actions positives réalisées par l'utilisateur sur KOSHA (contributions, missions accomplies, participations aux rituels). Il ne peut être ni modifié ni supprimé par l'utilisateur, y compris en cas de suppression de compte (les entrées sont anonymisées, jamais réattribuées).",
        "Le Score d'Humanité est calculé automatiquement à partir de l'activité de l'utilisateur (fiabilité, entraide, régularité, impact). Il n'a aucune valeur contractuelle et peut évoluer à tout moment selon l'algorithme en vigueur.",
      ],
    },
    {
      titre: 'Points Purama et missions',
      paragraphes: [
        "L'utilisateur peut gagner des Points Purama (1 Point = 0,01 €) en accomplissant des missions à impact positif (écologie, entraide, santé, connaissance, créativité) ou en participant aux rituels hebdomadaires. Les Points sont crédités après validation de la preuve fournie (photo, texte, géolocalisation selon la mission).",
        "Les Points ne constituent pas une monnaie électronique au sens du Code monétaire et financier : ils sont convertibles en euros uniquement via le portefeuille (wallet) de l'utilisateur, dans les conditions définies par KOSHA.",
      ],
    },
    {
      titre: 'Modération des publications',
      paragraphes: [
        "Toute publication (post, story, gratitude) est soumise à une modération automatisée par l'assistant IA Aria avant diffusion publique. KOSHA se réserve le droit de refuser ou de retirer tout contenu contraire à l'esprit du service (règle sacrée : seules 3 réactions positives — énergie, gratitude, soutien — sont disponibles, aucune fonctionnalité de dénigrement n'existe sur la plateforme).",
      ],
    },
  ],
  clausesSpecifiquesCgv: [
    {
      titre: 'Cagnottes et contributions',
      paragraphes: [
        "Une contribution à une cagnotte KOSHA (communautaire, projet de vie, action immédiate, humanitaire ou hybride) est un paiement en ligne sécurisé via Stripe, immédiatement débité. Le montant minimum est de 1 € et le montant maximum de 1 000 000 € par contribution.",
        "Chaque contribution est répartie automatiquement selon la clé 70 % (porteur du projet) / 15 % (redistribution aux contributeurs) / 5 % (sécurité anti-fraude) / 10 % (fonds VIDA, dont association et fonctionnement de la plateforme). Cette répartition est fixe et affichée avant tout paiement.",
        "Chaque contribution fait l'objet d'une preuve d'horodatage indépendante ancrée sur la blockchain Bitcoin (OpenTimestamps), garantissant l'intégrité et la date de l'engagement pris.",
      ],
    },
    {
      titre: 'Absence de remboursement',
      paragraphes: [
        "Une contribution versée à une cagnotte est définitive et non remboursable une fois le paiement confirmé, sauf en cas de fraude avérée constatée par KOSHA (cagnotte suspendue en `fraud_check` ou annulée), auquel cas les contributeurs concernés sont remboursés intégralement.",
      ],
    },
  ],
}
