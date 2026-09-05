import { redirect } from "next/navigation";
import { AuthShell } from "@/components/app/auth/auth-shell";
import { LoginForm, type AuthMode } from "@/components/app/login-form";
import { createClient } from "@/lib/supabase/server";
import { getUserSettings } from "@/lib/learning/activity";
import { isOnboardingComplete } from "@/lib/learning/onboarding";

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams?: Promise<{ mode?: string }>;
}) {
  const client = await createClient();
  const {
    data: { user },
  } = await client.auth.getUser();

  if (user) {
    const settings = await getUserSettings(client, user.id);
    redirect(isOnboardingComplete(settings) ? "/dashboard" : "/onboarding");
  }

  const resolvedParams = searchParams ? await searchParams : undefined;
  const initialMode: AuthMode =
    resolvedParams?.mode === "sign-up" ? "sign-up" : "sign-in";

  return (
    <AuthShell showBrandPanel>
      <LoginForm initialMode={initialMode} />
    </AuthShell>
  );
}
