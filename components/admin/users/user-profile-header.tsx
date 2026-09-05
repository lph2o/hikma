import Link from "next/link";
import { ArrowLeftIcon, CalendarIcon, ClockIcon, ShieldCheckIcon } from "lucide-react";

interface UserProfileHeaderProps {
  displayName: string | null;
  email: string | null;
  isAdmin: boolean;
  onboarded: boolean;
  createdAt: string;
  lastSignInAt: string | null;
}

export function UserProfileHeader({
  displayName,
  email,
  isAdmin,
  onboarded,
  createdAt,
  lastSignInAt,
}: UserProfileHeaderProps) {
  const initials = displayName
    ? displayName.slice(0, 2).toUpperCase()
    : email
    ? email.slice(0, 2).toUpperCase()
    : "US";

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-card">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        {/* User Info */}
        <div className="flex items-center gap-4">
          <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-lg font-bold text-primary">
            {initials}
          </div>
          <div className="flex flex-col gap-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                {displayName ?? "Utilisateur sans nom"}
              </h1>
              {isAdmin && (
                <span className="inline-flex items-center gap-1 rounded bg-primary/15 px-2 py-0.5 text-xs font-bold text-primary">
                  <ShieldCheckIcon className="size-3" />
                  ADMINISTRATEUR
                </span>
              )}
              <span
                className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                  onboarded
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                    : "bg-muted/60 text-muted-foreground"
                }`}
              >
                {onboarded ? "Onboarding terminé" : "Onboarding non finalisé"}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">{email ?? "Pas d'adresse e-mail"}</p>
          </div>
        </div>

        {/* Back Link */}
        <Link
          href="/admin/users"
          className="inline-flex items-center gap-1.5 self-start rounded-xl border border-border-subtle bg-surface-subtle px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-surface-interactive hover:text-foreground sm:self-auto"
        >
          <ArrowLeftIcon className="size-3.5" />
          <span>Tous les utilisateurs</span>
        </Link>
      </div>

      {/* Meta dates bar */}
      <div className="flex flex-wrap items-center gap-4 border-t border-border-subtle pt-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <CalendarIcon className="size-3.5" />
          <span>
            Inscrit le{" "}
            <strong className="text-foreground">
              {new Date(createdAt).toLocaleDateString("fr-FR", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </strong>
          </span>
        </div>
        {lastSignInAt ? (
          <div className="flex items-center gap-1.5">
            <ClockIcon className="size-3.5" />
            <span>
              Dernière connexion le{" "}
              <strong className="text-foreground">
                {new Date(lastSignInAt).toLocaleDateString("fr-FR", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </strong>
            </span>
          </div>
        ) : null}
      </div>
    </div>
  );
}
