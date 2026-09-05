import { redirect } from "next/navigation";
import { AuthShell } from "@/components/app/auth/auth-shell";
import { ForgotPasswordForm } from "@/components/app/forgot-password-form";
import { createClient } from "@/lib/supabase/server";
import { getUserSettings } from "@/lib/learning/activity";
import { isOnboardingComplete } from "@/lib/learning/onboarding";

export const dynamic = "force-dynamic";

export default async function ForgotPasswordPage() {
  const client = await createClient();
  const {
    data: { user },
  } = await client.auth.getUser();

  if (user) {
    const settings = await getUserSettings(client, user.id);
    redirect(isOnboardingComplete(settings) ? "/dashboard" : "/onboarding");
  }

  return (
    <AuthShell showBrandPanel={false}>
      <ForgotPasswordForm />
    </AuthShell>
  );
}
