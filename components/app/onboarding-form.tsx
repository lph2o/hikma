"use client";

import type { LucideIcon } from "lucide-react";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  Layers3,
  Languages,
  Leaf,
  Lightbulb,
  Sparkles,
  UserRound,
} from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArabicText } from "@/components/ui/arabic-text";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Mascot } from "@/components/ui/mascot";
import { BodyMedium, BodySmall, Caption, H1, H2, H3 } from "@/components/ui/typography";
import { completeOnboarding } from "@/lib/learning/actions";
import { recommendStartingSurah, type OnboardingProfile } from "@/lib/learning/onboarding";
import { getOnboardingSurahSummary, getOnboardingUxStage, isOnboardingSessionError } from "@/lib/learning/onboarding-presentation";
import type { SurahCatalogItem } from "@/lib/learning/queries";
import type {
  ArabicReadingLevel,
  LearningGoal,
  LearningPace,
  QuranFamiliarity,
} from "@/types/learning";
import { cn } from "@/lib/utils";

type Choice<T extends string> = {
  value: T;
  label: string;
  description?: string;
  icon?: LucideIcon;
};

const GOALS: Choice<LearningGoal>[] = [
  { value: "understand_recitation", label: "Comprendre ce que je récite", description: "Relier les mots à ta récitation.", icon: Lightbulb },
  { value: "memorize_vocabulary", label: "Mémoriser les mots du Coran", description: "Consolider progressivement les mots importants.", icon: BookOpen },
  { value: "understand_surahs", label: "Comprendre progressivement les sourates", description: "Avancer du mot vers le sens.", icon: Layers3 },
  { value: "build_vocabulary", label: "Enrichir mon vocabulaire arabe", description: "Faire grandir ton vocabulaire coranique.", icon: Languages },
  { value: "start_gently", label: "Simplement commencer", description: "Découvrir Hikma à ton rythme.", icon: Sparkles },
];

const READING: Choice<ArabicReadingLevel>[] = [
  { value: "beginner", label: "Je commence tout juste" },
  { value: "letters", label: "Je reconnais les lettres" },
  { value: "slow", label: "Je lis lentement" },
  { value: "correct", label: "Je lis correctement" },
  { value: "fluent", label: "Je lis couramment le Coran" },
];

const FAMILIARITY: Choice<QuranFamiliarity>[] = [
  { value: "beginner", label: "Je débute" },
  { value: "some_surahs", label: "Je connais quelques sourates" },
  { value: "regular_recitation", label: "Je récite régulièrement" },
  { value: "many_surahs", label: "Je connais beaucoup de sourates" },
  { value: "complete_reading", label: "Je lis ou récite régulièrement l’ensemble du Coran" },
];

const PACES: Choice<LearningPace>[] = [
  { value: "daily_short", label: "Un peu chaque jour", description: "Un fil léger et régulier.", icon: Leaf },
  { value: "some_days", label: "Quelques fois par semaine", description: "Des rendez-vous quand ils te conviennent.", icon: BookOpen },
  { value: "flexible", label: "Quand j’ai le temps", description: "Avancer sans pression.", icon: Sparkles },
  { value: "unknown", label: "Je ne sais pas encore", description: "Tu pourras ajuster plus tard.", icon: Lightbulb },
];

const DURATIONS = [
  { value: 5 as const, label: "5 min", description: "Une courte étape" },
  { value: 10 as const, label: "10 min", description: "Un rythme confortable" },
  { value: 15 as const, label: "15 min", description: "Un temps pour approfondir" },
  { value: 20 as const, label: "20 min", description: "Une session plus complète" },
  { value: 30 as const, label: "Plus de 20 minutes", description: "Selon ton envie" },
  { value: null, label: "Quand j’ai le temps", description: "Avancer librement" },
];

type FormProfile = OnboardingProfile;
const LAST_STEP = 8;

