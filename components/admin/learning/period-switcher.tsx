"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useTransition } from "react";
import { cn } from "@/lib/utils";
import type { LearningPeriod } from "@/lib/admin/queries/learning";

interface PeriodSwitcherProps {
  currentPeriod: LearningPeriod;
}

const PERIODS: { key: LearningPeriod; label: string }[] = [
  { key: "7d", label: "7 jours" },
  { key: "30d", label: "30 jours" },
];

export function PeriodSwitcher({ currentPeriod }: PeriodSwitcherProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  function selectPeriod(period: LearningPeriod) {
    const next = new URLSearchParams(searchParams.toString());
    next.set("period", period);
    startTransition(() => {
      router.push(`${pathname}?${next.toString()}`);
    });
  }

  return (
    <div className="flex items-center gap-1 rounded-xl border border-border-subtle bg-surface-subtle p-1 text-xs">
      {PERIODS.map(({ key, label }) => {
        const active = currentPeriod === key;
        return (
          <button
            key={key}
            type="button"
            onClick={() => selectPeriod(key)}
            className={cn(
              "rounded-lg px-3 py-1.5 font-medium transition-colors",
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
  );
}
