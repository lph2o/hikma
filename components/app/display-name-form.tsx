"use client";

// PHASE 97 — Édition du nom affiché depuis /profile/nom.
// Même contrainte que l'onboarding : ≤ 60 caractères, validé côté serveur.

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Caption } from "@/components/ui/typography";
import { updateLearningPreferences } from "@/lib/learning/actions";

export function DisplayNameForm({ current }: { current: string }) {
  const [displayName, setDisplayName] = useState(current);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function save() {
    setMessage(null);
    setError(null);
    startTransition(async () => {
      const res = await updateLearningPreferences({
        displayName: displayName.trim() === "" ? null : displayName.trim(),
      });
      if (res.ok) setMessage("Nom mis à jour.");
      else setError(res.error ?? "Impossible d’enregistrer ce nom.");
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <label className="flex flex-col gap-2 text-sm font-medium">
        Nom affiché
        <input
          value={displayName}
          maxLength={60}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="Ton prénom"
          className="min-h-11 rounded-xl border border-input bg-popover px-3 outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </label>
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
