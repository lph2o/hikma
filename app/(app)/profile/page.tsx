import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  BellIcon,
  BookOpenIcon,
  Clock3Icon,
  FileTextIcon,
  GaugeIcon,
  LanguagesIcon,
  LogOutIcon,
  MoonStarIcon,
  PencilIcon,
  ShieldCheckIcon,
  SparklesIcon,
  TargetIcon,
} from "lucide-react";
import type { ReactNode } from "react";
import { ProfileRow } from "@/components/app/profile-row";
import { Caption, H1 } from "@/components/ui/typography";
import {
  getGlobalWordStats,
  getSurahCatalog,
  getSurahProgressByUser,
} from "@/lib/learning/queries";
import { summarizeSurahProgress } from "@/lib/learning/active-path";
import { getDistinctLearningDays, getLocalDateKey, getUserSettings } from "@/lib/learning/activity";
import { computeRegularityMetrics } from "@/lib/learning/regularity";
import {
  arabicReadingLevelLabel,
  dailyDurationLabel,
  dailyGoalLabel,
  learningPaceLabel,
  quranFamiliarityLabel,
} from "@/lib/learning/preferences";
import { signOut } from "@/lib/learning/actions";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// Espace privé : signal d'indexation noindex (l'auth reste le vrai contrôle).
export const metadata: Metadata = { robots: { index: false, follow: false } };

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <Caption className="px-1 pb-2 font-medium uppercase tracking-[0.12em] text-label">
      {children}
    </Caption>
  );
}

/** Groupe de rows de préférence : une seule surface, lignes séparées par hairline. */
function GroupedRows({ children }: { children: ReactNode }) {
  return (
    <div className="divide-y divide-border-subtle overflow-hidden rounded-2xl border border-border-subtle bg-surface-elevated">
      {children}
    </div>
  );
}

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "H";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

