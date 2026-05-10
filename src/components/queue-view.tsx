import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import type { Application } from "@/lib/types";
import { Button } from "@/components/ui/button";

export function QueueView({ team }: { team: "credit" | "legal" }) {
  const { t } = useI18n();
  const [rows, setRows] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      let q = supabase.from("applications").select("*").order("submitted_at", { ascending: true, nullsFirst: false });
      if (team === "credit") q = q.eq("type", "buyer").in("status", ["credit_review"]);
      else q = q.in("status", ["legal_review", "contract_pending"]);
      const { data } = await q;
      setRows((data as Application[]) ?? []);
      setLoading(false);
    })();
  }, [team]);

  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <h1 className="font-display text-4xl font-semibold tracking-tight">
        {team === "credit" ? t("credit_queue_title") : t("legal_queue_title")}
      </h1>
      <div className="mt-8 overflow-hidden rounded-xl border border-border bg-card shadow-[var(--shadow-card)]">
        <table className="w-full text-sm">
          <thead className="bg-secondary/40 text-xs uppercase tracking-widest text-muted-foreground">
            <tr>
              <th className="px-4 py-3 text-start">{t("table_company")}</th>
              <th className="px-4 py-3 text-start">{t("table_type")}</th>
              <th className="px-4 py-3 text-start">{t("table_volume")}</th>
              <th className="px-4 py-3 text-start">{t("table_status")}</th>
              <th className="px-4 py-3 text-start">{t("table_submitted")}</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">Loading…</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">{t("queue_empty")}</td></tr>
            ) : rows.map((r) => (
              <tr key={r.id} className="border-t border-border">
                <td className="px-4 py-3 font-medium">{r.company_name ?? "—"}</td>
                <td className="px-4 py-3 capitalize">{r.type}</td>
                <td className="px-4 py-3">{r.expected_monthly_volume ? `SAR ${r.expected_monthly_volume.toLocaleString()}` : "—"}</td>
                <td className="px-4 py-3">{t(`status_${r.status}`)}</td>
                <td className="px-4 py-3 text-muted-foreground">{r.submitted_at ? new Date(r.submitted_at).toLocaleDateString() : "—"}</td>
                <td className="px-4 py-3 text-end">
                  <Button asChild size="sm" variant="outline">
                    <Link to="/case/$id" params={{ id: r.id }}>{t("action_review")}</Link>
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}