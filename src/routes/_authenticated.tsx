import { createFileRoute, Outlet, Navigate } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";
import { SiteHeader } from "@/components/site-header";

export const Route = createFileRoute("/_authenticated")({
  component: ProtectedLayout,
});

function ProtectedLayout() {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <div className="mx-auto max-w-7xl px-6 py-16">
          <div className="h-32 animate-pulse rounded-xl bg-muted" />
        </div>
      </div>
    );
  }
  if (!user) return <Navigate to="/login" />;
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <Outlet />
    </div>
  );
}