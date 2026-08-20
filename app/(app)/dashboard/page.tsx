import Link from "next/link";
import { ArrowRightIcon, BookOpenIcon, RefreshCcwIcon } from "lucide-react";
import { Mascot } from "@/components/ui/mascot";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { HikmaProgress } from "@/components/ui/hikma";
import { BodyLarge, BodyMedium, BodySmall, Caption, H1, H2 } from "@/components/ui/typography";
import { ActivityHistory, UpcomingReviews } from "@/components/learn/daily-activity";
import {
  getSurahCatalog,
  getSurahProgressByUser,
  getActiveLessonSessionResolved,
  getGlobalWordStats,
  getReviewDueCount,
  getQuranCoverage,
} from "@/lib/learning/queries";
import {
  getActivityDate,
  getActivityHistory,
  getDailyGoalProgress,
  getUpcomingReviewCounts,
  getUserSettings,
} from "@/lib/learning/activity";
import { createClient } from "@/lib/supabase/server";
import { recommendStartingSurah, type OnboardingProfile } from "@/lib/learning/onboarding";
import {
  getPersonalizedLearningCopy,
  getRecommendationReason,
} from "@/lib/learning/personalization";
import {
  selectActiveLearningPath,
  summarizeSurahProgress,
  type ActivePathSelection,
  type SurahSummary,
} from "@/lib/learning/active-path";
import {
  composeDailyPlan,
  getCoachLine,
  type DailyPlan,
} from "@/lib/learning/daily-plan";
import {
  composeWeeklySummary,
  formatWeeklySummary,
  type WeeklySummary,
} from "@/lib/learning/weekly-summary";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const client = await createClient();
  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user) return <DashboardAnon />;

  const settings = await getUserSettings(client, user.id);
  const catalog = await getSurahCatalog(client);
  const today = getActivityDate();
  const [goal, upcoming, history, progress, activeSession, globalWords, reviewDueCount, coverage] =
    await Promise.all([
      getDailyGoalProgress(client, user.id, settings, today),
      getUpcomingReviewCounts(client, user.id, 7),
      getActivityHistory(client, user.id, 30),
      getSurahProgressByUser(client, user.id),
      getActiveLessonSessionResolved(client, user.id),
      getGlobalWordStats(client, user.id),
      getReviewDueCount(client, user.id),
      getQuranCoverage(client, user.id),
    ]);

  // Préférences déclaratives uniquement — jamais un diagnostic de niveau.
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
  // Parcours actif : session réelle → progression réelle → recommandation → fallback.
  const selection = selectActiveLearningPath({
    progress,
    activeSession,
    recommendation: recommendation
      ? { surahNumber: recommendation.surahNumber, firstLessonSlug: recommendation.firstLessonSlug }
      : null,
    catalog,
  });
  const summary = summarizeSurahProgress(progress, catalog);
  const hasRealProgress = selection.kind === "active_session" || selection.kind === "in_progress";
  const firstVisit = summary.startedSurahs === 0 && summary.completedSurahs === 0 && !hasRealProgress;
  const allDone = summary.availableSurahs > 0 && summary.completedSurahs === summary.availableSurahs;

  // Daily Plan : composition pure des décisions déjà prises (aucune requête,
  // aucun recalcul pédagogique).
  const plan = composeDailyPlan({
    selection,
    goal,
    reviewDueCount,
    coveragePercent: coverage?.coveragePercent ?? null,
  });
  const coachLine = getCoachLine({ plan, profile, firstVisit });
  // Résumé hebdomadaire : dérivé des journaux déjà chargés (aucune requête).
  const weekly = composeWeeklySummary(history.days);

  const personalized = getPersonalizedLearningCopy(profile, { firstVisit, allDone });
  // La justification doit toujours correspondre à la sourate EFFECTIVEMENT
  // affichée (le parcours sélectionné), jamais à la recommandation brute.
  const recommendationReason =
    (selection.kind === "recommendation" || selection.kind === "fallback") &&
    selection.surahNumber != null
      ? getRecommendationReason(profile, { surahNumber: selection.surahNumber })
      : null;

  return (
    <DashboardMain
      selection={selection}
      summary={summary}
      upcoming={upcoming}
      history={history}
      wordsSeen={globalWords.wordsSeen}
      wordsMastered={globalWords.wordsMastered}
      avgMastery={globalWords.avgMastery}
      personalized={personalized}
      recommendationReason={recommendationReason}
      allDone={allDone}
      plan={plan}
      coachLine={coachLine}
      weekly={weekly}
    />
  );
}

