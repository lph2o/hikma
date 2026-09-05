import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin/auth";
import { getAdminUserDetail } from "@/lib/admin/queries/users";
import { UserProfileHeader } from "@/components/admin/users/user-profile-header";
import { UserProgressCards } from "@/components/admin/users/user-progress-cards";
import { UserVocabTable } from "@/components/admin/users/user-vocab-table";
import { UserActivityLog } from "@/components/admin/users/user-activity-log";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Fiche utilisateur — Admin Control Center | Hikma",
  robots: { index: false, follow: false },
};

interface UserDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function AdminUserDetailPage({
  params,
}: UserDetailPageProps) {
  await requireAdmin();

  const { id } = await params;
  const user = await getAdminUserDetail(id);

  if (!user) {
    notFound();
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8">
      {/* Header fiche utilisateur */}
      <UserProfileHeader
        displayName={user.displayName}
        email={user.email}
        isAdmin={user.isAdmin}
        onboarded={user.onboarded}
        createdAt={user.createdAt}
        lastSignInAt={user.lastSignInAt}
      />

      {/* Cartes KPI de progression */}
      <UserProgressCards user={user} />

      {/* Détail du vocabulaire dans le SRS */}
      <UserVocabTable words={user.words} />

      {/* Historique chronologique des leçons */}
      <UserActivityLog activities={user.recentActivities} />
    </div>
  );
}
