import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Mascot } from "@/components/ui/mascot";
import { Button } from "@/components/ui/button";
import { BodyMedium, Caption, H1 } from "@/components/ui/typography";
import { generateExercise } from "@/lib/exercises";
import type { WordBankEntry } from "@/lib/learning";
import { getDueReviewItems, getReviewOverview } from "@/lib/learning/queries";
import {
  classifyReviewState,
  formatNextReviewLabel,
} from "@/lib/learning/review-status";
import { createClient } from "@/lib/supabase/server";
import { ReviewPlayer } from "@/components/learn/review-player";

export const dynamic = "force-dynamic";

export default async function ReviewPage() {
  const client = await createClient();
  const {
    data: { user },
  } = await client.auth.getUser();

  if (!user) {
    return (
      <main className="mx-auto flex w-full max-w-2xl flex-col items-center gap-6 px-6 py-16 text-center">
        <Mascot variant="login" size="xl" message="Connecte-toi pour réviser" />
        <H1>Réviser</H1>
        <BodyMedium className="text-muted-foreground">
          Connecte-toi pour réviser tes mots et ancrer ton apprentissage.
        </BodyMedium>
        <Button render={<Link href="/login" />} size="lg" className="min-h-12">
          Se connecter
        </Button>
      </main>
    );
  }

  const [items, overview] = await Promise.all([
    getDueReviewItems(client, user.id),
    getReviewOverview(client, user.id),
  ]);

  // Aucun mot dû : distinguer « jamais étudié » de « étudié mais pas encore dû ».
  // On ne confond PAS review_items (SRS) avec user_word_progress (progression).
  if (items.length === 0) {
    const state = classifyReviewState(overview.dueCount, overview.studiedCount);
    const nextLabel = formatNextReviewLabel(overview.nextReviewAt);

    if (state === "NO_PROGRESS") {
      // ÉTAT A — aucun apprentissage.
      return (
        <main className="mx-auto flex w-full max-w-2xl flex-col items-center gap-6 px-6 py-16 text-center">
          <Mascot variant="learn" size="xl" message="Commence ton apprentissage !" />
          <H1>Rien à réviser pour le moment</H1>
          <BodyMedium className="text-muted-foreground">
            Commence une première leçon pour apprendre tes premiers mots.
          </BodyMedium>
          <Button render={<Link href="/learn" />} size="lg" className="min-h-12">
            Commencer une leçon
          </Button>
        </main>
      );
    }

    // ÉTAT B — mots étudiés mais aucune révision due (progression conservée).
    return (
      <main className="mx-auto flex w-full max-w-2xl flex-col items-center gap-6 px-6 py-16 text-center">
        <Mascot variant="welcome" size="xl" message="Tout est à jour !" />
        <H1>Tout est à jour 🎉</H1>
        <BodyMedium className="text-muted-foreground">
          Tu as déjà étudié des mots. Rien n&apos;est à réviser maintenant.
        </BodyMedium>
        {nextLabel ? (
          <Caption className="text-muted-foreground">
            Prochaine révision : {nextLabel}
          </Caption>
        ) : null}
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button render={<Link href="/learn" />} size="lg" className="min-h-12">
            Continuer à apprendre
          </Button>
          <Button
            render={<Link href="/learn" />}
            size="lg"
            variant="outline"
            className="min-h-12"
          >
            Voir mon parcours
          </Button>
        </div>
      </main>
    );
  }

  // ÉTAT C — révisions disponibles.
  // Exercices générés par le moteur (MULTIPLE_CHOICE) ; les mots sans
  // translittération passent en auto-évaluation (null → carte dédiée).
  const bank: WordBankEntry[] = items.map((item) => ({
    wordId: item.wordId,
    arabic: item.arabic,
    transliteration: item.transliteration,
    meaning: item.meaning,
    meaningLanguage: item.meaningLanguage,
    meaningFallback: item.meaningFallback,
    translationSource: item.translationSource,
    isValidated: item.isValidated,
  }));
  const exercises = items.map((item) =>
    generateExercise("MULTIPLE_CHOICE", {
      target: bank.find((b) => b.wordId === item.wordId)!,
      bank,
      difficulty: 1,
    }),
  );
  const meaningFallback = items.some((i) => i.meaningFallback);

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-6 py-12">
      <header className="flex flex-col gap-1">
        <H1>Tu as des mots à réviser</H1>
        <BodyMedium className="text-muted-foreground">
          {items.length} mot{items.length > 1 ? "s" : ""}{" "}
          {items.length > 1 ? "sont prêts" : "est prêt"} à être révisé
          {items.length > 1 ? "s" : ""}.
        </BodyMedium>
      </header>

      <Card className="items-center gap-2 p-4 sm:flex-row sm:justify-between">
        <div className="flex flex-col gap-1">
          <BodyMedium className="font-semibold">Session de révision</BodyMedium>
          <Caption>
            Une réponse par mot, puis ta prochaine échéance est recalculée
            (répétition espacée).
          </Caption>
          {meaningFallback ? (
            <Caption className="text-muted-foreground/80">
              Certains sens mot à mot sont affichés en anglais — la traduction
              française (Hikma) n&apos;est pas encore validée pour ces mots.
            </Caption>
          ) : null}
        </div>
        <Button render={<Link href="/learn" />} variant="ghost" size="sm">
          Retour au parcours
        </Button>
      </Card>

      <ReviewPlayer items={items} exercises={exercises} isAuthenticated />
    </main>
  );
}
