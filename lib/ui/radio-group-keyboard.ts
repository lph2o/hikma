import type { KeyboardEvent } from "react";

/**
 * Navigation clavier des radiogroups Hikma (Phase 36C, accessibilité) :
 * les flèches gauche/droite/haut/bas ainsi que Home/End déplacent le focus
 * entre les options `[role="radio"]`, comme des radios natifs. Purement
 * structurel : aucune logique métier, aucun effet sur le grading/le moteur.
 *
 * À attacher à `onKeyDown` du conteneur `role="radiogroup"`.
 */
export function handleRadioGroupKeyDown(e: KeyboardEvent<HTMLElement>): void {
  const container = e.currentTarget;
  const options = Array.from(
    container.querySelectorAll<HTMLElement>('[role="radio"]'),
  ).filter((el) => el.getAttribute("aria-disabled") !== "true");
  if (options.length === 0) return;

  const currentIndex = options.indexOf(document.activeElement as HTMLElement);
  if (currentIndex === -1) return;

  let next = currentIndex;
  switch (e.key) {
    case "ArrowDown":
    case "ArrowRight":
      next = (currentIndex + 1) % options.length;
      break;
    case "ArrowUp":
    case "ArrowLeft":
      next = (currentIndex - 1 + options.length) % options.length;
      break;
    case "Home":
      next = 0;
      break;
    case "End":
      next = options.length - 1;
      break;
    default:
      return;
  }
  e.preventDefault();
  options[next]?.focus();
}
