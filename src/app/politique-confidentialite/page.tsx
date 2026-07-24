import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Politique de Confidentialité — KOSHA',
  description: 'Politique de confidentialité et protection des données personnelles de KOSHA.',
}

export default function PolitiqueConfidentialite() {
  return (
    <div className="relative z-10 min-h-screen px-4 py-20">
      <div className="mx-auto max-w-4xl">
        <Link href="/" className="mb-8 inline-flex items-center gap-2 text-sm text-[var(--fg-muted)] hover:text-[var(--violet)] transition-colors">
          ← Retour à l&apos;accueil
        </Link>

        <h1 className="font-bold text-3xl md:text-4xl text-[var(--fg)] mb-2">
          Politique de Confidentialité
        </h1>
        <p className="text-sm text-[var(--fg-muted)] mb-12">Dernière mise à jour : 25 juillet 2026</p>

        <div className="bg-[var(--bg-elev-1)] border border-[var(--border)] rounded-3xl p-8 md:p-12 space-y-10 text-[var(--fg-muted)] leading-relaxed">

          <section>
            <h2 className="font-semibold text-xl text-[var(--fg)] mb-4">
              1. Qui sommes-nous ?
            </h2>
            <p>
              SASU PURAMA (ci-après &quot;nous&quot;) exploite la plateforme KOSHA accessible à l&apos;adresse <strong className="text-[var(--fg)]">kosha.purama.dev</strong>.
              SASU PURAMA est responsable du traitement de vos données personnelles au sens du Règlement Général sur la Protection des Données (RGPD — Règlement UE 2016/679).
            </p>
            <p className="mt-2">
              Notre Délégué à la Protection des Données (DPO) est joignable à l&apos;adresse : <a href="mailto:matiss.frasne@gmail.com" className="text-[var(--violet)] hover:underline">matiss.frasne@gmail.com</a>
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-xl text-[var(--fg)] mb-4">
              2. Données collectées
            </h2>
            <p>Nous collectons les données suivantes lors de votre utilisation de KOSHA :</p>
            <ul className="mt-3 space-y-2 ml-4 list-disc">
              <li><strong className="text-[var(--fg)]">Données d&apos;identification :</strong> adresse e-mail, nom complet (optionnel), photo de profil (via Google OAuth si utilisé)</li>
              <li><strong className="text-[var(--fg)]">Données d&apos;activité :</strong> cagnottes créées, contributions, Score d&apos;Humanité, participation aux rituels</li>
              <li><strong className="text-[var(--fg)]">Interactions avec Aria :</strong> historique de conversations, préférences utilisateur</li>
              <li><strong className="text-[var(--fg)]">Données de wallet :</strong> solde, historique des redistributions, retraits IBAN</li>
              <li><strong className="text-[var(--fg)]">Fil de Vie :</strong> actions, impacts mesurés, événements significatifs</li>
              <li><strong className="text-[var(--fg)]">Données de paiement :</strong> gérées exclusivement par Stripe (nous ne stockons jamais les numéros de carte)</li>
              <li><strong className="text-[var(--fg)]">Données techniques :</strong> adresse IP (anonymisée), type de navigateur, préférences d&apos;interface</li>
              <li><strong className="text-[var(--fg)]">Données d&apos;analytique :</strong> données agrégées et anonymisées sur l&apos;utilisation des fonctionnalités (via PostHog hébergé en Europe)</li>
            </ul>
          </section>

          <section>
            <h2 className="font-semibold text-xl text-[var(--fg)] mb-4">
              3. Finalités du traitement
            </h2>
            <p>Vos données sont traitées pour les finalités suivantes :</p>
            <ul className="mt-3 space-y-2 ml-4 list-disc">
              <li>Création et gestion de votre compte utilisateur</li>
              <li>Fourniture des services KOSHA (cagnottes, Fil de Vie, Aria, wallet)</li>
              <li>Calcul du Score d&apos;Humanité et redistribution mensuelle du CA</li>
              <li>Traitement des paiements et émission des factures</li>
              <li>Envoi d&apos;emails transactionnels (confirmation de compte, notifications)</li>
              <li>Amélioration continue de nos services (analytique agrégée)</li>
              <li>Prévention des abus et sécurité de la plateforme</li>
              <li>Respect de nos obligations légales et comptables</li>
            </ul>
            <p className="mt-3">
              La base légale du traitement est : l&apos;exécution du contrat (services), le consentement (communications marketing), et l&apos;obligation légale (comptabilité).
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-xl text-[var(--fg)] mb-4">
              4. Durée de conservation
            </h2>
            <ul className="mt-3 space-y-2 ml-4 list-disc">
              <li><strong className="text-[var(--fg)]">Données de compte actif :</strong> pendant toute la durée du contrat + 3 ans après clôture du compte</li>
              <li><strong className="text-[var(--fg)]">Fil de Vie :</strong> conservé à vie (règle sacrée KOSHA n°7 — continuité de vie)</li>
              <li><strong className="text-[var(--fg)]">Historique des conversations Aria :</strong> 1 an glissant (configurable dans les paramètres)</li>
              <li><strong className="text-[var(--fg)]">Données de facturation :</strong> 10 ans conformément aux obligations comptables françaises</li>
              <li><strong className="text-[var(--fg)]">Logs de sécurité :</strong> 6 mois</li>
              <li><strong className="text-[var(--fg)]">Données analytiques agrégées :</strong> 24 mois</li>
            </ul>
          </section>

          <section>
            <h2 className="font-semibold text-xl text-[var(--fg)] mb-4">
              5. Vos droits RGPD
            </h2>
            <p>Conformément au RGPD, vous disposez des droits suivants :</p>
            <ul className="mt-3 space-y-2 ml-4 list-disc">
              <li><strong className="text-[var(--fg)]">Droit d&apos;accès :</strong> obtenir une copie de vos données personnelles</li>
              <li><strong className="text-[var(--fg)]">Droit de rectification :</strong> corriger vos données inexactes ou incomplètes</li>
              <li><strong className="text-[var(--fg)]">Droit à l&apos;effacement (&quot;droit à l&apos;oubli&quot;) :</strong> demander la suppression de vos données (sauf Fil de Vie qui est conservé conformément aux règles sacrées)</li>
              <li><strong className="text-[var(--fg)]">Droit à la portabilité :</strong> recevoir vos données dans un format structuré et lisible</li>
              <li><strong className="text-[var(--fg)]">Droit d&apos;opposition :</strong> s&apos;opposer à certains traitements (notamment le marketing)</li>
              <li><strong className="text-[var(--fg)]">Droit à la limitation :</strong> restreindre le traitement dans certaines circonstances</li>
            </ul>
            <p className="mt-3">
              Pour exercer ces droits, rendez-vous dans <strong className="text-[var(--fg)]">Paramètres → Compte → Données personnelles</strong> de votre espace KOSHA, ou contactez notre DPO à : <a href="mailto:matiss.frasne@gmail.com" className="text-[var(--violet)] hover:underline">matiss.frasne@gmail.com</a>.
            </p>
            <p className="mt-2">
              Vous disposez également du droit d&apos;introduire une réclamation auprès de la CNIL (<a href="https://www.cnil.fr" target="_blank" rel="noopener noreferrer" className="text-[var(--violet)] hover:underline">cnil.fr</a>).
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-xl text-[var(--fg)] mb-4">
              6. Partage des données
            </h2>
            <p>Vos données peuvent être partagées avec les sous-traitants strictement nécessaires à la fourniture du service :</p>
            <ul className="mt-3 space-y-2 ml-4 list-disc">
              <li><strong className="text-[var(--fg)]">Supabase</strong> — base de données (serveurs EU)</li>
              <li><strong className="text-[var(--fg)]">Stripe</strong> — traitement des paiements (certifié PCI-DSS)</li>
              <li><strong className="text-[var(--fg)]">Anthropic / OpenAI</strong> — traitement des requêtes IA pour Aria (sans conservation personnalisée)</li>
              <li><strong className="text-[var(--fg)]">Resend</strong> — envoi d&apos;emails transactionnels</li>
              <li><strong className="text-[var(--fg)]">PostHog</strong> — analytique anonymisée (serveurs EU)</li>
              <li><strong className="text-[var(--fg)]">Sentry</strong> — monitoring des erreurs (données anonymisées)</li>
            </ul>
            <p className="mt-3">
              Nous ne vendons jamais vos données à des tiers à des fins publicitaires. C&apos;est une règle sacrée de KOSHA (n°1 : zéro publicité externe).
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-xl text-[var(--fg)] mb-4">
              7. Cookies
            </h2>
            <p>
              Nous utilisons uniquement des cookies essentiels au fonctionnement du service (session d&apos;authentification, préférences de langue).
              Nous n&apos;utilisons pas de cookies publicitaires ou de suivi tiers sans votre consentement explicite.
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-xl text-[var(--fg)] mb-4">
              8. Sécurité
            </h2>
            <p>
              Nous mettons en œuvre des mesures de sécurité adaptées : chiffrement TLS en transit, chiffrement au repos, accès aux données restreint, authentification multi-facteurs pour les accès internes, et audits réguliers.
              En cas de violation de données, nous vous informerons dans les 72 heures conformément au RGPD.
            </p>
          </section>

        </div>
      </div>
    </div>
  )
}
