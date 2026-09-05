import type { AdminLearningKpis } from "@/lib/admin/metrics";
import {
  BookOpenIcon,
  BrainIcon,
  SparklesIcon,
  ClockIcon,
  TrendingUpIcon,
  TrendingDownIcon,
  MinusIcon,
  PlayCircleIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface LearningKpiCardsProps {
  kpis: AdminLearningKpis;
}

function DeltaBadge({ delta }: { delta: number | null }) {
  if (delta === null) return null;
  const up = delta > 0;
  const zero = delta === 0;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-semibold",
        zero
          ? "bg-muted/60 text-muted-foreground"
          : up
          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
          : "bg-rose-500/10 text-rose-600 dark:text-rose-400",
      )}
    >
      {zero ? (
        <MinusIcon className="size-2.5" />
      ) : up ? (
        <TrendingUpIcon className="size-2.5" />
      ) : (
        <TrendingDownIcon className="size-2.5" />
      )}
      {zero ? "stable" : `${up ? "+" : ""}${delta}%`}
    </span>
  );
}

interface KpiCardProps {
  label: string;
  value: number | string;
  sub?: string;
  icon: React.ReactNode;
  iconBg: string;
  delta?: number | null;
  highlight?: boolean;
}

function KpiCard({ label, value, sub, icon, iconBg, delta, highlight }: KpiCardProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-2xl border bg-card p-4 shadow-card",
        highlight ? "border-amber-500/30" : "border-border",
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
        <div className={cn("flex size-7 items-center justify-center rounded-lg", iconBg)}>
          {icon}
        </div>
      </div>
      <div className="flex items-end justify-between gap-2">
        <div className="flex flex-col">
          <span className="text-2xl font-bold tabular-nums text-foreground">
            {typeof value === "number" ? value.toLocaleString("fr-FR") : value}
          </span>
          {sub && <span className="text-[11px] text-muted-foreground">{sub}</span>}
        </div>
        {delta !== undefined && <DeltaBadge delta={delta} />}
      </div>
    </div>
  );
}

export function LearningKpiCards({ kpis }: LearningKpiCardsProps) {
  const periodLabel = kpis.period === "7d" ? "7 jours" : "30 jours";
  const totalVocab = kpis.vocabMastered + kpis.vocabFamiliar + kpis.vocabLearning;

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      <KpiCard
        label="Leçons"
        value={kpis.lessonsCompleted}
        sub={`sur ${periodLabel}`}
        icon={<BookOpenIcon className="size-4 text-primary" />}
        iconBg="bg-primary/10"
        delta={kpis.lessonsCompletedDelta}
      />
      <KpiCard
        label="Mots étudiés"
        value={kpis.wordsStudied}
        sub={`sur ${periodLabel}`}
        icon={<SparklesIcon className="size-4 text-hikma-gold" />}
        iconBg="bg-hikma-gold/10"
        delta={kpis.wordsStudiedDelta}
      />
      <KpiCard
        label="Maîtrisés"
        value={kpis.vocabMastered}
        sub={`/ ${totalVocab} en progression`}
        icon={<BrainIcon className="size-4 text-emerald-600 dark:text-emerald-400" />}
        iconBg="bg-emerald-500/10"
      />
      <KpiCard
        label="Familiers"
        value={kpis.vocabFamiliar}
        sub="niveau intermédiaire"
        icon={<TrendingUpIcon className="size-4 text-sky-500" />}
        iconBg="bg-sky-500/10"
      />
      <KpiCard
        label="Révisions dues"
        value={kpis.reviewsDue}
        sub="à traiter maintenant"
        icon={<ClockIcon className="size-4 text-amber-500" />}
        iconBg="bg-amber-500/10"
        highlight={kpis.reviewsDue > 10}
      />
      <KpiCard
        label="Sessions actives"
        value={kpis.sessionsActive}
        sub="leçons en cours"
        icon={<PlayCircleIcon className="size-4 text-violet-500" />}
        iconBg="bg-violet-500/10"
      />
    </div>
  );
}
