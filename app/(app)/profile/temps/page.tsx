import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ProfileOptionPage } from "@/components/app/profile-option-page";
import { ProfilePreferenceForm } from "@/components/app/profile-preference-form";
import { getUserSettings } from "@/lib/learning/activity";
import { DAILY_DURATION_OPTIONS } from "@/lib/learning/preferences";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function ProfileDurationPage() {
  const client = await createClient();
  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user) redirect("/login");

  const settings = await getUserSettings(client, user.id);

  return (
    <ProfileOptionPage
      title="Temps souhaité"
      description="Une simple indication pour te suggérer des sessions, sans rien t’imposer."
    >
      <ProfilePreferenceForm
        field="dailyDuration"
        current={settings?.daily_duration ?? null}
        options={DAILY_DURATION_OPTIONS}
        emptyLabel="Je préfère avancer librement"
        render="select"
        numeric
        ariaLabel="Temps souhaité par session"
      />
    </ProfileOptionPage>
  );
}
