import Link from "next/link";
import { ArrowRightIcon, CheckCircle2Icon, LockKeyholeIcon } from "lucide-react";
import { ArabicText } from "@/components/ui/arabic-text";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { HikmaProgress } from "@/components/ui/hikma";
import { Mascot } from "@/components/ui/mascot";
import { BodyLarge, BodyMedium, Caption, H1, H2 } from "@/components/ui/typography";
import {
  getSurahCatalog,
  getSurahProgressByUser,
  type SurahCatalogItem,
} from "@/lib/learning/queries";
import { getUserSettings } from "@/lib/learning/activity";
import { recommendStartingSurah, type OnboardingProfile } from "@/lib/learning/onboarding";
import { getDailyDurationLabel, getRecommendationReason } from "@/lib/learning/personalization";
import type { SurahProgress } from "@/lib/learning/surah-progress";
import {
  getSurahContinueEncouragement,
  getSurahHeroCopy,
} from "@/lib/learning/surah-progress-copy";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

type ProgressEntry = { item: SurahCatalogItem; progress: SurahProgress | null };

export default async function SurahsPage() {
  const client = await createClient();
  const catalog = await getSurahCatalog(client);
  const { data: { user } } = await client.auth.getUser();
  const settings = user ? await getUserSettings(client, user.id) : null;
  const progressRows = user ? await getSurahProgressByUser(client, user.id) : [];
  const progressBySurah = new Map(progressRows.map((p) => [p.surahNumber, p]));

  const profile: OnboardingProfile = {
    displayName: settings?.display_name ?? null,
    learningGoal: settings?.learning_goal ?? null,
    arabicReadingLevel: settings?.arabic_reading_level ?? null,
    quranFamiliarity: settings?.quran_familiarity ?? null,
    dailyDuration: settings?.daily_duration ?? null,
    learningPace: settings?.learning_pace ?? null,
    preferredSurahNumber: settings?.preferred_surah_number ?? null,
  };
  const recommendation = recommendStartingSurah(profile, catalog);
  const recommendationReason = getRecommendationReason(profile, recommendation);
  const durationLabel = getDailyDurationLabel(profile.dailyDuration);

  const available = catalog.filter((c) => c.state === "READY" || c.state === "REFERENCE");
  const preparing = catalog.filter((c) => c.state === "IN_PREPARATION");

  const withProgress = (items: SurahCatalogItem[]): ProgressEntry[] =>
    items.map((item) => ({ item, progress: progressBySurah.get(item.surahNumber) ?? null }));

  const inProgress = withProgress(available)
    .filter(({ progress }) => progress?.status === "in_progress")
    .sort((a, b) => {
      // Session active d'abord, puis progression la plus avancée, puis ordre stable.
      const aActive = a.progress?.activeLessonSlug != null ? 1 : 0;
      const bActive = b.progress?.activeLessonSlug != null ? 1 : 0;
      if (aActive !== bActive) return bActive - aActive;
      const aDone = a.progress?.completedLessons ?? 0;
      const bDone = b.progress?.completedLessons ?? 0;
      if (aDone !== bDone) return bDone - aDone;
      return a.item.surahNumber - b.item.surahNumber;
    });

  const featured = inProgress[0] ?? null;
  const restInProgress = featured ? inProgress.slice(1) : [];

  const notStarted = withProgress(available)
    .filter(({ progress }) => progress == null || progress.status === "not_started")
    .sort((a, b) => a.item.surahNumber - b.item.surahNumber);

  const completed = withProgress(available)
    .filter(({ progress }) => progress?.status === "completed")
    .sort((a, b) => a.item.surahNumber - b.item.surahNumber);

  // Résumé réel du hero (jamais de préférence ni d'IN_PREPARATION compté).
  const hero = getSurahHeroCopy({
    startedCount: inProgress.length,
    completedCount: completed.length,
    totalAvailable: available.length,
  });

  // La recommandation de découverte n'est montrée que si elle est réellement
  // `not_started` : une sourate déjà commencée ou terminée n'est pas « à découvrir ».
  const recommendationProgress = recommendation
    ? (progressBySurah.get(recommendation.surahNumber) ?? null)
    : null;
  const showRecommendation =
    !featured &&
    recommendation != null &&
    (recommendationProgress == null || recommendationProgress.status === "not_started");

  // La recommandation mise en avant ne doit pas être dupliquée dans « Commencer ».
  const featuredRecommendationNumber = showRecommendation ? recommendation!.surahNumber : null;
  const commencer = notStarted.filter(({ item }) => item.surahNumber !== featuredRecommendationNumber);

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-10 px-5 py-8 sm:px-8 sm:py-10 lg:gap-12">
      <header className="overflow-hidden rounded-4xl border border-hikma-gold/25 bg-[radial-gradient(circle_at_85%_20%,color-mix(in_srgb,var(--hikma-gold)_12%,transparent),transparent_48%),var(--surface-featured)] p-6 shadow-card sm:p-10">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex max-w-2xl flex-col gap-2">
            <Caption className="text-primary-strong">Découvrir</Caption>
            <H1>{hero.title}</H1>
            <BodyLarge className="text-text-secondary">{hero.subtitle}</BodyLarge>
            {hero.footnote ? <Caption className="text-hikma-gold-muted">{hero.footnote}</Caption> : null}
          </div>
          <Mascot variant="learn" size="lg" className="hidden shrink-0 sm:flex" />
        </div>
      </header>

      {featured ? (
        <section className="flex flex-col gap-4" aria-labelledby="resume-heading">
          <div className="flex flex-col gap-1">
            <Caption className="text-primary-strong">
              {featured.progress?.activeLessonSlug
                ? "Reprendre ton apprentissage"
                : "Continuer ton parcours"}
            </Caption>
            <H2 id="resume-heading">
              {featured.progress?.activeLessonSlug
                ? `Tu étais en train d’apprendre dans ${featured.item.nameTransliteration}.`
                : "Reprends où tu en es"}
            </H2>
          </div>
          <SurahCard item={featured.item} progress={featured.progress} featured />
        </section>
      ) : showRecommendation && recommendation ? (
        <section className="flex flex-col gap-4" aria-labelledby="recommendation-heading">
          <div className="flex flex-col gap-1">
            <Caption className="text-hikma-gold-muted">Pour toi</Caption>
            <H2 id="recommendation-heading">Recommandée pour toi</H2>
          </div>
          <SurahCard
            item={recommendation}
            progress={recommendationProgress}
            featured
            reason={recommendationReason}
            durationLabel={durationLabel}
          />
        </section>
      ) : null}

      {restInProgress.length > 0 ? (
        <section className="flex flex-col gap-5" aria-labelledby="in-progress-heading">
          <div className="flex flex-col gap-1">
            <Caption className="text-primary-strong">Continuer</Caption>
            <H2 id="in-progress-heading">Tes parcours en cours</H2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {restInProgress.map(({ item, progress }) => (
              <SurahCard key={item.surahNumber} item={item} progress={progress} />
            ))}
          </div>
        </section>
      ) : null}

      {commencer.length > 0 ? (
        <section className="flex flex-col gap-5" aria-labelledby="available-heading">
          <div className="flex flex-col gap-1">
            <Caption className="text-primary-strong">Toutes les sourates disponibles</Caption>
            <H2 id="available-heading">Prêtes à apprendre</H2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {commencer.map(({ item, progress }) => (
              <SurahCard key={item.surahNumber} item={item} progress={progress} />
            ))}
          </div>
        </section>
      ) : null}

      {completed.length > 0 ? (
        <section className="flex flex-col gap-5" aria-labelledby="completed-heading">
          <div className="flex flex-col gap-1">
            <Caption className="text-hikma-gold-muted">Terminées</Caption>
            <H2 id="completed-heading">Parcours terminés</H2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {completed.map(({ item, progress }) => (
              <SurahCard key={item.surahNumber} item={item} progress={progress} />
            ))}
          </div>
        </section>
      ) : null}

      {preparing.length > 0 ? (
        <section className="flex flex-col gap-5" aria-labelledby="preparing-heading">
          <div className="flex flex-col gap-1">
            <Caption className="text-text-secondary">En préparation</Caption>
            <H2 id="preparing-heading">Bientôt disponibles</H2>
            <BodyMedium className="max-w-2xl text-text-secondary">
              Ces sourates existent déjà. Leur vocabulaire français est en cours de
              consolidation avant d’être proposé comme parcours complet.
            </BodyMedium>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {preparing.map((item) => <SurahCard key={item.surahNumber} item={item} />)}
          </div>
        </section>
      ) : null}
    </main>
  );
}

