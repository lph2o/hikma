import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ProfileOptionPage } from "@/components/app/profile-option-page";
import { ProfilePreferenceForm } from "@/components/app/profile-preference-form";
import { getUserSettings } from "@/lib/learning/activity";
import { QURAN_FAMILIARITY_OPTIONS } from "@/lib/learning/preferences";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function ProfileRelationPage() {
  const client = await createClient();
  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user) redirect("/login");

  const settings = await getUserSettings(client, user.id);

  return (
    <ProfileOptionPage
      title="Relation avec le Coran"
      description="Une indication pour mieux te proposer des sourates, jamais une mesure de niveau."
    >
      <ProfilePreferenceForm
        field="quranFamiliarity"
        current={settings?.quran_familiarity ?? null}
        options={QURAN_FAMILIARITY_OPTIONS}
        ariaLabel="Relation avec le Coran"
      />
    </ProfileOptionPage>
  );
}
