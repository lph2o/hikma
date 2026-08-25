import { redirect } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Mascot } from "@/components/ui/mascot";
import { HikmaLogo } from "@/components/ui/hikma-logo";
import { BodyMedium, H1 } from "@/components/ui/typography";
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
    <main className="w-full max-w-md">
      <Card>
        <CardContent className="items-center gap-6 p-8">
          <HikmaLogo size="lg" priority />
          <Mascot variant="login" size="md" message="On t'aide à te reconnecter" />
          <div className="flex flex-col items-center gap-1 text-center">
            <H1>Mot de passe oublié</H1>
            <BodyMedium className="text-muted-foreground">
              Saisis l&apos;adresse e-mail associée à ton compte pour recevoir
              un lien de réinitialisation.
            </BodyMedium>
          </div>
          <ForgotPasswordForm />
        </CardContent>
      </Card>
    </main>
  );
}
