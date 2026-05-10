import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, primaryRole } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Application } from "@/lib/types";
import { CircleDot, FileText, Inbox, Scale } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: Dashboard,
});

function StatusBadge({ status }: { status: Application["status"] }) {
  const { t } = useI18n();
  const tone: Record<Application["status"], string> = {
    draft: "bg-muted text-muted-foreground",
    submitted: "bg-blue-100 text-blue-900 dark:bg-blue-950 dark:text-blue-200",
    credit_review: "bg-amber-100 text-amber-900",
    legal_review: "bg-purple-100 text-purple-900",
    contract_pending: "bg-orange-100 text-orange-900",
    onboarded: "bg-emerald-100 text-emerald-900",
    rejected: "bg-red-100 text-red-900",
  };
  return <span className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${tone[status]}`}>{t(`status_${status}`)}</span>;
}

function Dashboard() {
  const { user, roles } = useAuth();
  const { t } = useI18n();
  const [app, setApp] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);
  const role = primaryRole(roles);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("applications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      setApp((data as Application) ?? null);
      setLoading(false);
    })();
  }, [user]);

  const isReviewer = role === "credit" || role === "legal" || role === "admin";

  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl font-semibold tracking-tight">{t("dash_welcome")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{user?.email}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs uppercase tracking-widest text-muted-foreground">{t("dash_role")}</span>
          <Badge variant="outline" className="border-primary/40 text-emerald-deep capitalize">
            {role ?? "—"}
          </Badge>
        </div>
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-3">
        {/* Applicant card */}
        {(role === "merchant" || role === "buyer") && (
          <div className="lg:col-span-2 rounded-2xl border border-border bg-card p-8 shadow-[var(--shadow-card)]">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-display text-2xl font-semibold">{t("dash_status")}</h2>
              {app && <StatusBadge status={app.status} />}
            </div>
            {loading ? (
              <div className="mt-6 h-20 animate-pulse rounded-lg bg-muted" />
            ) : !app ? (
              <div className="mt-6">
                <p className="text-muted-foreground">No application yet. Begin your KYC and document upload.</p>
                <Button asChild className="mt-6 bg-primary text-primary-foreground hover:bg-primary/90">
                  <Link to="/onboarding">{t("dash_start_onboarding")}</Link>
                </Button>
              </div>
            ) : (
              <div className="mt-6 space-y-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label={t("ob_field_company_name")} value={app.company_name} />
                  <Field label={t("ob_field_volume")} value={app.expected_monthly_volume ? `SAR ${app.expected_monthly_volume.toLocaleString()}` : "—"} />
                  <Field label={t("ob_field_manager_email")} value={app.manager_email} />
                  <Field label={t("ob_field_manager_phone")} value={app.manager_phone} />
                </div>
                {app.assigned_limit && (
                  <div className="rounded-lg border border-gold/40 bg-gold/10 p-4">
                    <div className="text-xs uppercase tracking-widest text-emerald-deep">{t("case_assigned_limit")}</div>
                    <div className="font-display text-3xl font-semibold text-emerald-deep">
                      SAR {app.assigned_limit.toLocaleString()}
                    </div>
                  </div>
                )}
                {app.status === "draft" && (
                  <Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90">
                    <Link to="/onboarding">{t("dash_continue_onboarding")}</Link>
                  </Button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Reviewer queues */}
        {isReviewer && (
          <div className="lg:col-span-2 rounded-2xl border border-border bg-card p-8 shadow-[var(--shadow-card)]">
            <h2 className="font-display text-2xl font-semibold">Reviewer queues</h2>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {(role === "credit" || role === "admin") && (
                <Link to="/queue/credit" className="group flex items-start gap-3 rounded-xl border border-border p-5 transition-colors hover:border-primary/50">
                  <Inbox className="h-5 w-5 text-emerald-mid" />
                  <div>
                    <div className="font-display text-lg font-semibold">{t("credit_queue_title")}</div>
                    <div className="text-sm text-muted-foreground">Buyer applications waiting for credit limit.</div>
                  </div>
                </Link>
              )}
              {(role === "legal" || role === "admin") && (
                <Link to="/queue/legal" className="group flex items-start gap-3 rounded-xl border border-border p-5 transition-colors hover:border-primary/50">
                  <Scale className="h-5 w-5 text-emerald-mid" />
                  <div>
                    <div className="font-display text-lg font-semibold">{t("legal_queue_title")}</div>
                    <div className="text-sm text-muted-foreground">Contracts, guarantees, final onboarding.</div>
                  </div>
                </Link>
              )}
            </div>
          </div>
        )}

        {/* Side: tips */}
        <aside className="rounded-2xl border border-border bg-secondary/40 p-6">
          <div className="flex items-center gap-2 text-emerald-deep">
            <CircleDot className="h-4 w-4" />
            <span className="text-xs font-semibold uppercase tracking-widest">Phase 1</span>
          </div>
          <h3 className="mt-2 font-display text-xl font-semibold">Onboarding flow</h3>
          <ol className="mt-4 space-y-3 text-sm text-muted-foreground">
            <li className="flex gap-2"><FileText className="h-4 w-4 mt-0.5 text-emerald-mid" /> Submit KYC documents</li>
            <li className="flex gap-2"><Inbox className="h-4 w-4 mt-0.5 text-emerald-mid" /> Internal review (credit/legal)</li>
            <li className="flex gap-2"><Scale className="h-4 w-4 mt-0.5 text-emerald-mid" /> Contracts & guarantees</li>
          </ol>
        </aside>
      </div>
    </main>
  );
}

function Field({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="mt-1 font-medium">{value || "—"}</div>
    </div>
  );
}