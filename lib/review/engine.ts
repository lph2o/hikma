import { LeitnerScheduler, type ReviewScheduler } from "./scheduler";
import type { ReviewItemWithWord, ReviewSchedule, ReviewState } from "./types";

/**
 * Moteur de révision : détermine les mots dus et calcule la prochaine
 * révision via un scheduler remplaçable. Indépendant de React et de Supabase.
 */
export class ReviewEngine {
  constructor(private readonly scheduler: ReviewScheduler = new LeitnerScheduler()) {}

  /** Mots dus : jamais revus (next_review_at null) ou échéance dépassée. */
  getDueItems(items: ReviewItemWithWord[], now = new Date()): ReviewItemWithWord[] {
    return items.filter((item) => {
      if (item.state == null || item.state.nextReviewAt == null) return true;
      return new Date(item.state.nextReviewAt).getTime() <= now.getTime();
    });
  }

  /** Planifie la prochaine révision après une réponse. */
  recordAnswer(
    state: ReviewState | null,
    correct: boolean,
    now = new Date(),
  ): ReviewSchedule {
    return this.scheduler.schedule(state, correct, now);
  }
}
