import { CheckCircle2Icon, InfoIcon, SparklesIcon } from "lucide-react";
import { ArabicText } from "@/components/ui/arabic-text";
import { AudioPlayer } from "@/components/ui/audio-player";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ExerciseFeedback } from "@/components/ui/exercise";
import { HikmaExplanation } from "@/components/ui/hikma-explanation";
import { HikmaFeedback, HikmaProgress, HikmaReveal, HikmaWord } from "@/components/ui/hikma";
import { HikmaExerciseShell } from "@/components/learn/exercises/hikma-exercise-shell";
import { HikmaContextDisclosure, HikmaLessonFocusHeader } from "@/components/learn/hikma-lesson-focus";
import { stableOptionOrder } from "@/components/learn/exercises/option-order";
import { Mascot } from "@/components/ui/mascot";
import { HikmaLogo } from "@/components/ui/hikma-logo";
import { Progress } from "@/components/ui/progress";
import { BodyLarge, BodyMedium, BodySmall, Caption, Display, H1, H2, H3, H4, Label } from "@/components/ui/typography";

const palette = [
  ["background", "#F8F8F0", "bg-background"],
  ["surface", "#FFFDF8", "bg-surface"],
  ["surface-elevated", "#FFFDF8", "bg-surface-elevated"],
  ["surface-interactive", "#DDEDEA", "bg-surface-interactive"],
  ["primary", "#083838", "bg-primary"],
  ["primary-strong", "#0B5552", "bg-primary-strong"],
  ["success", "#2EB872", "bg-success"],
  ["warning", "#FFC107", "bg-warning"],
  ["error", "#EF4444", "bg-error"],
  ["info", "#2D7A58", "bg-info"],
  ["text-primary", "#182028", "bg-text-primary"],
  ["text-secondary", "#536666", "bg-text-secondary"],
  ["border", "#D7E0DC", "bg-border"],
] as const;

const brandPalette = [
  ["Teal profond", "#002828", "bg-hikma-teal-900", "profondeur et surfaces principales"],
  ["Teal secondaire", "#083838", "bg-hikma-teal-800", "actions et navigation"],
  ["Or chaud", "#C8A058", "bg-hikma-gold", "accent premium rare"],
  ["Or atténué", "#B89050", "bg-hikma-gold-muted", "détails et dark mode"],
  ["Ivoire", "#F8F8F0", "bg-hikma-ivory", "canvas principal"],
  ["Blanc chaud", "#FFFDF8", "bg-hikma-cream", "surfaces neutres"],
  ["Teal très doux", "#F1F6F3", "bg-surface-subtle", "surfaces pédagogiques"],
  ["Teal interactif", "#DDEDEA", "bg-hikma-teal-100", "zones actives douces"],
  ["Charbon", "#182028", "bg-hikma-charcoal", "titres et foreground"],
] as const;

const typeScale = [
  ["Display · 56px · 1.1", <Display key="display">Une sagesse qui demeure</Display>],
  ["H1 · 32px · 1.2", <H1 key="h1">Une sagesse qui demeure</H1>],
  ["H2 · 24px · 1.3", <H2 key="h2">Une sagesse qui demeure</H2>],
  ["H3 · 20px · 1.3", <H3 key="h3">Une sagesse qui demeure</H3>],
  ["H4 · 16px · 1.4", <H4 key="h4">Une sagesse qui demeure</H4>],
  ["Body large · 17px · 1.6", <BodyLarge key="body-large">La compréhension grandit avec une pratique régulière et attentive.</BodyLarge>],
  ["Body · 15px · 1.6", <BodyMedium key="body">La compréhension grandit avec une pratique régulière et attentive.</BodyMedium>],
  ["Body small · 13px · 1.6", <BodySmall key="body-small">La compréhension grandit avec une pratique régulière et attentive.</BodySmall>],
  ["Caption · 12px · 1.4", <Caption key="caption">La compréhension grandit avec une pratique régulière.</Caption>],
] as const;