export function OnboardingForm({
  catalog,
  redirectTo = "/dashboard",
}: {
  catalog: SurahCatalogItem[];
  redirectTo?: string;
}) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [profile, setProfile] = useState<FormProfile>({
    displayName: null,
    learningGoal: null,
    arabicReadingLevel: null,
    quranFamiliarity: null,
    dailyDuration: null,
    learningPace: null,
    preferredSurahNumber: null,
  });
  const [error, setError] = useState<string | null>(null);
  const [sessionExpired, setSessionExpired] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [isPending, startTransition] = useTransition();
  const startable = useMemo(
    () => catalog.filter((item) => item.state === "REFERENCE" || item.state === "READY"),
    [catalog],
  );
  const recommendation = useMemo(
    () => recommendStartingSurah(profile, catalog),
    [catalog, profile],
  );
  const selected = startable.find((item) => item.surahNumber === profile.preferredSurahNumber)
    ?? recommendation;
  const uxStage = getOnboardingUxStage(step);

  function update<K extends keyof FormProfile>(key: K, value: FormProfile[K]) {
    setProfile((current) => ({ ...current, [key]: value }));
  }

  function next() {
    setError(null);
    setStep((current) => Math.min(LAST_STEP, current + 1));
  }

  function back() {
    setError(null);
    setStep((current) => Math.max(0, current - 1));
  }

  function skipOptional() {
    setError(null);
    setStep((current) => Math.min(LAST_STEP, current + 1));
  }

  /** Fast-track pour utilisateurs déjà familiers (Phase 71A — P1-01). */
  function fastTrack() {
    setProfile((current) => ({
      ...current,
      learningGoal: current.learningGoal ?? "understand_surahs",
      arabicReadingLevel: current.arabicReadingLevel ?? "correct",
      quranFamiliarity: current.quranFamiliarity ?? "regular_recitation",
      learningPace: current.learningPace ?? "flexible",
    }));
    setError(null);
    setStep(7);
  }

  function finish() {
    if (!selected) {
      setError("Nous n’avons pas pu préparer une sourate de départ. Réessaie dans un instant.");
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await completeOnboarding({
        ...profile,
        preferredSurahNumber: selected.surahNumber,
      });
      if (!result.ok) {
        const expired = isOnboardingSessionError(result.error ?? "");
        setSessionExpired(expired);
        setError(result.error ?? "Impossible d’enregistrer tes préférences pour le moment. Tes réponses sont toujours là. Réessaie.");
        return;
      }
      setSessionExpired(false);
      setShowCelebration(true);
    });
  }

  const destination = selected?.firstLessonSlug ? `/learn/${selected.firstLessonSlug}` : redirectTo;

  useEffect(() => {
    if (!showCelebration) return;
    const timer = window.setTimeout(() => {
      router.replace(destination);
      router.refresh();
    }, 1250);
    return () => window.clearTimeout(timer);
  }, [destination, router, showCelebration]);

  if (showCelebration) {
    return <Celebration displayName={profile.displayName} />;
  }

  return (
    <div className="relative flex w-full max-w-2xl flex-col gap-6">
      <ProgressRail stage={uxStage} step={step} />

      {step === 0 ? (
        <StepShell eyebrow="HIKMA" title="Comprends le Coran, mot par mot." description="Apprends les mots que tu récites, découvre leur sens et construis progressivement ton vocabulaire coranique." hero>
          <Mascot variant="welcome" size="md" decorative />
          <div className="flex items-center justify-center gap-2 text-sm text-text-secondary">
            <Sparkles aria-hidden="true" className="size-4 text-hikma-gold" />
            Ton parcours sera adapté à ton rythme.
          </div>
          <Button size="xl" className="w-full" onClick={next}>Commencer <ArrowRight aria-hidden="true" /></Button>
          <Button variant="ghost" className="w-full" onClick={fastTrack}>Je connais déjà le Coran</Button>
        </StepShell>
      ) : null}

      {step === 1 ? (
        <StepShell title="Comment veux-tu qu’on t’appelle ?" description="C’est ainsi que Hikma s’adressera à toi.">
          <label className="flex flex-col gap-2 text-left" htmlFor="display-name">
            <span className="text-sm font-medium">Ton prénom</span>
            <input id="display-name" value={profile.displayName ?? ""} onChange={(event) => update("displayName", event.target.value || null)} placeholder="Ex. Abdourahmane" maxLength={60} autoComplete="given-name" className="min-h-13 rounded-xl border border-input bg-popover px-4 text-base outline-none transition-[border-color,box-shadow] duration-150 placeholder:text-muted-foreground focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring" />
          </label>
          <NavButtons onBack={back} onNext={next} onSkip={skipOptional} />
        </StepShell>
      ) : null}

      {step === 2 ? <ChoiceStep mascot="profile" title="Qu’aimerais-tu surtout accomplir avec Hikma ?" description="Choisis ce qui te ressemble le plus. Tu pourras toujours ajuster ton rythme plus tard." choices={GOALS} value={profile.learningGoal} onChange={(value) => update("learningGoal", value)} onBack={back} onNext={next} onSkip={skipOptional} /> : null}
      {step === 3 ? <ChoiceStep title="Et avec l’arabe ?" description="Dis-nous simplement où tu en es. Il n’y a pas de bonne ou de mauvaise réponse." reassurance="Cela nous aide seulement à mieux t’accompagner." choices={READING} value={profile.arabicReadingLevel} onChange={(value) => update("arabicReadingLevel", value)} onBack={back} onNext={next} onSkip={skipOptional} /> : null}
      {step === 4 ? <ChoiceStep title="Quelle place le Coran occupe-t-il dans ton quotidien ?" description="Ce n’est pas une évaluation, seulement un repère pour préparer ton départ." choices={FAMILIARITY} value={profile.quranFamiliarity} onChange={(value) => update("quranFamiliarity", value)} onBack={back} onNext={next} onSkip={skipOptional} /> : null}

      {step === 5 ? (
        <StepShell title="Combien de temps aimerais-tu consacrer à Hikma ?" description="Même quelques minutes peuvent faire avancer ton vocabulaire.">
          <div className="grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label="Durée souhaitée">
            {DURATIONS.map((choice) => <ChoiceButton key={choice.label} selected={profile.dailyDuration === choice.value} label={choice.label} description={choice.description} onClick={() => update("dailyDuration", choice.value)} />)}
          </div>
          <NavButtons onBack={back} onNext={next} onSkip={skipOptional} />
        </StepShell>
      ) : null}

      {step === 6 ? <ChoiceStep title="Quel rythme te ressemble le plus ?" description="Il n’y a pas de rythme parfait. L’important est de trouver celui qui te convient." choices={PACES} value={profile.learningPace} onChange={(value) => update("learningPace", value)} onBack={back} onNext={next} onSkip={skipOptional} /> : null}

      {step === 7 ? (
        <StepShell title="Par quelle sourate veux-tu commencer ?" description="Hikma te propose un départ cohérent avec tes réponses. Tu peux choisir une autre sourate disponible.">
          <Mascot variant="learn" size="sm" decorative />
          {recommendation ? <SurahChoice item={recommendation} selected={selected?.surahNumber === recommendation.surahNumber} onClick={() => update("preferredSurahNumber", recommendation.surahNumber)} recommended /> : null}
          <div className="flex flex-col gap-3 pt-2">
            <div className="flex items-center justify-between gap-3"><H3 className="text-base">Choisir une autre sourate</H3><Caption>{startable.length} disponibles</Caption></div>
            <div className="grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label="Sourates disponibles">
              {startable.filter((item) => item.surahNumber !== recommendation?.surahNumber).map((item) => <SurahChoice key={item.surahNumber} item={item} selected={selected?.surahNumber === item.surahNumber} onClick={() => update("preferredSurahNumber", item.surahNumber)} />)}
            </div>
            {catalog.some((item) => item.state === "IN_PREPARATION") ? <div className="rounded-xl border border-border-subtle bg-surface-subtle px-4 py-3 text-left"><Caption className="font-semibold uppercase tracking-[0.12em] text-hikma-gold-muted">Bientôt disponibles</Caption><BodySmall className="mt-1 text-text-secondary">D’autres sourates arrivent progressivement. Elles ne sont pas encore démarrables.</BodySmall></div> : null}
          </div>
          {selected ? <SurahInfoCard item={selected} /> : null}
          <NavButtons onBack={back} onNext={next} onSkip={skipOptional} />
        </StepShell>
      ) : null}

      {step === 8 ? (
        <StepShell eyebrow="TON PARCOURS EST PRÊT" title={profile.displayName?.trim() ? `Ton parcours est prêt, ${profile.displayName.trim()} ✨` : "Ton parcours est prêt ✨"} description="Tes réponses nous ont aidés à préparer un premier pas qui te ressemble.">
          <Mascot variant="learn" size="sm" decorative />
          {selected ? <SummaryCard profile={profile} item={selected} /> : null}
          {error ? <ErrorNotice message={error} sessionExpired={sessionExpired} onRetry={finish} onLogin={() => router.push("/login")} /> : null}
          <Button size="xl" className="w-full" loading={isPending} onClick={finish}>Commencer mon parcours <ArrowRight aria-hidden="true" /></Button>
          <Button variant="ghost" className="w-full" disabled={isPending} onClick={() => setStep(7)}>Modifier mon choix</Button>
        </StepShell>
      ) : null}
    </div>
  );
}

