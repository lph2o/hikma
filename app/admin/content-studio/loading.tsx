// Hikma — Content Studio (UI2) : ÉTAT DE CHARGEMENT (squelettes studio sombre).

import { StudioShell } from "@/components/content-studio/studio-shell";
import { Skeleton } from "@/components/ui/skeleton";
import { Caption } from "@/components/ui/typography";

export default function ContentStudioLoading() {
  return (
    <StudioShell active="library">
      <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
        <div className="flex flex-col gap-1">
          <Skeleton className="h-8 w-56 bg-white/10" />
          <Skeleton className="h-4 w-80 max-w-full bg-white/5" />
        </div>
        <div className="mt-6 flex items-center gap-2">
          <Skeleton className="h-8 w-20 rounded-full bg-white/10" />
          <Skeleton className="h-8 w-24 rounded-full bg-white/5" />
          <Skeleton className="h-8 w-24 rounded-full bg-white/5" />
          <Skeleton className="h-8 w-24 rounded-full bg-white/5" />
        </div>
        <div className="mt-6 grid w-full grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="flex flex-col rounded-2xl border border-white/10 bg-[#0d1210]"
            >
              <Skeleton className="aspect-[9/16] w-full rounded-t-2xl bg-white/5" />
              <div className="flex flex-col gap-2 p-4">
                <Skeleton className="h-4 w-3/4 bg-white/10" />
                <div className="flex items-center gap-2">
                  <Skeleton className="h-4 w-20 rounded-full bg-white/5" />
                  <Skeleton className="ml-auto h-3 w-16 bg-white/5" />
                </div>
              </div>
            </div>
          ))}
        </div>
        <Caption className="sr-only">Chargement du Content Studio…</Caption>
      </div>
    </StudioShell>
  );
}
