import type { AdminLearningVocabBreakdown } from "@/lib/admin/metrics";
import { cn } from "@/lib/utils";

interface VocabProgressPanelProps {
  vocab: AdminLearningVocabBreakdown;
}

interface BarRowProps {
  label: string;
  value: number;
  total: number;
  color: string;
  description: string;
}

function BarRow({ label, value, total, color, description }: BarRowProps) {
  const pct = total > 0 ? Math.max(2, Math.round((value / total) * 100)) : 0;
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between text-xs">
        <div className="flex items-center gap-2">
          <span
            className={cn("inline-block size-2 rounded-full", color.replace("text-", "bg-"))}
          />
          <span className="font-medium text-foreground">{label}</span>
          <span className="text-muted-foreground">{description}</span>
        </div>
        <span className={cn("font-bold tabular-nums", color)}>
          {value.toLocaleString("fr-FR")}
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-surface-subtle">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-500",
            color.replace("text-", "bg-"),
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export function VocabProgressPanel({ vocab }: VocabProgressPanelProps) {
  const total = vocab.totalInProgress;

  return (
    <div className="flex flex-col gap-5 rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-card">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-base font-semibold text-foreground">
            Progression vocabulaire SRS
          </h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {total.toLocaleString("fr-FR")} mot{total > 1 ? "s" : ""} en progression active
          </p>
        </div>

        {/* Révisions en alerte */}
        {vocab.reviewDue > 0 && (
          <div className="flex flex-col items-end text-right">
            <span className="text-xl font-bold tabular-nums text-amber-500">
              {vocab.reviewDue}
            </span>
            <span className="text-[11px] text-muted-foreground">révisions dues</span>
          </div>
        )}
      </div>

      {total === 0 ? (
        <div className="rounded-xl border border-dashed border-border-subtle p-6 text-center text-xs text-muted-foreground">
          Aucun mot en progression pour le moment.
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <BarRow
            label="Maîtrisés"
            value={vocab.mastered}
            total={total}
            color="text-emerald-600 dark:text-emerald-400"
            description="— intervalles longs"
          />
          <BarRow
            label="Familiers"
            value={vocab.familiar}
            total={total}
            color="text-primary"
            description="— en consolidation"
          />
          <BarRow
            label="En apprentissage"
            value={vocab.learning}
            total={total}
            color="text-hikma-gold"
            description="— premiers cycles"
          />
        </div>
      )}

      {/* Légende comparative */}
      {total > 0 && (
        <p className="border-t border-border-subtle pt-3 text-[11px] text-muted-foreground">
          Maîtrise globale :{" "}
          <strong className="text-foreground">
            {total > 0 ? Math.round((vocab.mastered / total) * 100) : 0}%
          </strong>{" "}
          des mots atteignent le stade maîtrisé.
        </p>
      )}
    </div>
  );
}
