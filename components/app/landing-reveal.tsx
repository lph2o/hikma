"use client";

import { cn } from "@/lib/utils";
import { AppElementType } from "@/lib/react/jsx-elements";
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";

/**
 * Apparition en cascade (scroll reveal) pour la landing.
 *
 * - IntersectionObserver uniquement (pas de listener scroll) ; `transform` +
 *   `opacity` + `filter` uniquement, avec la courbe Hikma `--ease-hikma`.
 * - SSR-safe : le contenu est visible par défaut (lisible sans JavaScript et
 *   indexable) ; l'observateur masque ensuite les éléments hors écran pour
 *   préparer l'apparition, sans flash pour ce qui est déjà à l'écran.
 * - `prefers-reduced-motion` est géré globalement dans `globals.css` et par
 *   les variantes `motion-reduce`.
 */
export function Reveal({
  children,
  className,
  delay = 0,
  as,
}: {
  children: ReactNode;
  className?: string;
  /** Délai en ms pour l'effet en cascade entre éléments. */
  delay?: number;
  as?: AppElementType;
}) {
  const ref = useRef<HTMLElement | null>(null);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setVisible(true);
            observer.disconnect();
          } else {
            setVisible(false);
          }
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Tag dynamique typé SÛR : R3F v9 injecte des clés `never` dans
  // JSX.IntrinsicElements, ce qui casserait `React.ElementType` (voir
  // lib/react/jsx-elements.ts).
  const Comp = (as ?? "div") as AppElementType;

  return (
    <Comp
      ref={ref}
      style={{ transitionDelay: delay ? `${delay}ms` : undefined } as CSSProperties}
      className={cn(
        "transition-[opacity,transform,filter] duration-700 ease-[var(--ease-hikma)] motion-reduce:translate-y-0 motion-reduce:opacity-100 motion-reduce:blur-0 motion-reduce:transition-none",
        visible ? "translate-y-0 opacity-100 blur-0" : "translate-y-6 opacity-0 blur-[2px]",
        className,
      )}
    >
      {children}
    </Comp>
  );
}
