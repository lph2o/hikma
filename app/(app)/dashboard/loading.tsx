import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-5 py-8 sm:px-8 sm:py-10">
      <div className="flex flex-col gap-3"><Skeleton className="h-4 w-40" /><Skeleton className="h-10 w-72" /><Skeleton className="h-6 w-full max-w-xl" /></div>
      <Skeleton className="h-72 w-full rounded-4xl" />
      <div className="grid gap-5 lg:grid-cols-2"><Skeleton className="h-56 w-full rounded-2xl" /><Skeleton className="h-56 w-full rounded-2xl" /></div>
      <Skeleton className="h-64 w-full rounded-2xl" />
    </main>
  );
}
