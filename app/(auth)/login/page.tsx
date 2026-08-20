import { redirect } from "next/navigation";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Mascot } from "@/components/ui/mascot";
import { HikmaLogo } from "@/components/ui/hikma-logo";
import { BodyMedium, H1 } from "@/components/ui/typography";
import { LoginForm } from "@/components/app/login-form";
import { createClient } from "@/lib/supabase/server";
import { getUserSettings } from "@/lib/learning/activity";
import { isOnboardingComplete } from "@/lib/learning/onboarding";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
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
          <Mascot variant="login" size="md" message="Heureux de te revoir !" />
          <div className="flex flex-col items-center gap-1 text-center">
            <H1>Hikma</H1>
            <BodyMedium className="text-muted-foreground">
              Connecte-toi pour apprendre et suivre ta progression.
            </BodyMedium>
          </div>
          <LoginForm />
          <Link href="/" className="text-sm text-muted-foreground hover:underline">
            ← Retour à l&apos;accueil
          </Link>
        </CardContent>
      </Card>
    </main>
  );
}
