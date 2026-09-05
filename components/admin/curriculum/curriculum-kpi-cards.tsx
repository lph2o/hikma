import type { AdminCurriculumKpis } from "@/lib/admin/metrics";
import {
  BookOpenIcon,
  LayersIcon,
  CheckCircle2Icon,
  SparklesIcon,
  FileTextIcon,
  DatabaseIcon,
  LanguagesIcon,
  CompassIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface CurriculumKpiCardsProps {
  kpis: AdminCurriculumKpis;
}

interface KpiCardItem {
  title: string;
  value: string | number;
  subtitle: string;
  badge?: string;
  icon: React.ReactNode;
  theme: "teal" | "gold" | "sky" | "purple" | "emerald";
}

const THEMES = {
  teal: {
    bg: "bg-primary/5",
    border: "border-primary/20",
    icon: "text-primary bg-primary/10",
    badge: "bg-primary/10 text-primary-strong",
  },
  gold: {
    bg: "bg-hikma-gold/5",
    border: "border-hikma-gold/25",
    icon: "text-hikma-gold bg-hikma-gold/10",
    badge: "bg-hikma-gold/15 text-hikma-gold",
  },
  sky: {
    bg: "bg-sky-500/5",
    border: "border-sky-500/20",
    icon: "text-sky-500 bg-sky-500/10",
    badge: "bg-sky-500/10 text-sky-700 dark:text-sky-400",
  },
  purple: {
    bg: "bg-purple-500/5",
    border: "border-purple-500/20",
    icon: "text-purple-500 bg-purple-500/10",
    badge: "bg-purple-500/10 text-purple-700 dark:text-purple-400",
  },
  emerald: {
    bg: "bg-emerald-500/5",
    border: "border-emerald-500/20",
    icon: "text-emerald-500 bg-emerald-500/10",
    badge: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  },
};

export function CurriculumKpiCards({ kpis }: CurriculumKpiCardsProps) {
  const cards: KpiCardItem[] = [
    {
      title: "Parcours d'apprentissage",
      value: kpis.pathsCount,
      subtitle: `Sur ${kpis.surahsCount} sourates du Coran`,
      badge: `${Math.round((kpis.pathsCount / kpis.surahsCount) * 100)}% sourates`,
      icon: <CompassIcon className="size-5" />,
      theme: "sky",
    },
    {
      title: "Unités pédagogiques",
      value: kpis.unitsCount,
      subtitle: "1 unité par parcours actif",
      badge: "Structuré",
      icon: <LayersIcon className="size-5" />,
      theme: "teal",
    },
    {
      title: "Leçons publiées",
      value: kpis.lessonsPublishedCount,
      subtitle: `${kpis.lessonsDraftCount} en brouillon`,
      badge: "100% en ligne",
      icon: <BookOpenIcon className="size-5" />,
      theme: "emerald",
    },
    {
      title: "Mots enseignés",
      value: kpis.wordsTaughtCount.toLocaleString("fr-FR"),
      subtitle: "Mots uniques dans lesson_words",
      badge: "Actifs",
      icon: <SparklesIcon className="size-5" />,
      theme: "gold",
    },
    {
      title: "Couverture lexicale FR",
      value: `${kpis.frCoveragePct}%`,
      subtitle: `${kpis.frValidatedWordsCount.toLocaleString("fr-FR")} / ${kpis.quranWordsCount.toLocaleString("fr-FR")} formes`,
      badge: "Validé",
      icon: <LanguagesIcon className="size-5" />,
      theme: "gold",
    },
    {
      title: "Formes Coraniques",
      value: kpis.quranWordsCount.toLocaleString("fr-FR"),
      subtitle: "Formes uniques recensées",
      badge: "Corpus",
      icon: <DatabaseIcon className="size-5" />,
      theme: "purple",
    },
    {
      title: "Occurrences totales",
      value: kpis.occurrencesCount.toLocaleString("fr-FR"),
      subtitle: "Dans les 6 236 versets",
      badge: "Occurrences",
      icon: <FileTextIcon className="size-5" />,
      theme: "teal",
    },
    {
      title: "Lemmes Coraniques",
      value: kpis.lemmasCount.toLocaleString("fr-FR"),
      subtitle: `${kpis.lemmaTranslationsCount} traduits en FR`,
      badge: `${Math.round((kpis.lemmaTranslationsCount / kpis.lemmasCount) * 100)}% traduits`,
      icon: <CheckCircle2Icon className="size-5" />,
      theme: "sky",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((c) => {
        const t = THEMES[c.theme];
        return (
          <div
            key={c.title}
            className={cn(
              "flex flex-col justify-between gap-3 rounded-2xl border p-5 shadow-card transition-shadow hover:shadow-elevated",
              "bg-card border-border",
            )}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex flex-col gap-0.5">
                <span className="text-xs font-medium text-muted-foreground">
                  {c.title}
                </span>
                <span className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                  {c.value}
                </span>
              </div>
              <div className={cn("flex size-10 items-center justify-center rounded-xl", t.icon)}>
                {c.icon}
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-border-subtle pt-3 text-[11px]">
              <span className="text-muted-foreground truncate">{c.subtitle}</span>
              {c.badge && (
                <span className={cn("shrink-0 rounded-md px-2 py-0.5 font-semibold", t.badge)}>
                  {c.badge}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
