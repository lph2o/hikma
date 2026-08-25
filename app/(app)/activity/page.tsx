import Link from "next/link";
import { ArrowLeftIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { BodyMedium, Caption, H1, H2 } from "@/components/ui/typography";
import { ActivityCalendar } from "@/components/dashboard/activity-calendar";
import { StreakCard } from "@/components/dashboard/streak-card";
import {
  getActivityHistory,
  getDistinctLearningDays,
  getLocalDateKey,
  getUserSettings,
} from "@/lib/learning/activity";
import { createClient } from "@/lib/supabase/server";
import {
  computeRegularityMetrics,
  computeMonthlyActivity,
} from "@/lib/learning/regularity";

export const dynamic = "force-dynamic";

export default async function ActivityPage() {
  const client = await createClient();
  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user) {
    return (
      <main className="mx-auto flex w-full max-w-2xl flex-col items-center gap-6 px-5 py-12 text-center">
        <H1>Connecte-toi pour voir ton activité.</H1>
      </main>
    );
  }

  const settings = await getUserSettings(client, user.id);
  const timezone = settings?.timezone ?? null;
  const now = new Date();
  const today = getLocalDateKey(now, timezone);

  const [learningDays, history] = await Promise.all([
    getDistinctLearningDays(client, user.id, timezone),
    getActivityHistory(client, user.id, 30, now, timezone),
  ]);

  const regularity = computeRegularityMetrics(learningDays, today);
  const streakBroken =
    regularity.totalActiveDays > 0 && regularity.currentStreak === 0;
  const thisMonth = computeMonthlyActivity(
    learningDays,
    new Date().getUTCFullYear(),
    new Date().getUTCMonth() + 1,
  );

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-5 py-8 sm:px-8 sm:py-10">
      {/* Retour */}
      <div className="flex items-center gap-3">
        <Button
          render={<Link href="/dashboard" />}
          variant="ghost"
          size="icon"
          aria-label="Retour au tableau de bord"
          className="shrink-0 rounded-full"
        >
          <ArrowLeftIcon aria-hidden="true" />
        </Button>
      </div>

      {/* En-tête */}
      <header className="flex flex-col gap-2">
        <Caption className="text-primary-strong">Régularité</Caption>
        <H1>Ton activité</H1>
        <BodyMedium className="max-w-2xl text-text-secondary">
          Une vue de ta régularité d&rsquo;apprentissage. Chaque jour est
          compté lorsqu&rsquo;une leçon est terminée ou un mot est révisé.
        </BodyMedium>
      </header>

      {/* Cartes de statistiques */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-border-subtle bg-surface-elevated">
          <CardContent className="items-center gap-2 p-5">
            <Caption className="text-text-secondary">Jours actifs</Caption>
            <span className="text-2xl font-bold tabular-nums text-foreground">
              {regularity.totalActiveDays}
            </span>
          </CardContent>
        </Card>
        <Card className="border-border-subtle bg-surface-elevated">
          <CardContent className="items-center gap-2 p-5">
            <Caption className="text-text-secondary">Ce mois</Caption>
            <span className="text-2xl font-bold tabular-nums text-foreground">
              {thisMonth.activeDays}
            </span>
          </CardContent>
        </Card>
        <Card className="border-border-subtle bg-surface-elevated">
          <CardContent className="items-center gap-2 p-5">
            <Caption className="text-text-secondary">Mots étudiés (30 j)</Caption>
            <span className="text-2xl font-bold tabular-nums text-foreground">
              {history.wordsStudied}
            </span>
          </CardContent>
        </Card>
      </div>

      {/* Streak principal */}
      <Card className="border-border-subtle bg-surface-elevated">
        <CardContent className="items-center p-6 sm:p-8">
          <StreakCard
            regularity={regularity}
            streakBroken={streakBroken}
            variant="full"
          />
        </CardContent>
      </Card>

      {/* Calendrier mensuel */}
      <section aria-labelledby="calendar-title">
        <div className="flex flex-col gap-1 mb-4">
          <Caption className="text-primary-strong">Calendrier</Caption>
          <H2 id="calendar-title">Activité du mois</H2>
        </div>
        <Card className="border-border-subtle bg-surface-elevated">
          <CardContent className="p-5 sm:p-7">
            <ActivityCalendar learningDays={learningDays} today={today} />
          </CardContent>
        </Card>
      </section>
    </main>
  );
}