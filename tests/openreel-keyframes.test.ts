// Hikma — Tests du moteur keyframes/easing porté de OpenReel (MIT) :
//   lib/content-studio/editor/easing.ts + lib/content-studio/editor/keyframes.ts.
// Comportements purs et déterministes, calqués sur les tests OpenReel
// (easing-functions.test.ts, evaluate-keyframes.test.ts).

import { describe, it, expect } from "vitest";
import {
  EASING_FUNCTIONS,
  EASING_PRESETS,
  ALL_EASING_NAMES,
  cubicBezier,
  getEasingFunction,
  interpolate,
  springEasing,
} from "../lib/content-studio/editor/easing";
import {
  addKeyframe,
  evaluateKeyframesAt,
  getKeyframeValueAtTime,
  interpolateKeyframeValue,
  removeKeyframe,
  sortKeyframes,
  updateKeyframe,
  type HikmaKeyframe,
} from "../lib/content-studio/editor/keyframes";

function kf(
  id: string,
  time: number,
  property: string,
  value: unknown,
  easing: HikmaKeyframe["easing"] = "linear",
): HikmaKeyframe {
  return { id, time, property, value, easing };
}

describe("easing (port OpenReel easing-functions)", () => {
  it("linéaire : bornes et milieu exacts", () => {
    const linear = EASING_FUNCTIONS.linear;
    expect(linear(0)).toBe(0);
    expect(linear(0.5)).toBe(0.5);
    expect(linear(1)).toBe(1);
  });

  it("toutes les easings nommées : bornes exactes 0 et 1", () => {
    for (const name of ALL_EASING_NAMES) {
      const fn = EASING_FUNCTIONS[name];
      expect(fn(0), `${name}(0)`).toBeCloseTo(0, 9);
      expect(fn(1), `${name}(1)`).toBeCloseTo(1, 9);
    }
  });

  it("easings non-overshoot : valeurs bornées 0..1 sur [0,1]", () => {
    // Back/Elastic overshootent volontairement hors de [0,1] (design)
    for (const name of ALL_EASING_NAMES) {
      if (name.includes("Back") || name.includes("Elastic") || name.includes("Bounce")) continue;
      const fn = EASING_FUNCTIONS[name];
      for (const t of [0.25, 0.5, 0.75]) {
        const v = fn(t);
        expect(v, `${name}(${t})`).toBeGreaterThanOrEqual(0);
        expect(v, `${name}(${t})`).toBeLessThanOrEqual(1);
      }
    }
  });

  it("overshoot design : back/elastic dépassent 0..1 au milieu, rebouclent aux bornes", () => {
    expect(EASING_FUNCTIONS.easeInBack(0.25)).toBeLessThan(0); // back in : sous 0
    expect(EASING_FUNCTIONS.easeOutBack(0.75)).toBeGreaterThan(1); // back out : au-dessus de 1
    expect(EASING_FUNCTIONS.easeOutElastic(0.5)).toBeGreaterThan(1); // elastic : oscille au-dessus de 1
    const bounceMid = EASING_FUNCTIONS.easeOutBounce(0.5);
    expect(bounceMid).toBeGreaterThanOrEqual(0);
    expect(bounceMid).toBeLessThanOrEqual(1);
  });

  it("ease-in-out ≠ linéaire au milieu (accélération)", () => {
    expect(EASING_FUNCTIONS["ease-in-out"](0.5)).toBeCloseTo(0.5, 5);
    expect(EASING_FUNCTIONS["ease-in-out"](0.25)).toBeLessThan(0.25);
    expect(EASING_FUNCTIONS["ease-in-out"](0.75)).toBeGreaterThan(0.75);
  });

  it("hold : 0 avant la fin, 1 à la fin", () => {
    expect(EASING_FUNCTIONS.hold(0.5)).toBe(0);
    expect(EASING_FUNCTIONS.hold(1)).toBe(1);
  });

  it("cubicBezier : bornes, milieu et déterminisme", () => {
    const bez = cubicBezier(0.25, 0.1, 0.25, 1);
    expect(bez(0)).toBeCloseTo(0, 6);
    expect(bez(1)).toBeCloseTo(1, 6);
    const mid = bez(0.5);
    expect(mid).toBeGreaterThan(0.5); // easing "ease" : lente au départ
    expect(cubicBezier(0.25, 0.1, 0.25, 1)(0.5)).toBeCloseTo(mid, 10);
  });

  it("spring : démarre à 0, finit à 1, déterministe, paramétré", () => {
    const spring = springEasing(100, 10, 1);
    expect(spring(0)).toBeCloseTo(0, 6);
    expect(spring(1)).toBeGreaterThan(0.99);
    expect(springEasing(100, 10, 1)(0.5)).toBeCloseTo(spring(0.5), 10);
    // damping plus fort → moins d'oscillation
    const stiff = springEasing(100, 50, 1);
    expect(Math.abs(stiff(0.5) - 0.5)).toBeLessThan(Math.abs(spring(0.5) - 0.5));
  });

  it("getEasingFunction : nom, bezier, spring, inconnu → linear", () => {
    expect(getEasingFunction("linear")(0.5)).toBe(0.5);
    expect(getEasingFunction({ type: "cubicBezier", points: [0.25, 0.1, 0.25, 1] })(0.5)).toBeCloseTo(
      cubicBezier(0.25, 0.1, 0.25, 1)(0.5),
      10,
    );
    expect(getEasingFunction({ type: "spring", stiffness: 100, damping: 10, mass: 1 })(0.5)).toBeCloseTo(
      springEasing(100, 10, 1)(0.5),
      10,
    );
  });

  it("interpolate : linéaire par défaut et avec easing", () => {
    expect(interpolate(0, 10, 0.5)).toBe(5);
    expect(interpolate(0, 10, 0, "linear")).toBe(0);
    expect(interpolate(0, 10, 1, "linear")).toBe(10);
    // ease-out : commence vite
    expect(interpolate(0, 10, 0.5, "easeOutQuad")).toBeGreaterThan(5);
  });

  it("EASING_PRESETS couvre les presets documentés", () => {
    for (const key of ["linear", "ease", "easeIn", "easeOut", "easeInOut", "bounce", "elastic", "back", "snappy", "smooth"]) {
      expect(EASING_PRESETS[key]).toBeDefined();
    }
  });
});

