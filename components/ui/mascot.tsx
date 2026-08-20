import Image from "next/image";
import { cn } from "@/lib/utils";

import welcomeMascot from "@/public/welcome_mascotte.png";
import loginMascot from "@/public/login-mascotte.png";
import learnMascot from "@/public/learn-mascotte.png";
import profileMascot from "@/public/profile-mascotte.png";
import settingsMascot from "@/public/settings_mascotte.png";

/**
 * Les cinq mascottes officielles de Hikma.
 * Aucune nouvelle illustration ne doit être créée : les émotions sont
 * exprimées par le contexte, les messages et les micro-interactions.
 */
const MASCOTS = {
  welcome: { src: welcomeMascot, alt: "Mascotte Hikma — accueil" },
  login: { src: loginMascot, alt: "Mascotte Hikma — connexion" },
  learn: { src: learnMascot, alt: "Mascotte Hikma — apprentissage" },
  profile: { src: profileMascot, alt: "Mascotte Hikma — profil" },
  settings: { src: settingsMascot, alt: "Mascotte Hikma — réglages" },
} as const;

export type MascotVariant = keyof typeof MASCOTS;

export type MascotSize = "xs" | "sm" | "md" | "lg" | "xl" | "2xl";

const SIZE_CLASSES: Record<MascotSize, string> = {
  xs: "size-8",
  sm: "size-14",
  md: "size-20",
  lg: "size-28",
  xl: "size-36",
  "2xl": "size-48",
};

export type MascotProps = {
  /** Variante de mascotte (une des 5 illustrations officielles). */
  variant?: MascotVariant;
  /** Message optionnel affiché dans une bulle au-dessus de la mascotte. */
  message?: string;
  /** Taille de la mascotte (boîte carrée, illustration centrée sans déformation). */
  size?: MascotSize;
  /** Classes appliquées au conteneur racine. */
  className?: string;
  /** Usage purement décoratif : masque la mascotte aux lecteurs d'écran. */
  decorative?: boolean;
};

export function Mascot({
  variant = "welcome",
  message,
  size = "md",
  className,
  decorative = false,
}: MascotProps) {
  const { src, alt } = MASCOTS[variant];

  return (
    <div
      className={cn("flex flex-col items-center gap-2", className)}
      aria-hidden={decorative || undefined}
    >
      {message ? (
        <p className="max-w-56 rounded-2xl rounded-bl-sm border border-border bg-card px-3 py-2 text-center text-body-sm shadow-sm">
          {message}
        </p>
      ) : null}
      <div className={cn("relative", SIZE_CLASSES[size])}>
        <Image
          src={src}
          alt={alt}
          fill
          sizes="(max-width: 640px) 160px, 256px"
          className="object-contain"
        />
      </div>
    </div>
  );
}
