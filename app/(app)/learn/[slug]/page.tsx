import Link from "next/link";
import { notFound } from "next/navigation";
import { LessonPlayer } from "@/components/learn/lesson-player";
import { attachExerciseIdentities } from "@/components/learn/exercises/exercise-identity";
import {
  generateExercise,
  generateLessonExercises,
  generatePhoneticDiscriminationSet,
} from "@/lib/exercises";
import type { ExerciseType, GeneratedExercise } from "@/lib/exercises";
import {
  DEFAULT_LESSON_EXERCISE_TYPES,
  buildWordBank,
  buildCumulativeSequence,
  buildInterleavedSequence,
} from "@/lib/learning";
import {
  getLearningContext,
  getLessonAyahContext,
  getLessonSession,
  getLessonWithWords,
  getValidatedFrenchMeanings,
  getValidatedFrenchLemmaMeaningsByWord,
  getWordAudioState,
  getValidatedWordExplanationContexts,
  getValidatedWordExplanations,
  getWordAyahContexts,
  getWordLemmaRelations,
  getWordLinguisticEvidence,
  getUserSkillProgress,
} from "@/lib/learning/queries";
import { createClient } from "@/lib/supabase/server";
import type { LessonAyahContext } from "@/lib/learning/queries";
import type { WordContextData } from "@/lib/learning/types";
import { resolveSenseExplanation } from "@/lib/learning/sense-explanation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { H2, BodyMedium, BodySmall, Caption } from "@/components/ui/typography";
import { Mascot } from "@/components/ui/mascot";
import { BookOpenIcon } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function LessonPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<{ welcome?: string }>;
}) {
  const { slug } = await params;
  const showWelcome = (await searchParams)?.welcome === "1";
  const client = await createClient();
  const {
    data: { user },
  } = await client.auth.getUser();

  const result = await getLessonWithWords(client, slug);
  if (!result) notFound();

  const { lesson, words, surahNumber } = result;
  // Seules les leçons publiées sont accessibles (le parcours ne propose que celles-ci).
  if (lesson.status !== "published") notFound();

  // Lexique français Hikma VALIDÉ — forme puis lemme (Phase 17C) — fallback EN sinon.
  const [frenchByWord, lemmaFrenchByWord] = await Promise.all([
    getValidatedFrenchMeanings(client, words.map((w) => w.word.id)),
    getValidatedFrenchLemmaMeaningsByWord(client, words.map((w) => w.word.id)),
  ]);
  const bank = buildWordBank(words, frenchByWord, lemmaFrenchByWord);
  const wordIds = words.map((w) => w.word.id);

  // Audio réel Muallim : URL signées (une par forme). Jamais d'audio simulé.
  // `audio.registered` distingue « aucun audio enregistré » (badge) d'un
  // échec technique de signature (journalisé côté serveur, jamais présenté
  // comme « indisponible »).
  const audio = await getWordAudioState(client, wordIds);
  const audioByWord = audio.urls;

  // Prononciation guidée (24H-Q1) : un seul exercice auto-évalué, sur le
  // PREMIER mot de la leçon (déterministe). Hors séquence notée : il ne touche
  // ni la session persistante (24E), ni la maîtrise, ni le scoring.
  const guidedPronunciation =
    bank.length > 0
      ? generateExercise("PRONUNCIATION_GUIDED", {
          target: bank[0]!,
          bank,
          difficulty: lesson.difficulty,
          audioUrl: audioByWord.get(bank[0]!.wordId) ?? null,
        })
      : null;

  // Contexte réel du verset (CONTEXT_RECOGNITION) + relations forme→lemme
  // réelles (LEMMA_RELATION). Aucune donnée inventée : un mot sans contexte ou
  // sans « frère » de lemme ne produira simplement pas l'exercice correspondant.
  // Couche linguistique MASAQ (Phase 24I) — lecture seule, sourate 1 uniquement
  // (seule sourate importée). EXPLICATION uniquement : aucun effet sur le
  // grading, le SRS, la maîtrise, le word bank ni la génération des exercices.
  // Couche « explication de sens » (Phase 44B) : formulations validées, résolues
  // par FORME puis par contexte (surah:ayah) — passive, aucun effet moteur.
  const [contextByWord, lemmaByWord, linguisticByWord, explanationsByWord, explanationContextsByWord] =
    await Promise.all([
      getWordAyahContexts(client, wordIds, surahNumber),
      getWordLemmaRelations(client, wordIds),
      getWordLinguisticEvidence(client, wordIds, surahNumber),
      getValidatedWordExplanations(client, wordIds),
      getValidatedWordExplanationContexts(client, wordIds),
    ]);

  // Séquence d'exercices :
  //   - utilisateur connecté → séquence CUMULATIVE ordonnée par compétence
  //     (reconnaissance → rappel → audio), en sautant les compétences déjà
  //     maîtrisées (un utilisateur avancé ne recommence pas tout) ;
  //   - visiteur → ordre par défaut (déterministe).
  let exercises: GeneratedExercise[];
  if (user) {
    const progress = await getUserSkillProgress(client, user.id, wordIds);
    exercises = buildCumulativeSequence(bank, progress)
      .map((step) =>
        generateExercise(step.exerciseType, {
          target: bank.find((b) => b.wordId === step.wordId)!,
          bank,
          difficulty: lesson.difficulty,
          audioUrl: audioByWord.get(step.wordId) ?? null,
          context: contextByWord.get(step.wordId) ?? null,
          lemma: lemmaByWord.get(step.wordId) ?? null,
        }),
      )
      .filter((ex): ex is GeneratedExercise => ex != null);
  } else {
    exercises = generateLessonExercises(
      bank,
      DEFAULT_LESSON_EXERCISE_TYPES as readonly string[] as ExerciseType[],
      lesson.difficulty,
      audioByWord,
      contextByWord,
      lemmaByWord,
    );
  }

  // Q2-B — discrimination phonétique (exposition limitée, déterministe).
  // Ajouté APRÈS la séquence de base (visiteur comme connecté) : jamais plus de
  // PHONETIC_DISCRIMINATION_MAX_PER_LESSON exercices par leçon, uniquement pour
  // les mots ayant un audio réel ET une caractéristique phonétique réellement
  // présente. Alimente la compétence audio_recognition (aucune nouvelle skill).
  exercises = [
    ...exercises,
    ...generatePhoneticDiscriminationSet(bank, audioByWord, lesson.difficulty),
  ];
  // L'explication après erreur réutilise les mêmes données vérifiées que la
  // génération : aucune requête ni donnée pédagogique parallèle n'est créée.
  // Ces champs restent optionnels et n'apparaissent qu'après soumission.
  // Explication de sens (Phase 44B) : générique validée, ou override contextuel
  // si le verset du mot (contexte réel de l'exercice) est couvert. Résolution
  // PURE (resolveSenseExplanation) : aucune inférence, l'absence d'explication
  // est un état valide.
  exercises = exercises.map((exercise) => {
    const target = bank.find((word) => word.wordId === exercise.metadata.targetWordId);
    const wordId = exercise.metadata.targetWordId;
    const lemmaMeaning = lemmaFrenchByWord.get(wordId)?.text ?? null;
    const exerciseContext = (exercise.metadata.context ?? contextByWord.get(wordId)) as WordContextData | null | undefined;
    return {
      ...exercise,
      metadata: {
        ...exercise.metadata,
        audioUrl: exercise.metadata.audioUrl ?? audioByWord.get(wordId) ?? null,
        context: exerciseContext,
        lemma: exercise.metadata.lemma ?? lemmaByWord.get(wordId),
        lemmaMeaning,
        meaningValidated: target?.isValidated === true,
        senseExplanation: resolveSenseExplanation(
          explanationsByWord.get(wordId),
          explanationContextsByWord.get(wordId),
          exerciseContext,
        ),
        linguisticEvidence:
          exercise.metadata.linguisticEvidence ?? linguisticByWord.get(wordId) ?? null,
      },
    };
  });
  exercises = buildInterleavedSequence(exercises);
  exercises = attachExerciseIdentities(lesson.id, exercises);

  // Contexte du verset étudié, en FRANÇAIS réel (table translations, Hamidullah).
  const ayahContext = await getLessonAyahContext(
    client,
    words.map((w) => w.word.id),
    3,
    surahNumber,
  );

  // Leçon suivante + progression du parcours (pour l'écran de fin).
  const ctx = await getLearningContext(
    client,
    user?.id ?? null,
    result.surahNumber != null ? { surahNumber: result.surahNumber } : {},
  );
  let nextLesson: { title: string; href: string } | null = null;
  let pathProgress: { completed: number; total: number } | null = null;
  // Nom de la sourate (transliteration) pour la célébration — jamais inventé.
  let surahName: string | null = null;
  if (ctx.curriculum) {
    const allLessons = ctx.curriculum.units.flatMap((u) => u.lessons);
    const idx = allLessons.findIndex((l) => l.id === lesson.id);
    const next = idx >= 0 ? allLessons[idx + 1] : undefined;
    if (next) nextLesson = { title: next.title, href: `/learn/${next.slug}` };
    pathProgress = { completed: ctx.lessonsCompleted, total: ctx.totalLessons };
    // Le titre de la première unité est le nom de la sourate (éditorial ou généré).
    surahName = ctx.curriculum.units[0]?.title ?? null;
  }

  // Sens mot-à-mot : la langue pédagogique est le français. Si un FR Hikma
  // validé existe il est utilisé ; sinon repli explicite sur la gloss EN.
  const meaningFallback = bank.some((b) => b.meaningFallback);

  // Session persistante (Phase 24E) : reprise exacte de la position pour un
  // utilisateur connecté (séquence déterministe reconstruite au chargement).
  const resumeState = user
    ? await getLessonSession(client, user.id, lesson.id)
    : null;

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-8 px-5 py-6 sm:px-8 sm:py-8">
      {!user ? <TrialBanner /> : null}
      {showWelcome ? (
        <PreLesson
          surahName={surahName}
          lessonTitle={lesson.title}
          wordCount={bank.length}
          exerciseCount={exercises.length}
        />
      ) : null}
      <LessonPlayer
        lessonId={lesson.id}
        lessonTitle={lesson.title}
        surahName={surahName}
        lessonObjective={lesson.objective}
        exercises={exercises}
        discovery={bank.map((word) => {
          const ctx = contextByWord.get(word.wordId);
          return {
            ...word,
            audioUrl: audioByWord.get(word.wordId) ?? null,
            // Signature Hikma (Phase 36C) : référence d'ayah RÉELLE du mot,
            // jamais inventée (null si le mot n'a pas de contexte dans la sourate).
            ayahRef: ctx
              ? `${surahName ?? `Sourate ${ctx.surahNumber}`} ${ctx.surahNumber}:${ctx.ayahNumber}`
              : null,
          };
        })}
        guidedPronunciation={guidedPronunciation}
        isAuthenticated={user != null}
        nextLesson={nextLesson}
        pathProgress={pathProgress}
        resumeState={resumeState}
        ayahContext={ayahContext as LessonAyahContext[]}
        meaningFallback={meaningFallback}
        audioUnavailable={audio.registered === 0}
      />
    </main>
  );
}

