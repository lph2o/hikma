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
import { Caption, BodyMedium } from "@/components/ui/typography";
import { HikmaProgress } from "@/components/ui/hikma";
import { AyahCoverage } from "@/components/surahs/ayah-coverage";

export const dynamic = "force-dynamic";

type Params = Promise<{ number: string }>;

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
  const { data: { user } } = await client.auth.getUser();
  if (!user) notFound();

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
  const surah = surahRows[0] as {
    id: string;
    number: number;
    name_arabic: string;
    name_transliteration: string;
    name_translation: string | null;
    ayah_count: number;
  };

  // Couverture lexicale des ayahs.
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