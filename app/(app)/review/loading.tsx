import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function ReviewLoading() {
  return (
    <main
      className="mx-auto flex w-full max-w-2xl flex-col gap-8 px-5 py-6 sm:px-8 sm:py-8"
      aria-label="Chargement des révisions..."
      aria-busy="true"
    >
      {/* En-tête de révision */}
      <header className="flex items-center justify-between gap-4">
        <div className="flex flex-col gap-1.5">
          <Skeleton className="h-3.5 w-24 rounded-full" />
          <Skeleton className="h-6 w-48 rounded-lg" />
        </div>
        <Skeleton className="h-4 w-16 rounded-full" />
      </header>

      {/* Carte d'exercice de révision */}
      <Card className="rounded-3xl border-border-subtle bg-surface-elevated shadow-card">
        <CardContent className="flex flex-col items-center gap-6 p-6 sm:p-8">
          <Skeleton className="h-4 w-32 rounded-full" />
          <Skeleton className="h-8 w-56 rounded-lg" />
          <Skeleton className="h-4 w-72 rounded-md" />

          {/* Options de révision */}
          <div className="grid w-full gap-3 sm:grid-cols-2">
            <Skeleton className="h-14 w-full rounded-xl" />
            <Skeleton className="h-14 w-full rounded-xl" />
            <Skeleton className="h-14 w-full rounded-xl" />
            <Skeleton className="h-14 w-full rounded-xl" />
          </div>
        </CardContent>
      </Card>

      {/* Action de continuation */}
      <div className="flex justify-end pt-2">
        <Skeleton className="h-12 w-32 rounded-full" />
      </div>
    </main>
  );
}