function ProgressRail({ stage, step }: { stage: number; step: number }) {
  const labels = ["Bienvenue", "À propos de toi", "Ton expérience", "Ton rythme", "Ton parcours", "Prêt à apprendre"];
  /** Phase 71B — P2-02 : compteur d'étape lisible.
   *  step 0 = welcome (hors compteur), steps 1-7 = "Étape X/7", step 8 = confirmation. */
  const stepLabel = step <= 0 ? null : step >= 8 ? "Confirmation" : `Étape ${step} sur 7`;
  return (
    <div className="flex flex-col gap-3" aria-label="Progression de ton parcours">
      <div className="flex items-center gap-1.5" aria-hidden="true">
        {labels.map((label, index) => <span key={label} className={cn("h-1.5 flex-1 rounded-full transition-[background-color,transform] duration-250 ease-[var(--ease-hikma)]", index <= stage ? "bg-hikma-gold" : "bg-border-subtle", index === stage && "scale-y-150")} />)}
      </div>
      <div className="flex items-center justify-between gap-3">
        <Caption className="font-medium text-text-secondary">{labels[stage]}</Caption>
        {stepLabel ? <Caption className="tabular-nums text-hikma-gold-muted">{stepLabel}</Caption> : <Caption className="text-hikma-gold-muted">C’est presque prêt ✨</Caption>}
      </div>
    </div>
  );
}

