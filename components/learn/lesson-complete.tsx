"use client";

// Écran de fin de leçon. Statistiques réelles de la session uniquement
// (aucune récompense inventée : le système XP n'existe pas encore).
//
// Phase 34C : lorsqu'il s'agit de la DERNIÈRE leçon d'une sourate
// (`nextLesson === null` + un parcours réel), une micro-célébration légère
// (confettis dorés/teal, CSS uniquement, `prefers-reduced-motion` respecté)
// marque le passage à `completed` — un événement UX, jamais une donnée
// pédagogique ni une nouvelle table.

import Link from "next/link";
import { Sparkles, UserPlusIcon } from "lucide-react";
import { Mascot } from "@/components/ui/mascot";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { BodyMedium, BodySmall, Caption, H2 } from "@/components/ui/typography";
import {
  getSurahCompletionCopy,
  isSurahCompletionTransition,
} from "@/lib/learning/surah-progress-copy";
import { getLessonProgressCopy } from "@/lib/learning/lesson-copy";
import { cn } from "@/lib/utils";
import type { SessionStats } from "@/lib/learning/session";

export type LessonCompleteProps = {
  lessonTitle: string;
  stats: SessionStats;
  nextLesson: { title: string; href: string } | null;
  /** Progression du parcours (leçons terminées / total), AVANT la leçon courante. */
  pathProgress: { completed: number; total: number } | null;
  /** Nom de la sourate (transliteration), si connu — jamais inventé. */
  surahName?: string | null;
  /** Nombre de mots renforcés en mini-révision de fin (0 = aucune). */
  reinforcedWords?: number;
  /** false = visiteur anonyme (page d'essai) : CTA inscription affiché à la place
   *  des boutons de navigation habituels. */
  isAuthenticated?: boolean;
};

function StatCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-xl border border-border bg-surface px-3 py-4">
      <BodyMedium className="text-h3 font-semibold text-foreground">{value}</BodyMedium>
      <Caption>{label}</Caption>
    </div>
  );
}

export function LessonComplete({
  lessonTitle,
  stats,
  nextLesson,
  pathProgress,
  surahName,
  reinforcedWords = 0,
  isAuthenticated = true,
}: LessonCompleteProps) {
  const percent =
    pathProgress && pathProgress.total > 0
      ? Math.round((pathProgress.completed / pathProgress.total) * 100)
      : null;
  const progressCopy = getLessonProgressCopy(surahName ?? null);

  // VRAIE transition vers `completed` (Phase 35B) : dernière leçon ET toutes
  // les autres leçons déjà terminées. Déclenché UNIQUEMENT ici (pas à chaque
  // ouverture de page), jamais sur une sourate déjà terminée.
  const justCompletedSurah = isSurahCompletionTransition(nextLesson, pathProgress);
  const completionCopy = getSurahCompletionCopy(surahName);

  return (
    <Card
      className={cn(
        "mx-auto w-full max-w-lg",
        justCompletedSurah &&
          "relative isolate overflow-hidden border-hikma-gold/40 bg-surface-featured",
      )}
    >
      <CardContent className="relative items-center gap-5 p-8 text-center">
        {justCompletedSurah ? (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 overflow-hidden"
          >
            <span className="onboarding-confetti onboarding-confetti-1" />
            <span className="onboarding-confetti onboarding-confetti-2" />
            <span className="onboarding-confetti onboarding-confetti-3" />
            <span className="onboarding-confetti onboarding-confetti-4" />
            <span className="onboarding-confetti onboarding-confetti-5" />
            <span className="onboarding-confetti onboarding-confetti-6" />
          </div>
        ) : null}

        {justCompletedSurah ? (
          <>
            <div className="relative flex size-14 items-center justify-center rounded-full border border-hikma-gold/45 bg-hikma-gold/12 text-hikma-gold-muted">
              <Sparkles aria-hidden="true" className="size-7" />
            </div>
            <H2 className="relative">{completionCopy.title}</H2>
            <BodyMedium className="relative text-text-secondary">
              {completionCopy.message}
            </BodyMedium>
          </>
        ) : (
          <>
            <Mascot variant="learn" size="lg" message="Leçon terminée !" />
            <div className="flex flex-col gap-2">
              <H2>Leçon terminée</H2>
              <BodyMedium className="text-primary-strong">Al-ḥamdulillāh, tu as franchi cette étape.</BodyMedium>
              <BodyMedium className="text-muted-foreground">« {lessonTitle} »</BodyMedium>
              {progressCopy ? (
                <BodyMedium className="text-text-secondary">{progressCopy}</BodyMedium>
              ) : null}
            </div>
          </>
        )}

        {reinforcedWords > 0 ? (
          <BodyMedium className="text-text-secondary">
            {reinforcedWords} mot{reinforcedWords > 1 ? "s" : ""} renforcé{reinforcedWords > 1 ? "s" : ""} en fin de session.
          </BodyMedium>
        ) : null}

        <div className="grid w-full grid-cols-3 gap-3">
          <StatCell label="Exercices" value={String(stats.total)} />
          <StatCell label="Précision" value={`${stats.accuracy}%`} />
          <StatCell label="Mots étudiés" value={String(stats.wordsStudied)} />
        </div>

        {pathProgress && percent != null ? (
          <div className="flex w-full flex-col gap-2">
            <div className="flex items-center justify-between">
              <Caption>Progression du parcours</Caption>
              <Caption>
                {pathProgress.completed}/{pathProgress.total} leçons
              </Caption>
            </div>
            <Progress value={percent} />
          </div>
        ) : null}

        <div className="flex w-full flex-col gap-2 pt-2">
          {!isAuthenticated ? (
            // CTA inscription pour les visiteurs anonymes (page d'essai terminée).
            // La progression de cet essai n'est PAS sauvegardée — le message est
            // honnête sur ce point et incite à créer un compte pour la prochaine fois.
            <div className="flex flex-col items-center gap-4 rounded-2xl border border-primary/30 bg-primary/6 px-5 py-5">
              <div className="flex flex-col items-center gap-1 text-center">
                <UserPlusIcon className="mb-1 size-6 text-primary-strong" aria-hidden="true" />
                <BodyMedium className="font-semibold text-text-primary">
                  Crée ton compte gratuit
                </BodyMedium>
                <BodySmall className="text-text-secondary">
                  Ta progression ne sera pas perdue à chaque session si tu as un compte.
                  Rejoins Hikma pour que chaque leçon compte.
                </BodySmall>
              </div>
              <div className="flex w-full flex-col gap-2">
                <Button render={<Link href="/signup" />} size="lg" className="w-full min-h-12">
                  Créer un compte — c&apos;est gratuit
                </Button>
                <Button
                  render={<Link href="/login" />}
                  variant="outline"
                  size="lg"
                  className="w-full min-h-12"
                >
                  Se connecter
                </Button>
              </div>
            </div>
          ) : (
            <>
              {justCompletedSurah ? (
                <Button render={<Link href="/surahs" />} size="lg" className="w-full min-h-12">
                  Voir mes sourates
                </Button>
              ) : nextLesson ? (
                <Button
                  render={<Link href={nextLesson.href} />}
                  size="lg"
                  className="w-full min-h-12"
                >
                  Continuer — {nextLesson.title}
                </Button>
              ) : null}
              <Button
                render={<Link href="/review" />}
                variant="outline"
                size="lg"
                className="w-full min-h-12"
              >
                Réviser mes mots
              </Button>
              <Button
                render={<Link href="/learn" />}
                variant="ghost"
                size="lg"
                className="w-full min-h-12"
              >
                Retour au parcours
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
