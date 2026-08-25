// Page 404 Hikma (résout U4 + Phase 89E R-012) : marque + actions de
// récupération. Un visiteur anonyme n'est jamais envoyé vers l'espace privé.

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Mascot } from "@/components/ui/mascot";
import { BodyMedium, H1 } from "@/components/ui/typography";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function NotFound() {
  const client = await createClient();
  const {
    data: { user },
  } = await client.auth.getUser();

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col items-center gap-6 px-6 py-16 text-center">
      <Mascot variant="welcome" size="lg" message="Cette page n'existe pas." />
      <div className="flex flex-col gap-2">
        <H1>Page introuvable</H1>
        <BodyMedium className="text-muted-foreground">
          Le lien est peut-être obsolète.
        </BodyMedium>
      </div>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Button render={<Link href={user ? "/dashboard" : "/"} />} size="lg" className="min-h-12">
          {user ? "Retour au tableau de bord" : "Retour à l'accueil"}
        </Button>
        <Button
          render={<Link href="/surahs" />}
          size="lg"
          variant="outline"
          className="min-h-12"
        >
          Découvrir les sourates
        </Button>
      </div>
    </main>
  );
}
