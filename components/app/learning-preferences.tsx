"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Caption } from "@/components/ui/typography";
import { updateLearningPreferences } from "@/lib/learning/actions";
import type { SurahCatalogItem } from "@/lib/learning/queries";
import type { UserSettings } from "@/types/learning";

const GOALS = [
  ["understand_recitation", "Mieux comprendre ce que je récite"],
  ["memorize_vocabulary", "Mémoriser les mots du Coran"],
  ["understand_surahs", "Comprendre progressivement les sourates"],
  ["build_vocabulary", "Enrichir mon vocabulaire arabe coranique"],
  ["start_gently", "Je veux simplement commencer"],
] as const;
const READING = [
  ["beginner", "Je commence tout juste"], ["letters", "Je reconnais les lettres"],
  ["slow", "Je peux lire lentement"], ["correct", "Je lis correctement"], ["fluent", "Je lis couramment le Coran"],
] as const;
const FAMILIARITY = [
  ["beginner", "Je découvre encore le Coran"], ["some_surahs", "Je connais quelques sourates"],
  ["regular_recitation", "Je récite régulièrement"], ["many_surahs", "Je connais beaucoup de sourates"],
  ["complete_reading", "Je lis/récite régulièrement l’ensemble du Coran"],
] as const;
const PACES = [["daily_short", "Un peu chaque jour"], ["some_days", "Quelques fois par semaine"], ["flexible", "Quand j’ai le temps"], ["unknown", "Je ne sais pas encore"]] as const;

export function LearningPreferences({ settings, catalog }: { settings: UserSettings | null; catalog: SurahCatalogItem[] }) {
  const [displayName, setDisplayName] = useState(settings?.display_name ?? "");
  const [learningGoal, setLearningGoal] = useState(settings?.learning_goal ?? "");
  const [arabicReadingLevel, setArabicReadingLevel] = useState(settings?.arabic_reading_level ?? "");
  const [quranFamiliarity, setQuranFamiliarity] = useState(settings?.quran_familiarity ?? "");
  const [dailyDuration, setDailyDuration] = useState(String(settings?.daily_duration ?? ""));
  const [learningPace, setLearningPace] = useState(settings?.learning_pace ?? "");
  const [preferredSurahNumber, setPreferredSurahNumber] = useState(String(settings?.preferred_surah_number ?? ""));
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function save() {
    setMessage(null); setError(null);
    startTransition(async () => {
      const result = await updateLearningPreferences({
        displayName: displayName || null,
        learningGoal: (learningGoal || null) as UserSettings["learning_goal"],
        arabicReadingLevel: (arabicReadingLevel || null) as UserSettings["arabic_reading_level"],
        quranFamiliarity: (quranFamiliarity || null) as UserSettings["quran_familiarity"],
        dailyDuration: dailyDuration ? Number(dailyDuration) as 5 | 10 | 15 | 20 | 30 : null,
        learningPace: (learningPace || null) as UserSettings["learning_pace"],
        preferredSurahNumber: preferredSurahNumber ? Number(preferredSurahNumber) : null,
      });
      if (result.ok) setMessage("Préférences enregistrées.");
      else setError(result.error ?? "Impossible d’enregistrer tes préférences.");
    });
  }

  return <div className="flex flex-col gap-5">
    <PreferenceField label="Comment veux-tu qu’on t’appelle ?" description="On l’utilise pour te saluer sur ton accueil."><input value={displayName} maxLength={60} onChange={(e) => setDisplayName(e.target.value)} placeholder="Ton prénom" className="min-h-11 rounded-xl border border-input bg-popover px-3 outline-none focus-visible:ring-2 focus-visible:ring-ring" /></PreferenceField>
    <PreferenceSelect label="Pourquoi apprends-tu ?" description="Cela nous aide à adapter certains messages et recommandations." value={learningGoal} onChange={setLearningGoal} options={GOALS} />
    <PreferenceSelect label="Comment lis-tu l’arabe ?" description="Ce choix ne modifie pas la correction de tes réponses." value={arabicReadingLevel} onChange={setArabicReadingLevel} options={READING} />
    <PreferenceSelect label="Ma relation avec le Coran" description="Une indication pour mieux te proposer des sourates, jamais une mesure de niveau." value={quranFamiliarity} onChange={setQuranFamiliarity} options={FAMILIARITY} />
    <PreferenceSelect label="Temps souhaité" description="Une simple indication pour te suggérer des sessions, sans rien t’imposer." value={dailyDuration} onChange={setDailyDuration} options={[["", "Je préfère avancer librement"], ["5", "5 min par jour"], ["10", "10 min par jour"], ["15", "15 min par jour"], ["20", "20 min par jour"], ["30", "Plus de 20 minutes"]] as const} />
    <PreferenceSelect label="Rythme" description="Une préférence pour personnaliser ton expérience, pas une obligation." value={learningPace} onChange={setLearningPace} options={PACES} />
    <PreferenceSelect label="Sourate de départ" description="Le point de départ que tu choisis, toujours modifiable." value={preferredSurahNumber} onChange={setPreferredSurahNumber} options={[["", "Recommandation Hikma"], ...catalog.filter((item) => item.state === "REFERENCE" || item.state === "READY").map((item) => [String(item.surahNumber), item.nameTransliteration] as const)] as readonly (readonly [string, string])[]} />
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center"><Button onClick={save} disabled={isPending} aria-busy={isPending}>{isPending ? "Enregistrement…" : "Enregistrer"}</Button>{message ? <Caption className="text-success-text">{message}</Caption> : null}{error ? <Caption className="text-error-text">{error}</Caption> : null}</div>
  </div>;
}

function PreferenceField({ label, description, children }: { label: string; description?: string; children: React.ReactNode }) { return <label className="flex flex-col gap-2 text-sm font-medium">{label}{description ? <Caption className="font-normal">{description}</Caption> : null}{children}</label>; }
function PreferenceSelect<T extends readonly (readonly [string, string])[]>({ label, description, value, onChange, options }: { label: string; description?: string; value: string; onChange: (value: string) => void; options: T }) { return <PreferenceField label={label} description={description}><select value={value} onChange={(e) => onChange(e.target.value)} className="min-h-11 rounded-xl border border-input bg-popover px-3 outline-none focus-visible:ring-2 focus-visible:ring-ring"><option value="">Passer</option>{options.filter(([v]) => v !== "").map(([v, text]) => <option key={v} value={v}>{text}</option>)}</select></PreferenceField>; }
