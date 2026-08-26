import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ProfileOptionPage } from "@/components/app/profile-option-page";
import { ProfilePreferenceForm } from "@/components/app/profile-preference-form";
import { getUserSettings } from "@/lib/learning/activity";
import { LEARNING_PACE_OPTIONS } from "@/lib/learning/preferences";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function ProfilePacePage() {
  const client = await createClient();
  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user) redirect("/login");

  const settings = await getUserSettings(client, user.id);

  return (
    <ProfileOptionPage
      title="Rythme"
      description="Une préférence pour personnaliser ton expérience, pas une obligation."
    >
      <ProfilePreferenceForm
        field="learningPace"
        current={settings?.learning_pace ?? null}
        options={LEARNING_PACE_OPTIONS}
        ariaLabel="Rythme d’apprentissage"
      />
    </ProfileOptionPage>
  );
}
