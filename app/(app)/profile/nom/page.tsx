import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { DisplayNameForm } from "@/components/app/display-name-form";
import { ProfileOptionPage } from "@/components/app/profile-option-page";
import { getUserSettings } from "@/lib/learning/activity";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function ProfileNamePage() {
  const client = await createClient();
  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user) redirect("/login");

  const settings = await getUserSettings(client, user.id);

  return (
    <ProfileOptionPage
      title="Comment veux-tu qu’on t’appelle ?"
      description="On l’utilise pour te saluer sur ton accueil et sur ton profil."
    >
      <DisplayNameForm current={settings?.display_name ?? ""} />
    </ProfileOptionPage>
  );
}
