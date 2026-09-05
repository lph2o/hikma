import { BookOpenIcon, CalendarIcon } from "lucide-react";
import type { AdminUserActivityItem } from "@/lib/admin/metrics";

interface UserActivityLogProps {
  activities: AdminUserActivityItem[];
}

export function UserActivityLog({ activities }: UserActivityLogProps) {
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-card">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-foreground">
            Historique des leçons complétées
          </h2>
          <p className="text-xs text-muted-foreground">
            Journal des leçons validées ({activities.length} session{activities.length > 1 ? "s" : ""})
          </p>
        </div>
      </div>

      {activities.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border-subtle p-8 text-center text-xs text-muted-foreground">
          Aucune leçon complétée pour le moment.
        </div>
      ) : (
        <div className="divide-y divide-border-subtle">
          {activities.map((a, idx) => (
            <div
              key={`${a.lessonId}-${a.activityDate}-${idx}`}
              className="flex items-center justify-between py-3 text-xs"
            >
              <div className="flex items-center gap-3">
                <div className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <BookOpenIcon className="size-3.5" />
                </div>
                <div className="flex flex-col">
                  <span className="font-semibold text-foreground">
                    {a.lessonTitle}
                  </span>
                  {a.unitTitle && (
                    <span className="text-[11px] text-muted-foreground">
                      Unité : {a.unitTitle}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <CalendarIcon className="size-3" />
                <span>
                  {new Date(a.activityDate).toLocaleDateString("fr-FR", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