function StepShell({ eyebrow, title, description, children, hero = false }: { eyebrow?: string; title: string; description?: string; children: ReactNode; hero?: boolean }) {
  return <Card className={cn("overflow-hidden border-border-subtle bg-surface-elevated", hero && "border-hikma-gold/32 bg-[radial-gradient(circle_at_50%_0%,color-mix(in_srgb,var(--hikma-gold)_10%,transparent),transparent_42%),var(--surface-elevated)]")}><CardContent className={cn("gap-8 p-5 sm:gap-9 sm:p-8", hero && "p-6 sm:p-12")}><div className="flex flex-col items-center gap-4 text-center">{hero ? <div className="flex items-center gap-3" aria-hidden="true"><div className="size-2 rounded-full bg-hikma-gold" /><span className="text-xs font-semibold tracking-[0.28em] text-hikma-teal-700">{eyebrow}</span><div className="size-2 rounded-full bg-hikma-gold" /></div> : eyebrow ? <Caption className="font-semibold uppercase tracking-[0.16em] text-hikma-gold-muted">{eyebrow}</Caption> : null}{hero ? <div className="flex size-20 items-center justify-center rounded-full border border-hikma-gold/32 bg-hikma-gold/8"><Leaf aria-hidden="true" className="size-9 text-hikma-teal-700" /></div> : null}<H1 className={cn("max-w-xl", hero && "text-3xl sm:text-4xl")}>{title}</H1>{description ? <BodyMedium className="max-w-xl text-text-secondary">{description}</BodyMedium> : null}</div>{children}</CardContent></Card>;
}

