import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Conditions Générales d\'Utilisation — KOSHA',
  description: 'CGU de KOSHA par SASU PURAMA.',
}

export default function CGU() {
  return (
    <div className="relative z-10 min-h-screen px-4 py-20">
      <div className="mx-auto max-w-4xl">
        <Link href="/" className="mb-8 inline-flex items-center gap-2 text-sm text-[var(--fg-muted)] hover:text-[var(--violet)] transition-colors">
          ← Retour à l&apos;accueil
        </Link>

        <h1 className="font-bold text-3xl md:text-4xl text-[var(--fg)] mb-2">
          Conditions Générales d&apos;Utilisation
        </h1>
        <p className="text-sm text-[var(--fg-muted)] mb-12">Dernière mise à jour : 25 juillet 2026</p>

        <div className="bg-[var(--bg-elev-1)] border border-[var(--border)] rounded-3xl p-8 md:p-12 space-y-10 text-[var(--fg-muted)] leading-relaxed">

          <section>
            <h2 className="font-semibold text-xl text-[var(--fg)] mb-4">
              1. Acceptation des CGU
            </h2>
            <p>
              En accédant et en utilisant la plateforme KOSHA (accessible à <strong className="text-[var(--fg)]">kosha.purama.dev</strong>), vous acceptez sans réserve les présentes Conditions Générales d&apos;Utilisation.
              Si vous n&apos;acceptez pas ces conditions, vous ne devez pas utiliser le service.
            </p>
            <p className="mt-2">
              SASU PURAMA se réserve le droit de modifier les présentes CGU à tout moment. Les utilisateurs seront informés de toute modification substantielle par email ou notification dans l&apos;application. La poursuite de l&apos;utilisation du service vaut acceptation des nouvelles conditions.
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-xl text-[var(--fg)] mb-4">
              2. Description du service
            </h2>
            <p>
              KOSHA est un réseau social positif combinant entraide, cagnottes collectives et redistribution économique. Le service comprend notamment :
            </p>
            <ul className="mt-3 space-y-1.5 ml-4 list-disc">
              <li>Création et participation à des cagnottes collectives</li>
              <li>Système de Score d&apos;Humanité et redistribution mensuelle du CA</li>
              <li>Aria, IA conversationnelle personnalisée</li>
              <li>Fil de Vie et suivi de l&apos;impact personnel</li>
              <li>Rituels planétaires hebdomadaires</li>
              <li>Wallet et carte Bitcoin &quot;argent à mémoire&quot;</li>
            </ul>
            <p className="mt-3">
              Le service est fourni en mode SaaS accessible via navigateur web et application mobile progressive (PWA). SASU PURAMA s&apos;efforce d&apos;assurer une disponibilité maximale du service mais ne peut garantir une disponibilité ininterrompue.
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-xl text-[var(--fg)] mb-4">
              3. Création et gestion du compte
            </h2>
            <p>Pour utiliser KOSHA, vous devez créer un compte en fournissant une adresse e-mail valide. Vous pouvez également vous connecter via votre compte Google.</p>
            <p className="mt-2">Vous êtes responsable :</p>
            <ul className="mt-2 space-y-1.5 ml-4 list-disc">
              <li>De la confidentialité de vos identifiants de connexion</li>
              <li>De toutes les activités effectuées depuis votre compte</li>
              <li>De la mise à jour de vos informations si elles changent</li>
            </ul>
            <p className="mt-2">
              Vous devez avoir au moins 16 ans pour créer un compte. Pour les mineurs de moins de 16 ans, le consentement parental est requis.
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-xl text-[var(--fg)] mb-4">
              4. Utilisation acceptable
            </h2>
            <p>En utilisant KOSHA, vous vous engagez à ne pas :</p>
            <ul className="mt-3 space-y-1.5 ml-4 list-disc">
              <li>Générer, diffuser ou promouvoir du contenu illégal, haineux, violent, pornographique ou discriminatoire</li>
              <li>Utiliser le service pour du spam, du phishing ou toute activité frauduleuse</li>
              <li>Créer de fausses cagnottes ou détourner des fonds</li>
              <li>Tenter de contourner les limites d&apos;utilisation ou les mesures de sécurité</li>
              <li>Revendre ou redistribuer l&apos;accès au service sans autorisation écrite</li>
              <li>Utiliser le service pour entraîner des modèles d&apos;IA concurrents</li>
              <li>Violer les droits de propriété intellectuelle de tiers</li>
              <li>Usurper l&apos;identité d&apos;une autre personne ou entité</li>
              <li>Utiliser des robots ou scripts automatisés non autorisés pour accéder au service</li>
            </ul>
            <p className="mt-3">
              SASU PURAMA se réserve le droit de suspendre ou supprimer tout compte en violation de ces règles, sans préavis et sans remboursement dans les cas graves.
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-xl text-[var(--fg)] mb-4">
              5. Les 7 règles sacrées de KOSHA
            </h2>
            <p>KOSHA est construit sur 7 règles fondamentales qui ne peuvent être violées :</p>
            <ul className="mt-3 space-y-1.5 ml-4 list-disc">
              <li>Zéro publicité externe — uniquement pub interne entre utilisateurs</li>
              <li>Zéro toxicité — pas de likes négatifs, pas de comparaison, pas de FOMO</li>
              <li>Zéro manipulation — l&apos;IA explique chaque suggestion</li>
              <li>100% naturel — design pur, calme, espaces respirants</li>
              <li>Argent vivant — chaque euro a une trace, une mémoire, une conséquence</li>
              <li>Universalité radicale — sceptiques, démotivés, fatigués bienvenus</li>
              <li>Continuité de vie — le Fil de Vie ne s&apos;efface jamais</li>
            </ul>
          </section>

          <section>
            <h2 className="font-semibold text-xl text-[var(--fg)] mb-4">
              6. Propriété intellectuelle
            </h2>
            <p>
              <strong className="text-[var(--fg)]">Contenu de la plateforme :</strong> L&apos;ensemble du code, des interfaces, des marques, des logos et contenus de KOSHA restent la propriété exclusive de SASU PURAMA.
            </p>
            <p className="mt-3">
              <strong className="text-[var(--fg)]">Contenu utilisateur :</strong> Vous conservez la propriété des contenus que vous créez via KOSHA (cagnottes, publications). En publiant sur KOSHA, vous accordez à SASU PURAMA une licence limitée pour afficher ces contenus dans le cadre du service.
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-xl text-[var(--fg)] mb-4">
              7. Responsabilité limitée
            </h2>
            <p>
              KOSHA facilite l&apos;entraide financière et communautaire via des cagnottes. SASU PURAMA n&apos;est pas responsable de l&apos;utilisation des fonds collectés par les porteurs de projets.
            </p>
            <p className="mt-2">
              Les conseils générés par Aria sont fournis à titre indicatif et ne constituent pas un conseil professionnel (juridique, médical, financier, etc.). La responsabilité de SASU PURAMA est limitée au montant total des sommes versées par l&apos;utilisateur au cours des 12 derniers mois.
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-xl text-[var(--fg)] mb-4">
              8. Droit applicable et juridiction
            </h2>
            <p>
              Les présentes CGU sont soumises au droit français. En cas de litige, les parties s&apos;efforceront de trouver une solution amiable. À défaut, les tribunaux compétents seront ceux du ressort du Tribunal de Commerce de Besançon (France), sauf dispositions impératives contraires.
            </p>
            <p className="mt-2">
              Pour les consommateurs résidant dans l&apos;Union Européenne, les dispositions impératives de protection des consommateurs de votre pays de résidence s&apos;appliquent.
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-xl text-[var(--fg)] mb-4">
              9. Contact
            </h2>
            <p>
              Pour toute question relative aux présentes CGU : <a href="mailto:matiss.frasne@gmail.com" className="text-[var(--violet)] hover:underline">matiss.frasne@gmail.com</a>
            </p>
          </section>

        </div>
      </div>
    </div>
  )
}
