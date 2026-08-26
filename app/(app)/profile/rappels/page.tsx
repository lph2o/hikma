import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ProfileOptionPage } from "@/components/app/profile-option-page";
import { ReminderPreferences } from "@/components/app/reminder-preferences";
import { getUserSettings } from "@/lib/learning/activity";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function ProfileRemindersPage() {
  const client = await createClient();
  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user) redirect("/login");

  const settings = await getUserSettings(client, user.id);

  return (
    <ProfileOptionPage
      title="Rappels"
      description="Un rappel discret apparaît sur ton tableau de bord quand tu n’as pas encore appris aujourd’hui."
    >
      <ReminderPreferences
        enabled={settings?.reminder_enabled ?? false}
        time={settings?.reminder_time ?? "19:00"}
      />
    </ProfileOptionPage>
  );
}
