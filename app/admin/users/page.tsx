import type { Metadata } from "next";
import { requireAdmin } from "@/lib/admin/auth";
import { getAdminUsersList } from "@/lib/admin/queries/users";
import { UsersTable } from "@/components/admin/users/users-table";
import { UsersIcon, UserCheckIcon, SparklesIcon } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Gestion des utilisateurs — Admin Control Center | Hikma",
  robots: { index: false, follow: false },
};

interface UsersPageProps {
  searchParams: Promise<{
    page?: string;
    q?: string;
    status?: "all" | "onboarded" | "not_onboarded" | "active_7d";
  }>;
}

export default async function AdminUsersPage({ searchParams }: UsersPageProps) {
  await requireAdmin();

  const params = await searchParams;
  const page = params.page ? parseInt(params.page, 10) : 1;
  const search = params.q ?? "";
  const statusFilter = params.status ?? "all";

  const data = await getAdminUsersList({
    page: isNaN(page) ? 1 : page,
    perPage: 20,
    search,
    statusFilter,
  });

  const onboardedCount = data.users.filter((u) => u.onboarded).length;
  const activeCount = data.users.filter((u) => u.lessonsCompletedCount > 0 || u.wordsStudiedCount > 0).length;

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8">
      {/* Header section */}
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Gestion des utilisateurs
          </h1>
          <p className="text-xs text-muted-foreground sm:text-sm mt-0.5">
            Comptes inscrits, états d&apos;onboarding et progression de l&apos;apprentissage.
          </p>
        </div>

        {/* Quick summary chips */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <div className="flex items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-1.5 shadow-sm">
            <UsersIcon className="size-3.5 text-muted-foreground" />
            <span className="text-muted-foreground">Total :</span>
            <strong className="text-foreground">{data.totalUsers}</strong>
          </div>
          <div className="flex items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-1.5 shadow-sm">
            <UserCheckIcon className="size-3.5 text-emerald-600 dark:text-emerald-400" />
            <span className="text-muted-foreground">Onboardés :</span>
            <strong className="text-foreground">{onboardedCount}</strong>
          </div>
          <div className="flex items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-1.5 shadow-sm">
            <SparklesIcon className="size-3.5 text-primary" />
            <span className="text-muted-foreground">Avec activité :</span>
            <strong className="text-foreground">{activeCount}</strong>
          </div>
        </div>
      </div>

      {/* Tableau des utilisateurs */}
      <UsersTable
        users={data.users}
        totalUsers={data.totalUsers}
        page={data.page}
        perPage={data.perPage}
        totalPages={data.totalPages}
        currentSearch={search}
        currentStatus={statusFilter}
      />
    </div>
  );
}