function DashboardAnon() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col items-center gap-8 px-5 py-12 text-center sm:px-8 sm:py-16">
      <Mascot variant="welcome" size="lg" message="Bienvenue sur Hikma" />
      <div className="flex flex-col gap-3">
        <H1>Comprends le Coran, mot par mot.</H1>
        <BodyLarge className="text-text-secondary">
          Apprends le sens des mots, reconnais-les dans les versets et avance à ton rythme.
        </BodyLarge>
      </div>
      <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
        <Button render={<Link href="/learn/basmala" />} size="lg" className="w-full sm:w-auto">
          Commencer avec Al-Fatiha
        </Button>
        <Button render={<Link href="/login" />} size="lg" variant="outline" className="w-full sm:w-auto">
          Créer un compte
        </Button>
      </div>
    </main>
  );
}

function DashboardMain({
  selection,
  summary,
  upcoming,
  history,
  wordsSeen,
  wordsMastered,
  avgMastery,
  personalized,
  recommendationReason,
  allDone,
  plan,
  coachLine,
  weekly,
}: {
  selection: ActivePathSelection;
  summary: SurahSummary;
  upcoming: Array<{ date: string; dueCount: number }>;
  history: Awaited<ReturnType<typeof getActivityHistory>>;
  wordsSeen: number;
  wordsMastered: number;
  avgMastery: number | null;
  personalized: { greeting: string; opening: string };
  recommendationReason: string | null;
  allDone: boolean;
  plan: DailyPlan;
  coachLine: string;
  weekly: WeeklySummary;
}) {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-5 py-8 sm:px-8 sm:py-10 lg:gap-10">
      <header className="flex flex-col gap-2">
        <Caption className="text-primary-strong">Ta progression</Caption>
        <H1>{personalized.greeting}</H1>
        <BodyLarge className="max-w-2xl text-text-secondary">{personalized.opening}</BodyLarge>
      </header>

      <TodayCard plan={plan} coachLine={coachLine} context={recommendationReason} />

      <WeeklyCard weekly={weekly} />

      <section aria-label="Découvrir les sourates">
        <Card className="border-border-subtle bg-surface-elevated">
          <CardContent className="flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
            <div className="flex min-w-0 flex-col gap-1">
              <H2 className="text-lg">Découvrir les sourates</H2>
              <BodyMedium className="text-text-secondary">
                Explore les parcours disponibles et choisis ta prochaine sourate.
              </BodyMedium>
            </div>
            <Button render={<Link href="/surahs" />} variant="outline" className="shrink-0">
              Explorer
              <ArrowRightIcon aria-hidden="true" />
            </Button>
          </CardContent>
        </Card>
      </section>

      <section className="flex flex-col gap-5" aria-labelledby="path-title">
        <div className="flex items-end justify-between gap-4">
          <div className="flex flex-col gap-1">
            <Caption className="text-primary-strong">Progression</Caption>
            <H2 id="path-title">Tes sourates</H2>
          </div>
          <Caption>{summary.startedSurahs} commencée{summary.startedSurahs > 1 ? "s" : ""} · {summary.completedSurahs} terminée{summary.completedSurahs > 1 ? "s" : ""}</Caption>
        </div>
        <Card className="border-border-subtle bg-surface-elevated">
          <CardContent className="gap-5 p-6 sm:p-7">
            <HikmaProgress
              value={summary.totalLessons > 0 ? Math.round((summary.completedLessons / summary.totalLessons) * 100) : 0}
              label={`${summary.completedLessons} leçon${summary.completedLessons > 1 ? "s" : ""} terminée${summary.completedLessons > 1 ? "s" : ""}`}
              detail={`${summary.totalLessons} au total`}
            />
            <div className="flex flex-col gap-2 rounded-2xl bg-surface-subtle p-4">
              <Caption>Prochaine étape</Caption>
              <BodyMedium className="font-medium">
                {selection.lessonSlug ? selection.surahName ?? "Continuer" : allDone ? "Toutes les sourates disponibles sont terminées" : "Revoir tes mots"}
              </BodyMedium>
              <Caption>{allDone ? "Tu peux revoir tes parcours terminés." : "Le parcours actif est choisi par ta progression réelle."}</Caption>
            </div>
            <Button render={<Link href="/surahs" />} variant="outline" className="w-full sm:w-fit">Voir mes sourates<ArrowRightIcon aria-hidden="true" /></Button>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-5 lg:grid-cols-[0.85fr_1.15fr]" aria-label="Résumé personnel">
        <Card className="border-border-subtle bg-surface-elevated">
          <CardContent className="gap-5 p-6 sm:p-7">
            <H2>En quelques mots</H2>
            <div className="grid grid-cols-3 gap-4">
              <SummaryValue label="Mots étudiés" value={String(wordsSeen)} />
              <SummaryValue label="Mots maîtrisés" value={String(wordsMastered)} />
              <SummaryValue label="Maîtrise moyenne" value={avgMastery != null ? `${avgMastery}%` : "—"} />
            </div>
          </CardContent>
        </Card>
        <Card className="border-border-subtle bg-surface-elevated">
          <CardContent className="gap-5 p-6 sm:p-7">
            <div className="flex items-center justify-between gap-4">
              <div className="flex flex-col gap-1"><H2>Activité récente</H2><Caption>Les 30 derniers jours</Caption></div>
              <BodySmall className="text-text-secondary">{history.wordsStudied} mot{history.wordsStudied > 1 ? "s" : ""}</BodySmall>
            </div>
            <ActivityHistory days={history.days} />
          </CardContent>
        </Card>
      </section>

      <section className="flex flex-col gap-5" aria-labelledby="upcoming-title">
        <div className="flex flex-col gap-1">
          <Caption className="text-primary-strong">À venir</Caption>
          <H2 id="upcoming-title">Révisions à venir</H2>
        </div>
        <Card className="border-border-subtle bg-surface-elevated">
          <CardContent className="p-6 sm:p-7">
            <UpcomingReviews days={upcoming} />
          </CardContent>
        </Card>
      </section>
    </main>
  );
}

