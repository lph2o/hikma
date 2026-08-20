"use client";

import { Progress as ProgressPrimitive } from "@base-ui/react/progress";
import type React from "react";
import { cn } from "@/lib/utils";

export function Progress({
  className,
  children,
  getAriaValueText,
  ...props
}: ProgressPrimitive.Root.Props): React.ReactElement {
  return (
    <ProgressPrimitive.Root
      className={cn("flex w-full flex-col gap-2", className)}
      data-slot="progress"
      // `aria-valuetext` doit être DÉTERMINISTE : le formatage par défaut de
      // base-ui utilise Intl.NumberFormat(locale) dont la locale diffère entre
      // le serveur (Node, en-US → "67%") et le navigateur (fr-FR → "67 %",
      // voire U+202F selon l'ICU), ce qui casse l'hydratation. On fournit donc
      // notre propre texte stable, indépendant de la locale.
      getAriaValueText={
        getAriaValueText ??
        ((_formatted, value) =>
          typeof value === "number" && Number.isFinite(value)
            ? `${Math.round(value)} %`
            : "progression indéterminée")
      }
      {...props}
    >
      {children ? (
        children
      ) : (
        <ProgressTrack>
          <ProgressIndicator />
        </ProgressTrack>
      )}
    </ProgressPrimitive.Root>
  );
}

export function ProgressLabel({
  className,
  ...props
}: ProgressPrimitive.Label.Props): React.ReactElement {
  return (
    <ProgressPrimitive.Label
      className={cn("font-medium text-sm", className)}
      data-slot="progress-label"
      {...props}
    />
  );
}

export function ProgressTrack({
  className,
  ...props
}: ProgressPrimitive.Track.Props): React.ReactElement {
  return (
    <ProgressPrimitive.Track
      className={cn(
        "block h-1.5 w-full overflow-hidden rounded-full bg-input",
        className,
      )}
      data-slot="progress-track"
      {...props}
    />
  );
}

export function ProgressIndicator({
  className,
  ...props
}: ProgressPrimitive.Indicator.Props): React.ReactElement {
  return (
    <ProgressPrimitive.Indicator
      className={cn("bg-primary transition-all duration-500", className)}
      data-slot="progress-indicator"
      {...props}
    />
  );
}

export function ProgressValue({
  className,
  ...props
}: ProgressPrimitive.Value.Props): React.ReactElement {
  return (
    <ProgressPrimitive.Value
      className={cn("text-sm tabular-nums", className)}
      data-slot="progress-value"
      {...props}
    />
  );
}

export { ProgressPrimitive };
