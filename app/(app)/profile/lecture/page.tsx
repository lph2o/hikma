import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ProfileOptionPage } from "@/components/app/profile-option-page";
import { ProfilePreferenceForm } from "@/components/app/profile-preference-form";
import { getUserSettings } from "@/lib/learning/activity";
import { ARABIC_READING_LEVEL_OPTIONS } from "@/lib/learning/preferences";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function ProfileReadingPage() {
  const client = await createClient();
  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user) redirect("/login");

  const settings = await getUserSettings(client, user.id);

  return (
    <ProfileOptionPage
      title="Lecture de l’arabe"
      description="À quel point es-tu à l’aise avec la lecture arabe ? Ce choix ne modifie jamais la correction de tes réponses."
    >
      <ProfilePreferenceForm
        field="arabicReadingLevel"
        current={settings?.arabic_reading_level ?? null}
        options={ARABIC_READING_LEVEL_OPTIONS}
        ariaLabel="Niveau de lecture de l’arabe"
      />
    </ProfileOptionPage>
  );
}
