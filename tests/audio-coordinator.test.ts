import { describe, expect, it } from "vitest";
import {
  pauseOtherAudios,
  registerAudio,
  type StoppableAudio,
} from "../lib/ui/audio-coordinator";

// Mock d'un élément audio pilotable, avec compteur d'appels pause().
function makeAudio(initiallyPaused = false) {
  const audio: StoppableAudio & { pauseCalls: number } = {
    paused: initiallyPaused,
    pauseCalls: 0,
    pause() {
      this.paused = true;
      this.pauseCalls += 1;
    },
  };
  return audio;
}

describe("audio-coordinator — un seul audio actif à la fois", () => {
  it("met en pause les autres lecteurs mais jamais celui qui démarre", () => {
    const a = makeAudio();
    const b = makeAudio();
    const c = makeAudio();
    registerAudio(a);
    registerAudio(b);
    registerAudio(c);

    pauseOtherAudios(a);

    expect(a.paused).toBe(false);
    expect(a.pauseCalls).toBe(0);
    expect(b.paused).toBe(true);
    expect(c.paused).toBe(true);
  });

  it("n'appelle pas pause() sur un lecteur déjà en pause", () => {
    const a = makeAudio();
    const b = makeAudio(true);
    registerAudio(a);
    registerAudio(b);

    pauseOtherAudios(a);

    expect(b.paused).toBe(true);
    expect(b.pauseCalls).toBe(0);
  });

  it("un lecteur désinscrit n'est plus affecté (cleanup au démontage)", () => {
    const a = makeAudio();
    const b = makeAudio();
    const unregisterB = registerAudio(b);
    registerAudio(a);
    unregisterB();

    pauseOtherAudios(a);

    expect(b.paused).toBe(false);
    expect(b.pauseCalls).toBe(0);
  });

  it("la coordination est stable : un lecteur déjà arrêté n'est pas re-arrêté", () => {
    const a = makeAudio();
    const b = makeAudio();
    registerAudio(a);
    registerAudio(b);

    pauseOtherAudios(a);
    pauseOtherAudios(a);

    expect(b.pauseCalls).toBe(1);
  });
});
