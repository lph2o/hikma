"use client";

// PHASE 97 — Formulaire d'édition d'UNE préférence d'apprentissage.
// Rendu en radio (choix courts) ou select (listes longues, ex. sourates).
// Persistance via updateLearningPreferences (validation serveur inchangée).

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Caption } from "@/components/ui/typography";
import { cn } from "@/lib/utils";
import { updateLearningPreferences } from "@/lib/learning/actions";
import type {
  ArabicReadingLevel,
  LearningGoal,
  LearningPace,
  QuranFamiliarity,
} from "@/types/learning";

export type ProfilePreferenceField =
  | "learningGoal"
  | "arabicReadingLevel"
  | "quranFamiliarity"
  | "learningPace"
  | "dailyDuration"
  | "preferredSurahNumber";

function buildPayload(
  field: ProfilePreferenceField,
  value: string,
  numeric: boolean,
): Parameters<typeof updateLearningPreferences>[0] {
  const v: string | number | null = value === "" ? null : numeric ? Number(value) : value;
  switch (field) {
    case "learningGoal":
      return { learningGoal: v as LearningGoal | null };
    case "arabicReadingLevel":
      return { arabicReadingLevel: v as ArabicReadingLevel | null };
    case "quranFamiliarity":
      return { quranFamiliarity: v as QuranFamiliarity | null };
    case "learningPace":
      return { learningPace: v as LearningPace | null };
    case "dailyDuration":
      return { dailyDuration: v as 5 | 10 | 15 | 20 | 30 | null };
    case "preferredSurahNumber":
      return { preferredSurahNumber: v as number | null };
  }
}

export function ProfilePreferenceForm({
  field,
  current,
  options,
  emptyLabel = "Passer",
  render = "radio",
  numeric = false,
  ariaLabel,
}: {
  field: ProfilePreferenceField;
  current: string | number | null;
  options: readonly (readonly [string, string])[];
  emptyLabel?: string;
  render?: "radio" | "select";
  numeric?: boolean;
  ariaLabel: string;
}) {
  const [value, setValue] = useState(current == null ? "" : String(current));
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function save() {
    setMessage(null);
    setError(null);
    startTransition(async () => {
      const res = await updateLearningPreferences(buildPayload(field, value, numeric));
      if (res.ok) setMessage("Préférence enregistrée.");
      else setError(res.error ?? "Impossible d’enregistrer cette préférence.");
    });
  }

  return (
    <div className="flex flex-col gap-5">
      {render === "radio" ? (
        <div role="radiogroup" aria-label={ariaLabel} className="flex flex-col gap-2">
          {([["", emptyLabel], ...options] as readonly (readonly [string, string])[]).map(
            ([v, label]) => {
              const checked = value === v;
              return (
                <button
                  key={v || "__empty__"}
                  type="button"
                  role="radio"
                  aria-checked={checked}
                  onClick={() => setValue(v)}
                  className={cn(
                    "flex min-h-11 w-full items-center rounded-xl border px-4 py-3 text-left text-sm font-medium transition-colors",
                    checked
                      ? "border-primary/40 bg-primary/5 text-primary-strong"
                      : "border-border bg-popover text-foreground hover:border-border-subtle",
                  )}
                >
                  {label}
                </button>
              );
            },
          )}
        </div>
      ) : (
        <select
          value={value}
          onChange={(e) => setValue(e.target.value)}
          aria-label={ariaLabel}
          className="min-h-11 w-full rounded-xl border border-input bg-popover px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <option value="">{emptyLabel}</option>
          {options.map(([v, label]) => (
            <option key={v} value={v}>
              {label}
            </option>
          ))}
        </select>
      )}

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <Button onClick={save} disabled={isPending} aria-busy={isPending} className="w-full min-h-11 sm:w-auto">
          {isPending ? "Enregistrement…" : "Enregistrer"}
        </Button>
        {message ? <Caption className="text-success-text">{message}</Caption> : null}
        {error ? <Caption className="text-error-text">{error}</Caption> : null}
      </div>
    </div>
  );
}
