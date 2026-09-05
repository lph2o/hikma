import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function SurahsLoading() {
  return (
    <main
      className="mx-auto flex w-full max-w-5xl flex-col gap-10 px-5 py-8 sm:px-8 sm:py-10 lg:gap-12"
      aria-label="Chargement des sourates..."
      aria-busy="true"
    >
      <header className="flex flex-col gap-3">
        <Skeleton className="h-4 w-24 rounded-full" />
        <Skeleton className="h-9 w-64 rounded-lg sm:w-80" />
        <Skeleton className="h-5 w-full max-w-xl rounded-md" />
      </header>

      {/* Hero card skeleton */}
      <Card className="rounded-4xl border-primary/20 bg-surface-featured shadow-elevated">
        <CardContent className="flex flex-col gap-5 p-6 sm:p-8">
          <div className="flex flex-col gap-2">
            <Skeleton className="h-4 w-32 rounded-full" />
            <Skeleton className="h-8 w-60 rounded-lg" />
            <Skeleton className="h-4 w-full max-w-md rounded-md" />
          </div>
          <Skeleton className="h-3 w-full rounded-full" />
          <Skeleton className="h-11 w-44 rounded-full" />
        </CardContent>
      </Card>

      {/* Grid of surahs */}
      <section className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-4 w-28 rounded-full" />
          <Skeleton className="h-7 w-48 rounded-lg" />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="border-border-subtle bg-surface-elevated shadow-card">
              <CardContent className="flex flex-col gap-4 p-5">
                <div className="flex items-start justify-between">
                  <div className="flex flex-col gap-1.5">
                    <Skeleton className="h-3.5 w-16 rounded-full" />
                    <Skeleton className="h-6 w-32 rounded-md" />
                  </div>
                  <Skeleton className="size-10 rounded-full" />
                </div>
                <Skeleton className="h-2.5 w-full rounded-full" />
                <Skeleton className="h-3.5 w-24 rounded-md" />
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </main>
  );
}
