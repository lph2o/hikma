import type { AdminUserWordItem } from "@/lib/admin/metrics";
import { cn } from "@/lib/utils";

interface UserVocabTableProps {
  words: AdminUserWordItem[];
}

const STATUS_CONFIG: Record<
  string,
  { label: string; className: string }
> = {
  mastered: {
    label: "Maîtrisé",
    className:
      "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  },
  familiar: {
    label: "Familier",
    className:
      "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20",
  },
  learning: {
    label: "En apprentissage",
    className:
      "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  },
  new: {
    label: "Nouveau",
    className: "bg-muted/60 text-muted-foreground border-border-subtle",
  },
};

export function UserVocabTable({ words }: UserVocabTableProps) {
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-card">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-foreground">
            Vocabulaire dans le SRS
          </h2>
          <p className="text-xs text-muted-foreground">
            Progression espacée et mémorisation ({words.length} mot{words.length > 1 ? "s" : ""})
          </p>
        </div>
      </div>

      {words.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border-subtle p-8 text-center text-xs text-muted-foreground">
          Cet utilisateur n&apos;a pas encore commencé l&apos;apprentissage de mots.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-foreground">
            <thead>
              <tr className="border-b border-border text-muted-foreground">
                <th className="py-3 px-3 font-semibold">Mot arabe</th>
                <th className="py-3 px-3 font-semibold">Sens français</th>
                <th className="py-3 px-3 font-semibold">Statut</th>
                <th className="py-3 px-3 font-semibold text-center">Maîtrise</th>
                <th className="py-3 px-3 font-semibold text-center">Succès / Échecs</th>
                <th className="py-3 px-3 font-semibold">Prochaine révision</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {words.map((w) => {
                const conf = STATUS_CONFIG[w.status] ?? STATUS_CONFIG.new;
                const totalAnswers = w.correctCount + w.incorrectCount;
                const successRate =
                  totalAnswers > 0
                    ? Math.round((w.correctCount / totalAnswers) * 100)
                    : null;

                return (
                  <tr
                    key={w.wordId}
                    className="transition-colors hover:bg-surface-subtle/50"
                  >
                    {/* Arabe + translittération */}
                    <td className="py-3 px-3">
                      <div className="flex items-baseline gap-2">
                        <span className="font-amiri text-lg text-primary font-bold">
                          {w.arabic}
                        </span>
                        {w.transliteration && (
                          <span className="text-[11px] text-muted-foreground">
                            ({w.transliteration})
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Sens français */}
                    <td className="py-3 px-3 font-medium">
                      {w.meaning ?? "—"}
                    </td>

                    {/* Statut SRS */}
                    <td className="py-3 px-3">
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium",
                          conf.className,
                        )}
                      >
                        {conf.label}
                      </span>
                    </td>

                    {/* Barre de maîtrise */}
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2 justify-center">
                        <div className="h-1.5 w-16 rounded-full bg-border/60 overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full transition-all"
                            style={{ width: `${w.mastery}%` }}
                          />
                        </div>
                        <span className="text-[11px] font-bold text-foreground w-8 text-right">
                          {w.mastery}%
                        </span>
                      </div>
                    </td>

                    {/* Succès / Échecs */}
                    <td className="py-3 px-3 text-center">
                      <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                        {w.correctCount}
                      </span>
                      <span className="text-muted-foreground"> / </span>
                      <span className="text-destructive font-semibold">
                        {w.incorrectCount}
                      </span>
                      {successRate !== null && (
                        <span className="text-[10px] text-muted-foreground block">
                          ({successRate}%)
                        </span>
                      )}
                    </td>

                    {/* Prochaine révision */}
                    <td className="py-3 px-3 text-[11px] text-muted-foreground">
                      {w.nextReviewAt
                        ? new Date(w.nextReviewAt).toLocaleDateString("fr-FR", {
                            day: "numeric",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "Non planifiée"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
