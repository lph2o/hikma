"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import {
  SearchIcon,
  ShieldCheckIcon,
  CheckCircleIcon,
  XCircleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "lucide-react";

import type { AdminUserListItem } from "@/lib/admin/metrics";
import { cn } from "@/lib/utils";

interface UsersTableProps {
  users: AdminUserListItem[];
  totalUsers: number;
  page: number;
  perPage: number;
  totalPages: number;
  currentSearch?: string;
  currentStatus?: string;
}

const GOAL_LABELS: Record<string, string> = {
  start_gently: "Débuter en douceur",
  understand_surahs: "Comprendre les sourates",
  understand_recitation: "Comprendre la récitation",
  memorize_vocabulary: "Mémoriser le vocabulaire",
};

export function UsersTable({
  users,
  totalUsers,
  page,
  totalPages,
  currentSearch = "",
  currentStatus = "all",
}: UsersTableProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const [searchTerm, setSearchTerm] = useState(currentSearch);

  function updateQuery(params: { search?: string; status?: string; page?: number }) {
    const next = new URLSearchParams(searchParams.toString());

    if (params.search !== undefined) {
      if (params.search.trim()) next.set("q", params.search.trim());
      else next.delete("q");
      next.delete("page");
    }

    if (params.status !== undefined) {
      if (params.status !== "all") next.set("status", params.status);
      else next.delete("status");
      next.delete("page");
    }

    if (params.page !== undefined) {
      if (params.page > 1) next.set("page", String(params.page));
      else next.delete("page");
    }

    startTransition(() => {
      router.push(`${pathname}?${next.toString()}`);
    });
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateQuery({ search: searchTerm });
  };

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-card">
      {/* Barre d'outils : Recherche & Filtres */}
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        {/* Recherche */}
        <form onSubmit={handleSearchSubmit} className="relative w-full sm:max-w-xs">
          <SearchIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onBlur={() => updateQuery({ search: searchTerm })}
            placeholder="Rechercher par nom ou email..."
            className="w-full rounded-xl border border-border bg-background py-2 pl-9 pr-3 text-xs text-foreground placeholder:text-muted-foreground outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary"
          />
        </form>

        {/* Filtres par statut */}
        <div className="flex items-center gap-1 overflow-x-auto rounded-xl border border-border-subtle bg-surface-subtle p-1 text-xs">
          {[
            { key: "all", label: "Tous" },
            { key: "onboarded", label: "Onboardés" },
            { key: "not_onboarded", label: "Non-onboardés" },
            { key: "active_7d", label: "Actifs 7j" },
          ].map(({ key, label }) => {
            const active = currentStatus === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => updateQuery({ status: key })}
                className={cn(
                  "whitespace-nowrap rounded-lg px-2.5 py-1 font-medium transition-colors",
                  active
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tableau des utilisateurs */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-foreground">
          <thead>
            <tr className="border-b border-border text-muted-foreground">
              <th className="py-3 px-3 font-semibold">Utilisateur</th>
              <th className="py-3 px-3 font-semibold">Statut</th>
              <th className="py-3 px-3 font-semibold">Objectif</th>
              <th className="py-3 px-3 font-semibold text-center">Leçons</th>
              <th className="py-3 px-3 font-semibold text-center">Mots maîtrisés</th>
              <th className="py-3 px-3 font-semibold">Dernière activité</th>
              <th className="py-3 px-3 font-semibold text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-subtle">
            {users.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-muted-foreground">
                  Aucun utilisateur ne correspond à ces critères.
                </td>
              </tr>
            ) : (
              users.map((u) => {
                const goalLabel = u.learningGoal
                  ? GOAL_LABELS[u.learningGoal] ?? u.learningGoal
                  : "—";

                return (
                  <tr
                    key={u.id}
                    className="group transition-colors hover:bg-surface-subtle/60"
                  >
                    {/* Nom + Email + Badge admin */}
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2.5">
                        <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-bold text-primary">
                          {u.displayName
                            ? u.displayName.charAt(0).toUpperCase()
                            : u.email
                            ? u.email.charAt(0).toUpperCase()
                            : "U"}
                        </div>
                        <div className="flex flex-col">
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-foreground">
                              {u.displayName ?? "Sans nom"}
                            </span>
                            {u.isAdmin ? (
                              <span className="inline-flex items-center gap-0.5 rounded bg-primary/15 px-1.5 py-0.2 text-[9px] font-bold text-primary">
                                <ShieldCheckIcon className="size-2.5" />
                                ADMIN
                              </span>
                            ) : null}
                          </div>
                          <span className="text-[11px] text-muted-foreground truncate max-w-[180px]">
                            {u.email ?? "Sans email"}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Statut Onboarding */}
                    <td className="py-3 px-3">
                      {u.onboarded ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
                          <CheckCircleIcon className="size-3" />
                          Onboardé
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-muted/60 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                          <XCircleIcon className="size-3" />
                          Non terminé
                        </span>
                      )}
                    </td>

                    {/* Objectif */}
                    <td className="py-3 px-3 text-muted-foreground">
                      <span className="truncate max-w-[150px] block" title={goalLabel}>
                        {goalLabel}
                      </span>
                    </td>

                    {/* Leçons */}
                    <td className="py-3 px-3 text-center font-medium">
                      {u.lessonsCompletedCount}
                    </td>

                    {/* Mots maîtrisés */}
                    <td className="py-3 px-3 text-center">
                      <span
                        className={cn(
                          "font-semibold",
                          u.wordsMasteredCount > 0 ? "text-primary" : "text-muted-foreground",
                        )}
                      >
                        {u.wordsMasteredCount}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {" "}
                        / {u.wordsStudiedCount}
                      </span>
                    </td>

                    {/* Dernière activité */}
                    <td className="py-3 px-3 text-muted-foreground text-[11px]">
                      {u.lastActiveAt
                        ? new Date(u.lastActiveAt).toLocaleDateString("fr-FR")
                        : "Jamais"}
                    </td>

                    {/* Action */}
                    <td className="py-3 px-3 text-right">
                      <Link
                        href={`/admin/users/${u.id}`}
                        className="inline-flex items-center gap-1 rounded-lg border border-border-subtle bg-surface-subtle px-2.5 py-1 text-[11px] font-medium text-foreground transition-colors hover:bg-surface-interactive hover:text-primary outline-none focus-visible:ring-1 focus-visible:ring-primary"
                      >
                        <span>Fiche</span>
                        <span>&rarr;</span>
                      </Link>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex flex-col items-center justify-between gap-3 pt-2 text-xs text-muted-foreground sm:flex-row">
        <span>
          Affichage de{" "}
          <strong className="text-foreground">{users.length}</strong> sur{" "}
          <strong className="text-foreground">{totalUsers}</strong> utilisateur{totalUsers > 1 ? "s" : ""}
        </span>

        {totalPages > 1 && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => updateQuery({ page: page - 1 })}
              className="inline-flex items-center gap-1 rounded-lg border border-border-subtle bg-surface-subtle px-2.5 py-1 font-medium transition-colors hover:bg-surface-interactive disabled:opacity-40 disabled:pointer-events-none"
            >
              <ChevronLeftIcon className="size-3.5" />
              <span>Précédent</span>
            </button>
            <span>
              Page {page} sur {totalPages}
            </span>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => updateQuery({ page: page + 1 })}
              className="inline-flex items-center gap-1 rounded-lg border border-border-subtle bg-surface-subtle px-2.5 py-1 font-medium transition-colors hover:bg-surface-interactive disabled:opacity-40 disabled:pointer-events-none"
            >
              <span>Suivant</span>
              <ChevronRightIcon className="size-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
