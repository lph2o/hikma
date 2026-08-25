/**
 * Hikma — Observabilité (Phase 89I, R-008).
 *
 * Couche PURE de construction et d'assainissement des événements
 * d'erreur. Zéro dépendance, zéro effet de bord : tout est testable.
 *
 * Règles de collecte minimales :
 * - jamais de cookies, headers, corps de requête, tokens ou données utilisateur ;
 * - URL réduite au pathname (jamais la query string) ;
 * - messages tronqués ;
 * - redaction des secrets apparents dans les messages.
 */

export const OBSERVABILITY_LOG_PREFIX = "[hikma-observability]";

export type ObservabilityKind = "boot" | "server" | "client";

export type ObservabilityEvent = {
  ts: string;
  env: string;
  release: string;
  kind: ObservabilityKind;
  error: {
    name: string;
    message: string;
    stack?: string;
  };
  context?: {
    path?: string;
    method?: string;
    routeType?: string;
    renderSource?: string;
    revalidateReason?: string;
    source?: string;
  };
};

const MAX_MESSAGE = 2000;
const MAX_STACK = 4000;

/** Redacte les valeurs de paramètres sensibles dans un texte libre. */
export function redactSensitive(text: string): string {
  return text.replace(
    /(access_token|refresh_token|id_token|token|code|api[_-]?key|password|secret)=([^&\s"'<>]+)/gi,
    "$1=[REDACTED]",
  );
}

/** Tronque une chaîne à une longueur maximale (coupe proprement). */
export function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max)}…[truncated]`;
}

/** Extrait un {name, message, stack} sûr depuis une erreur inconnue. */
export function safeErrorDetail(error: unknown): ObservabilityEvent["error"] {
  if (error instanceof Error) {
    return {
      name: truncate(redactSensitive(error.name || "Error"), MAX_MESSAGE),
      message: truncate(redactSensitive(error.message || ""), MAX_MESSAGE),
      stack: error.stack ? truncate(redactSensitive(error.stack), MAX_STACK) : undefined,
    };
  }
  if (typeof error === "string") {
    return {
      name: "Error",
      message: truncate(redactSensitive(error), MAX_MESSAGE),
    };
  }
  try {
    const serialized = JSON.stringify(error);
    return {
      name: "UnknownError",
      message: truncate(redactSensitive(serialized ?? "unserializable error"), MAX_MESSAGE),
    };
  } catch {
    return { name: "UnknownError", message: "unserializable error" };
  }
}

export type EnvName = string;

function currentEnv(): EnvName {
  return process.env.NODE_ENV ?? "development";
}

function currentRelease(): string {
  // Serveur uniquement (jamais NEXT_PUBLIC_) : SHA du commit de déploiement
  // (Vercel) ou version du package en repli.
  return process.env.VERCEL_GIT_COMMIT_SHA ?? process.env.RENDER_GIT_COMMIT ?? "dev";
}

/**
 * Construit l'événement serveur (instrumentation.onRequestError).
 * N'inclut JAMAIS les headers, cookies, query string ou corps de requête.
 */
export function buildServerErrorEvent(
  error: unknown,
  req: { path: string; method: string },
  ctx: {
    routeType?: string;
    renderSource?: string;
    revalidateReason?: string;
    routerKind?: string;
  },
): ObservabilityEvent {
  return {
    ts: new Date().toISOString(),
    env: currentEnv(),
    release: currentRelease(),
    kind: "server",
    error: safeErrorDetail(error),
    context: {
      path: redactSensitive(req.path.split("?")[0] ?? req.path),
      method: req.method,
      routeType: ctx.routeType,
      renderSource: ctx.renderSource,
      revalidateReason: ctx.revalidateReason,
    },
  };
}

/** Construit l'événement de démarrage serveur (register). */
export function buildBootEvent(detail: Record<string, string>): ObservabilityEvent {
  return {
    ts: new Date().toISOString(),
    env: currentEnv(),
    release: currentRelease(),
    kind: "boot",
    error: { name: "Boot", message: "Server instrumentation registered" },
    context: { source: JSON.stringify(detail) },
  };
}

/**
 * Assainit un payload client reçu par POST /observability.
 * N'accepte que des champs en liste blanche ; tout le reste est ignoré.
 */
export function sanitizeClientPayload(body: unknown): ObservabilityEvent | null {
  if (typeof body !== "object" || body === null) return null;
  const raw = body as Record<string, unknown>;
  if (typeof raw.message !== "string" || raw.message.length === 0) return null;
  if (typeof raw.path !== "string") return null;

  const stack = typeof raw.stack === "string" ? raw.stack : undefined;
  const source = typeof raw.source === "string" ? raw.source : undefined;

  return {
    ts: new Date().toISOString(),
    env: currentEnv(),
    release: currentRelease(),
    kind: "client",
    error: {
      name: truncate(redactSensitive(typeof raw.name === "string" ? raw.name : "Error"), MAX_MESSAGE),
      message: truncate(redactSensitive(raw.message), MAX_MESSAGE),
      stack: stack ? truncate(redactSensitive(stack), MAX_STACK) : undefined,
    },
    context: {
      path: truncate(redactSensitive(raw.path.split("?")[0]), MAX_MESSAGE),
      source,
    },
  };
}

/** Sérialise un événement en ligne de log JSON unique et filtrable. */
export function serializeEvent(event: ObservabilityEvent): string {
  return `${OBSERVABILITY_LOG_PREFIX} ${JSON.stringify(event)}`;
}

/**
 * Limiteur à fenêtre glissante (mémoire) pour l'endpoint d'ingestion client.
 * Pur et testable ; suffisant pour le pré-lancement (pas de stockage).
 */
export class SlidingWindowRateLimiter {
  private hits = new Map<string, number[]>();

  constructor(
    private readonly maxPerWindow: number,
    private readonly windowMs: number,
  ) {}

  allow(key: string, now = Date.now()): boolean {
    const cutoff = now - this.windowMs;
    const prev = (this.hits.get(key) ?? []).filter((t) => t > cutoff);
    if (prev.length >= this.maxPerWindow) {
      this.hits.set(key, prev);
      return false;
    }
    prev.push(now);
    this.hits.set(key, prev);
    return true;
  }

  /** Vide l'état (tests / hot-reload). */
  reset(): void {
    this.hits.clear();
  }
}
