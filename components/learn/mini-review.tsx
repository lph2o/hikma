"use client";

// Mini-révision de fin de session (Phase 36C) + retry d'écriture arabe
// (Phase 36E) — couche de RENFORCEMENT pure, sans re-grading, sans persistance,
// sans effet SRS/mastery.
//
// Deux types d'étapes :
//   - « arabic » (retry d'écriture) : l'utilisateur réécrit la forme arabe d'un
//     mot raté sur la compétence `meaning_to_form`, PUIS compare à la forme
//     canonique révélée. Comparaison locale uniquement (`isArabicRewriteExact`),
//     jamais notée, jamais envoyée au moteur.
//   - « self » (auto-évaluation) : l'utilisateur juge s'il se souvient du sens.
//
// Aucun `validateAnswer`, aucun `user_word_progress`, aucun SRS, aucun mastery,
// aucun score, aucune session : la séquence principale reste la seule vérité.

import { useRef, useState } from "react";
import { CheckIcon, RotateCcwIcon } from "lucide-react";
import { AudioPlayer } from "@/components/ui/audio-player";
import { ArabicText } from "@/components/ui/arabic-text";
import { ArabicKeyboard } from "@/components/ui/arabic-keyboard";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Mascot } from "@/components/ui/mascot";
import { HikmaProgress } from "@/components/ui/hikma";
import { BodyLarge, BodyMedium, BodySmall, Caption, H2 } from "@/components/ui/typography";
import { backspaceAtCursor, insertTextAtCursor } from "@/lib/ui/arabic-input";
import { cn } from "@/lib/utils";
import type { DiscoveryWord } from "./lesson-player";
import {
  getArabicRewriteEmptyCopy,
  getArabicRewriteExactCopy,
  getArabicRewriteMismatchCopy,
  getArabicRewriteReassuranceCopy,
  getCombinedMiniReviewIntroCopy,
  getMiniReviewDoneCopy,
  isArabicRewriteExact,
} from "@/lib/learning/lesson-copy";

type StepKind = "arabic" | "self";
type Step = { kind: StepKind; word: DiscoveryWord };
type Phase = "intro" | "reviewing" | "done";

