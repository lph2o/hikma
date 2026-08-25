import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRightIcon } from "lucide-react";
import { getSurahAyahCoverage } from "@/lib/learning/queries";
import { getSurahCatalog } from "@/lib/learning/queries";
import { getSurahProgressByUser } from "@/lib/learning/queries";
import { computeCoveragePercent } from "@/lib/learning/coverage";
import { createClient } from "@/lib/supabase/server";
import { ArabicText } from "@/components/ui/arabic-text";
import { Button } from "@/components/ui/button";
import { BodySmall, Caption, BodyMedium } from "@/components/ui/typography";
import { HikmaProgress } from "@/components/ui/hikma";
import { AyahCoverage } from "@/components/surahs/ayah-coverage";

export const dynamic = "force-dynamic";

type Params = Promise<{ number: string }>;

type SurahRow = {
  id: string;
  number: number;
  name_arabic: string;
  name_transliteration: string;
  name_translation: string | null;
  ayah_count: number;
};

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { number } = await params;
  const surahNumber = parseInt(number, 10);
  if (isNaN(surahNumber) || surahNumber < 1 || surahNumber > 114) {
    return { title: "Sourate introuvable" };
  }
  try {
    const client = await createClient();
    const { data } = await client
      .from("surahs")
      .select("name_translation")
      .eq("number", surahNumber)
      .limit(1);
    const name =
      (data?.[0] as { name_translation: string | null } | undefined)
        ?.name_translation ?? `Sourate ${surahNumber}`;
    const title = `Sourate ${surahNumber} — ${name}`;
    return {
      title,
      description: `Découvre la sourate ${surahNumber} (${name}) : lis ses versets et apprends le sens de ses mots avec Hikma.`,
      openGraph: {
        title,
        description: `Lis les versets de la sourate ${surahNumber} (${name}) et apprends le sens de ses mots avec Hikma.`,
      },
      // Canonical explicite : résout contre metadataBase → URL absolue de prod.
      alternates: { canonical: `/surahs/${surahNumber}` },
    };
  } catch {
    return { title: `Sourate ${surahNumber}` };
  }
}

/** En-tête sourate (public) — partagé entre le mode visiteur et le mode connecté. */
function SurahTitle({ surah }: { surah: SurahRow }) {
  return (
    <div className="flex flex-col gap-2">
      <ArabicText scale="hero" className="text-primary-strong">
        {surah.name_arabic}
      </ArabicText>
      <div className="flex flex-col gap-0.5">
        <BodyMedium className="font-semibold">
          {surah.name_transliteration}
        </BodyMedium>
        <Caption className="text-text-secondary">
          {surah.name_translation
            ? `Sourate ${surah.number} — ${surah.name_translation}`
            : `Sourate ${surah.number}`}
        </Caption>
      </div>
    </div>
  );
}