function ChoiceStep<T extends string>({ mascot, title, description, reassurance, choices, value, onChange, onBack, onNext, onSkip }: { mascot?: "profile"; title: string; description: string; reassurance?: string; choices: Choice<T>[]; value: T | null; onChange: (value: T) => void; onBack: () => void; onNext: () => void; onSkip: () => void }) {
  return <StepShell title={title} description={description}>{mascot ? <Mascot variant={mascot} size="sm" decorative /> : null}<div className="flex flex-col gap-3" role="radiogroup" aria-label={title}>{choices.map((choice) => <ChoiceButton key={choice.value} label={choice.label} description={choice.description} icon={choice.icon} selected={value === choice.value} onClick={() => onChange(choice.value)} />)}</div>{reassurance ? <div className="flex items-center justify-center gap-2 rounded-xl bg-surface-subtle px-4 py-3 text-center"><UserRound aria-hidden="true" className="size-4 text-hikma-gold-muted" /><Caption>{reassurance}</Caption></div> : null}<NavButtons onBack={onBack} onNext={onNext} onSkip={onSkip} /></StepShell>;
}

function ChoiceButton({ label, description, icon: Icon, selected, onClick }: { label: string; description?: string; icon?: LucideIcon; selected: boolean; onClick: () => void }) {
  return <button type="button" role="radio" aria-checked={selected} onClick={onClick} className={cn("group flex min-h-14 items-center gap-4 rounded-2xl border bg-popover px-4 py-3 text-left transition-[background-color,border-color,box-shadow,transform] duration-150 ease-[var(--ease-hikma)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring", selected ? "border-hikma-gold bg-hikma-gold/8 shadow-card" : "border-border-subtle hover:-translate-y-px hover:border-hikma-teal-500/48 hover:bg-surface-subtle")}>{Icon ? <span className={cn("flex size-10 shrink-0 items-center justify-center rounded-xl border", selected ? "border-hikma-gold/45 bg-hikma-gold/12 text-hikma-teal-700" : "border-border-subtle bg-surface-subtle text-text-secondary")}><Icon aria-hidden="true" className="size-5" /></span> : null}<span className="flex min-w-0 flex-1 flex-col gap-0.5"><span className="font-medium text-text-primary">{label}</span>{description ? <span className="text-sm text-text-secondary">{description}</span> : null}</span>{selected ? <Check aria-hidden="true" className="size-5 shrink-0 text-hikma-gold-muted" /> : null}</button>;
}

function NavButtons({ onBack, onNext, onSkip }: { onBack: () => void; onNext: () => void; onSkip: () => void }) {
  return <div className="flex flex-col-reverse gap-3 pt-1 sm:flex-row sm:items-center sm:justify-between"><Button variant="ghost" onClick={onBack}><ArrowLeft aria-hidden="true" /> Retour</Button><div className="flex flex-col gap-2 sm:flex-row sm:items-center"><Button variant="ghost" onClick={onSkip}>Plus tard</Button><Button onClick={onNext}>Continuer <ArrowRight aria-hidden="true" /></Button></div></div>;
}

/** Phase 71B — P2-01 : fiche info de la sourate sélectionnée. */
function SurahInfoCard({ item }: { item: SurahCatalogItem }) {
  return (
    <Card className="border-hikma-gold/24 bg-surface-subtle shadow-none">
      <CardContent className="gap-4 p-5 sm:p-6">
        <div className="flex items-center gap-4">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-full border border-hikma-gold/40 bg-hikma-gold/10">
            <ArabicText scale="word" className="text-hikma-gold-muted">{item.nameArabic}</ArabicText>
          </div>
          <div className="min-w-0 text-left">
            <H3 className="text-base">{item.nameTransliteration}</H3>
            <Caption className="text-text-secondary">{item.lessonCount} leçons · {item.formCount} formes</Caption>
          </div>
        </div>
        <BodySmall className="text-text-secondary">
          {item.state === "REFERENCE"
            ? "Un parcours de référence avec des explications complètes pour chaque mot."
            : "Un parcours prêt à démarrer avec une couverture lexicale adaptée."}
        </BodySmall>
      </CardContent>
    </Card>
  );
}

