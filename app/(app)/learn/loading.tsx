import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function LearnLoading() {
  return (
    <main
      className="mx-auto flex w-full max-w-5xl flex-col gap-10 px-5 py-8 sm:px-8 sm:py-10 lg:gap-12"
      aria-label="Chargement du parcours..."
      aria-busy="true"
    >
      <header className="flex flex-col gap-3">
        <Skeleton className="h-4 w-20 rounded-full" />
        <Skeleton className="h-9 w-64 rounded-lg sm:w-80" />
        <Skeleton className="h-5 w-full max-w-2xl rounded-md" />
      </header>

      <section
        className="grid grid-cols-1 gap-5 [&>*]:min-w-0 lg:grid-cols-[1fr_0.7fr]"
        aria-label="Résumé du parcours"
      >
        {/* Ton chemin */}
        <Card className="rounded-4xl border-primary/20 bg-surface-featured shadow-elevated">
          <CardContent className="flex flex-col gap-5 p-6 sm:p-8">
            <div className="flex items-end justify-between gap-4">
              <div className="flex flex-col gap-1">
                <Skeleton className="h-3.5 w-24 rounded-full" />
                <Skeleton className="h-7 w-40 rounded-lg" />
              </div>
              <Skeleton className="h-4 w-12 rounded-full" />
            </div>
            <Skeleton className="h-3 w-full rounded-full" />
            {/* Prochaine étape placeholder */}
            <div className="flex items-center justify-between gap-4 rounded-2xl border border-border-subtle bg-surface-elevated p-4">
              <div className="flex flex-col gap-1.5">
                <Skeleton className="h-3 w-24 rounded-full" />
                <Skeleton className="h-5 w-48 rounded-md" />
                <Skeleton className="h-3 w-32 rounded-full" />
              </div>
              <Skeleton className="size-5 rounded-full" />
            </div>
          </CardContent>
        </Card>

        {/* Comment avancer */}
        <Card className="border-border-subtle bg-surface-elevated">
          <CardContent className="flex flex-col gap-4 p-6 sm:p-8">
            <Skeleton className="h-7 w-44 rounded-lg" />
            <Skeleton className="h-4 w-full rounded-md" />
            <Skeleton className="h-4 w-4/5 rounded-md" />
            <Skeleton className="h-11 w-36 rounded-full" />
          </CardContent>
        </Card>
      </section>

      {/* Étapes du parcours */}
      <section className="flex flex-col gap-8">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-3.5 w-28 rounded-full" />
          <Skeleton className="h-7 w-52 rounded-lg" />
        </div>

        <div className="flex flex-col gap-4">
          {[1, 2, 3].map((i) => (
            <Card
              key={i}
              className="border-border-subtle bg-surface-elevated shadow-card"
            >
              <CardContent className="flex items-start gap-4 p-5 sm:p-6">
                <Skeleton className="size-10 shrink-0 rounded-full" />
                <div className="flex flex-1 flex-col gap-2">
                  <Skeleton className="h-5 w-44 rounded-md" />
                  <Skeleton className="h-4 w-full max-w-md rounded-md" />
                  <Skeleton className="h-2.5 w-3/4 rounded-full" />
                </div>
                <Skeleton className="size-5 shrink-0 rounded-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </main>
  );
}