export default function DesignSystemPage() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-16 px-5 py-10 sm:px-8 sm:py-16">
      <header className="flex max-w-3xl flex-col gap-4">
        <Label>Laboratoire visuel · fondation V2</Label>
        <H1>Le langage visuel de Hikma</H1>
        <BodyLarge className="text-text-secondary">
          Une interface chaleureuse, précise et calme. Cette page est la source de vérification des tokens, surfaces, états, arabe, audio et motion.
        </BodyLarge>
      </header>

      <section className="flex flex-col gap-6" aria-labelledby="brand-identity-title">
        <div><H2 id="brand-identity-title">Hikma Brand Identity</H2><Caption>Le logo réel et les tokens officiels : teal profond, or chaud, ivoire et charbon.</Caption></div>
        <div className="grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
          <Card className="rounded-4xl border-hikma-gold/40 bg-hikma-ivory shadow-elevated"><CardContent className="items-center gap-3 p-6 text-center sm:p-8"><HikmaLogo size="lg" /><Caption>Logo officiel · proportions et transparence conservées</Caption></CardContent></Card>
          <div className="grid gap-3 sm:grid-cols-2">
            {brandPalette.map(([name, value, swatch, role]) => <Card key={name}><CardContent className="gap-3 p-4"><div className={`h-16 rounded-xl border border-border ${swatch}`} aria-hidden="true" /><div className="flex items-baseline justify-between gap-3"><BodySmall className="font-medium">{name}</BodySmall><Caption className="font-mono">{value}</Caption></div><Caption>{role}</Caption></CardContent></Card>)}
          </div>
        </div>
        <div className="rounded-3xl bg-hikma-charcoal-deep p-4 sm:p-6"><div className="flex items-center justify-center rounded-2xl bg-hikma-ivory p-3"><HikmaLogo size="sm" /></div><Caption className="mt-3 block text-center text-hikma-ivory">Sur fond sombre, le logo reste posé sur une surface ivoire pour préserver le wordmark charbon.</Caption></div>
      </section>

      <section className="flex flex-col gap-6" aria-labelledby="colors-title">
        <div><H2 id="colors-title">Couleurs sémantiques</H2><Caption>Chaque couleur a un rôle ; les variantes textuelles AA portent le contenu.</Caption></div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {palette.map(([name, value, swatch]) => (
            <div key={name} className="flex flex-col gap-2 rounded-2xl border border-border bg-surface-elevated p-3 shadow-card">
              <div className={`h-16 rounded-xl border border-border ${swatch}`} aria-hidden="true" />
              <BodySmall className="font-medium">{name}</BodySmall>
              <Caption className="font-mono">{value}</Caption>
            </div>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-6" aria-labelledby="type-title">
        <div><H2 id="type-title">Typographie</H2><Caption>Poppins pour le français, Amiri pour l’arabe. Le texte reste respirant sur mobile.</Caption></div>
        <div className="flex flex-col divide-y divide-border-subtle rounded-3xl border border-border bg-surface-elevated px-5 shadow-card sm:px-8">
          {typeScale.map(([label, node]) => <div key={label} className="flex flex-col gap-2 py-5"><Caption>{label}</Caption>{node}</div>)}
        </div>
      </section>

      <section className="flex flex-col gap-6" aria-labelledby="arabic-title">
        <div><H2 id="arabic-title">Arabe et apprentissage</H2><Caption>RTL local, diacritiques intactes, aucun letter-spacing et line-height généreux.</Caption></div>
        <Card className="border-border-subtle bg-surface-subtle shadow-card"><CardContent className="items-center gap-4 p-6 text-center sm:p-8">
          <ArabicText as="div" scale="verse">بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ</ArabicText>
          <Caption>bis-mi llāhi r-raḥmāni r-raḥīm</Caption>
          <BodyLarge>Au nom d’Allah, le Tout Miséricordieux, le Très Miséricordieux.</BodyLarge>
          <div className="flex flex-wrap justify-center gap-2"><Badge variant="success">Diacritiques visibles</Badge><Badge variant="outline">RTL local</Badge><Badge variant="secondary">Amiri</Badge></div>
        </CardContent></Card>
        <div className="grid gap-4 sm:grid-cols-2"><HikmaWord arabic="حِكْمَة" transliteration="ḥikma" meaning="Sagesse" validated /><HikmaWord arabic="نُور" transliteration="nūr" meaning="Lumière" /></div>
      </section>

      <section className="flex flex-col gap-6" aria-labelledby="controls-title">
        <div><H2 id="controls-title">Actions, progression et états</H2><Caption>Une hiérarchie tactile claire, sans surcharge décorative.</Caption></div>
        <div className="grid gap-4 lg:grid-cols-2">
          <Card><CardContent className="gap-5 p-6"><H3>Boutons</H3><div className="flex flex-wrap gap-3"><Button>Commencer</Button><Button variant="secondary">Continuer</Button><Button variant="outline">Plus tard</Button><Button variant="ghost">Détails</Button></div></CardContent></Card>
          <Card><CardContent className="gap-5 p-6"><H3>Progression</H3><Progress value={62} aria-label="Progression de démonstration" /><HikmaProgress value={62} label="Retrouver le sens" detail="3 mots restants" /></CardContent></Card>
          <Card><CardContent className="gap-5 p-6"><H3>Feedback</H3><HikmaFeedback status="correct">Le sens correspond à ta réponse.</HikmaFeedback><HikmaFeedback status="ambiguous">La bonne réponse apparaîtra après ton effort.</HikmaFeedback></CardContent></Card>
          <Card><CardContent className="gap-5 p-6"><H3>Révélation</H3><BodyMedium>Un indice reste volontairement caché jusqu’à ce que tu le demandes.</BodyMedium><HikmaReveal><BodyMedium>La première lettre est <ArabicText scale="small">ح</ArabicText>.</BodyMedium></HikmaReveal></CardContent></Card>
        </div>
      </section>

      <section className="flex flex-col gap-6" aria-labelledby="audio-title">
        <div><H2 id="audio-title">Audio et motion</H2><Caption>Le lecteur conserve ses états ; la motion guide l’attention et respecte reduced motion.</Caption></div>
        <Card><CardContent className="items-center gap-4 p-6"><AudioPlayer src="/audio/design-system-demo.mp3" label="Écouter la démonstration" /><div className="flex items-center gap-2 text-success-text"><CheckCircle2Icon className="size-4" aria-hidden="true" /> <BodySmall>Une seule lecture audio active à la fois.</BodySmall></div></CardContent></Card>
      </section>

      <section className="flex flex-col gap-6" aria-labelledby="exercise-shell-title">
        <div>
          <H2 id="exercise-shell-title">Exercise Shell</H2>
          <Caption>Une grammaire commune pour la consigne, l’interaction, le feedback et l’action suivante.</Caption>
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <HikmaExerciseShell
            step={12}
            total={53}
            skill="Comprendre le sens"
            status="ready"
            primaryAction={<Button className="min-h-12 w-full sm:w-auto">Vérifier</Button>}
          >
            <BodyLarge className="text-center font-medium">Quel mot signifie « nous adorons » ?</BodyLarge>
            <div className="grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label="Exemple d’options">
              <Button variant="outline" className="min-h-12 whitespace-normal">نَعْبُدُ</Button>
              <Button variant="outline" className="min-h-12 whitespace-normal">نَسْتَعِينُ</Button>
            </div>
          </HikmaExerciseShell>

          <HikmaExerciseShell
            step={12}
            total={53}
            skill="Retrouver le sens"
            status="feedback"
            feedback={<HikmaFeedback status="correct">Tu as identifié le bon mot.</HikmaFeedback>}
            primaryAction={<Button variant="secondary" className="min-h-12 w-full sm:w-auto">Continuer</Button>}
          >
            <BodyLarge className="text-center font-medium">Quel est le sens de ce mot ?</BodyLarge>
            <div className="rounded-2xl border border-border-subtle bg-surface-subtle p-5 text-center">
              <ArabicText as="div" scale="word">حِكْمَة</ArabicText>
            </div>
          </HikmaExerciseShell>

          <HikmaExerciseShell
            step={13}
            total={53}
            skill="Écouter et identifier"
            status="loading"
            primaryAction={<Button disabled className="min-h-12 w-full sm:w-auto">Validation…</Button>}
          >
            <BodyLarge className="text-center font-medium">Écoute attentivement, puis choisis le mot.</BodyLarge>
            <div className="flex justify-center rounded-2xl border border-border-subtle bg-surface-subtle p-5">
              <AudioPlayer src="/audio/design-system-demo.mp3" label="Écouter le mot" />
            </div>
          </HikmaExerciseShell>

          <HikmaExerciseShell
            step={14}
            total={53}
            skill="Retrouver la forme arabe"
            status="feedback"
            feedback={<HikmaFeedback status="incorrect">La bonne réponse apparaît ici après ton effort.</HikmaFeedback>}
            primaryAction={<Button variant="secondary" className="min-h-12 w-full sm:w-auto">Continuer</Button>}
          >
            <BodyLarge className="text-center font-medium">Quel est le mot arabe correspondant ?</BodyLarge>
            <div className="h-12 rounded-xl border border-border bg-surface-subtle" aria-hidden="true" />
          </HikmaExerciseShell>
        </div>
      </section>

      <section className="flex flex-col gap-6" aria-labelledby="exercise-feedback-title">
        <div>
          <H2 id="exercise-feedback-title">Exercise Feedback</H2>
          <Caption>Le résultat vient après la réponse et reste séparé de la zone interactive.</Caption>
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          <Card><CardContent className="gap-4 p-6"><H3>Correct</H3><HikmaFeedback status="correct">Le mot correspond à ta réponse.</HikmaFeedback><Button className="min-h-12">Continuer</Button></CardContent></Card>
          <Card><CardContent className="gap-4 p-6"><H3>Incorrect</H3><HikmaFeedback status="incorrect">La correction est affichée après ton effort.</HikmaFeedback><Button variant="secondary" className="min-h-12">Continuer</Button></CardContent></Card>
          <Card><CardContent className="gap-4 p-6"><H3>Ambigu</H3><HikmaFeedback status="ambiguous">La réponse reste à vérifier.</HikmaFeedback><Button variant="secondary" className="min-h-12">Continuer</Button></CardContent></Card>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Card><CardContent className="gap-4 p-6"><H3>Correction arabe</H3><HikmaFeedback status="incorrect"><ArabicText scale="small">يَوْمِ</ArabicText> signifie « jour ».</HikmaFeedback></CardContent></Card>
          <Card><CardContent className="gap-4 p-6"><H3>États techniques</H3><HikmaFeedback status="ambiguous">Aucun signal détecté : réessaie sans jugement automatique.</HikmaFeedback><Button disabled className="min-h-12">Chargement…</Button></CardContent></Card>
        </div>
      </section>

      <section className="flex flex-col gap-6" aria-labelledby="pedagogical-feedback-title">
        <div>
          <H2 id="pedagogical-feedback-title">Islamic UX &amp; Pedagogical Feedback</H2>
          <Caption>Le feedback aide à comprendre sans transformer la progression en mécanique de récompense.</Caption>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardContent className="gap-4 p-6">
              <H3>Réussite ordinaire</H3>
              <ExerciseFeedback status="correct" correctTitle="Très bien" correctMessage="Réponse juste." />
              <Caption>Copie neutre, utilisée pour une réussite courante.</Caption>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="gap-4 p-6">
              <H3>Réussite significative</H3>
              <ExerciseFeedback status="correct" correctTitle="Mā shā’ Allāh" correctMessage="Tu viens de franchir une étape importante." />
              <Caption>Expression réservée à un moment difficile ou à un jalon.</Caption>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="gap-4 p-6">
              <H3>Incorrect · explication fermée</H3>
              <ExerciseFeedback
                status="incorrect"
                userAnswer="ils adorent"
                correctContent="nous adorons"
                explanationData={{
                  availability: "partial",
                  kind: "meaning",
                  shortText: "La réponse attendue correspond au sens enregistré pour ce mot.",
                  arabic: "نَعْبُدُ",
                  transliteration: "naʿbudu",
                }}
              />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="gap-4 p-6">
              <H3>Incorrect · explication ouverte</H3>
              <HikmaExplanation
                defaultOpen
                data={{
                  availability: "verified",
                  kind: "phonetic",
                  shortText: "Le ◌ّ (shadda) double la consonne : on la tient un instant de plus.",
                  arabic: "إِيَّاكَ",
                  transliteration: "iyyāka",
                  phoneticHints: ["La vocalisation réelle reste visible dans la forme arabe."],
                }}
              />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="gap-4 p-6">
              <H3>Explication indisponible</H3>
              <HikmaExplanation
                data={{ availability: "unavailable", kind: "meaning" }}
              />
              <Caption>Une absence honnête vaut mieux qu’une analyse inventée.</Caption>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="gap-4 p-6">
              <H3>Langage contextuel</H3>
              <div className="flex flex-col gap-2 rounded-2xl border border-border-subtle bg-surface-subtle p-4">
                <BodyMedium className="font-medium">Bismillāh</BodyMedium>
                <BodySmall className="text-text-secondary">Entrée réelle dans une leçon.</BodySmall>
                <BodyMedium className="font-medium">Al-ḥamdulillāh</BodyMedium>
                <BodySmall className="text-text-secondary">Fin réelle d’une leçon ou d’une étape importante.</BodySmall>
              </div>
              <Caption>Jamais après chaque réponse correcte ; jamais comme un score.</Caption>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="flex flex-col gap-6" aria-labelledby="pedagogical-integrity-title">
        <div>
          <H2 id="pedagogical-integrity-title">Pedagogical Integrity</H2>
          <Caption>Le contexte reste utile, mais la réponse demeure cachée jusqu’à l’effort.</Caption>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <Card><CardContent className="gap-4 p-6"><H3>Context safe</H3><ArabicText as="div" scale="word">إِيَّاكَ نَعْبُدُ</ArabicText><div className="rounded-2xl border border-border-subtle bg-surface-subtle p-4"><Caption className="text-primary-strong">Contexte du verset</Caption><BodyMedium>Le contexte ne contient pas le sens ciblé.</BodyMedium></div><Badge variant="success">SAFE_CONTEXT</Badge></CardContent></Card>
          <Card><CardContent className="gap-4 p-6"><H3>Translation hidden</H3><ArabicText as="div" scale="word">نَعْبُدُ</ArabicText><HikmaReveal label="Afficher la traduction du verset"><BodyMedium>« C’est Toi seul que nous adorons. »</BodyMedium></HikmaReveal><Badge variant="warning">REVEAL_RISK</Badge></CardContent></Card>
          <Card><CardContent className="gap-4 p-6"><H3>Answer language</H3><div className="flex flex-wrap gap-2"><Badge variant="success">FR_VERIFIED</Badge><Badge variant="outline">EN_VERIFIED</Badge><Badge variant="secondary">UNKNOWN</Badge></div><Caption>La consigne ne promet que la langue réellement disponible.</Caption></CardContent></Card>
          <Card><CardContent className="gap-4 p-6"><H3>Distractors</H3><div className="flex flex-wrap gap-2"><Badge variant="success">VERIFIED</Badge><Badge variant="secondary">UNKNOWN fallback</Badge></div><Caption>Une relation inconnue reste inconnue ; aucune proximité linguistique n’est inventée.</Caption></CardContent></Card>
          <Card><CardContent className="gap-4 p-6"><H3>Explanations</H3><div className="flex flex-wrap gap-2"><Badge variant="success">VERIFIED</Badge><Badge variant="warning">PARTIAL</Badge><Badge variant="outline">UNAVAILABLE</Badge></div><HikmaExplanation data={{ availability: "unavailable", kind: "meaning" }} /></CardContent></Card>
          <Card><CardContent className="gap-4 p-6"><H3>Incorrect answer</H3><ExerciseFeedback status="incorrect" userAnswer="ils adorent" correctContent="nous adorons" explanationData={{ availability: "unavailable", kind: "meaning", arabic: "نَعْبُدُ", transliteration: "naʿbudu" }} /></CardContent></Card>
          <Card><CardContent className="gap-4 p-6"><H3>Arabic Quranic text</H3><ArabicText as="div" scale="word">ٱلرَّحْمَـٰنِ</ArabicText><Caption>ٱ · shadda · voyelles et alif khanjariyah conservés.</Caption></CardContent></Card>
        </div>
      </section>

      <section className="flex flex-col gap-6" aria-labelledby="option-ordering-title">
        <div>
          <H2 id="option-ordering-title">Option Ordering</H2>
          <Caption>La permutation d’affichage est stable par exercice, sans changer l’identité des réponses.</Caption>
        </div>
        {[
          ["exercise-a", "Exercice A"],
          ["exercise-b", "Exercice B"],
        ].map(([seed, label]) => {
          const ordered = stableOptionOrder([
            { position: 1, content: "sens A", isCorrect: false, wordId: null },
            { position: 2, content: "sens B", isCorrect: true, wordId: "demo" },
            { position: 3, content: "sens C", isCorrect: false, wordId: null },
            { position: 4, content: "sens D", isCorrect: false, wordId: null },
          ], seed);
          return (
            <Card key={seed}><CardContent className="gap-4 p-6"><H3>{label}</H3><div className="grid gap-3 sm:grid-cols-2">{ordered.map((option) => <Button key={option.position} variant={option.isCorrect ? "secondary" : "outline"} className="min-h-12">{option.content}{option.isCorrect ? " · réponse correcte" : ""}</Button>)}</div></CardContent></Card>
          );
        })}
      </section>

      <section className="flex flex-col gap-6" aria-labelledby="interleaving-title">
        <div>
          <H2 id="interleaving-title">Interleaved Exercise Sequence</H2>
          <Caption>Les compétences restent dans leur progression pédagogique, tandis que les types alternent quand une alternative valide existe.</Caption>
        </div>
        <Card><CardContent className="gap-5 p-6">
          <div className="flex flex-wrap items-center gap-2" aria-label="Exemple de séquence intercalée">
            {["Comprendre", "Retrouver", "Comprendre", "Écouter", "Retrouver", "Écouter"].map((stage, index) => (
              <div key={`${stage}-${index}`} className="flex items-center gap-2">
                <span className="rounded-full border border-primary/25 bg-surface-featured px-3 py-2 text-sm font-medium text-text-primary">{stage}</span>
                {index < 5 ? <span className="text-text-tertiary" aria-hidden="true">→</span> : null}
              </div>
            ))}
          </div>
          <BodySmall className="text-text-secondary">La variété sert le rappel actif ; elle ne contourne jamais les prérequis d’apprentissage.</BodySmall>
        </CardContent></Card>
      </section>

      <section className="flex flex-col gap-6" aria-labelledby="lesson-focus-title">
        <div>
          <H2 id="lesson-focus-title">Lesson Focus Mode</H2>
          <Caption>Un cadre calme qui rend la sortie, l’étape et l’action courante immédiatement lisibles.</Caption>
        </div>
        <Card><CardContent className="gap-6 p-6 sm:p-8">
          <HikmaLessonFocusHeader title="C’est Toi que nous adorons" stepLabel="Mot 2 sur 8" exit={<Button variant="ghost" size="icon" aria-label="Retour au parcours"><span aria-hidden="true">←</span></Button>} />
          <div className="flex flex-col items-center gap-4 rounded-4xl border border-border-subtle bg-surface-featured p-8 text-center">
            <Caption className="text-primary-strong">Étape 1 · Découverte</Caption>
            <ArabicText as="div" scale="word">إِيَّاكَ</ArabicText>
            <Caption className="text-text-secondary">iyyāka</Caption>
            <AudioPlayer src="/audio/design-system-demo.mp3" label="Écouter le modèle" />
            <Button variant="outline" className="min-h-12">Voir le sens</Button>
          </div>
          <HikmaContextDisclosure contexts={[{ surahNumber: 1, surahName: "L'ouverture", ayahNumber: 5, arabic: "إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ", french: "C’est toi que nous adorons, c’est toi dont nous implorons le secours.", globalAyahNumber: null }]} />
        </CardContent></Card>
      </section>

      <section className="flex flex-col gap-6" aria-labelledby="premium-lesson-title">
        <div>
          <H2 id="premium-lesson-title">Premium Lesson Experience</H2>
          <Caption>Une scène d’apprentissage centrée sur le mot, l’écoute et une progression calme.</Caption>
        </div>
        <Card className="rounded-4xl border-primary/18 bg-surface-featured shadow-elevated">
          <CardContent className="gap-7 p-6 sm:gap-8 sm:p-10">
            <div className="flex items-center justify-between gap-3">
              <Caption className="text-primary-strong">Mot actuel · 3 sur 8</Caption>
              <Caption className="text-text-secondary">Découverte</Caption>
            </div>
            <div className="flex flex-col items-center gap-4 py-3 text-center">
              <ArabicText as="div" scale="hero">ٱلرَّحْمَـٰنِ</ArabicText>
              <Caption className="text-text-secondary">ar-raḥmāni</Caption>
              <BodyMedium className="text-text-secondary">Le Tout Miséricordieux</BodyMedium>
              <AudioPlayer src="/audio/design-system-demo.mp3" label="Écouter le modèle" />
            </div>
            <div className="flex flex-col gap-4 border-t border-primary/15 pt-6">
              <div className="flex flex-col gap-1">
                <Caption className="text-primary-strong">Prononciation guidée</Caption>
                <BodyMedium>Écoute, répète, puis compare tranquillement.</BodyMedium>
              </div>
              <div className="grid gap-2 sm:grid-cols-3" aria-label="Étapes de prononciation guidée">
                {[
                  ["1", "Écoute"],
                  ["2", "Répète"],
                  ["3", "Compare"],
                ].map(([step, label]) => (
                  <div key={step} className="flex items-center gap-3 rounded-2xl border border-border-subtle bg-background p-4">
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-secondary text-sm font-semibold text-secondary-foreground">{step}</span>
                    <BodySmall>{label}</BodySmall>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
        <div className="grid gap-4 lg:grid-cols-[1fr_0.8fr]">
          <Card className="border-border-subtle bg-surface-subtle">
            <CardContent className="gap-4 p-6">
              <Caption className="text-primary-strong">Texte arabe du verset</Caption>
              <ArabicText as="div" scale="verse" className="text-center">إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ</ArabicText>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="gap-3 p-6">
              <Caption>Traduction française</Caption>
              <BodyLarge>« C’est toi que nous adorons, c’est toi dont nous implorons le secours. »</BodyLarge>
              <Caption className="text-text-secondary">L’ouverture · 1:5</Caption>
            </CardContent>
          </Card>
        </div>
        <Caption className="text-text-secondary">Référence de composition : arabe dominant, translittération secondaire, sens discret, audio compact, contexte séparé.</Caption>
      </section>

      <section className="flex flex-col gap-6" aria-labelledby="dashboard-title">
        <div><H2 id="dashboard-title">Dashboard</H2><Caption>Référence de composition : l’action d’apprentissage précède les détails.</Caption></div>
        <div className="flex flex-col gap-5 rounded-4xl border border-primary/20 bg-surface-featured p-6 shadow-elevated sm:p-8">
          <Caption className="text-primary-strong">Prochaine étape</Caption>
          <H3>La Basmala</H3>
          <BodyMedium className="text-text-secondary">Commence par quelques mots, puis avance à ton rythme.</BodyMedium>
          <HikmaProgress value={24} label="Ton parcours" detail="2 / 8 leçons" />
          <Button className="w-full sm:w-fit">Commencer la leçon</Button>
        </div>
        <div className="grid gap-4 sm:grid-cols-2"><Card><CardContent className="gap-4 p-6"><H3>Réviser</H3><BodyMedium className="text-text-secondary">12 mots t’attendent aujourd’hui.</BodyMedium><Button variant="secondary" className="w-fit">Réviser maintenant</Button></CardContent></Card><Card><CardContent className="gap-4 p-6"><H3>Tout est à jour</H3><BodyMedium className="text-text-secondary">Prochaine révision : demain.</BodyMedium><Caption>Exemple d’état sans révision due.</Caption></CardContent></Card></div>
      </section>

      <section className="flex flex-col gap-6" aria-labelledby="path-title">
        <div><H2 id="path-title">Learning Path</H2><Caption>Une continuité visuelle entre l’étape, la leçon actuelle et ce qui vient ensuite.</Caption></div>
        <div className="flex flex-col gap-3 sm:pl-12"><div className="rounded-2xl border border-success/25 bg-surface-elevated p-5"><div className="flex items-center gap-3"><span className="flex size-9 items-center justify-center rounded-full bg-success/8 text-success-text">✓</span><div><BodyMedium className="font-semibold">La Basmala</BodyMedium><Caption>Terminée · 100 %</Caption></div></div></div><div className="rounded-2xl border border-primary/35 bg-surface-featured p-5 shadow-elevated"><div className="flex items-center gap-3"><span className="flex size-9 items-center justify-center rounded-full bg-primary/10 text-primary-strong">→</span><div><Caption className="text-primary-strong">Tu es ici</Caption><BodyMedium className="font-semibold">C’est Toi que nous adorons</BodyMedium><Caption>Reprendre la leçon</Caption></div></div><HikmaProgress value={42} label="Progression de cette leçon" detail="42 %" /></div><div className="rounded-2xl border border-border-subtle bg-surface-subtle p-5"><div className="flex items-center gap-3"><span className="flex size-9 items-center justify-center rounded-full border border-border text-text-secondary">·</span><div><BodyMedium className="font-semibold">La prochaine étape</BodyMedium><Caption>Termine la leçon précédente pour continuer.</Caption></div></div></div></div>
      </section>

      <section className="flex flex-col gap-6" aria-labelledby="mascot-title">
        <div><H2 id="mascot-title">Signature Hikma</H2><Caption>La mascotte est contextuelle, statique et unique dans une vue.</Caption></div>
        <div className="flex flex-wrap items-center gap-8 rounded-3xl border border-border bg-surface-featured p-8"><Mascot variant="welcome" size="lg" message="Avance à ton rythme." /><div className="flex max-w-md flex-col gap-3"><SparklesIcon className="size-5 text-primary-strong" aria-hidden="true" /><BodyLarge>La profondeur vient du rythme, de l’espace et de la typographie — pas de la décoration.</BodyLarge><div className="flex items-center gap-2 text-info-text"><InfoIcon className="size-4" aria-hidden="true" /><Caption>Laboratoire interne, aucune page métier modifiée.</Caption></div></div></div>
      </section>

      <section className="flex flex-col gap-6" aria-labelledby="landing-product-story-title">
        <div>
          <H2 id="landing-product-story-title">Landing / Premium Conversion</H2>
          <Caption>Référence de composition Phase 7C : six actes éditoriaux, une preuve produit continue et une conversion visible sans réduire la pédagogie à des slogans.</Caption>
        </div>
        <Card className="rounded-4xl border-primary/20 bg-surface-featured shadow-elevated">
          <CardContent className="grid gap-6 p-6 sm:grid-cols-2 sm:p-8">
            <div className="flex flex-col gap-4">
              <Caption className="text-primary-strong">The Quranic Editorial Studio</Caption>
              <H3>Une page courte, une preuve continue.</H3>
              <BodyMedium className="text-text-secondary">La composition suit six actes : Hero → Product Proof → One Word / One Method → Feedback pédagogique → Fonctionnement Hikma → CTA final.</BodyMedium>
              <div className="flex flex-wrap gap-2"><span className="rounded-full border border-border-subtle bg-background px-3 py-1.5 text-sm">mot fil rouge</span><span className="rounded-full border border-border-subtle bg-background px-3 py-1.5 text-sm">feedback utile</span><span className="rounded-full border border-border-subtle bg-background px-3 py-1.5 text-sm">CTA intermédiaire</span></div>
            </div>
            <div className="flex flex-col gap-4 rounded-3xl border border-border-subtle bg-background p-6"><Caption className="text-primary-strong">VOIR → COMPRENDRE → SE RAPPELER → PRODUIRE → FEEDBACK</Caption><div className="flex flex-col items-center gap-3 text-center"><ArabicText as="div" scale="word">ٱلرَّحْمَـٰنِ</ArabicText><BodySmall className="text-text-secondary">ar-Raḥmān</BodySmall><BodyMedium className="text-text-primary">Le Tout Miséricordieux</BodyMedium></div><HikmaProgress value={38} label="Exemple de progression" detail="État démonstratif" /><div className="grid gap-2 sm:grid-cols-2"><span className="rounded-xl border border-border-subtle p-3 text-center text-sm">Arabe séparé du français</span><span className="rounded-xl border border-primary/25 bg-surface-featured p-3 text-center text-sm text-primary-strong">Un seul “Comprendre pourquoi”</span></div></div>
          </CardContent>
        </Card>
        <div className="grid gap-4 sm:grid-cols-2">
          <Card><CardContent className="gap-3 p-6"><H3>Composition arabe</H3><BodyMedium className="text-text-secondary">Toujours verticale : arabe vocalisé, translittération secondaire, traduction séparée. RTL local, diacritiques intactes, aucun chevauchement.</BodyMedium><Caption>Mobile minimum : 18px, line-height ≥ 1.9.</Caption></CardContent></Card>
          <Card><CardContent className="gap-3 p-6"><H3>CTA et feedback</H3><BodyMedium className="text-text-secondary">Le CTA hero ouvre l’expérience réelle ; un CTA intermédiaire suit la preuve ; le CTA final reste calme et explicite.</BodyMedium><Caption>Un seul disclosure pédagogique dans une scène de feedback.</Caption></CardContent></Card>
        </div>
      </section>
    </main>
  );
}
