import { redirect } from "next/navigation";
import { AuthShell } from "@/components/app/auth/auth-shell";
import { LoginForm } from "@/components/app/login-form";
import { createClient } from "@/lib/supabase/server";
import { getUserSettings } from "@/lib/learning/activity";
import { isOnboardingComplete } from "@/lib/learning/onboarding";

export const dynamic = "force-dynamic";

export default async function SignupPage() {
  const client = await createClient();
  const {
    data: { user },
  } = await client.auth.getUser();

  if (user) {
    const settings = await getUserSettings(client, user.id);
    redirect(isOnboardingComplete(settings) ? "/dashboard" : "/onboarding");
  }

  return (
    <AuthShell showBrandPanel>
      <LoginForm initialMode="sign-up" />
    </AuthShell>
  );
}
