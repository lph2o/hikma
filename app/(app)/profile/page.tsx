import Link from "next/link";
import { Mascot } from "@/components/ui/mascot";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { BodyMedium, Caption, H1 } from "@/components/ui/typography";
import { GoalSettings } from "@/components/app/goal-settings";
import { ReminderPreferences } from "@/components/app/reminder-preferences";
import { LearningPreferences } from "@/components/app/learning-preferences";
import {
  getSurahCatalog,
  getSurahProgressByUser,
  getGlobalWordStats,
  getReviewDueCount,
} from "@/lib/learning/queries";
import { summarizeSurahProgress } from "@/lib/learning/active-path";
import { getUserSettings } from "@/lib/learning/activity";
import { signOut } from "@/lib/learning/actions";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function ProfileStat({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardContent className="gap-1 p-4">
        <BodyMedium className="text-h3 font-semibold">{value}</BodyMedium>
        <Caption>{label}</Caption>
      </CardContent>
    </Card>
  );
}

export default async function ProfilePage() {
  const client = await createClient();
  const {
    data: { user },
  } = await client.auth.getUser();

  if (!user) {
    return (
      <main className="mx-auto flex w-full max-w-2xl flex-col items-center gap-6 px-6 py-16 text-center">
        <Mascot variant="profile" size="xl" message="Connecte-toi" />
        <H1>Profil</H1>
        <BodyMedium className="text-muted-foreground">
          Connecte-toi pour voir ta progression et tes statistiques.
        </BodyMedium>
        <Button render={<Link href="/login" />} size="lg" className="min-h-12">
          Se connecter
        </Button>
      </main>
    );
  }

  const settings = await getUserSettings(client, user.id);
  const catalog = await getSurahCatalog(client);
  const [progress, words, reviewDueCount] = await Promise.all([
    getSurahProgressByUser(client, user.id),
    getGlobalWordStats(client, user.id),
    getReviewDueCount(client, user.id),
  ]);
  // Statistiques GLOBALES (toutes sourates), plus de « Al-Fātiḥah présentée
  // comme globale » : leçons = somme sur les sourates démarrables.
  const summary = summarizeSurahProgress(progress, catalog);

  const memberSince = user.created_at
    ? new Date(user.created_at).toLocaleDateString("fr-FR", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-8 px-6 py-12">
      <header className="flex flex-col items-center gap-4 text-center">
        <Mascot variant="profile" size="lg" message="Voilà ta progression" />
        <div className="flex flex-col gap-1">
          <H1>{settings?.display_name ?? user.email}</H1>
          {memberSince ? (
            <Caption>Membre depuis le {memberSince}</Caption>
          ) : null}
        </div>
      </header>

      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4" aria-label="Vos statistiques">
        <ProfileStat label="Leçons terminées" value={`${summary.completedLessons}/${summary.totalLessons}`} />
        <ProfileStat label="Mots appris" value={String(words.wordsSeen)} />
        <ProfileStat label="Mots maîtrisés" value={String(words.wordsMastered)} />
        <ProfileStat label="Mots à réviser" value={String(reviewDueCount)} />
      </section>

      {/* Objectif quotidien (F3) */}
      <Card>
        <CardContent className="flex flex-col gap-3 p-6">
          <BodyMedium className="font-semibold">Objectif quotidien</BodyMedium>
          <Caption className="text-muted-foreground">
            Ton objectif compte les leçons complétées ou les mots distincts étudiés
            chaque jour (leçons + révisions).
          </Caption>
          <GoalSettings
            currentType={settings?.daily_goal_type ?? "words"}
            currentValue={settings?.daily_goal_value ?? 5}
          />
        </CardContent>
      </Card>

      {/* Rappels (Phase 80) */}
      <Card>
        <CardContent className="flex flex-col gap-4 p-6">
          <ReminderPreferences
            enabled={settings?.reminder_enabled ?? false}
            time={settings?.reminder_time ?? "19:00"}
          />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex flex-col gap-4 p-6">
          <div className="flex flex-col gap-1">
            <BodyMedium className="font-semibold">Préférences d’apprentissage</BodyMedium>
            <Caption className="text-muted-foreground">
              Elles personnalisent ton accueil sans modifier ta progression, tes révisions ou tes exercices.
            </Caption>
          </div>
          <LearningPreferences settings={settings} catalog={catalog} />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-1">
            <BodyMedium className="font-semibold">Déconnexion</BodyMedium>
            <Caption>Quitte ta session sur cet appareil.</Caption>
          </div>
          <form action={signOut}>
            <Button type="submit" variant="outline" className="w-full min-h-11 sm:w-auto">
              Se déconnecter
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
