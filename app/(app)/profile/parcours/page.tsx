import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ProfileOptionPage } from "@/components/app/profile-option-page";
import { ProfilePreferenceForm } from "@/components/app/profile-preference-form";
import { getUserSettings } from "@/lib/learning/activity";
import { getSurahCatalog } from "@/lib/learning/queries";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function ProfilePathPage() {
  const client = await createClient();
  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user) redirect("/login");

  const [settings, catalog] = await Promise.all([
    getUserSettings(client, user.id),
    getSurahCatalog(client),
  ]);

  const options: readonly (readonly [string, string])[] = catalog
    .filter((item) => item.state === "REFERENCE" || item.state === "READY")
    .map((item) => [String(item.surahNumber), item.nameTransliteration] as const);

  return (
    <ProfileOptionPage
      title="Sourate de départ"
      description="Le point de départ de ton parcours, toujours modifiable. « Recommandation Hikma » laisse le choix suivre ta progression."
    >
      <ProfilePreferenceForm
        field="preferredSurahNumber"
        current={settings?.preferred_surah_number ?? null}
        options={options}
        emptyLabel="Recommandation Hikma"
        render="select"
        numeric
        ariaLabel="Sourate de départ"
      />
    </ProfileOptionPage>
  );
}