export default async function ProfilePage() {
  const client = await createClient();
  const {
    data: { user },
  } = await client.auth.getUser();

  if (!user) redirect("/login");

  const settings = await getUserSettings(client, user.id);
  const catalog = await getSurahCatalog(client);
  const [progress, words] = await Promise.all([
    getSurahProgressByUser(client, user.id),
    getGlobalWordStats(client, user.id),
  ]);
  const summary = summarizeSurahProgress(progress, catalog);

  // Régularité (même source que le dashboard) pour l'accent doré du profil.
  const timezone = settings?.timezone ?? null;
  const today = getLocalDateKey(new Date(), timezone);
  const learningDays = await getDistinctLearningDays(client, user.id, timezone);
  const regularity = computeRegularityMetrics(learningDays, today);

  const displayName = settings?.display_name?.trim() || null;
  const name = displayName ?? user.email ?? "Ton profil";
  const initials = displayName
    ? initialsOf(displayName)
    : (user.email?.[0]?.toUpperCase() ?? "H");

  const surahName =
    settings?.preferred_surah_number != null
      ? catalog.find((s) => s.surahNumber === settings.preferred_surah_number)?.nameTransliteration ?? null
      : null;

  const memberSince = user.created_at
    ? new Date(user.created_at).toLocaleDateString("fr-FR", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-10 px-6 py-10">
      {/* Identité : avatar, nom, espace Hikma, accent doré de régularité. */}
      <header className="flex flex-col items-center gap-3 text-center">
        <div
          className="flex size-20 items-center justify-center rounded-full bg-primary/10 text-2xl font-semibold text-primary-strong"
          aria-hidden="true"
        >
          {initials}
        </div>
        <div className="flex flex-col items-center gap-1">
          <H1>{name}</H1>
          <Caption>Ton espace Hikma</Caption>
        </div>
        <Link
          href="/profile/nom"
          className="inline-flex items-center gap-1.5 rounded-lg text-sm font-medium text-muted-foreground outline-none transition-colors hover:text-primary-strong focus-visible:ring-2 focus-visible:ring-focus"
        >
          <PencilIcon className="size-3.5" aria-hidden="true" />
          Modifier le nom
        </Link>
        {regularity.currentStreak > 0 ? (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-hikma-gold/35 bg-hikma-gold/10 px-3.5 py-1.5 text-sm font-medium text-hikma-gold-muted">
            <SparklesIcon className="size-4 text-hikma-gold" aria-hidden="true" />
            {regularity.currentStreak} jour{regularity.currentStreak > 1 ? "s" : ""} de régularité
          </span>
        ) : (
          <Caption className="text-text-secondary">Commence ta série aujourd’hui.</Caption>
        )}
        <div className="flex flex-col gap-0.5">
          <Caption className="text-text-secondary">
            {words.wordsSeen} mot{words.wordsSeen > 1 ? "s" : ""} appris
            {summary.completedLessons > 0
              ? ` · ${summary.completedLessons} leçon${summary.completedLessons > 1 ? "s" : ""}`
              : ""}
          </Caption>
          {memberSince ? <Caption className="text-text-secondary">Membre depuis {memberSince}</Caption> : null}
        </div>
      </header>

      {/* Mon apprentissage : les préférences pédagogiques, en rows. */}
      <section className="flex flex-col gap-3" aria-labelledby="learning-prefs-title">
        <h2 id="learning-prefs-title" className="sr-only">
          Mon apprentissage
        </h2>
        <SectionLabel>Mon apprentissage</SectionLabel>
        <GroupedRows>
          <ProfileRow
            icon={TargetIcon}
            label="Objectif quotidien"
            value={dailyGoalLabel(settings?.daily_goal_type ?? "words", settings?.daily_goal_value ?? 5)}
            href="/profile/objectif"
          />
          <ProfileRow
            icon={BookOpenIcon}
            label="Sourate de départ"
            value={surahName ?? "Recommandation Hikma"}
            href="/profile/parcours"
          />
          <ProfileRow
            icon={LanguagesIcon}
            label="Lecture de l’arabe"
            value={arabicReadingLevelLabel(settings?.arabic_reading_level) ?? "À préciser"}
            href="/profile/lecture"
          />
          <ProfileRow
            icon={MoonStarIcon}
            label="Relation avec le Coran"
            value={quranFamiliarityLabel(settings?.quran_familiarity) ?? "À préciser"}
            href="/profile/relation"
          />
          <ProfileRow
            icon={Clock3Icon}
            label="Temps souhaité"
            value={dailyDurationLabel(settings?.daily_duration) ?? "Je préfère avancer librement"}
            href="/profile/temps"
          />
          <ProfileRow
            icon={GaugeIcon}
            label="Rythme"
            value={learningPaceLabel(settings?.learning_pace) ?? "À préciser"}
            href="/profile/rythme"
          />
        </GroupedRows>
      </section>

      {/* Préférences : réglages généraux (évolue avec les futures options). */}
      <section className="flex flex-col gap-3" aria-labelledby="settings-title">
        <h2 id="settings-title" className="sr-only">
          Préférences
        </h2>
        <SectionLabel>Préférences</SectionLabel>
        <GroupedRows>
          <ProfileRow
            icon={BellIcon}
            label="Rappels"
            value={
              settings?.reminder_enabled
                ? `Activés · ${settings.reminder_time ?? "19:00"}`
                : "Désactivés"
            }
            href="/profile/rappels"
          />
        </GroupedRows>
      </section>

      {/* Compte & aide */}
      <section className="flex flex-col gap-3" aria-labelledby="account-title">
        <h2 id="account-title" className="sr-only">
          Compte et aide
        </h2>
        <SectionLabel>Compte &amp; aide</SectionLabel>
        <GroupedRows>
          <ProfileRow icon={ShieldCheckIcon} label="Confidentialité" href="/privacy" />
          <ProfileRow icon={FileTextIcon} label="Conditions d’utilisation" href="/terms" />
          <form action={signOut}>
            <ProfileRow icon={LogOutIcon} label="Se déconnecter" submit destructive />
          </form>
        </GroupedRows>
      </section>
    </main>
  );
}
