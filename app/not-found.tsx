// Page 404 Hikma (résout U4) : marque + action de récupération.

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Mascot } from "@/components/ui/mascot";
import { BodyMedium, H1 } from "@/components/ui/typography";

export default function NotFound() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col items-center gap-6 px-6 py-16 text-center">
      <Mascot variant="welcome" size="lg" message="Cette page n'existe pas." />
      <div className="flex flex-col gap-2">
        <H1>Page introuvable</H1>
        <BodyMedium className="text-muted-foreground">
          Le lien est peut-être obsolète. Retourne au parcours pour continuer
          ton apprentissage.
        </BodyMedium>
      </div>
      <Button render={<Link href="/dashboard" />} size="lg" className="min-h-12">
        Retour à l&apos;accueil
      </Button>
    </main>
  );
}
