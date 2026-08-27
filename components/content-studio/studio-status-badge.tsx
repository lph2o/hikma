// Hikma — Content Studio (UI1) : BADGES DE STATUT.
//
// Système visuel de statuts : badges compacts, sémantiques, scannables.
//   - statut ÉDITORIAL (workflow : DRAFT → … → PUBLISHED) ;
//   - statut de RENDU (NOT_RENDERED / RENDERING / RENDERED / FAILED).
// Couleurs Hikma : teal = action/édition active, gold = accomplissement/rendu,
// warning/success/destructive = sémantiques AA existantes.
// Composants server-safe (aucun hook, aucune I/O).

import { Badge } from "@/components/ui/badge";
import type { ContentItemStatus, RenderStatus } from "@/lib/content-studio/types";
import { cn } from "@/lib/utils";
import { Loader2Icon } from "lucide-react";



/** Pastille colorée porteuse du sens (scannable même en petit). */
function Dot({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn("size-1.5 shrink-0 rounded-full", className)}
    />
  );
}

const EDITORIAL_META: Record<
  ContentItemStatus,
  { label: string; className: string; dot: string }
> = {
  DRAFT: {
    label: "Brouillon",
    className: "border-border-subtle bg-surface-subtle text-text-secondary",
    dot: "bg-text-secondary/60",
  },
  REVIEW: {
    label: "En revue",
    className: "border-info/40 bg-info/10 text-info-text",
    dot: "bg-info",
  },
  APPROVED: {
    label: "Approuvé",
    className: "border-hikma-teal-500/40 bg-hikma-teal-500/12 text-hikma-teal-700",
    dot: "bg-hikma-teal-600",
  },
  SCHEDULED: {
    label: "Programmé",
    className: "border-warning/45 bg-warning/10 text-warning-text",
    dot: "bg-warning",
  },
  PUBLISHED: {
    label: "Publié",
    className: "border-success/40 bg-success/10 text-success-text",
    dot: "bg-success",
  },
  REJECTED: {
    label: "Rejeté",
    className: "border-error/40 bg-error/10 text-error-text",
    dot: "bg-error",
  },
  ARCHIVED: {
    label: "Archivé",
    className: "border-border-subtle bg-surface-subtle text-text-secondary",
    dot: "bg-text-secondary/40",
  },
  EXPORTED: {
    label: "Exporté",
    className: "border-info/30 bg-surface-subtle text-text-secondary",
    dot: "bg-info/70",
  },
};

const RENDER_META: Record<
  RenderStatus,
  { label: string; className: string; dot: string; spinner?: boolean }
> = {
  NOT_RENDERED: {
    label: "Non rendu",
    className: "border-border-subtle bg-surface-subtle text-text-secondary",
    dot: "bg-text-secondary/50",
  },
  RENDERING: {
    label: "Rendu en cours",
    className: "border-info/40 bg-info/10 text-info-text",
    dot: "bg-info",
    spinner: true,
  },
  RENDERED: {
    label: "Rendu",
    className: "border-hikma-gold/45 bg-hikma-gold/12 text-hikma-gold-muted",
    dot: "bg-hikma-gold",
  },
  FAILED: {
    label: "Échec du rendu",
    className: "border-error/40 bg-error/10 text-error-text",
    dot: "bg-error",
  },
};

function StatusBadge({
  meta,
  label,
  className,
}: {
  meta: { label: string; className: string; dot: string; spinner?: boolean };
  label: string;
  className?: string;
}) {
  return (
    <Badge
      variant="outline"
      size="sm"
      className={cn(
        "gap-1.5 border font-medium normal-case",
        meta.className,
        className,
      )}
      title={label}
    >
      {meta.spinner ? (
        <Loader2Icon aria-hidden="true" className="size-3 animate-spin" />
      ) : (
        <Dot className={meta.dot} />
      )}
      {meta.label}
    </Badge>
  );
}

/** Badge de statut ÉDITORIAL (workflow). */
export function StudioStatusBadge({
  status,
  className,
}: {
  status: ContentItemStatus;
  className?: string;
}) {
  const meta = EDITORIAL_META[status];
  return (
    <StatusBadge
      label={status}
      meta={meta}
      className={className}
    />
  );
}

/** Badge de statut de RENDU vidéo. */
export function StudioRenderBadge({
  renderStatus,
  className,
}: {
  renderStatus: RenderStatus;
  className?: string;
}) {
  const meta = RENDER_META[renderStatus];
  return (
    <StatusBadge
      label={renderStatus}
      meta={meta}
      className={className}
    />
  );
}
