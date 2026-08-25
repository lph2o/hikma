import { redirect } from "next/navigation";
import Link from "next/link";
import { AlertTriangleIcon } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { HikmaLogo } from "@/components/ui/hikma-logo";
import { BodyMedium, H1 } from "@/components/ui/typography";
import { ResetPasswordForm } from "@/components/app/reset-password-form";
import { hasRecoverySession } from "@/lib/auth/password-reset";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/**
 * Page de nouveau mot de passe (Phase 89D, R-004).
 *
 * - `?code=` présent (lien reçu par e-mail, flux PKCE) → le formulaire échange
 *   le code côté client puis affiche le formulaire ;
 * - session de récupération déjà établie (amr = recovery) → formulaire direct ;
 * - session normale (utilisateur connecté hors récupération) → /dashboard
 *   (on ne casse pas la session, on ne réinitialise pas sans lien) ;
 * - sinon → « lien invalide ou expiré » + actions vers /forgot-password.
 */
export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string }>;
}) {
  const { code } = await searchParams;
  const client = await createClient();
  const {
    data: { session },
  } = await client.auth.getSession();

  if (session && !hasRecoverySession(session) && !code) {
    redirect("/dashboard");
  }

  const showForm = Boolean(code) || hasRecoverySession(session);

  return (
    <main className="w-full max-w-md">
      <Card>
        <CardContent className="items-center gap-6 p-8">
          <HikmaLogo size="lg" priority />
          <div className="flex flex-col items-center gap-1 text-center">
            <H1>Nouveau mot de passe</H1>
            <BodyMedium className="text-muted-foreground">
              Choisis un nouveau mot de passe pour ton compte.
            </BodyMedium>
          </div>
          {showForm ? (
            <ResetPasswordForm code={code ?? null} />
          ) : (
            <div className="flex flex-col gap-4">
              <Alert variant="error">
                <AlertTriangleIcon />
                <AlertTitle>Lien invalide ou expiré</AlertTitle>
                <AlertDescription>
                  Ce lien de réinitialisation est invalide, expiré ou déjà
                  utilisé. Redemande un lien pour continuer.
                </AlertDescription>
              </Alert>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button render={<Link href="/forgot-password" />} size="lg" className="min-h-11 w-full sm:w-auto">
                  Redemander un lien
                </Button>
                <Button
                  render={<Link href="/login" />}
                  size="lg"
                  variant="outline"
                  className="min-h-11 w-full sm:w-auto"
                >
                  Retour à la connexion
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