function SurahChoice({ item, selected, onClick, recommended = false }: { item: SurahCatalogItem; selected: boolean; onClick: () => void; recommended?: boolean }) {
  return <button type="button" role="radio" aria-checked={selected} onClick={onClick} className={cn("flex min-h-24 items-center gap-4 rounded-2xl border bg-popover p-4 text-left transition-[background-color,border-color,box-shadow,transform] duration-150 ease-[var(--ease-hikma)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring", recommended && "border-hikma-gold/55 bg-[radial-gradient(circle_at_0%_0%,color-mix(in_srgb,var(--hikma-gold)_12%,transparent),transparent_56%),var(--popover)] shadow-card", selected ? "border-hikma-gold bg-hikma-gold/8 shadow-card" : "border-border-subtle hover:-translate-y-px hover:border-hikma-teal-500/48 hover:bg-surface-subtle")}>{recommended ? <span className="flex size-11 shrink-0 items-center justify-center rounded-full border border-hikma-gold/30 bg-hikma-gold/12 text-hikma-gold-muted"><Sparkles aria-hidden="true" className="size-5" /></span> : <ArabicText scale="word" className="shrink-0">{item.nameArabic}</ArabicText>}<span className="flex min-w-0 flex-1 flex-col gap-1">{recommended ? <Caption className="font-semibold uppercase tracking-[0.1em] text-hikma-gold-muted">Notre recommandation</Caption> : null}<span className={cn("font-medium text-text-primary", recommended && "text-lg")}>{item.nameTransliteration}</span><span className="text-sm text-text-secondary">{recommended ? "Un premier parcours pour découvrir Hikma." : `${item.lessonCount} leçons · vocabulaire coranique`}</span>{recommended ? <span className="text-sm text-text-secondary">{item.lessonCount} leçons · vocabulaire coranique</span> : null}</span>{selected ? <Check aria-hidden="true" className="size-5 shrink-0 text-hikma-gold-muted" /> : null}</button>;
}

function SummaryCard({ profile, item }: { profile: FormProfile; item: SurahCatalogItem }) {
  return <Card className="border-hikma-gold/32 bg-surface-subtle shadow-none"><CardContent className="gap-5 p-5 sm:p-6"><div className="flex items-center gap-4"><div className="flex size-14 shrink-0 items-center justify-center rounded-full border border-hikma-gold/40 bg-hikma-gold/10"><ArabicText scale="word">{item.nameArabic}</ArabicText></div><div className="min-w-0 text-left"><H2 className="text-xl">{item.nameTransliteration}</H2><Caption>{item.lessonCount} leçons · {durationLabel(profile.dailyDuration)}</Caption></div></div><BodyMedium className="text-text-secondary">{summarySentence(profile, item)}</BodyMedium><div className="grid gap-2 sm:grid-cols-2"><SummaryDetail label="Objectif" value={goalLabel(profile.learningGoal)} /><SummaryDetail label="Rythme" value={paceLabel(profile.learningPace, profile.dailyDuration)} /></div></CardContent></Card>;
}