function SurahCard({
  item,
  progress = null,
  featured = false,
  reason = null,
  durationLabel = null,
}: {
  item: SurahCatalogItem;
  progress?: SurahProgress | null;
  featured?: boolean;
  reason?: string | null;
  durationLabel?: string | null;
}) {
  const isAvailable = item.state === "READY" || item.state === "REFERENCE";
  const status = isAvailable ? (progress?.status ?? "not_started") : null;

  let ctaHref: string | null = null;
  let ctaLabel: string | null = null;
  if (isAvailable) {
    if (status === "completed") {
      ctaLabel = "Revoir";
      ctaHref = item.firstLessonSlug ? `/learn/${item.firstLessonSlug}` : null;
    } else if (status === "in_progress") {
      ctaLabel = progress?.activeLessonSlug ? "Reprendre" : "Continuer";
      ctaHref = progress?.nextLessonSlug
        ? `/learn/${progress.nextLessonSlug}`
        : item.firstLessonSlug
          ? `/learn/${item.firstLessonSlug}`
          : null;
    } else {
      ctaLabel = "Commencer";
      ctaHref = item.firstLessonSlug ? `/learn/${item.firstLessonSlug}` : null;
    }
  }

  const percent =
    progress && progress.totalLessons > 0
      ? Math.round((progress.completedLessons / progress.totalLessons) * 100)
      : 0;

  return (
    <Card
      className={cn(
        "overflow-hidden rounded-3xl transition-shadow",
        featured && "border-hikma-gold/40 bg-surface-featured shadow-elevated",
        isAvailable
          ? "border-border-subtle bg-surface-elevated hover:shadow-elevated"
          : "border-border-subtle bg-surface-subtle",
      )}
    >
      <CardContent className="gap-4 p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 flex-col gap-2">
            <ArabicText scale="word" className="text-primary-strong">
              {item.nameArabic}
            </ArabicText>
            <div className="flex flex-col gap-0.5">
              <BodyMedium className="font-semibold leading-snug">
                {item.nameTransliteration}
              </BodyMedium>
              <Caption className="text-text-secondary">Sourate {item.surahNumber}</Caption>
            </div>
          </div>
          {status === "completed" ? (
            <span className="mt-1 flex shrink-0 items-center gap-1.5">
              <CheckCircle2Icon className="size-5 text-success-text" aria-hidden="true" />
              <Caption className="font-semibold text-success-text">Terminée</Caption>
            </span>
          ) : !isAvailable ? (
            <LockKeyholeIcon className="mt-1 size-5 shrink-0 text-text-secondary/60" aria-hidden="true" />
          ) : null}
        </div>

        {reason ? <BodyMedium className="text-text-secondary">{reason}</BodyMedium> : null}
        {durationLabel ? <Caption className="text-text-secondary">{durationLabel}</Caption> : null}

        {isAvailable && progress && status !== "not_started" ? (
          <>
            <HikmaProgress
              value={percent}
              label={`${progress.completedLessons} / ${progress.totalLessons} leçons`}
            />
            {status === "in_progress" ? (
              <Caption className="text-text-secondary">
                {getSurahContinueEncouragement(progress.completedLessons, progress.totalLessons)}
              </Caption>
            ) : null}
          </>
        ) : (
          <Caption className="text-text-secondary">
            {item.lessonCount} leçon{item.lessonCount > 1 ? "s" : ""}
          </Caption>
        )}

        {isAvailable ? (
          <>
            {ctaHref ? (
              <Button
                render={<Link href={ctaHref} />}
                variant={status === "in_progress" ? "default" : "outline"}
                className="w-full"
              >
                {ctaLabel}
                <ArrowRightIcon aria-hidden="true" />
              </Button>
            ) : null}
            {status !== "not_started" && (
              <Link
                href={`/surahs/${item.surahNumber}`}
                className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-primary-strong"
              >
                Voir les versets
                <ArrowRightIcon className="size-3.5" aria-hidden="true" />
              </Link>
            )}
          </>
        ) : (
          <div
            className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm text-text-secondary"
            aria-disabled="true"
          >
            <Caption className="text-text-secondary">Bientôt disponible</Caption>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
