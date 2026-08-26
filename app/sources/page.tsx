import { LegalDoc } from "@/components/app/legal-doc";
import { H2, BodyMedium, BodySmall, Caption } from "@/components/ui/typography";

export const metadata = {
  title: "Sources et attributions — Hikma",
  description:
    "Sources du texte coranique, des traductions, du lexique et des récitations audio utilisés par Hikma, avec leurs licences.",
  robots: { index: false, follow: false },
};

type SourceRow = {
  name: string;
  role: string;
  license: string;
  status: "OK" | "NOT_VERIFIED" | "REVIEW_REQUIRED";
};

const SOURCES: SourceRow[] = [
  {
    name: "Texte coranique (uthmani)",
    role: "Texte des versets affiché dans les leçons et les pages de sourates.",
    license:
      "Texte uthmani basé sur Tanzil (libre de droits), servi via Quran.com API v4.",
    status: "OK",
  },
  {
    name: "Traduction française — Muhammad Hamidullah (resource 31)",
    role: "Traduction de référence des versets (FR).",
    license: "Droits des traducteurs respectifs ; usage pédagogique via Quran.com API.",
    status: "REVIEW_REQUIRED",
  },
  {
    name: "Traduction française — Kazimirski (1869, resource 9001)",
    role: "Traduction historique de contrôle éditorial (FR).",
    license: "Domaine public (auteur décédé en 1887) — transcription Wikisource FR.",
    status: "OK",
  },
  {
    name: "Traduction anglaise — Sahih International (resource 20)",
    role: "Corroboration inter-langues dans la chaîne lexicale.",
    license: "Droits des traducteurs respectifs ; usage pédagogique via Quran.com API.",
    status: "REVIEW_REQUIRED",
  },
  {
    name: "Traduction italienne — Piccardo (resource 153)",
    role: "Corroboration inter-langues dans la chaîne lexicale.",
    license: "Droits du traducteur ; usage pédagogique via Quran.com API.",
    status: "REVIEW_REQUIRED",
  },
  {
    name: "MASAQ — données linguistiques",
    role: "Données morphologiques/lexicales de base (Majdi Sawalha, University of Jordan).",
    license: "CC BY 4.0 — DOI 10.17632/9yvrzxktmr.2. Attribution : Sawalha (2024), Mendeley Data.",
    status: "OK",
  },
  {
    name: "Lexique éditorial Hikma",
    role: "Gloses françaises et curriculum (production interne, validation humaine).",
    license: "Données originales Hikma — production interne.",
    status: "OK",
  },
  {
    name: "Récitations audio des versets — Al Quran Cloud",
    role: "Lecture audio des versets (récitateur par défaut : Al-Afasy).",
    license:
      "Streaming/embedding autorisé pour usage éducatif (cdn.islamic.network).",
    status: "NOT_VERIFIED",
  },
  {
    name: "Audio mot-à-mot — Hugging Face (zaibihassan)",
    role: "Lecture mot par mot (style Muallim).",
    license:
      "Apache-2.0 déclaré ; provenance des enregistrements non divulguée (LEGAL_STATUS REVIEW_REQUIRED).",
    status: "REVIEW_REQUIRED",
  },
];

function StatusBadge({ status }: { status: SourceRow["status"] }) {
  const styles: Record<SourceRow["status"], string> = {
    OK: "bg-hikma-teal-100 text-hikma-teal-800",
    REVIEW_REQUIRED: "bg-hikma-gold/20 text-hikma-gold-700",
    NOT_VERIFIED: "bg-surface-elevated text-text-secondary",
  };
  const labels: Record<SourceRow["status"], string> = {
    OK: "Vérifié",
    REVIEW_REQUIRED: "À revoir",
    NOT_VERIFIED: "Non vérifié",
  };
  return (
    <span
      className={`inline-flex w-fit rounded-full px-2.5 py-0.5 text-xs font-semibold ${styles[status]}`}
    >
      {labels[status]}
    </span>
  );
}

export default function SourcesPage() {
  return (
    <LegalDoc title="Sources et attributions" updatedAt="25 août 2026">
      <BodyMedium className="text-text-secondary">
        Hikma s&apos;appuie sur des sources publiques et documentées. Cette page
        détaille chaque source et son statut juridique, sans rien affirmer qui
        n&apos;ait été vérifié.
      </BodyMedium>

      <div className="flex flex-col gap-4">
        {SOURCES.map((s) => (
          <div
            key={s.name}
            className="flex flex-col gap-2 rounded-2xl border border-border-subtle bg-surface-elevated/50 p-5"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Caption className="font-semibold text-text-primary">{s.name}</Caption>
              <StatusBadge status={s.status} />
            </div>
            <BodySmall className="text-text-secondary">{s.role}</BodySmall>
            <BodySmall className="text-text-secondary">{s.license}</BodySmall>
          </div>
        ))}
      </div>

      <section className="flex flex-col gap-3">
        <H2>Note sur l&apos;audio</H2>
        <BodySmall className="text-text-secondary">
          Le statut <strong>« Non vérifié »</strong> pour les récitations
          d&apos;Al Quran Cloud est volontaire : le streaming éducatif est
          autorisé, mais l&apos;utilisation commerciale (monétisation) dépend des
          droits des récitateurs, qui n&apos;ont pas été confirmés par écrit.
          Avant toute mise en ligne commerciale, cette licence doit être
          confirmée auprès du fournisseur ou le récitateur remplacé.
        </BodySmall>
      </section>
    </LegalDoc>
  );
}
