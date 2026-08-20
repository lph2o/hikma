import { cn } from "@/lib/utils";
import type { HTMLAttributes } from "react";

/** Titre signature (56px). Un seul Display par page. */
export function Display({
  className,
  ...props
}: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h1
      className={cn("font-heading text-display font-semibold tracking-tight", className)}
      {...props}
    />
  );
}

/** Libellé typographique (12px) — distinct du `Label` de formulaire (`components/ui/label`). */
export function Label({
  className,
  ...props
}: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn("text-label font-medium text-muted-foreground", className)}
      {...props}
    />
  );
}

export function H1({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return <h1 className={cn("font-heading text-h1 font-semibold tracking-tight", className)} {...props} />;
}

export function H2({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return <h2 className={cn("font-heading text-h2 font-semibold", className)} {...props} />;
}

export function H3({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cn("font-heading text-h3 font-semibold", className)} {...props} />;
}

export function H4({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return <h4 className={cn("text-h4 font-medium", className)} {...props} />;
}

export function BodyLarge({
  className,
  ...props
}: HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("text-body-lg", className)} {...props} />;
}

export function BodyMedium({
  className,
  ...props
}: HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("text-body-md", className)} {...props} />;
}

export function BodySmall({
  className,
  ...props
}: HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("text-body-sm", className)} {...props} />;
}

export function Caption({
  className,
  ...props
}: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span className={cn("text-caption text-muted-foreground", className)} {...props} />
  );
}
