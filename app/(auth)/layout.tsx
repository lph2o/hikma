import type { ReactNode } from "react";

/** Layout d'authentification — délègue le responsive au shell dédié. */
export default function AuthLayout({ children }: { children: ReactNode }) {
  return <div className="min-h-dvh w-full">{children}</div>;
}
