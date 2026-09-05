import type { ReactNode } from "react";
import { AdminSidebar } from "./admin-sidebar";
import { AdminHeader } from "./admin-header";

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
        <main className="flex-1 w-full">{children}</main>
      </div>
    </div>
  );
}
