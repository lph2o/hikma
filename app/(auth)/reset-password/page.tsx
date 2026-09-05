import { redirect } from "next/navigation";
import Link from "next/link";
import { AlertCircleIcon, RotateCcwIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AuthShell } from "@/components/app/auth/auth-shell";
import { ResetPasswordForm } from "@/components/app/reset-password-form";
import { hasRecoverySession } from "@/lib/auth/password-reset";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

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
    <AuthShell showBrandPanel={false}>
      {showForm ? (
        <ResetPasswordForm code={code ?? null} />
      ) : (
        <div className="w-full rounded-2xl border border-border bg-surface-elevated p-6 shadow-elevated sm:p-8">
          <div className="flex flex-col items-center gap-5 text-center">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-destructive/15 text-destructive">
              <AlertCircleIcon className="size-8" />
            </div>

            <div className="flex flex-col gap-1.5">
              <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground">
                Lien invalide ou expiré
              </h1>
              <p className="text-body-sm text-muted-foreground">
                Ce lien de réinitialisation est invalide, expiré ou a déjà été utilisé.
                Veuillez demander un nouveau lien.
              </p>
            </div>

            <div className="mt-2 flex w-full flex-col gap-2.5 sm:flex-row">
              <Button
                render={<Link href="/forgot-password" />}
                size="lg"
                className="h-12 w-full rounded-xl bg-hikma-teal-700 font-semibold text-white hover:bg-hikma-teal-800"
              >
                <RotateCcwIcon className="size-4" />
                <span>Redemander un lien</span>
              </Button>
              <Button
                render={<Link href="/login" />}
                size="lg"
                variant="outline"
                className="h-12 w-full rounded-xl"
              >
                <span>Connexion</span>
              </Button>
            </div>
          </div>
        </div>
      )}
    </AuthShell>
  );
}