export default async function SurahDetailPage({
  params,
}: {
  params: Params;
}) {
  const { number } = await params;
  const surahNumber = parseInt(number, 10);

  // Validation du numéro.
  if (isNaN(surahNumber) || surahNumber < 1 || surahNumber > 114) {
    notFound();
  }

  const client = await createClient();
  const {
    data: { user },
  } = await client.auth.getUser();

  // Récupère métadonnées de la sourate.
  const catalog = await getSurahCatalog(client);
  const catalogItem = catalog.find((c) => c.surahNumber === surahNumber);
  if (!catalogItem) notFound();

  // Récupère l'ID interne de la sourate.
  const { data: surahRows, error: surahError } = await client
    .from("surahs")
    .select("id, number, name_arabic, name_transliteration, name_translation, ayah_count")
    .eq("number", surahNumber)
    .limit(1);
  if (surahError || !surahRows?.length) notFound();
  const surah = surahRows[0] as SurahRow;

  // ---- Mode visiteur (Phase 89E, R-011) : contenu public uniquement ----
  // Pas de progression, pas de couverture utilisateur, pas de statuts par mot.
  if (!user) {
    const { data: ayahRows, error: ayahError } = await client
      .from("ayahs")
      .select("id, ayah_number, text_uthmani")
      .eq("surah_id", surah.id)
      .order("ayah_number", { ascending: true });
    if (ayahError) throw new Error(`ayahs : ${ayahError.message}`);
    const ayahs = (ayahRows ?? []) as Array<{
      id: string;
      ayah_number: number;
      text_uthmani: string;
    }>;

    return (
      <main className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-5 py-8 sm:px-8 sm:py-10">
        <header className="flex flex-col gap-4">
          <Link
            href="/surahs"
            className="inline-flex w-fit items-center gap-1.5 text-sm text-muted-foreground hover:text-primary-strong transition-colors"
          >
            <ArrowRightIcon className="size-3.5 rtl:rotate-180" aria-hidden="true" />
            Toutes les sourates
          </Link>

          <SurahTitle surah={surah} />

          {/* Bandeau visiteur — contenu public, progression non enregistrée */}
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-hikma-gold/40 bg-hikma-gold/8 px-5 py-4 text-center sm:flex-row sm:justify-between sm:text-left">
            <div className="flex flex-col gap-1">
              <BodySmall className="font-semibold text-text-primary">
                Découverte libre
              </BodySmall>
              <BodySmall className="text-text-secondary">
                Tu consultes cette sourate sans compte : aucun progrès n&apos;est
                enregistré. Crée un compte pour suivre ta progression.
              </BodySmall>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              {catalogItem.firstLessonSlug ? (
                <Button
                  render={<Link href={`/learn/${catalogItem.firstLessonSlug}`} />}
                  size="sm"
                  className="shrink-0 rounded-full"
                >
                  Découvrir la première leçon
                </Button>
              ) : null}
              <Button
                render={<Link href="/login" />}
                variant="outline"
                size="sm"
                className="shrink-0 rounded-full"
              >
                Se connecter
              </Button>
            </div>
          </div>
        </header>

        {/* Versets (texte coranique public) */}
        <div
          className="flex flex-col gap-8"
          role="list"
          aria-label={`Versets de ${surah.name_translation ?? `Sourate ${surah.number}`}`}
        >
          {ayahs.map((ayah) => (
            <div key={ayah.id} role="listitem" className="flex flex-col gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface-elevated text-sm font-semibold tabular-nums text-primary-strong">
                {ayah.ayah_number}
              </span>
              <ArabicText scale="verse" className="leading-loose">
                {ayah.text_uthmani}
              </ArabicText>
            </div>
          ))}
          {ayahs.length === 0 && (
            <div className="flex flex-col items-center gap-3 py-12 text-center">
              <Caption className="text-text-secondary">
                Aucune donnée disponible pour cette sourate.
              </Caption>
            </div>
          )}
        </div>
      </main>
    );
  }

  // ---- Mode connecté : couverture lexicale et progression utilisateur ----
  const ayahs = await getSurahAyahCoverage(client, user.id, surah.id);

  // Statistiques globales de la sourate.
  const totalOccurrences = ayahs.reduce(
    (sum, a) => sum + a.totalOccurrences,
    0,
  );
  const coveredOccurrences = ayahs.reduce(
    (sum, a) => sum + a.coveredOccurrences,
    0,
  );
  const surahCoveragePercent = computeCoveragePercent(
    coveredOccurrences,
    totalOccurrences,
  );

  // Progression des leçons (pour le CTA).
  const progressRows = await getSurahProgressByUser(client, user.id);
  const progress = progressRows.find((p) => p.surahNumber === surahNumber);
  const lessonSlug = progress?.nextLessonSlug ?? catalogItem.firstLessonSlug;
  const hasProgress =
    progress != null && progress.status !== "not_started";

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-5 py-8 sm:px-8 sm:py-10">
      {/* Header sourate */}
      <header className="flex flex-col gap-4">
        <Link
          href="/surahs"
          className="inline-flex w-fit items-center gap-1.5 text-sm text-muted-foreground hover:text-primary-strong transition-colors"
        >
          <ArrowRightIcon className="size-3.5 rtl:rotate-180" aria-hidden="true" />
          Toutes les sourates
        </Link>

        <SurahTitle surah={surah} />

        {/* Couverture globale de la sourate */}
        <div className="flex flex-col gap-3 rounded-2xl border border-border-subtle bg-surface-elevated p-5 sm:p-6">
          <Caption className="text-primary-strong">
            Couverture lexicale
          </Caption>
          <div className="flex items-center gap-4">
            <HikmaProgress
              value={surahCoveragePercent}
              label={`${surahCoveragePercent} %`}
            />
            <Caption className="shrink-0 tabular-nums text-text-secondary">
              {coveredOccurrences}/{totalOccurrences} occurrences
            </Caption>
          </div>
          {coveredOccurrences === 0 && (
            <Caption className="text-text-secondary">
              Pas encore de mots compris dans cette sourate.
            </Caption>
          )}
        </div>

        {/* CTA vers la leçon si progression entamée ou dispo */}
        {lessonSlug && !hasProgress && (
          <Button
            render={<Link href={`/learn/${lessonSlug}`} />}
            variant="outline"
            className="w-full sm:w-fit"
          >
            Commencer cette sourate
            <ArrowRightIcon aria-hidden="true" />
          </Button>
        )}
        {lessonSlug && hasProgress && (
          <Button
            render={<Link href={`/learn/${lessonSlug}`} />}
            variant="default"
            className="w-full sm:w-fit"
          >
            {progress?.activeLessonSlug ? "Reprendre" : "Continuer"}
            <ArrowRightIcon aria-hidden="true" />
          </Button>
        )}
      </header>

      {/* Liste des ayahs */}
      <div
        className="flex flex-col gap-8"
        role="list"
        aria-label={`Versets de ${surah.name_translation ?? `Sourate ${surah.number}`}`}
      >
        {ayahs.map((ayah) => (
          <div key={ayah.ayahId} role="listitem">
            <AyahCoverage ayah={ayah} />
          </div>
        ))}
        {ayahs.length === 0 && (
          <div className="flex flex-col items-center gap-3 py-12 text-center">
            <Caption className="text-text-secondary">
              Aucune donnée disponible pour cette sourate.
            </Caption>
          </div>
        )}
      </div>
    </main>
  );
}