describe("keyframes (port OpenReel keyframe-engine)", () => {
  const opacity = [
    kf("a", 0, "opacity", 0),
    kf("b", 30, "opacity", 1),
  ];

  it("liste vide → value undefined", () => {
    expect(getKeyframeValueAtTime([], 10).value).toBeUndefined();
    expect(evaluateKeyframesAt(undefined, 10).size).toBe(0);
  });

  it("un seul keyframe → sa valeur partout (clamp)", () => {
    const single = [kf("s", 10, "opacity", 0.7)];
    expect(getKeyframeValueAtTime(single, 0).value).toBe(0.7);
    expect(getKeyframeValueAtTime(single, 100).value).toBe(0.7);
  });

  it("avant le premier / après le dernier → clamp aux bornes", () => {
    expect(getKeyframeValueAtTime(opacity, -5).value).toBe(0);
    expect(getKeyframeValueAtTime(opacity, 0).value).toBe(0);
    expect(getKeyframeValueAtTime(opacity, 30).value).toBe(1);
    expect(getKeyframeValueAtTime(opacity, 999).value).toBe(1);
  });

  it("interpolation linéaire frame-exacte", () => {
    expect(getKeyframeValueAtTime(opacity, 15).value).toBe(0.5);
    expect(getKeyframeValueAtTime(opacity, 7.5).value).toBe(0.25);
    const mid = getKeyframeValueAtTime(opacity, 15);
    expect(mid.progress).toBeCloseTo(0.5, 10);
    expect(mid.easedProgress).toBeCloseTo(0.5, 10);
  });

  it("easing appliqué : ease-in-out au milieu ≠ 0.5", () => {
    const eased = [
      kf("a", 0, "opacity", 0, "ease-in-out"),
      kf("b", 30, "opacity", 1, "ease-in-out"),
    ];
    const mid = getKeyframeValueAtTime(eased, 15);
    // ease-in-out : symétrique → 0.5 au milieu exact, mais accélère ailleurs
    expect(mid.value).toBeCloseTo(0.5, 5);
    expect(getKeyframeValueAtTime(eased, 7.5).value).toBeLessThan(0.25);
    expect(getKeyframeValueAtTime(eased, 22.5).value).toBeGreaterThan(0.75);
  });

  it("hold : reste sur la valeur A jusqu'à la fin", () => {
    const hold = [
      kf("a", 0, "opacity", 0, "hold"),
      kf("b", 30, "opacity", 1, "hold"),
    ];
    expect(getKeyframeValueAtTime(hold, 0).value).toBe(0);
    expect(getKeyframeValueAtTime(hold, 29).value).toBe(0);
    expect(getKeyframeValueAtTime(hold, 30).value).toBe(1);
  });

  it("valeur objet (position) : interpolation récursive", () => {
    const pos = [
      kf("a", 0, "position", { x: 0, y: 0 }),
      kf("b", 60, "position", { x: 100, y: 200 }),
    ];
    expect(getKeyframeValueAtTime(pos, 30).value).toEqual({ x: 50, y: 100 });
  });

  it("valeur non numérique (string) → hold", () => {
    const label = [
      kf("a", 0, "label", "avant"),
      kf("b", 30, "label", "après"),
    ];
    expect(getKeyframeValueAtTime(label, 10).value).toBe("avant");
    expect(getKeyframeValueAtTime(label, 20).value).toBe("après");
  });

  it("evaluateKeyframesAt : plusieurs propriétés", () => {
    const many = [
      kf("a", 0, "opacity", 0),
      kf("b", 30, "opacity", 1),
      kf("c", 0, "scale", 0.8),
      kf("d", 30, "scale", 1.2),
    ];
    const at = evaluateKeyframesAt(many, 15);
    expect(at.get("opacity")).toBe(0.5);
    expect(at.get("scale")).toBe(1);
    expect(at.size).toBe(2);
  });

  it("evaluateKeyframesAt : propriété objet conservée", () => {
    const withPos = [
      kf("a", 0, "opacity", 0),
      kf("b", 30, "opacity", 1),
      kf("c", 0, "position", { x: 0, y: 0 }),
      kf("d", 60, "position", { x: 10, y: 20 }),
    ];
    const at = evaluateKeyframesAt(withPos, 30);
    expect(at.get("opacity")).toBe(1);
    expect(at.get("position")).toEqual({ x: 5, y: 10 });
  });

  it("poignées Bézier : easing 'bezier' déterministe", () => {
    const bezierKf: HikmaKeyframe = {
      id: "b1",
      time: 30,
      property: "opacity",
      value: 1,
      easing: "bezier",
      bezierHandles: { in: { x: 0.25, y: 0.1 }, out: { x: 0.25, y: 1 } },
    };
    const curve = [kf("a", 0, "opacity", 0, "bezier"), bezierKf];
    const v1 = getKeyframeValueAtTime(curve, 15).value as number;
    const v2 = getKeyframeValueAtTime(curve, 15).value as number;
    expect(v1).toBeCloseTo(v2, 10); // déterministe
    expect(v1).toBeGreaterThan(0.5); // "ease" par défaut : lente au départ
    expect(getKeyframeValueAtTime(curve, 0).value).toBe(0);
    expect(getKeyframeValueAtTime(curve, 30).value).toBe(1);
  });

  it("spring en easing de keyframe : déterministe, borné", () => {
    const springKf = [kf("a", 0, "opacity", 0, "easeOutElastic"), kf("b", 30, "opacity", 1, "easeOutElastic")];
    const a = getKeyframeValueAtTime(springKf, 10).value as number;
    const b = getKeyframeValueAtTime(springKf, 10).value as number;
    expect(a).toBeCloseTo(b, 10);
    expect(a).toBeGreaterThanOrEqual(0);
    expect(a).toBeLessThanOrEqual(1);
  });

  it("CRUD pur : add/remove/update ne mutent pas l'entrée", () => {
    const original = [...opacity];
    const added = addKeyframe(original, kf("c", 15, "opacity", 0.5));
    expect(added).toHaveLength(3);
    expect(original).toHaveLength(2);
    expect(sortKeyframes(added).map((k) => k.time)).toEqual([0, 15, 30]);

    const removed = removeKeyframe(added, "c");
    expect(removed.map((k) => k.id)).toEqual(["a", "b"]);

    const updated = updateKeyframe(original, "b", { time: 60 });
    expect(original[1]!.time).toBe(30); // non muté
    expect(updated[1]!.time).toBe(60);
    expect(sortKeyframes(updated).map((k) => k.time)).toEqual([0, 60]);
  });

  it("interpolateKeyframeValue : types mixtes", () => {
    expect(interpolateKeyframeValue(0, 10, 0.25)).toBe(2.5);
    expect(interpolateKeyframeValue({ a: 0, b: 2 }, { a: 10, b: 4 }, 0.5)).toEqual({ a: 5, b: 3 });
    // hold : A si progress < 0.5, sinon B (sémantique OpenReel)
    expect(interpolateKeyframeValue("x", "y", 0.4)).toBe("x");
    expect(interpolateKeyframeValue("x", "y", 0.5)).toBe("y");
    expect(interpolateKeyframeValue(true, false, 0.9)).toBe(false);
    // clé absente de B → valeur de A conservée
    expect(interpolateKeyframeValue({ a: 1, b: 2 }, { a: 3 }, 0.5)).toEqual({ a: 2, b: 2 });
  });

  it("déterminisme complet : même entrée → mêmes valeurs", () => {
    const complex = [
      kf("a", 0, "opacity", 0, "easeOutCubic"),
      kf("b", 30, "opacity", 1, "easeOutCubic"),
      kf("c", 0, "position", { x: 0, y: 0 }, "smoothstep"),
      kf("d", 60, "position", { x: 90, y: -30 }, "smoothstep"),
    ];
    const r1 = evaluateKeyframesAt(complex, 23);
    const r2 = evaluateKeyframesAt(complex, 23);
    expect(r1).toEqual(r2);
    expect(Array.from(r1.keys())).toEqual(["opacity", "position"]);
  });
});