function SummaryValue({ label, value }: { label: string; value: string }) {
  return <div className="flex flex-col gap-1 rounded-xl bg-surface-subtle p-3"><BodyMedium className="text-xl font-semibold tabular-nums">{value}</BodyMedium><Caption>{label}</Caption></div>;
}

/**
 * Carte « Aujourd'hui » (Phase 38B consolidée en 39B) — l'UNIQUE conteneur de
 * l'action principale. Elle compose les décisions déjà prises (action, objectif,
 * révisions, couverture) sans recalcul, et porte le seul CTA primaire. La
 * révision n'y apparaît qu'en CTA secondaire (quand l'action principale est une
 * leçon et que des révisions sont dues).
 */
function TodayCard({
  plan,
  coachLine,
  context,
}: {
  plan: DailyPlan;
  coachLine: string;
  context: string | null;
}) {
  const goalUnit = plan.goal.type === "lessons" ? "leçons" : "mots";
  const shownContext = context ?? plan.action.context;
  return (
    <section aria-labelledby="today-title">
      <Card className="rounded-4xl border-primary/20 bg-surface-featured shadow-elevated">
        <CardContent className="flex flex-col gap-4 p-6 sm:p-7">
          <Caption className="text-primary-strong">Aujourd’hui</Caption>
          <H2 id="today-title" className="text-xl sm:text-2xl">{coachLine}</H2>
          {shownContext ? (
            <BodyMedium className="max-w-2xl text-text-secondary">{shownContext}</BodyMedium>
          ) : null}
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <BodyMedium className="tabular-nums">
              <span className="font-semibold">{plan.goal.current} / {plan.goal.target}</span>{" "}
              <span className="text-text-secondary">{goalUnit}</span>
            </BodyMedium>
            <BodyMedium className="text-text-secondary">
              <span className="font-semibold text-foreground tabular-nums">{plan.reviews.dueCount}</span>{" "}
              à réviser
            </BodyMedium>
            {plan.coverage.percent != null ? (
              <BodyMedium className="text-text-secondary">
                <span className="font-semibold text-foreground tabular-nums">≈ {plan.coverage.percent} %</span>{" "}
                du Coran compris
              </BodyMedium>
            ) : null}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {plan.action.href ? (
              <Button render={<Link href={plan.action.href} />} size="lg" className="w-full sm:w-auto">
                <BookOpenIcon aria-hidden="true" />
                {plan.action.label}
              </Button>
            ) : null}
            {plan.reviews.hasDue && plan.action.href?.startsWith("/learn") ? (
              <Button render={<Link href="/review" />} size="lg" variant="outline" className="w-full sm:w-auto">
                <RefreshCcwIcon aria-hidden="true" />
                Réviser maintenant
              </Button>
            ) : null}
          </div>
          <Button render={<Link href="/profile" />} variant="ghost" size="sm" className="w-fit">
            Ajuster mon rythme
          </Button>
        </CardContent>
      </Card>
    </section>
  );
}

/**
 * Carte « Cette semaine » (Phase 39B) — résumé descriptif dérivé des journaux
 * d'activité existants (mots · leçons · jours actifs). Aucune donnée inventée,
 * aucun score, aucune cible.
 */
function WeeklyCard({ weekly }: { weekly: WeeklySummary }) {
  return (
    <section aria-labelledby="week-title">
      <Card className="border-border-subtle bg-surface-elevated">
        <CardContent className="flex flex-col gap-2 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-7">
          <div className="flex flex-col gap-1">
            <Caption className="text-primary-strong">Cette semaine</Caption>
            <BodyLarge id="week-title" className="font-semibold tabular-nums">
              {formatWeeklySummary(weekly)}
            </BodyLarge>
          </div>
          <Caption className="text-text-secondary">
            {weekly.activeDays === 0
              ? "Tes premiers chiffres apparaîtront avec ta première leçon."
              : "7 derniers jours"}
          </Caption>
        </CardContent>
      </Card>
    </section>
  );
}
