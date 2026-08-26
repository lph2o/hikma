"use client";

// Composants d'exercice Phase 5/23F — présentation uniquement.
// Ils consomment les TYPES de l'Exercise Engine et délèguent la validation
// au moteur (validateAnswer / scoreAnswer). Aucune logique métier ici.
//
// Phase 23F : ajout des cartes de RAPPEL actif (auto-évalué noté) et d'AUDIO.
// Phase 24F : l'audio utilise le lecteur Hikma (AudioPlayer, 24C) — jamais un
// <audio controls> natif ; l'écoute reste au service de la compétence.

import { useRef, useState, type ReactElement } from "react";
import { BodyLarge, BodyMedium, Caption } from "@/components/ui/typography";
import { ArabicText } from "@/components/ui/arabic-text";
import { Button } from "@/components/ui/button";
import { AudioPlayer } from "@/components/ui/audio-player";
import { ArabicKeyboard } from "@/components/ui/arabic-keyboard";
import { backspaceAtCursor, insertTextAtCursor } from "@/lib/ui/arabic-input";
import type { ExerciseType } from "@/lib/exercises";
import {
  OptionsExercise,
  OptionContent,
  type OptionsExerciseProps,
} from "./options-exercise";
import {
  PronunciationGuided,
} from "./pronunciation-exercise";
import type { PhoneticMark } from "@/lib/learning/phonetics";
import { stableOptionOrder } from "./option-order";
import { exerciseIdentity } from "./exercise-identity";
import { HikmaReveal } from "@/components/ui/hikma";
import { handleRadioGroupKeyDown } from "@/lib/ui/radio-group-keyboard";

export type { OnChoose, FeedbackPanel, FeedbackPanelProps } from "./options-exercise";
export { OptionsExercise, OptionContent } from "./options-exercise";

/** WORD_TO_TRANSLATION — mot arabe → choisir la traduction. */
export function WordToTranslation(props: OptionsExerciseProps) {
  return <OptionsExercise {...props} />;
}

/** TRANSLATION_TO_WORD — traduction (+ translittération en indice) → mot arabe. */
export function TranslationToWord(props: OptionsExerciseProps) {
  return <OptionsExercise {...props} />;
}

/** REVERSE_TRANSLATION — sens seul → mot arabe (sans indice). */
export function ReverseTranslation(props: OptionsExerciseProps) {
  return <OptionsExercise {...props} />;
}

/** MULTIPLE_CHOICE — mot arabe → translittération (prononciation). */
export function MultipleChoice(props: OptionsExerciseProps) {
  return <OptionsExercise {...props} />;
}

/** COMPLETE_WORD — compléter le sens du mot. */
export function CompleteWord(props: OptionsExerciseProps) {
  return <OptionsExercise {...props} />;
}

/**
 * WORD_RECOGNITION — auto-évaluation « connais-tu ce mot ? ».
 * Non noté par le moteur : l'utilisateur juge lui-même (Oui / Pas encore).
 */