/**
 * Bandeau « page d’essai » pour les visiteurs anonymes : la leçon est
 * consultable sans compte, mais la progression n’est pas enregistrée.
 */
function TrialBanner() {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-hikma-gold/40 bg-hikma-gold/8 px-5 py-4 text-center sm:flex-row sm:justify-between sm:text-left">
      <div className="flex flex-col gap-1">
        <BodySmall className="font-semibold text-text-primary">Page d’essai</BodySmall>
        <BodySmall className="text-text-secondary">
          Tu découvres cette leçon sans compte : ta progression ne sera pas enregistrée. Connecte-toi pour la
          sauvegarder et reprendre où tu t’es arrêté.
        </BodySmall>
      </div>
      <Button render={<Link href="/login" />} variant="outline" size="sm" className="shrink-0 rounded-full">
        Se connecter
      </Button>
    </div>
  );
}

/**
 * Phase 71B P2-05 / Phase 71C D-01 — transition onboarding → première leçon.
 *
 * Présente la leçon à venir avec une introduction narrative courte,
 * sans jargon technique. Le principe : ACTION > EXPLICATION.
 */
function PreLesson({
  surahName,
  lessonTitle,
  wordCount,
  exerciseCount,
}: {
  surahName: string | null;
  lessonTitle: string;
  wordCount: number;
  exerciseCount: number;
}) {
  return (
    <Card className="border-hikma-gold/32 bg-surface-featured">
      <CardContent className="gap-6 p-6 text-center sm:p-8">
        <Mascot variant="learn" size="md" decorative />
        <div className="flex flex-col gap-2">
          <H2>Ta première leçon</H2>
          <BodyMedium className="text-text-secondary">
            {surahName ? `Tu commences avec ${surahName} — ${lessonTitle}.` : lessonTitle}
          </BodyMedium>
        </div>
        <div className="flex items-center justify-center gap-4">
          <Caption className="tabular-nums">
            <span className="font-semibold text-foreground">{wordCount}</span>{" "}
            mot{wordCount > 1 ? "s" : ""} à découvrir
          </Caption>
          <span className="text-border-subtle" aria-hidden="true">·</span>
          <Caption className="tabular-nums">
            <span className="font-semibold text-foreground">{exerciseCount}</span>{" "}
            exercice{exerciseCount > 1 ? "s" : ""}
          </Caption>
        </div>
        <BodyMedium className="text-text-secondary">
          Tu vas découvrir les mots de cette sourate un par un.
          Essaie de retrouver leur sens — Hikma t’accompagnera à chaque réponse.
          Plus tard, ces mots reviendront au bon moment pour que tu les retiennes durablement.
        </BodyMedium>
        <div className="flex items-center justify-center gap-2 text-sm text-hikma-gold-muted">
          <BookOpenIcon aria-hidden="true" className="size-4" />
          Commence quand tu es prêt.
        </div>
      </CardContent>
    </Card>
  );
}
