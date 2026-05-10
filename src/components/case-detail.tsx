import { useEffect, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, primaryRole } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import type { Application, DocumentRow } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";

export function CaseDetail({ id }: { id: string }) {
  const { t } = useI18n();
  const { roles } = useAuth();
  const role = primaryRole(roles);
  const navigate = useNavigate();

  const [app, setApp] = useState<Application | null>(null);
  const [docs, setDocs] = useState<DocumentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [limit, setLimit] = useState("");
  const [notes, setNotes] = useState("");
  const [contractSigned, setContractSigned] = useState(false);
  const [guaranteeApproved, setGuaranteeApproved] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: a } = await supabase.from("applications").select("*").eq("id", id).maybeSingle();
      const { data: d } = await supabase.from("documents").select("*").eq("application_id", id);
      const application = a as Application | null;
      setApp(application);
      setDocs((d as DocumentRow[]) ?? []);
      if (application) {
        setLimit(application.assigned_limit?.toString() ?? "");
        setNotes(application.review_notes ?? "");
        setContractSigned(application.contract_signed);
        setGuaranteeApproved(application.guarantee_approved);
      }
      setLoading(false);
    })();
  }, [id]);

  const downloadDoc = async (doc: DocumentRow) => {
    const { data, error } = await supabase.storage.from("kyc-documents").createSignedUrl(doc.file_path, 60);
    if (error) return toast.error(error.message);
    window.open(data.signedUrl, "_blank");
  };

  const approveLimit = async () => {
    if (!app || !limit) return toast.error("Enter a limit");
    setSaving(true);
    const { error } = await supabase.from("applications").update({
      assigned_limit: Number(limit),
      review_notes: notes || null,
      status: "legal_review",
      decided_at: new Date().toISOString(),
    }).eq("id", app.id);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success(t("toast_approved"));
    navigate({ to: "/queue/credit" });
  };

  const reject = async () => {
    if (!app) return;
    setSaving(true);
    const { error } = await supabase.from("applications").update({
      status: "rejected",
      review_notes: notes || null,
      decided_at: new Date().toISOString(),
    }).eq("id", app.id);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success(t("toast_rejected"));
    navigate({ to: role === "credit" ? "/queue/credit" : "/queue/legal" });
  };

  const finalize = async () => {
    if (!app) return;
    if (!contractSigned || !guaranteeApproved) return toast.error("Confirm contract and guarantee");
    setSaving(true);
    const { error } = await supabase.from("applications").update({
      contract_signed: true,
      guarantee_approved: true,
      review_notes: notes || null,
      status: "onboarded",
      decided_at: new Date().toISOString(),
    }).eq("id", app.id);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success(t("toast_onboarded"));
    navigate({ to: "/queue/legal" });
  };

  if (loading) return <main className="mx-auto max-w-4xl px-6 py-12"><div className="h-40 animate-pulse rounded-xl bg-muted" /></main>;
  if (!app) return <main className="mx-auto max-w-4xl px-6 py-12"><p>Not found.</p></main>;

  const backTo = app.type === "buyer" && app.status === "credit_review" ? "/queue/credit" : "/queue/legal";
  const showCreditPanel = (role === "credit" || role === "admin") && app.status === "credit_review";
  const showLegalPanel = (role === "legal" || role === "admin") && (app.status === "legal_review" || app.status === "contract_pending");

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <Link to={backTo} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> {t("case_back")}
      </Link>

      <div className="mt-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-4xl font-semibold tracking-tight">{app.company_name ?? "—"}</h1>
          <p className="mt-1 text-sm text-muted-foreground capitalize">{app.type} · {t(`status_${app.status}`)}</p>
        </div>
        {app.assigned_limit && (
          <div className="rounded-lg border border-gold/40 bg-gold/10 px-4 py-2">
            <div className="text-xs uppercase tracking-widest text-emerald-deep">{t("case_assigned_limit")}</div>
            <div className="font-display text-2xl font-semibold text-emerald-deep">SAR {app.assigned_limit.toLocaleString()}</div>
          </div>
        )}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-6">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-card)]">
            <h2 className="font-display text-xl font-semibold">Application info</h2>
            <dl className="mt-4 grid gap-3 sm:grid-cols-2 text-sm">
              <Item label={t("ob_field_manager_email")} value={app.manager_email} />
              <Item label={t("ob_field_manager_phone")} value={app.manager_phone} />
              <Item label={t("ob_field_volume")} value={app.expected_monthly_volume ? `SAR ${app.expected_monthly_volume.toLocaleString()}` : "—"} />
              <Item label={t("table_submitted")} value={app.submitted_at ? new Date(app.submitted_at).toLocaleString() : "—"} />
            </dl>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-card)]">
            <h2 className="font-display text-xl font-semibold">{t("case_documents")}</h2>
            <ul className="mt-4 space-y-2">
              {docs.length === 0 && <li className="text-sm text-muted-foreground">{t("case_no_docs")}</li>}
              {docs.map((d) => (
                <li key={d.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                  <div>
                    <div className="font-medium text-sm">{t(`doc_${d.kind}`)}</div>
                    <div className="text-xs text-muted-foreground">{d.file_name}</div>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => downloadDoc(d)}>
                    <Download className="h-3.5 w-3.5 me-1.5" /> View
                  </Button>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="space-y-6">
          {showCreditPanel && (
            <div className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-card)]">
              <h3 className="font-display text-lg font-semibold">Credit decision</h3>
              <div className="mt-4 space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="limit">{t("case_assign_limit")}</Label>
                  <Input id="limit" type="number" min="0" value={limit} onChange={(e) => setLimit(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">{t("case_notes")}</Label>
                  <Textarea id="notes" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
                </div>
                <Button onClick={approveLimit} disabled={saving} className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
                  {saving && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
                  {t("case_approve_limit")}
                </Button>
                <Button onClick={reject} variant="outline" className="w-full text-destructive border-destructive/40 hover:bg-destructive/10">
                  {t("case_reject")}
                </Button>
              </div>
            </div>
          )}

          {showLegalPanel && (
            <div className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-card)]">
              <h3 className="font-display text-lg font-semibold">Legal & contracts</h3>
              <div className="mt-4 space-y-3">
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox checked={contractSigned} onCheckedChange={(v) => setContractSigned(!!v)} />
                  {t("case_contract_signed")}
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox checked={guaranteeApproved} onCheckedChange={(v) => setGuaranteeApproved(!!v)} />
                  {t("case_guarantee_approved")}
                </label>
                <div className="space-y-2">
                  <Label htmlFor="lnotes">{t("case_notes")}</Label>
                  <Textarea id="lnotes" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
                </div>
                <Button onClick={finalize} disabled={saving} className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
                  {saving && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
                  {t("case_finalize")}
                </Button>
                <Button onClick={reject} variant="outline" className="w-full text-destructive border-destructive/40 hover:bg-destructive/10">
                  {t("case_reject")}
                </Button>
              </div>
            </div>
          )}

          {app.status === "onboarded" && (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6">
              <p className="text-emerald-900 font-medium">This account is fully onboarded.</p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

function Item({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="mt-0.5 font-medium">{value || "—"}</div>
    </div>
  );
}