import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { GoalSettings } from "@/components/app/goal-settings";
import { ProfileOptionPage } from "@/components/app/profile-option-page";
import { getUserSettings } from "@/lib/learning/activity";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function ProfileGoalPage() {
  const client = await createClient();
  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user) redirect("/login");

  const settings = await getUserSettings(client, user.id);

  return (
    <ProfileOptionPage
      title="Objectif quotidien"
      description="Ton objectif compte les leçons complétées ou les mots distincts étudiés chaque jour (leçons + révisions)."
    >
      <GoalSettings
        currentType={settings?.daily_goal_type ?? "words"}
        currentValue={settings?.daily_goal_value ?? 5}
      />
    </ProfileOptionPage>
  );
}
