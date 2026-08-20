import { cn } from "@/lib/utils";
import type { ElementType, HTMLAttributes, ReactNode } from "react";

export type ArabicTextScale = "inline" | "small" | "word" | "verse" | "hero";

type ArabicTextProps<T extends ElementType> = {
  /** Élément HTML à rendre (défaut : `span`). */
  as?: T;
  className?: string;
  /** Niveau de lecture : jamais sous 16px et 18px minimum sur mobile. */
  scale?: ArabicTextScale;
  children?: ReactNode;
} & Omit<HTMLAttributes<HTMLElement>, "as" | "className" | "children">;

/**
 * Rend du texte arabe avec les bonnes fondations RTL :
 * - `dir="rtl"` et `lang="ar"` ;
 * - police arabe dédiée (Amiri) via le token `--font-arabic` ;
 * - interligne généreux pour laisser la place aux diacritiques (harakât) ;
 * - aucun `letter-spacing` ni transformation de casse, pour préserver les
 *   ligatures et les diacritiques.
 */
export function ArabicText<T extends ElementType = "span">({
  as,
  className,
  children,
  scale = "inline",
  ...props
}: ArabicTextProps<T>) {
  const Tag = (as ?? "span") as ElementType;

  const scaleClass = {
    inline: "text-base",
    small: "text-lg",
    word: "text-2xl sm:text-3xl",
    verse: "text-3xl sm:text-4xl",
    hero: "text-5xl sm:text-6xl",
  }[scale];

  return (
    <Tag
      dir="rtl"
      lang="ar"
      className={cn(
        "font-arabic font-normal leading-[1.9] [letter-spacing:0] [text-transform:none]",
        scaleClass,
        className,
      )}
      {...props}
    >
      {children}
    </Tag>
  );
}
