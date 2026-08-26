import { PageLoading } from "@/components/ui/page-loading";

/**
 * Loading racine global (Phase 92) : feedback wordmark pour toute navigation
 * vers une route sans loading.tsx plus spécifique (/, /login, /signup,
 * /forgot-password, /reset-password, /onboarding).
 */
export default function RootLoading() {
  return <PageLoading />;
}
