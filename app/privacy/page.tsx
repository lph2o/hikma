import { LegalDoc } from "@/components/app/legal-doc";
import { H2, BodyMedium, BodySmall } from "@/components/ui/typography";

export const metadata = {
  title: "Confidentialité — Hikma",
  description:
    "Politique de confidentialité de Hikma : quelles données sont collectées, comment elles sont stockées et quels sont vos droits.",
  alternates: { canonical: "/privacy" },
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <H2>{title}</H2>
      <div className="flex flex-col gap-3 text-text-secondary">
        {children}
      </div>
    </section>
  );
}

export default function PrivacyPage() {
  return (
    <LegalDoc title="Politique de confidentialité" updatedAt="25 août 2026">
      <BodyMedium className="text-text-secondary">
        Hikma est une application pédagogique d&apos;apprentissage du vocabulaire
        coranique. Cette politique décrit, de façon honnête et simple, les données
        que nous traitons et pourquoi.
      </BodyMedium>

      <Section title="Données que nous collectons">
        <BodySmall>
          <strong>Compte</strong> — adresse e-mail et mot de passe (stocké de
          façon chiffrée par notre fournisseur d&apos;authentification, jamais en
          clair).
        </BodySmall>
        <BodySmall>
          <strong>Préférences</strong> — sourate préférée, objectif quotidien,
          fuseau horaire, choix d&apos;onboarding.
        </BodySmall>
        <BodySmall>
          <strong>Progression pédagogique</strong> — leçons suivies, résultats
          d&apos;exercices, mots compris, révisions planifiées (SRS), série de
          jours (streak) et activité.
        </BodySmall>
      </Section>

      <Section title="Stockage et hébergement">
        <BodySmall>
          Vos données sont hébergées chez <strong>Supabase</strong> (base de
          données et authentification), protégées par des règles d&apos;accès
          qui n&apos;autorisent que vous-même à lire vos propres données. Les
          échanges sont chiffrés en transit (HTTPS).
        </BodySmall>
      </Section>

      <Section title="Cookies">
        <BodySmall>
          Nous utilisons uniquement le <strong>cookie de session</strong>{" "}
          nécessaire à votre connexion (fourni par notre prestataire
          d&apos;authentification). Aucun cookie publicitaire, aucun traqueur
          tiers, aucune analytics actuellement.
        </BodySmall>
      </Section>

      <Section title="Notice de confidentialité">
        <BodySmall>
          À la première visite, une notice informative vous indique cette
          situation. Pour ne pas vous la réafficher, nous mémorisons
          <strong> localement sur votre appareil</strong> (localStorage,
          clé <code>hikma:consent:v1</code>) que vous l&apos;avez vue. Ceci
          n&apos;est pas un consentement publicitaire : aucune donnée n&apos;est
          envoyée, aucun cookie supplémentaire n&apos;est déposé, et la notice
          réapparaîtra si notre politique évolue (versionnage).
        </BodySmall>
      </Section>

      <Section title="Services tiers">
        <BodySmall>
          <strong>Supabase</strong> (authentification + base de données) ;
          <strong> CDN de récitations</strong> (islamic.network) pour la lecture
          audio des versets — aucune donnée personnelle n&apos;y est transmise.
          Hikma n&apos;utilise actuellement <strong>aucun outil d&apos;analyse
          ou de statistiques</strong>.
        </BodySmall>
      </Section>

      <Section title="Conservation et suppression">
        <BodySmall>
          Vos données sont conservées tant que votre compte existe. Pour
          supprimer votre compte et l&apos;ensemble de vos données, écrivez-nous
          via le dépôt GitHub du projet (section Issues) — le traitement de la
          demande inclut la suppression définitive de vos données.
        </BodySmall>
      </Section>

      <Section title="Vos droits">
        <BodySmall>
          Vous pouvez à tout moment demander l&apos;accès, la rectification ou
          la suppression de vos données, ainsi que leur portabilité. Contact :
          issues du dépôt GitHub <code>lph2o/hikma</code>.
        </BodySmall>
      </Section>
    </LegalDoc>
  );
}