export function WordRecognition({ exercise, answer, onChoose }: OptionsExerciseProps) {
  const options = stableOptionOrder(
    exercise.options,
    `${exercise.type}:${exercise.metadata.targetWordId}:${exercise.prompt}`,
  );
  return (
    <div className="flex flex-col gap-5">
      {exercise.metadata.arabic ? (
        <ArabicText className="text-h2 text-center font-normal">
          {exercise.metadata.arabic}
        </ArabicText>
      ) : null}
      {exercise.metadata.transliteration ? (
        <BodyLarge className="text-center text-muted-foreground">
          {exercise.metadata.transliteration}
        </BodyLarge>
      ) : null}
      {exercise.metadata.meaning ? (
        <BodyLarge className="text-center">{exercise.metadata.meaning}</BodyLarge>
      ) : null}
      <BodyLarge className="text-center font-medium">{exercise.prompt}</BodyLarge>

      <div className="grid gap-2 sm:grid-cols-2" role="radiogroup" aria-label="Auto-évaluation" onKeyDown={handleRadioGroupKeyDown}>
        {options.map((option) => {
          const isChosen = answer?.optionIndex === option.position - 1;
          return (
            <button
              key={option.position}
              type="button"
              role="radio"
              aria-checked={isChosen}
              disabled={answer != null}
              onClick={() => onChoose(option)}
              className={
                "h-12 rounded-lg border px-4 text-base font-medium transition-colors " +
                (isChosen
                  ? "border-primary bg-secondary text-secondary-foreground"
                  : "border-input bg-popover text-foreground hover:bg-accent/50")
              }
            >
              {option.content}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/**
 * RAPPEL LIBRE machine-noté (FORM_TO_MEANING / MEANING_TO_FORM).
 * L'utilisateur doit d'abord RETROUVER la réponse de mémoire puis la SAISIR ;
 * le moteur note la réponse (CORRECT / INCORRECT / AMBIGUOUS), sans
 * auto-évaluation. La bonne réponse est révélée après soumission.
 */
function RecallExercise({ exercise, answer, onSubmitText }: OptionsExerciseProps) {
  const [value, setValue] = useState("");
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const lang = exercise.metadata.freeTextLang === "ar" ? "ar" : "fr";
  const isArabic = lang === "ar";
  const showArabic = exercise.metadata.showArabic === true;
  const reveal = (exercise.metadata.revealContent as string | undefined) ?? "";
  const submitted = answer != null;

  /** Insère un caractère à la position du curseur puis restaure le focus. */
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

  /** Supprime en arrière (backspace) à la position du curseur. */
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
    <div className="flex flex-col gap-5">
      {showArabic && exercise.metadata.arabic ? (
        <ArabicText className="text-h2 text-center font-normal">
          {exercise.metadata.arabic}
        </ArabicText>
      ) : null}
      {!showArabic && exercise.metadata.meaning ? (
        <BodyLarge className="text-center">{exercise.metadata.meaning}</BodyLarge>
      ) : null}

      <BodyLarge className="text-center">{exercise.prompt}</BodyLarge>

      {!submitted ? (
        <form
          className="flex flex-col gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (value.trim()) onSubmitText?.(value);
          }}
        >
          <input
            ref={inputRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            lang={lang}
            dir={isArabic ? "rtl" : "ltr"}
            inputMode="text"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
            aria-label={exercise.prompt}
            placeholder={
              isArabic ? "Écris le mot arabe…" : "Écris ta réponse en français…"
            }
            className="h-12 w-full rounded-lg border border-input bg-popover px-4 text-base text-foreground outline-none focus:ring-2 focus:ring-ring"
          />
          {isArabic && !keyboardOpen ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setKeyboardOpen(true);
                // Le clavier reste borné (70dvh) : ramène la question + la zone
                // de saisie dans le viewport pour ne jamais perdre le contexte.
                requestAnimationFrame(() =>
                  inputRef.current?.scrollIntoView({ block: "center" }),
                );
              }}
            >
              ⌨ Clavier arabe
            </Button>
          ) : null}
          {isArabic && keyboardOpen ? (
            <ArabicKeyboard
              onInsert={insertChar}
              onBackspace={backspace}
              onSpace={() => insertChar(" ")}
              onClose={() => setKeyboardOpen(false)}
            />
          ) : null}
          <Button type="submit" size="lg" disabled={!value.trim()}>
            Vérifier
          </Button>
        </form>
      ) : (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-info/32 bg-info/4 p-4">
          <Caption>La réponse</Caption>
          {ARABIC_RE.test(reveal) ? (
            <ArabicText className="text-h3 text-center">{reveal}</ArabicText>
          ) : (
            <BodyLarge className="text-center font-medium">{reveal}</BodyLarge>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * CONTEXT_RECOGNITION — reconnaître le sens d'une forme DANS son verset réel
 * (ayah + traduction FR du verset affichés). La correction est un QCM de sens.
 */
export function ContextRecognitionExercise(props: OptionsExerciseProps) {
  const context = props.exercise.metadata.context;
  const exposure = props.exercise.metadata.translationExposure;
  const translationIsRisky = exposure === "REVEAL_RISK" || exposure === "UNKNOWN";
  return (
    <div className="flex flex-col gap-5">
      {context?.arabic ? (
        <ArabicText className="text-h2 text-center font-normal">{context.arabic}</ArabicText>
      ) : null}
      {context?.french && translationIsRisky ? (
        <HikmaReveal label="Afficher la traduction du verset">
          <div className="flex flex-col gap-2">
            <Caption className="text-primary-strong">Contexte du verset</Caption>
            <BodyMedium className="text-center text-muted-foreground">{context.french}</BodyMedium>
          </div>
        </HikmaReveal>
      ) : context?.french ? (
        <div className="flex flex-col gap-2 rounded-2xl border border-border-subtle bg-surface-subtle p-4">
          <Caption className="text-primary-strong">Contexte du verset</Caption>
          <BodyMedium className="text-center text-muted-foreground">{context.french}</BodyMedium>
        </div>
      ) : null}
      {context ? (
        <Caption className="text-center">
          Sourate {context.surahNumber} · {context.surahNumber}:{context.ayahNumber}
        </Caption>
      ) : null}
      <OptionsExercise {...props} />
    </div>
  );
}

/**
 * AUDIO_TO_WORD — écouter le mot puis identifier la forme arabe (QCM).
 */
function AudioToWordExercise({ exercise, answer, onChoose }: OptionsExerciseProps) {
  const audioUrl = exercise.metadata.audioUrl as string | undefined;
  const options = stableOptionOrder(
    exercise.options,
    `${exercise.type}:${exercise.metadata.targetWordId}:${exercise.prompt}`,
  );
  return (
    <div className="flex flex-col gap-5">
      {audioUrl ? (
        <AudioPlayer key={audioUrl} src={audioUrl} label="Écouter le mot" />
      ) : null}
      <BodyLarge className="text-center">{exercise.prompt}</BodyLarge>
      <div className="grid gap-2 sm:grid-cols-2" role="radiogroup" aria-label="Options de réponse" onKeyDown={handleRadioGroupKeyDown}>
        {options.map((option) => {
          const isChosen = answer?.optionIndex === option.position - 1;
          return (
            <Button
              key={option.position}
              variant={isChosen ? "secondary" : "outline"}
              className="h-auto min-h-12 whitespace-normal px-4 py-3 justify-center"
              role="radio"
              aria-checked={isChosen}
              disabled={answer != null}
              onClick={() => onChoose(option)}
            >
              <OptionContent content={option.content} />
            </Button>
          );
        })}
      </div>
    </div>
  );
}

/** WORD_TO_AUDIO — forme affichée + écoute, puis auto-évaluation notée. */
function WordToAudioExercise({ exercise, answer, onChoose }: OptionsExerciseProps) {
  const audioUrl = exercise.metadata.audioUrl as string | undefined;
  const options = stableOptionOrder(
    exercise.options,
    `${exercise.type}:${exercise.metadata.targetWordId}:${exercise.prompt}`,
  );
  return (
    <div className="flex flex-col gap-5">
      {exercise.metadata.arabic ? (
        <ArabicText className="text-h2 text-center font-normal">
          {exercise.metadata.arabic}
        </ArabicText>
      ) : null}
      {audioUrl ? (
        <AudioPlayer key={audioUrl} src={audioUrl} label="Écouter la prononciation" />
      ) : null}
      <BodyLarge className="text-center">{exercise.prompt}</BodyLarge>
      <div className="grid gap-2 sm:grid-cols-2" role="radiogroup" aria-label="Auto-évaluation" onKeyDown={handleRadioGroupKeyDown}>
        {options.map((option) => {
          const isChosen = answer?.optionIndex === option.position - 1;
          return (
            <button
              key={option.position}
              type="button"
              role="radio"
              aria-checked={isChosen}
              disabled={answer != null}
              onClick={() => onChoose(option)}
              className={
                "h-12 rounded-lg border px-4 text-base font-medium transition-colors " +
                (isChosen
                  ? "border-primary bg-secondary text-secondary-foreground"
                  : "border-input bg-popover text-foreground hover:bg-accent/50")
              }
            >
              {option.content}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/**
 * PHONETIC_DISCRIMINATION (24H-Q2-B) — écouter le mot puis identifier la
 * caractéristique phonétique réellement présente. QCM noté (binaire), mappé
 * sur la compétence audio_recognition. Aucun micro, aucun enregistrement :
 * c'est de l'écoute, pas de la production (distinct de PRONUNCIATION_GUIDED).
 *
 * Accessibilité : une alternative visuelle (« Afficher le mot ») est proposée
 * pour ne jamais dépendre exclusivement du son.
 */
function PhoneticDiscriminationExercise({ exercise, answer, onChoose }: OptionsExerciseProps) {
  const [showWord, setShowWord] = useState(false);
  const audioUrl = exercise.metadata.audioUrl as string | undefined;
  const symbols = (exercise.metadata.phoneticSymbols as Record<string, string> | undefined) ?? {};
  const options = stableOptionOrder(
    exercise.options,
    `${exercise.type}:${exercise.metadata.targetWordId}:${exercise.prompt}`,
  );

  return (
    <div className="flex flex-col gap-5">
      {audioUrl ? (
        <AudioPlayer key={audioUrl} src={audioUrl} label="Écouter le mot" />
      ) : null}
      <BodyLarge className="text-center">{exercise.prompt}</BodyLarge>
      <div
        className="grid gap-2 sm:grid-cols-2"
        role="radiogroup"
        aria-label="Caractéristiques possibles"
        onKeyDown={handleRadioGroupKeyDown}
      >
        {options.map((option) => {
          const isChosen = answer?.optionIndex === option.position - 1;
          const symbol = symbols[option.content];
          return (
            <Button
              key={option.position}
              variant={isChosen ? "secondary" : "outline"}
              className="h-auto min-h-12 whitespace-normal px-4 py-3 justify-center"
              role="radio"
              aria-checked={isChosen}
              disabled={answer != null}
              onClick={() => onChoose(option)}
            >
              <span className="flex items-center justify-center gap-2">
                {symbol ? (
                  <ArabicText as="span" className="font-normal">
                    {symbol}
                  </ArabicText>
                ) : null}
                <span>{option.content}</span>
              </span>
            </Button>
          );
        })}
      </div>

      {/* Alternative visuelle (accessibilité) : ne dépend jamais du son seul. */}
      {!showWord ? (
        <button
          type="button"
          onClick={() => setShowWord(true)}
          className="self-center text-body-sm text-muted-foreground underline underline-offset-2 hover:text-foreground"
        >
          Afficher le mot (alternative visuelle)
        </button>
      ) : (
        <div className="flex flex-col items-center gap-1">
          <Caption className="text-muted-foreground">Le mot étudié</Caption>
          <ArabicText className="text-h2 text-center">
            {(exercise.metadata.arabic as string | undefined) ?? ""}
          </ArabicText>
        </div>
      )}
    </div>
  );
}

/**
 * PRONUNCIATION_GUIDED — lecture guidée + production guidée (24H-Q1).
 * Auto-évaluée : aucune analyse, jamais CORRECT/INCORRECT, jamais de score.
 * La complétion appelle onChoose (option synthétique) pour faire avancer le
 * lecteur sans toucher à la maîtrise.
 */
function PronunciationGuidedExercise({ exercise, answer, onChoose }: OptionsExerciseProps) {
  return (
    <PronunciationGuided
      arabic={(exercise.metadata.arabic as string | undefined) ?? ""}
      transliteration={(exercise.metadata.transliteration as string | undefined) ?? null}
      meaning={(exercise.metadata.meaning as string | undefined) ?? null}
      audioUrl={(exercise.metadata.audioUrl as string | undefined) ?? null}
      hints={(exercise.metadata.phoneticHints as string[] | undefined) ?? []}
      marks={(exercise.metadata.phoneticMarks as PhoneticMark[] | undefined) ?? []}
      completed={answer != null}
      onComplete={() =>
        onChoose({
          position: 1,
          content: "Prononciation travaillée",
          isCorrect: true,
          wordId: exercise.metadata.targetWordId,
        })
      }
    />
  );
}

const ARABIC_RE = /[\u0600-\u06FF]/;

const EXERCISE_COMPONENTS: Record<
  ExerciseType,
  ((props: OptionsExerciseProps) => ReactElement) | null
> = {
  WORD_TO_TRANSLATION: WordToTranslation,
  TRANSLATION_TO_WORD: TranslationToWord,
  REVERSE_TRANSLATION: ReverseTranslation,
  MULTIPLE_CHOICE: MultipleChoice,
  COMPLETE_WORD: CompleteWord,
  WORD_RECOGNITION: WordRecognition,
  FORM_TO_MEANING: RecallExercise,
  MEANING_TO_FORM: RecallExercise,
  AUDIO_TO_WORD: AudioToWordExercise,
  WORD_TO_AUDIO: WordToAudioExercise,
  CONTEXT_RECOGNITION: ContextRecognitionExercise,
  LEMMA_RELATION: OptionsExercise,
  PRONUNCIATION_GUIDED: PronunciationGuidedExercise,
  PHONETIC_DISCRIMINATION: PhoneticDiscriminationExercise,
};

/**
 * Carte d'exercice : rend le composant adapté au type réel de l'exercice,
 * en passant les données du moteur sans aucune transformation métier.
 */
export function ExerciseCard(props: OptionsExerciseProps) {
  const Component = EXERCISE_COMPONENTS[props.exercise.type];
  if (!Component) {
    return (
      <BodyLarge className="text-center text-muted-foreground">
        Ce type d&apos;exercice n&apos;est pas encore disponible.
      </BodyLarge>
    );
  }
  // Remount uniquement le composant d'interaction : le player, le shell et
  // la progression restent montés. Cela nettoie les states locaux entre deux
  // exercices sans ajouter de logique métier.
  return <Component key={exerciseIdentity(props.exercise)} {...props} />;
}