function SummaryDetail({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl border border-border-subtle bg-surface-elevated px-3 py-2 text-left"><Caption className="text-text-secondary">{label}</Caption><BodySmall className="font-medium">{value}</BodySmall></div>;
}

function summarySentence(profile: FormProfile, item: SurahCatalogItem) {
  const parts = [goalSummary(profile.learningGoal), durationSummary(profile.dailyDuration), readingSummary(profile.arabicReadingLevel)].filter(Boolean);
  const explicitlySelected = profile.preferredSurahNumber != null;
  const usedFallback = explicitlySelected && profile.preferredSurahNumber !== item.surahNumber;
  return `${parts.join(" ")} ${getOnboardingSurahSummary({ name: item.nameTransliteration, explicitlySelected, usedFallback })}`;
}

function goalSummary(value: LearningGoal | null) {
  return ({ understand_recitation: "Ton parcours mettra l’accent sur la compréhension des mots que tu récites.", memorize_vocabulary: "Ton parcours t’aidera à consolider progressivement les mots importants.", understand_surahs: "Ton parcours reliera progressivement les mots au sens des sourates.", build_vocabulary: "Ton parcours fera grandir ton vocabulaire coranique avec douceur.", start_gently: "Ton parcours commencera par des étapes simples et accessibles.", } as Record<LearningGoal, string | undefined>)[value ?? "start_gently"] ?? "Ton parcours commencera par des étapes simples et accessibles.";
}

function durationSummary(value: FormProfile["dailyDuration"]) {
  if (value === 30) return "Nous garderons des sessions de plus de 20 minutes.";
  return value ? `Nous garderons des sessions d’environ ${value} minutes.` : "Tu pourras avancer quand tu en auras le temps.";
}

function durationLabel(value: FormProfile["dailyDuration"]) {
  if (value === 30) return "Plus de 20 minutes";
  return value ? `${value} min environ` : "à ton rythme";
}

function readingSummary(value: ArabicReadingLevel | null) {
  return value === "beginner" || value === "letters" ? "Les explications de lecture resteront simples et accessibles." : "Nous respecterons ton expérience actuelle de lecture.";
}

function goalLabel(value: LearningGoal | null) {
  return ({ understand_recitation: "Comprendre ce que tu récites", memorize_vocabulary: "Mémoriser les mots", understand_surahs: "Comprendre les sourates", build_vocabulary: "Enrichir ton vocabulaire", start_gently: "Commencer simplement", } as Record<LearningGoal, string | undefined>)[value ?? "start_gently"] ?? "Commencer simplement";
}

function paceLabel(value: LearningPace | null, duration: FormProfile["dailyDuration"]) {
  if (value === "daily_short") return "Un peu chaque jour";
  if (value === "some_days") return "Quelques fois par semaine";
  if (value === "flexible") return "Quand tu as le temps";
  return duration ? `${duration} min, sans pression` : "À ton rythme";
}

function ErrorNotice({ message, sessionExpired, onRetry, onLogin }: { message: string; sessionExpired: boolean; onRetry: () => void; onLogin: () => void }) {
  if (sessionExpired) {
    return <div className="flex flex-col gap-3 rounded-2xl border border-hikma-gold/40 bg-hikma-gold/8 px-4 py-4 text-left" role="alert"><BodySmall className="font-semibold text-text-primary">Ta session a expiré</BodySmall><BodySmall className="text-text-secondary">Reconnecte-toi pour terminer ton parcours.</BodySmall><Button className="self-start" onClick={onLogin}>Se reconnecter</Button></div>;
  }
  return <div className="flex flex-col gap-3 rounded-2xl border border-error/40 bg-error/8 px-4 py-4 text-left" role="alert"><BodySmall className="font-medium text-error-text">{message}</BodySmall><Button variant="outline" className="self-start" onClick={onRetry}>Réessayer</Button></div>;
}

function Celebration({ displayName }: { displayName: string | null }) {
  const name = displayName?.trim();
  return <Card className="relative isolate overflow-hidden border-hikma-gold/40 bg-surface-featured"><CardContent className="relative items-center gap-4 p-10 text-center sm:p-14"><div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden"><span className="onboarding-confetti onboarding-confetti-1" /><span className="onboarding-confetti onboarding-confetti-2" /><span className="onboarding-confetti onboarding-confetti-3" /><span className="onboarding-confetti onboarding-confetti-4" /><span className="onboarding-confetti onboarding-confetti-5" /><span className="onboarding-confetti onboarding-confetti-6" /></div><div className="relative flex size-14 items-center justify-center rounded-full border border-hikma-gold/45 bg-hikma-gold/12 text-hikma-gold-muted"><Sparkles aria-hidden="true" className="size-7" /></div><H2 className="relative">C’est parti{name ? `, ${name}` : ""} !</H2><BodyMedium className="relative text-text-secondary">Ton parcours Hikma est prêt.</BodyMedium><p className="relative text-sm font-medium text-primary-strong" aria-live="polite">Découvre maintenant ton premier mot du Coran.</p></CardContent></Card>;
}
