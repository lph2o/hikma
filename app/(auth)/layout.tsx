import type { ReactNode } from "react";

/** Mise en page centrée, sans navigation applicative (page d'authentification). */
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh items-center justify-center px-6 py-12">
      {children}
    </div>
  );
}
