import Link from "next/link";
import { ArrowRightIcon, LockKeyholeIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Mascot } from "@/components/ui/mascot";
import { BodyLarge, BodyMedium, Caption, H1, H2 } from "@/components/ui/typography";
import { Button } from "@/components/ui/button";
import { HikmaProgress } from "@/components/ui/hikma";
import { HikmaLessonCard } from "@/components/learn/hikma-lesson-card";
import { validateCurriculum } from "@/lib/learning";
import {
  getLearningContext,
  getSurahCatalog,
  getSurahProgressByUser,
  getActiveLessonSessionResolved,
} from "@/lib/learning/queries";
import { getUserSettings } from "@/lib/learning/activity";
import { createClient } from "@/lib/supabase/server";
import { recommendStartingSurah, type OnboardingProfile } from "@/lib/learning/onboarding";
import { selectActiveLearningPath } from "@/lib/learning/active-path";

export const dynamic = "force-dynamic";

export default async function LearnPage() {
  const client = await createClient();
  const {
    data: { user },
  } = await client.auth.getUser();

  // Parcours actif = session réelle → progression réelle → recommandation → fallback.
  // `/learn` ne suppose PLUS quran-vocabulary : il suit la progression réelle.
  let activeSurahNumber: number | null = null;
  if (user) {
    const [settings, catalog, progress, activeSession] = await Promise.all([
      getUserSettings(client, user.id),
      getSurahCatalog(client),
      getSurahProgressByUser(client, user.id),
      getActiveLessonSessionResolved(client, user.id),
    ]);
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
    const selection = selectActiveLearningPath({
      progress,
      activeSession,
      recommendation: recommendation
        ? { surahNumber: recommendation.surahNumber, firstLessonSlug: recommendation.firstLessonSlug }
        : null,
      catalog,
    });
    activeSurahNumber = selection.surahNumber;
  }

  const ctx = await getLearningContext(
    client,
    user?.id ?? null,
    activeSurahNumber != null ? { surahNumber: activeSurahNumber } : {},
  );

  if (!ctx.curriculum) {
    return (
      <main className="mx-auto flex w-full max-w-2xl flex-col items-center gap-6 px-5 py-16 text-center sm:px-8">
        <Mascot variant="learn" size="lg" message="Le parcours arrive bientôt." />
        <H1>Parcours d’apprentissage</H1>
        <BodyMedium className="text-text-secondary">Aucun parcours n’est encore disponible. Reviens bientôt.</BodyMedium>
      </main>
    );
  }

  const report = validateCurriculum(ctx.curriculum);
  const pathPercent = ctx.totalLessons > 0 ? Math.round((ctx.lessonsCompleted / ctx.totalLessons) * 100) : 0;
  const firstVisit = ctx.wordsSeen === 0 && ctx.lessonsCompleted === 0 && ctx.activeSession == null;
  const currentLessonId = ctx.activeSession?.lesson.id ?? ctx.nextLesson?.lesson.id ?? null;

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-10 px-5 py-8 sm:px-8 sm:py-10 lg:gap-12">
      <header className="flex flex-col gap-3">
        <Caption className="text-primary-strong">Apprendre</Caption>
        <H1>{ctx.curriculum.path.title}</H1>
        <BodyLarge className="max-w-3xl text-text-secondary">
          {firstVisit ? "Bienvenue. Commence ton parcours avec quelques mots, puis avance à ton rythme." : ctx.lessonsCompleted === ctx.totalLessons ? "Tu as parcouru toutes les leçons de cette étape. Tu peux revoir les mots ou reprendre le chemin." : "Voici le chemin que tu construis, une leçon après l’autre."}
        </BodyLarge>
        {ctx.curriculum.path.description ? <Caption className="max-w-2xl">{ctx.curriculum.path.description}</Caption> : null}
      </header>

      {/* grid-cols-1 + min-w-0 sur les items : sans colonne explicite, le track auto du grid
       * se cale sur le max-content de la carte « Prochaine étape » (356px) et déborde du
       * viewport sur mobile (PHASE 96C). min-w-0 laisse les items rétrécir sous leur
       * contenu intrinsèque ; le contenu se réorganise alors naturellement. */}
      <section className="grid grid-cols-1 gap-5 [&>*]:min-w-0 lg:grid-cols-[1fr_0.7fr]" aria-label="Résumé du parcours">
        <Card className="rounded-4xl border-primary/20 bg-surface-featured shadow-elevated"><CardContent className="flex flex-col gap-5 p-6 sm:p-8"><div className="flex items-end justify-between gap-4"><div className="flex flex-col gap-1"><Caption className="text-primary-strong">Ton chemin</Caption><H2>{firstVisit ? "Le premier pas" : "Ta progression"}</H2></div><Caption>{pathPercent} %</Caption></div><HikmaProgress value={pathPercent} label={`${ctx.lessonsCompleted} / ${ctx.totalLessons} leçons terminées`} detail={ctx.wordsSeen > 0 ? `${ctx.wordsSeen} mots étudiés` : "Aucun mot étudié"} />{ctx.nextLesson ? <Link href={`/learn/${ctx.nextLesson.lesson.slug}`} className="group flex items-center justify-between gap-4 rounded-2xl border border-border-subtle bg-surface-elevated p-4 outline-none transition-[background-color,border-color,transform,opacity] duration-150 ease-[var(--ease-hikma)] hover:border-border hover:bg-surface-subtle active:scale-[0.99] active:opacity-90 focus-visible:ring-2 focus-visible:ring-focus"><div className="flex min-w-0 flex-col gap-1"><Caption>Prochaine étape</Caption><BodyMedium className="font-medium">{ctx.nextLesson.lesson.title}</BodyMedium><Caption>{ctx.nextLesson.unit.title}</Caption></div><ArrowRightIcon className="size-5 shrink-0 text-primary-strong transition-transform duration-150 ease-[var(--ease-hikma)] group-hover:translate-x-0.5" aria-hidden="true" /></Link> : null}</CardContent></Card>
        <Card className="border-border-subtle bg-surface-elevated"><CardContent className="flex flex-col gap-4 p-6 sm:p-8"><H2>Comment avancer</H2><BodyMedium className="text-text-secondary">Découvre les mots, retrouve leur sens, puis laisse les révisions les ancrer.</BodyMedium>{ctx.reviewDueCount > 0 ? <Button render={<Link href="/review" />} variant="secondary" className="w-full sm:w-fit">Réviser {ctx.reviewDueCount} mot{ctx.reviewDueCount > 1 ? "s" : ""}</Button> : <Caption>{ctx.wordsSeen > 0 ? "Tes révisions apparaîtront au bon moment." : "Commence par la première leçon."}</Caption>}</CardContent></Card>
      </section>

      {!report.valid ? <Card className="border-warning/35 bg-warning/8"><CardContent className="flex-row items-start gap-3 p-4"><LockKeyholeIcon className="mt-0.5 size-5 shrink-0 text-warning-text" aria-hidden="true" /><BodyMedium className="text-warning-text">Le parcours est en cours de préparation : {report.issues[0]?.message}</BodyMedium></CardContent></Card> : null}

      <section className="flex flex-col gap-8" aria-labelledby="path-heading">
        <div className="flex flex-col gap-1"><Caption className="text-primary-strong">Étapes du parcours</Caption><H2 id="path-heading">Un chemin, pas une liste</H2></div>
        <div className="flex flex-col gap-10">
          {ctx.curriculum.units.map((unit, unitIndex) => (
            <section key={unit.id} className="relative flex flex-col gap-4" aria-labelledby={`unit-${unit.id}`}>
              {unitIndex > 0 ? <div className="absolute -top-10 bottom-0 left-5 hidden w-px bg-border-subtle sm:block" aria-hidden="true" /> : null}
              <div className="relative flex items-start justify-between gap-4 sm:pl-12"><div className="flex flex-col gap-1"><Caption className="text-primary-strong">Étape {unitIndex + 1}</Caption><Link href={`/learn/units/${unit.slug}`} className="rounded-md outline-none focus-visible:ring-2 focus-visible:ring-focus"><H2 id={`unit-${unit.id}`} className="text-xl hover:text-primary-strong">{unit.title}</H2></Link>{unit.description ? <BodyMedium className="max-w-2xl text-text-secondary">{unit.description}</BodyMedium> : null}</div><Caption className="shrink-0">{unit.lessons.length} leçon{unit.lessons.length > 1 ? "s" : ""}</Caption></div>
              <div className="relative flex flex-col gap-3 sm:pl-12">
                <div className="absolute bottom-8 left-5 top-8 hidden w-px bg-border-subtle sm:block" aria-hidden="true" />
                {unit.lessons.map((lesson) => {
                  const status = ctx.lessonStatuses.get(lesson.id) ?? "LOCKED";
                  const wordIds = ctx.lessonWordMap.get(lesson.id) ?? [];
                  const progressRows = wordIds.map((id) => ctx.progressByWord.get(id)).filter((row): row is NonNullable<typeof row> => row != null);
                  return <div key={lesson.id} className="relative sm:pl-12"><span className={status === "LOCKED" ? "absolute left-[13px] top-7 hidden size-3 rounded-full border-2 border-border bg-surface sm:block" : status === "IN_PROGRESS" || lesson.id === currentLessonId ? "absolute left-[10px] top-6 hidden size-4 rounded-full border-4 border-primary/30 bg-primary sm:block" : "absolute left-[13px] top-7 hidden size-3 rounded-full border-2 border-success/50 bg-success sm:block"} aria-hidden="true" /><HikmaLessonCard title={lesson.title} objective={lesson.objective ?? lesson.description} href={`/learn/${lesson.slug}`} status={status} progressRows={progressRows} /></div>;
                })}
              </div>
            </section>
          ))}
        </div>
      </section>
    </main>
  );
}
