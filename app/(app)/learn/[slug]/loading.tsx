import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function LessonLoading() {
  return (
    <main
      className="mx-auto flex w-full max-w-2xl flex-col gap-8 px-5 py-6 sm:px-8 sm:py-8"
      aria-label="Chargement de la leçon..."
      aria-busy="true"
    >
      {/* Barre de navigation / sortie de leçon */}
      <header className="flex items-center justify-between gap-4">
        <div className="flex flex-1 items-center gap-3">
          <Skeleton className="h-2.5 w-full max-w-xs rounded-full" />
          <Skeleton className="h-4 w-16 rounded-full" />
        </div>
        <Skeleton className="size-9 rounded-full" />
      </header>

      {/* Shell de l'exercice */}
      <div className="flex flex-col gap-6">
        <div className="flex flex-col items-center gap-2 text-center">
          <Skeleton className="h-3.5 w-32 rounded-full" />
          <Skeleton className="h-7 w-64 rounded-lg sm:w-80" />
        </div>

        {/* Carte de l'exercice */}
        <Card className="rounded-3xl border-border-subtle bg-surface-elevated shadow-card">
          <CardContent className="flex flex-col items-center gap-6 p-6 sm:p-8">
            <Skeleton className="h-10 w-28 rounded-full" />
            <Skeleton className="h-8 w-48 rounded-lg" />
            <Skeleton className="h-4 w-60 rounded-md" />

            {/* Options grid */}
            <div className="grid w-full gap-3 sm:grid-cols-2">
              <Skeleton className="h-14 w-full rounded-xl" />
              <Skeleton className="h-14 w-full rounded-xl" />
              <Skeleton className="h-14 w-full rounded-xl" />
              <Skeleton className="h-14 w-full rounded-xl" />
            </div>
          </CardContent>
        </Card>

        {/* Action bar */}
        <div className="flex justify-end pt-2">
          <Skeleton className="h-12 w-36 rounded-full" />
        </div>
      </div>
    </main>
  );
}
