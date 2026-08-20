import { Skeleton } from "@/components/ui/skeleton";

export default function AppLoading() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-6 py-12" aria-busy="true">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96 max-w-full" />
      </div>
      <Skeleton className="h-28 w-full rounded-2xl" />
      <Skeleton className="h-20 w-full rounded-2xl" />
      <Skeleton className="h-20 w-full rounded-2xl" />
    </main>
  );
}
