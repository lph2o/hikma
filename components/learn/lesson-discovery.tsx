"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeftIcon, ArrowRightIcon, BookOpenIcon, VolumeXIcon, XIcon } from "lucide-react";
import { AlertDialog, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogPopup, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { AudioPlayer } from "@/components/ui/audio-player";
import { ArabicText } from "@/components/ui/arabic-text";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { HikmaProgress, HikmaReveal } from "@/components/ui/hikma";
import { BodyLarge, BodyMedium, Caption, H2 } from "@/components/ui/typography";
import type { DiscoveryWord } from "@/components/learn/lesson-player";
import { PronunciationGuided } from "@/components/learn/exercises/pronunciation-exercise";
import type { GeneratedExercise } from "@/lib/exercises";
import type { PhoneticMark } from "@/lib/learning/phonetics";
import type { LessonAyahContext } from "@/lib/learning/queries";
import { HikmaContextDisclosure, HikmaLessonFocusHeader } from "@/components/learn/hikma-lesson-focus";
import { getAnticipationCopy, getSignatureCopy } from "@/lib/learning/lesson-copy";

type LessonDiscoveryProps = {
  lessonTitle: string;
  lessonObjective?: string | null;
  words: DiscoveryWord[];
  guidedPronunciation?: GeneratedExercise | null;
  isAuthenticated: boolean;
  onQuit: () => void | Promise<void>;
  onStart: () => void;
  ayahContext: LessonAyahContext[];
  meaningFallback: boolean;
  audioUnavailable: boolean;
};

/** Découverte focalisée : un mot, une aide volontaire, une prochaine action. */
export function LessonDiscovery({ lessonTitle, lessonObjective, words, guidedPronunciation, isAuthenticated, onQuit, onStart, ayahContext, meaningFallback, audioUnavailable }: LessonDiscoveryProps) {
  const [index, setIndex] = useState(0);
  const [quitOpen, setQuitOpen] = useState(false);
  const word = words[index] ?? null;
  const isLast = index >= words.length - 1;
  const hasGuidedPronunciation = Boolean(guidedPronunciation && index === 0);
  const guided = hasGuidedPronunciation ? guidedPronunciation : null;

  function next() {
    if (isLast) {
      onStart();
      return;
    }
    setIndex((current) => current + 1);
  }

  return (
    <div className="flex flex-col gap-7 pb-24 md:gap-8 md:pb-0">
      <HikmaLessonFocusHeader
        title={lessonTitle}
        stepLabel={`Mot ${words.length > 0 ? index + 1 : 0} sur ${words.length}`}
        exit={(
        <AlertDialog open={quitOpen} onOpenChange={setQuitOpen}>
          <Button variant="ghost" size="icon" aria-label="Quitter la leçon" onClick={() => setQuitOpen(true)}>
            <XIcon />
          </Button>
          <AlertDialogPopup>
            <AlertDialogHeader>
              <AlertDialogTitle>Quitter la leçon ?</AlertDialogTitle>
              <AlertDialogDescription>
                {isAuthenticated ? "Ta progression sera sauvegardée. Tu pourras reprendre exactement où tu t'es arrêté." : "Connecte-toi pour sauvegarder ta progression."}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <Button variant="outline" onClick={() => setQuitOpen(false)}>Continuer la leçon</Button>
              <Button variant="destructive" onClick={() => { setQuitOpen(false); void onQuit(); }}>Quitter</Button>
            </AlertDialogFooter>
          </AlertDialogPopup>
        </AlertDialog>
        )}
      />

      <div className="flex flex-col gap-3">
        <Caption className="text-primary-strong">Étape 1 · Découverte</Caption>
        <H2>Découvre les mots de la leçon</H2>
        {lessonObjective ? <BodyMedium className="text-text-secondary">{lessonObjective}</BodyMedium> : null}
        <Caption className="text-primary-strong">Découvre → entraîne-toi → retrouve-les dans l&apos;ayah</Caption>
        <Caption className="text-text-secondary">{getAnticipationCopy(words.length)}</Caption>
        <HikmaProgress
          value={words.length > 0 ? ((index + 1) / words.length) * 100 : 100}
          label={words.length > 0 ? `Mot ${index + 1} sur ${words.length}` : "Découverte"}
          detail="À ton rythme"
        />
      </div>

      {word ? (
        <Card className="rounded-4xl border-primary/18 bg-surface-featured shadow-elevated" data-slot="lesson-word-hero">
          <CardContent className="gap-6 p-5 sm:gap-8 sm:p-10">
            <div className="flex items-center justify-between gap-3">
              <Caption className="text-primary-strong">Mot actuel</Caption>
              <Link href={`/mots/${word.wordId}`} className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-primary hover:underline">
                <BookOpenIcon className="size-4" aria-hidden="true" />
                Voir la fiche
              </Link>
            </div>

            <div className="flex flex-col items-center gap-3 py-1 text-center sm:gap-4 sm:py-3">
              <ArabicText as="div" scale="word" className="max-w-full">
                {word.arabic}
              </ArabicText>
              {word.transliteration ? <Caption className="text-text-secondary">{word.transliteration}</Caption> : null}
              {word.audioUrl && !hasGuidedPronunciation ? (
                <AudioPlayer key={word.audioUrl} src={word.audioUrl} label="Écouter le mot" />
              ) : !hasGuidedPronunciation ? (
                <div className="flex items-center gap-2 rounded-xl border border-border-subtle bg-surface-subtle px-4 py-3">
                  <VolumeXIcon className="size-4 text-text-secondary" aria-hidden="true" />
                  <Caption>Audio momentanément indisponible. Tu peux continuer.</Caption>
                </div>
              ) : null}
            </div>

            {word.ayahRef ? (
              <Caption className="text-primary-strong">{getSignatureCopy(word.ayahRef)}</Caption>
            ) : null}

            {word.meaning ? (
              <HikmaReveal key={word.wordId} label="Voir le sens">
                <div className="flex flex-col items-center gap-2 text-center">
                  <BodyLarge>{word.meaning}</BodyLarge>
                  {word.isValidated ? <Badge variant="success">Sens français validé</Badge> : null}
                  {word.meaningFallback ? <Badge variant="secondary">Sens mot à mot en anglais — FR en préparation</Badge> : null}
                </div>
              </HikmaReveal>
            ) : (
              <BodyMedium className="rounded-xl border border-border-subtle bg-surface-subtle p-4 text-center text-muted-foreground">
                Le sens éditorial de ce mot n’est pas encore disponible. Tu peux continuer avec l’écoute et les exercices.
              </BodyMedium>
            )}

            {guided ? (
              <div className="flex flex-col gap-4 border-t border-primary/15 pt-6 sm:gap-5 sm:pt-7" data-slot="guided-pronunciation-stage">
                <div className="flex flex-col gap-1">
                  <Caption className="text-primary-strong">Prononciation guidée</Caption>
                  <BodyMedium>Écoute, répète, puis compare tranquillement.</BodyMedium>
                </div>
                <PronunciationGuided
                  arabic={(guided.metadata.arabic as string | undefined) ?? ""}
                  transliteration={(guided.metadata.transliteration as string | undefined) ?? null}
                  meaning={(guided.metadata.meaning as string | undefined) ?? null}
                  audioUrl={(guided.metadata.audioUrl as string | undefined) ?? null}
                  hints={(guided.metadata.phoneticHints as string[] | undefined) ?? []}
                  marks={(guided.metadata.phoneticMarks as PhoneticMark[] | undefined) ?? []}
                  showWord={false}
                  showMeaning={false}
                />
              </div>
            ) : null}
          </CardContent>
        </Card>
      ) : (
        <Card className="items-center gap-4 p-8 text-center">
          <BodyMedium className="text-muted-foreground">Cette leçon n’a pas de liste de mots à présenter.</BodyMedium>
        </Card>
      )}

      {audioUnavailable ? (
        <Caption className="text-text-secondary">Certains exercices audio pourront être indisponibles ; les autres étapes restent accessibles.</Caption>
      ) : null}

      {meaningFallback ? (
        <Caption className="text-text-secondary">Certains sens mot à mot sont encore affichés en anglais pendant la préparation du français Hikma.</Caption>
      ) : null}

      {ayahContext.length > 0 ? (
        <Caption className="text-center text-text-secondary">
          Tu viens de découvrir ces mots — retrouve-les dans l&apos;ayah que tu récites.
        </Caption>
      ) : null}

      <HikmaContextDisclosure key={word?.wordId ?? "empty"} contexts={ayahContext} />

      <div className="sticky bottom-0 z-10 -mx-4 flex flex-col gap-3 border-t border-border-subtle bg-background/95 px-4 pb-[calc(env(safe-area-inset-bottom,0px)+--spacing(3))] pt-3 backdrop-blur-sm sm:static sm:mx-0 sm:flex-row sm:justify-end sm:border-0 sm:bg-transparent sm:p-0 sm:backdrop-blur-none">
        {index > 0 ? (
          <Button variant="outline" className="min-h-12 sm:order-first" onClick={() => setIndex((current) => current - 1)}>
            <ArrowLeftIcon aria-hidden="true" /> Mot précédent
          </Button>
        ) : null}
        <Button size="lg" className="min-h-12 w-full sm:w-auto" onClick={next}>
          {isLast ? "Commencer les exercices" : "Mot suivant"}
          <ArrowRightIcon aria-hidden="true" />
        </Button>
      </div>
    </div>
  );
}
