"use client";

// Phase 80 — Préférences de rappel in-app.
// Toggle ON/OFF + sélecteur d'heure (HH:MM, 24h).
// Opt-in par défaut, persistance via updateReminderPreferences.

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { BodyMedium, Caption } from "@/components/ui/typography";
import { Switch } from "@/components/ui/switch";
import { updateReminderPreferences } from "@/lib/learning/actions";

export type ReminderPreferencesProps = {
  enabled: boolean;
  time: string; // HH:MM
};

export function ReminderPreferences({
  enabled: initialEnabled,
  time: initialTime,
}: ReminderPreferencesProps) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [time, setTime] = useState(initialTime);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Vérifier le format HH:MM
  function isValidTime(v: string): boolean {
    return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
  }

  function save() {
    setError(null);
    setMessage(null);
    if (!isValidTime(time)) {
      setError("Format invalide (HH:MM, ex: 19:00).");
      return;
    }
    startTransition(async () => {
      const res = await updateReminderPreferences({ enabled, time });
      if (res.ok) {
        setMessage("Préférences enregistrées.");
      } else {
        setError(res.error ?? "Impossible d'enregistrer.");
      }
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex flex-col gap-0.5">
          <BodyMedium className="font-medium">Rappel quotidien</BodyMedium>
          <Caption className="text-text-secondary">
            Un rappel discret apparaît sur ton tableau de bord quand tu
            n&rsquo;as pas encore appris aujourd&rsquo;hui.
          </Caption>
        </div>
        <Switch
          checked={enabled}
          onCheckedChange={setEnabled}
          aria-label="Activer le rappel quotidien"
        />
      </div>

      {enabled ? (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex flex-col gap-1">
            <label
              htmlFor="reminder-time"
              className="text-sm text-muted-foreground"
            >
              Heure
            </label>
            <input
              id="reminder-time"
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="h-10 w-32 rounded-lg border border-input bg-popover px-3 text-base tabular-nums outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
        </div>
      ) : null}

      <div>
        <Button
          onClick={save}
          disabled={isPending}
          aria-busy={isPending}
          variant="outline"
          size="sm"
        >
          {isPending ? "Enregistrement…" : "Enregistrer"}
        </Button>
        {message ? (
          <Caption className="ml-3 text-success">{message}</Caption>
        ) : null}
        {error ? (
          <Caption className="ml-3 text-error">{error}</Caption>
        ) : null}
      </div>
    </div>
  );
}