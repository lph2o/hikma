import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ListOrderedIcon } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { isAdminEmail } from "@/lib/content-studio/admin";
import { ContentRegistryService } from "@/lib/content-studio/registry";
import { getContentStudioDbClient } from "@/lib/content-studio/client";
import { StudioShell } from "@/components/content-studio/studio-shell";
import { ProductionQueue } from "@/components/content-studio/queue/production-queue";
import {
  Empty,
  EmptyAction,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function ContentQueuePage() {
  const client = await createClient();
  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user) redirect("/login");
  if (!isAdminEmail(user.email)) notFound();

  const registry = new ContentRegistryService(getContentStudioDbClient());
  const page = await registry.list({ limit: 100 });

  const empty = page.items.length === 0;

  return (
    <StudioShell active="queue">
      <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
        <header className="mb-6 flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight text-white/95">
            File de Production
          </h1>
          <p className="text-sm text-white/50">
            Ordre de priorité des vidéos à finaliser, rendre et diffuser sur les plateformes.
          </p>
        </header>

        {empty ? (
          <Empty className="border-white/10 bg-[#0d1210]">
            <EmptyHeader>
              <EmptyMedia variant="icon" className="border-white/10 bg-white/5 text-white/60">
                <ListOrderedIcon aria-hidden="true" />
              </EmptyMedia>
              <EmptyTitle className="text-white/90">File d&apos;attente vide</EmptyTitle>
              <EmptyDescription className="text-white/40">
                Créez et préparez vos contenus pour constituer votre file de publication.
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <EmptyAction>
                <Button render={<Link href="/admin/content-studio" />}>
                  Aller à la bibliothèque
                </Button>
              </EmptyAction>
            </EmptyContent>
          </Empty>
        ) : (
          <ProductionQueue items={page.items} />
        )}
      </div>
    </StudioShell>
  );
}
