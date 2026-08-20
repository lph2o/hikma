import type { WordStatus } from "@/types/learning";
import type { MasteryLevel } from "./types";

/** Signaux utilisés pour calculer la maîtrise d'un mot. */
export type MasteryInput = {
  status: WordStatus;
  correctCount: number;
  incorrectCount: number;
  /** Intervalle courant de répétition espacée (en jours). */
  intervalDays: number;
};

/**
 * Abstraction du calcul de maîtrise : permet de faire évoluer la formule sans
 * toucher aux moteurs qui la consomment (progression, UI, stats).
 */
export interface MasteryCalculator {
  /** Retourne un niveau de maîtrise discret (0 | 25 | 50 | 75 | 100). */
  compute(input: MasteryInput): MasteryLevel;
}

const DAYS_FOR_75 = 7;

/**
 * Calcul par défaut. La maîtrise ne dépend pas d'un simple ratio
 * correct/total : elle croît avec le statut et, au stade « familiar »,
 * avec l'intervalle de répétition (un mot revu à long intervalle est plus
 * proche de la maîtrise).
 */
export const defaultMasteryCalculator: MasteryCalculator = {
  compute({ status, intervalDays }: MasteryInput): MasteryLevel {
    switch (status) {
      case "new":
        return 0;
      case "learning":
        return 25;
      case "familiar":
        return intervalDays >= DAYS_FOR_75 ? 75 : 50;
      case "mastered":
        return 100;
    }
  },
};
