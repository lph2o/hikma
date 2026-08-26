import { LegalDoc } from "@/components/app/legal-doc";
import { H2, BodyMedium, BodySmall } from "@/components/ui/typography";

export const metadata = {
  title: "Conditions d'utilisation — Hikma",
  description:
    "Conditions d'utilisation de Hikma : compte, contenu, usage acceptable et limites de responsabilité.",
  alternates: { canonical: "/terms" },
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

export default function TermsPage() {
  return (
    <LegalDoc title="Conditions d'utilisation" updatedAt="25 août 2026">
      <BodyMedium className="text-text-secondary">
        En utilisant Hikma, vous acceptez les présentes conditions.
      </BodyMedium>

      <Section title="Le service">
        <BodySmall>
          Hikma est un outil pédagogique d&apos;apprentissage du vocabulaire du
          Coran à partir des formes réellement présentes dans le texte coranique.
          Le service est fourni « tel quel », dans un but éducatif.
        </BodySmall>
      </Section>

      <Section title="Compte">
        <BodySmall>
          La création d&apos;un compte est nécessaire pour enregistrer votre
          progression. Vous êtes responsable de la confidentialité de vos
          identifiants. Le partage de compte ou la création de comptes multiples
          pour contourner des limites n&apos;est pas autorisé.
        </BodySmall>
      </Section>

      <Section title="Contenu et propriété intellectuelle">
        <BodySmall>
          Le texte coranique est reproduit à des fins éducatives (texte uthmani,
          base Tanzil). Les traductions appartiennent à leurs traducteurs
          respectifs et sont affichées à des fins d&apos;apprentissage. Le
          lexique éditorial Hikma est une production originale du projet.
        </BodySmall>
      </Section>

      <Section title="Usage acceptable">
        <BodySmall>
          Vous pouvez utiliser Hikma pour votre apprentissage personnel. Il est
          interdit de redistribuer, revendre ou réutiliser commercialement les
          contenus (texte, traductions, audio, lexique) sans autorisation
          préalable, conformément aux licences de chaque source.
        </BodySmall>
      </Section>

      <Section title="Aucun conseil">
        <BodySmall>
          Hikma est un outil d&apos;apprentissage linguistique. Il ne fournit
          aucun conseil religieux, juridique ou médical.
        </BodySmall>
      </Section>

      <Section title="Limitation de responsabilité">
        <BodySmall>
          Hikma est fourni sans garantie d&apos;exactitude ou de disponibilité.
          Dans toute la mesure permise par la loi, le projet ne saurait être tenu
          responsable des dommages indirects liés à l&apos;utilisation du
          service.
        </BodySmall>
      </Section>

      <Section title="Modification et résiliation">
        <BodySmall>
          Nous pouvons faire évoluer ces conditions ; la version en vigueur est
          toujours publiée sur cette page. Nous pouvons suspendre un compte en
          cas de violation manifeste des présentes conditions.
        </BodySmall>
      </Section>
    </LegalDoc>
  );
}