export function MiniReview({
  arabicWords = [],
  reviewWords = [],
  onComplete,
}: {
  /** Mots ratés sur `meaning_to_form` → retry d'écriture arabe. */
  arabicWords?: DiscoveryWord[];
  /** Autres mots ratés → auto-évaluation. */
  reviewWords?: DiscoveryWord[];
  /** Appelé à la fin (reinforced = nombre de mots réellement re-présentés). */
  onComplete: (reinforced: number) => void;
}) {
  const [phase, setPhase] = useState<Phase>("intro");
  const [index, setIndex] = useState(0);

  const steps: Step[] = [
    ...arabicWords.map((word) => ({ kind: "arabic" as const, word })),
    ...reviewWords.map((word) => ({ kind: "self" as const, word })),
  ];

  const intro = getCombinedMiniReviewIntroCopy(
    arabicWords.length,
    reviewWords.length,
  );
  const done = getMiniReviewDoneCopy(steps.length);

  if (steps.length === 0) return null;

  function next() {
    if (index + 1 >= steps.length) setPhase("done");
    else setIndex((i) => i + 1);
  }

  if (phase === "intro") {
    const startLabel =
      arabicWords.length > 0
        ? reviewWords.length > 0
          ? "Commencer le renforcement"
          : "Réécrire ces mots"
        : "Revoir ces mots";
    return (
      <Card className="mx-auto w-full max-w-lg rounded-4xl border-primary/25 bg-surface-featured shadow-elevated">
        <CardContent className="flex flex-col items-center gap-5 p-6 text-center sm:p-8">
          <div className="flex size-14 items-center justify-center rounded-full border border-primary/30 bg-primary/10 text-primary-strong shadow-xs">
            <RotateCcwIcon className="size-7" />
          </div>
          <div className="flex flex-col gap-1">
            <Caption className="font-semibold text-primary-strong">Consolidation bienveillante</Caption>
            <H2 className="text-2xl">{intro.title}</H2>
            <BodyMedium className="text-text-secondary">{intro.message}</BodyMedium>
          </div>
          <div className="w-full rounded-2xl border border-primary/20 bg-surface-elevated/70 p-4 text-center">
            <BodySmall className="text-text-secondary">
              Tu as hésité sur certains mots pendant cette leçon. Prenons un court instant pour les consolider sans pression : cette étape n&apos;altère pas ton score.
            </BodySmall>
          </div>
          <div className="flex w-full flex-col gap-2 pt-2">
            <Button
              size="lg"
              className="w-full min-h-12 active:scale-[0.98]"
              onClick={() => {
                setPhase("reviewing");
                setIndex(0);
              }}
            >
              <RotateCcwIcon aria-hidden="true" />
              {startLabel}
            </Button>
            <Button
              variant="ghost"
              className="w-full min-h-12 active:scale-[0.98]"
              onClick={() => onComplete(0)}
            >
              Terminer la leçon
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (phase === "done") {
    const reinforcedWordsList = Array.from(
      new Map(steps.map((s) => [s.word.wordId, s.word])).values(),
    );

    return (
      <Card className="mx-auto w-full max-w-lg rounded-4xl border-primary/25 bg-surface-featured shadow-elevated">
        <CardContent className="flex flex-col items-center gap-5 p-6 text-center sm:p-8">
          <div className="flex size-14 items-center justify-center rounded-full border border-success/30 bg-success/10 text-success-text shadow-xs">
            <CheckIcon className="size-7" />
          </div>
          <div className="flex flex-col gap-1">
            <Caption className="font-semibold text-primary-strong">Consolidation réussie</Caption>
            <H2 className="text-2xl">{done.title}</H2>
            <BodyMedium className="text-text-secondary">{done.message}</BodyMedium>
          </div>

          {/* Liste récapitulative des mots consolidés */}
          <div className="flex w-full flex-col gap-2 rounded-2xl border border-border-subtle bg-surface-elevated/80 p-4">
            <Caption className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Mots consolidés ({reinforcedWordsList.length})
            </Caption>
            <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
              {reinforcedWordsList.map((w) => (
                <div
                  key={w.wordId}
                  className="inline-flex items-center gap-2 rounded-xl border border-border-subtle bg-surface-subtle px-3 py-1.5"
                >
                  <ArabicText as="span" className="text-base font-normal">
                    {w.arabic}
                  </ArabicText>
                  {w.meaning ? (
                    <span className="text-xs text-text-secondary">· {w.meaning}</span>
                  ) : null}
                </div>
              ))}
            </div>
          </div>

          <Button
            size="lg"
            className="w-full min-h-12 active:scale-[0.98]"
            onClick={() => onComplete(steps.length)}
          >
            Terminer la leçon
          </Button>
        </CardContent>
      </Card>
    );
  }

  const current = steps[index];

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <Caption className="text-primary-strong">
          {current.kind === "arabic" ? "Renforcement · écriture" : "Renforcement"}
        </Caption>
        <H2>{current.kind === "arabic" ? "Réécris le mot arabe" : "Retiens ce mot"}</H2>
        <HikmaProgress
          value={((index + 1) / steps.length) * 100}
          label={`Mot ${index + 1} sur ${steps.length}`}
        />
      </header>

      {current.kind === "arabic" ? (
        <ArabicRewriteStep
          key={`arabic-${index}-${current.word.wordId}`}
          word={current.word}
          onNext={next}
        />
      ) : (
        <SelfAssessmentStep
          key={`self-${index}-${current.word.wordId}`}
          word={current.word}
          onNext={next}
        />
      )}
    </div>
  );
}

function SelfAssessmentStep({
  word,
  onNext,
}: {
  word: DiscoveryWord;
  onNext: () => void;
}) {
  const [rating, setRating] = useState<boolean | null>(null);

  return (
    <>
      <Card className="rounded-4xl border-primary/18 bg-surface-featured shadow-elevated">
        <CardContent className="items-center gap-5 p-6 text-center sm:p-8">
          <ArabicText as="div" scale="word" className="max-w-full">
            {word.arabic}
          </ArabicText>
          {word.transliteration ? (
            <Caption className="text-text-secondary">{word.transliteration}</Caption>
          ) : null}
          {word.audioUrl ? (
            <AudioPlayer key={word.audioUrl} src={word.audioUrl} label="Réécouter le mot" />
          ) : null}
          <BodyLarge className="font-medium">Tu te souviens du sens ?</BodyLarge>

          <div className="grid w-full gap-3 sm:grid-cols-2">
            <Button
              variant="outline"
              className={cn(
                "min-h-12 transition-all duration-150 active:scale-[0.98]",
                rating === true
                  ? "border-success bg-success/12 text-success-text font-semibold ring-1 ring-success/30 shadow-xs"
                  : rating === false
                    ? "opacity-60"
                    : "",
              )}
              onClick={() => setRating(true)}
            >
              {rating === true ? "✓ " : ""}Je m&apos;en souviens
            </Button>
            <Button
              variant="outline"
              className={cn(
                "min-h-12 transition-all duration-150 active:scale-[0.98]",
                rating === false
                  ? "border-primary bg-primary/12 text-primary-strong font-semibold ring-1 ring-primary/30 shadow-xs"
                  : rating === true
                    ? "opacity-60"
                    : "",
              )}
              onClick={() => setRating(false)}
            >
              {rating === false ? "• " : ""}Pas encore
            </Button>
          </div>

          {rating != null ? (
            <div className="flex w-full flex-col gap-2 rounded-2xl border border-border-subtle bg-surface-subtle p-4">
              <Caption className={rating ? "text-success-text" : "text-primary-strong"}>
                {rating ? "Bien retenu ✓" : "Le voici — garde-le en tête."}
              </Caption>
              {word.meaning ? (
                <BodyLarge>{word.meaning}</BodyLarge>
              ) : (
                <BodyMedium className="text-text-secondary">
                  Sens indisponible pour ce mot.
                </BodyMedium>
              )}
            </div>
          ) : null}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        {rating != null ? (
          <Button
            size="lg"
            className="w-full min-h-12 active:scale-[0.98] sm:w-auto sm:min-w-48"
            onClick={onNext}
          >
            Continuer
          </Button>
        ) : (
          <Button
            size="lg"
            disabled
            aria-disabled="true"
            className="w-full min-h-12 sm:w-auto sm:min-w-48"
          >
            Choisis une réponse
          </Button>
        )}
      </div>
    </>
  );
}

function ArabicRewriteStep({
  word,
  onNext,
}: {
  word: DiscoveryWord;
  onNext: () => void;
}) {
  const [value, setValue] = useState("");
  const [attempted, setAttempted] = useState(false);
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const exact = isArabicRewriteExact(value, word.arabic);

  function insertChar(char: string) {
    const el = inputRef.current;
    const start = el?.selectionStart ?? value.length;
    const end = el?.selectionEnd ?? value.length;
    const { value: next, caret } = insertTextAtCursor(value, start, end, char);
    setValue(next);
    requestAnimationFrame(() => {
      const target = inputRef.current;
      target?.focus();
      target?.setSelectionRange(caret, caret);
    });
  }

  function backspace() {
    const el = inputRef.current;
    const start = el?.selectionStart ?? value.length;
    const end = el?.selectionEnd ?? value.length;
    const { value: next, caret } = backspaceAtCursor(value, start, end);
    setValue(next);
    requestAnimationFrame(() => {
      const target = inputRef.current;
      target?.focus();
      target?.setSelectionRange(caret, caret);
    });
  }

  return (
    <>
      <Card className="rounded-4xl border-primary/18 bg-surface-featured shadow-elevated">
        <CardContent className="items-center gap-5 p-6 text-center sm:p-8">
          <Caption className="text-primary-strong">Le sens</Caption>
          {word.meaning ? (
            <BodyLarge>{word.meaning}</BodyLarge>
          ) : (
            <BodyMedium className="text-text-secondary">Sens indisponible pour ce mot.</BodyMedium>
          )}
          <BodyLarge className="font-medium">Écris le mot arabe :</BodyLarge>

          {!attempted ? (
            <>
              <input
                ref={inputRef}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                lang="ar"
                dir="rtl"
                inputMode="text"
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck={false}
                aria-label={`Écris le mot arabe correspondant à « ${word.meaning ?? ""} »`}
                className="h-14 w-full max-w-xs rounded-lg border border-input bg-popover px-4 text-center text-2xl text-foreground outline-none focus:ring-2 focus:ring-ring"
              />
              {!keyboardOpen ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setKeyboardOpen(true);
                    // Le clavier reste borné (70dvh) : ramène la question + la
                    // zone de saisie dans le viewport (contexte jamais perdu).
                    requestAnimationFrame(() =>
                      inputRef.current?.scrollIntoView({ block: "center" }),
                    );
                  }}
                >
                  ⌨ Clavier arabe
                </Button>
              ) : null}
              {keyboardOpen ? (
                <ArabicKeyboard
                  onInsert={insertChar}
                  onBackspace={backspace}
                  onSpace={() => insertChar(" ")}
                  onClose={() => setKeyboardOpen(false)}
                />
              ) : null}
              <Caption className="text-text-secondary">
                {getArabicRewriteReassuranceCopy()}
              </Caption>
              <div className="flex w-full flex-col gap-2 sm:flex-row sm:justify-center">
                <Button size="lg" className="min-h-12" onClick={() => setAttempted(true)}>
                  Réessayer
                </Button>
                <Button variant="ghost" className="min-h-12" onClick={onNext}>
                  Passer
                </Button>
              </div>
            </>
          ) : (
            <div className="flex w-full flex-col items-center gap-3">
              <BodyMedium className={exact ? "text-success-text" : "text-text-secondary"}>
                {exact
                  ? getArabicRewriteExactCopy()
                  : value.trim()
                    ? getArabicRewriteMismatchCopy()
                    : getArabicRewriteEmptyCopy()}
              </BodyMedium>
              <ArabicText as="div" scale="word" className="max-w-full">
                {word.arabic}
              </ArabicText>
              {word.audioUrl ? (
                <AudioPlayer key={word.audioUrl} src={word.audioUrl} label="Écouter le mot" />
              ) : null}
              {!exact && value.trim() ? (
                <Caption className="text-text-secondary">Ta réponse : {value}</Caption>
              ) : null}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        {attempted ? (
          <Button size="lg" className="w-full min-h-12 sm:w-auto sm:min-w-48" onClick={onNext}>
            Continuer
          </Button>
        ) : null}
      </div>
    </>
  );
}
