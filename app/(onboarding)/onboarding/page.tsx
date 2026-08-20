import { redirect } from "next/navigation";
import { OnboardingForm } from "@/components/app/onboarding-form";
import { getUserSettings } from "@/lib/learning/activity";
import { getSurahCatalog } from "@/lib/learning/queries";
import { isOnboardingComplete } from "@/lib/learning/onboarding";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const client = await createClient();
  const {
    data: { user },
  } = await client.auth.getUser();

  if (!user) redirect("/login");

  const settings = await getUserSettings(client, user.id);
  if (isOnboardingComplete(settings)) redirect("/dashboard");

  const catalog = await getSurahCatalog(client);

  return (
    <main className="min-h-dvh bg-background px-4 py-8 sm:px-6 sm:py-16">
      <div className="mx-auto flex w-full max-w-2xl flex-col items-center">
        <OnboardingForm catalog={catalog} redirectTo="/surahs" />
      </div>
    </main>
  );
}
