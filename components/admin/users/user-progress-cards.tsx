import { AwardIcon, BookOpenIcon, ClockIcon, TargetIcon } from "lucide-react";
import type { AdminUserDetail } from "@/lib/admin/metrics";

interface UserProgressCardsProps {
  user: AdminUserDetail;
}

const GOAL_LABELS: Record<string, string> = {
  start_gently: "Débuter en douceur",
  understand_surahs: "Comprendre les sourates",
  understand_recitation: "Comprendre la récitation",
  memorize_vocabulary: "Mémoriser le vocabulaire",
};

export function UserProgressCards({ user }: UserProgressCardsProps) {
  const goalLabel = user.learningGoal
    ? GOAL_LABELS[user.learningGoal] ?? user.learningGoal
    : "Non défini";

  const dailyGoalStr = user.dailyGoalValue
    ? `${user.dailyGoalValue} ${user.dailyGoalType === "words" ? "mots" : "leçons"}/jour`
    : "5 min/jour";

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {/* Mots maîtrisés */}
      <div className="flex flex-col gap-2 rounded-2xl border border-border bg-card p-4 shadow-card">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Mots maîtrisés
          </span>
          <div className="flex size-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <AwardIcon className="size-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="text-2xl font-bold text-foreground">
            {user.progress.masteredWords}
          </span>
          <span className="text-xs text-muted-foreground">
            / {user.progress.totalWords}
          </span>
        </div>
        <p className="text-[11px] text-muted-foreground">
          {user.progress.familiarWords} familiers, {user.progress.learningWords} en apprentissage
        </p>
      </div>

      {/* Leçons complétées */}
      <div className="flex flex-col gap-2 rounded-2xl border border-border bg-card p-4 shadow-card">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Leçons complétées
          </span>
          <div className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <BookOpenIcon className="size-4" />
          </div>
        </div>
        <span className="text-2xl font-bold text-foreground">
          {user.recentActivities.length}
        </span>
        <p className="text-[11px] text-muted-foreground">
          Activité totale enregistrée
        </p>
      </div>

      {/* Objectif pédagogique */}
      <div className="flex flex-col gap-2 rounded-2xl border border-border bg-card p-4 shadow-card">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Objectif
          </span>
          <div className="flex size-7 items-center justify-center rounded-lg bg-hikma-gold/10 text-hikma-gold">
            <TargetIcon className="size-4" />
          </div>
        </div>
        <span className="text-sm font-bold text-foreground truncate" title={goalLabel}>
          {goalLabel}
        </span>
        <p className="text-[11px] text-muted-foreground">
          Rythme : {dailyGoalStr}
        </p>
      </div>

      {/* Niveau & Fuseau */}
      <div className="flex flex-col gap-2 rounded-2xl border border-border bg-card p-4 shadow-card">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Préférences
          </span>
          <div className="flex size-7 items-center justify-center rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400">
            <ClockIcon className="size-4" />
          </div>
        </div>
        <span className="text-sm font-bold text-foreground truncate">
          {user.timezone ?? "Europe/Paris"}
        </span>
        <p className="text-[11px] text-muted-foreground truncate">
          Lecture : {user.arabicReadingLevel ?? "Standard"}
        </p>
      </div>
    </div>
  );
}
