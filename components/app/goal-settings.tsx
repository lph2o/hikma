"use client";

// F3 — Modification de l'objectif quotidien depuis le profil.
// La validation des valeurs est faite côté serveur (updateDailyGoal).

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Caption } from "@/components/ui/typography";
import { cn } from "@/lib/utils";
import { updateDailyGoal } from "@/lib/learning/actions";
import type { DailyGoalType } from "@/types/learning";

export type GoalSettingsProps = {
  currentType: DailyGoalType;
  currentValue: number;
};

const TYPE_LABEL: Record<DailyGoalType, string> = {
  lessons: "Leçons par jour",
  words: "Mots par jour",
};

export function GoalSettings({ currentType, currentValue }: GoalSettingsProps) {
  const [type, setType] = useState<DailyGoalType>(currentType);
  const [value, setValue] = useState(currentValue);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function submit() {
    setError(null);
    setMessage(null);
    startTransition(async () => {
      const res = await updateDailyGoal(type, value);
      if (res.ok) {
        setMessage("Objectif mis à jour.");
      } else {
        setError(res.error ?? "Impossible de modifier l'objectif.");
      }
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="flex gap-1 rounded-lg border border-border bg-surface p-1" role="radiogroup" aria-label="Type d'objectif">
          {(["words", "lessons"] as DailyGoalType[]).map((t) => (
            <button
              key={t}
              type="button"
              role="radio"
              aria-checked={type === t}
              onClick={() => setType(t)}
              className={cn(
                "flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                type === t
                  ? "bg-popover text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {TYPE_LABEL[t]}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <label htmlFor="goal-value" className="text-sm text-muted-foreground">
            Objectif :
          </label>
          <input
            id="goal-value"
            type="number"
            min={1}
            max={100}
            value={value}
            onChange={(e) => setValue(Number(e.target.value))}
            className="h-10 w-20 rounded-lg border border-input bg-popover px-3 text-center text-base font-medium tabular-nums outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <Button
          onClick={submit}
          disabled={isPending}
          aria-busy={isPending}
          className="w-full min-h-11 sm:w-auto"
        >
          {isPending ? "Enregistrement…" : "Enregistrer l'objectif"}
        </Button>
        {message ? <Caption className="text-success">{message}</Caption> : null}
        {error ? <Caption className="text-error">{error}</Caption> : null}
      </div>
    </div>
  );
}
