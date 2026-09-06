import type { ReactNode } from "react";
import { AdminSidebar } from "./admin-sidebar";
import { AdminHeader } from "./admin-header";
import { AdminBottomNav } from "./admin-bottom-nav";

interface AdminShellProps {
  userEmail?: string | null;
  children: ReactNode;
}

export function AdminShell({ userEmail, children }: AdminShellProps) {
  return (
    <div className="min-h-dvh bg-background text-foreground">
      <AdminSidebar />
      <div className="md:pl-64 flex flex-col min-h-dvh">
        <AdminHeader userEmail={userEmail} />
        {/* pb-24 : clearance pour la bottom nav mobile (≈60px pilule + safe-area).
            md:pb-0 : desktop utilise la sidebar, aucun clearance nécessaire. */}
        <main className="flex-1 w-full pb-24 md:pb-0">{children}</main>
      </div>
      <AdminBottomNav />
    </div>
  );
}
