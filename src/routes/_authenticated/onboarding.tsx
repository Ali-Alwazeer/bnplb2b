import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Check, FileUp, Loader2, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, primaryRole } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { requiredDocs, HIGH_VOLUME_THRESHOLD } from "@/lib/documents";
import type { Application, DocumentRow, ApplicationType } from "@/lib/types";

export const Route = createFileRoute("/_authenticated/onboarding")({
  component: OnboardingPage,
});

type Step = 0 | 1 | 2;

function OnboardingPage() {
  const { user, roles } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();

  const role = primaryRole(roles);
  const type: ApplicationType = role === "merchant" ? "merchant" : "buyer";

  const [step, setStep] = useState<Step>(0);
  const [app, setApp] = useState<Application | null>(null);
  const [docs, setDocs] = useState<DocumentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingKind, setUploadingKind] = useState<string | null>(null);

  const [form, setForm] = useState({
    company_name: "",
    manager_email: "",
    manager_phone: "",
    expected_monthly_volume: "" as string,
  });

  // Load or create draft application
  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: existing } = await supabase
        .from("applications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      let current = existing as Application | null;

      if (!current) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("company_name, phone")
          .eq("id", user.id)
          .maybeSingle();
        const { data: created, error } = await supabase
          .from("applications")
          .insert({
            user_id: user.id,
            type,
            status: "draft",
            company_name: profile?.company_name ?? null,
            manager_email: user.email ?? null,
            manager_phone: profile?.phone ?? null,
          })
          .select("*")
          .single();
        if (error) {
          toast.error(error.message);
        }
        current = (created as Application) ?? null;
      }

      if (current) {
        setApp(current);
        setForm({
          company_name: current.company_name ?? "",
          manager_email: current.manager_email ?? "",
          manager_phone: current.manager_phone ?? "",
          expected_monthly_volume: current.expected_monthly_volume?.toString() ?? "",
        });
        if (current.status !== "draft") {
          // already submitted — go back to dashboard
          navigate({ to: "/dashboard" });
          return;
        }
        const { data: rows } = await supabase
          .from("documents")
          .select("*")
          .eq("application_id", current.id)
          .order("uploaded_at", { ascending: false });
        setDocs((rows as DocumentRow[]) ?? []);
      }
      setLoading(false);
    })();
  }, [user, type, navigate]);

  const volume = Number(form.expected_monthly_volume) || 0;
  const docList = useMemo(() => requiredDocs(type, volume), [type, volume]);
  const docsByKind = useMemo(() => {
    const map = new Map<string, DocumentRow>();
    for (const d of docs) map.set(d.kind, d);
    return map;
  }, [docs]);

  const allUploaded = docList.every((d) => docsByKind.has(d.kind));

  const saveCompanyInfo = async () => {
    if (!app) return;
    setSaving(true);
    const { data, error } = await supabase
      .from("applications")
      .update({
        company_name: form.company_name.trim() || null,
        manager_email: form.manager_email.trim() || null,
        manager_phone: form.manager_phone.trim() || null,
        expected_monthly_volume: form.expected_monthly_volume ? Number(form.expected_monthly_volume) : null,
      })
      .eq("id", app.id)
      .select("*")
      .single();
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setApp(data as Application);
    toast.success(t("toast_saved"));
    setStep(1);
  };

  const onUpload = async (kind: string, file: File) => {
    if (!app || !user) return;
    setUploadingKind(kind);
    const path = `${user.id}/${app.id}/${kind}-${Date.now()}-${file.name}`;
    const { error: upErr } = await supabase.storage.from("kyc-documents").upload(path, file, { upsert: false });
    if (upErr) {
      toast.error(upErr.message);
      setUploadingKind(null);
      return;
    }
    // Replace existing doc of same kind: delete previous DB row + storage object
    const existing = docsByKind.get(kind);
    if (existing) {
      await supabase.storage.from("kyc-documents").remove([existing.file_path]);
      await supabase.from("documents").delete().eq("id", existing.id);
    }
    const { data, error } = await supabase
      .from("documents")
      .insert({ application_id: app.id, kind: kind as any, file_path: path, file_name: file.name })
      .select("*")
      .single();
    if (error) {
      toast.error(error.message);
    } else {
      setDocs((prev) => [data as DocumentRow, ...prev.filter((d) => d.kind !== kind)]);
    }
    setUploadingKind(null);
  };

  const onRemove = async (doc: DocumentRow) => {
    await supabase.storage.from("kyc-documents").remove([doc.file_path]);
    await supabase.from("documents").delete().eq("id", doc.id);
    setDocs((prev) => prev.filter((d) => d.id !== doc.id));
  };

  const submit = async () => {
    if (!app) return;
    if (!form.company_name || !form.manager_email || !form.manager_phone) {
      toast.error("Complete company info first");
      setStep(0);
      return;
    }
    if (!allUploaded) {
      toast.error("Upload all required documents");
      setStep(1);
      return;
    }
    setSaving(true);
    const nextStatus = type === "merchant" ? "legal_review" : "credit_review";
    const { error } = await supabase
      .from("applications")
      .update({ status: nextStatus, submitted_at: new Date().toISOString() })
      .eq("id", app.id);
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(t("ob_submitted"));
    navigate({ to: "/dashboard" });
  };

  if (loading) {
    return (
      <main className="mx-auto max-w-4xl px-6 py-12">
        <div className="h-40 animate-pulse rounded-xl bg-muted" />
      </main>
    );
  }

  const title = type === "merchant" ? t("ob_title_merchant") : t("ob_title_buyer");
  const steps = [t("ob_step_company"), t("ob_step_documents"), t("ob_step_review")];

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <h1 className="font-display text-4xl font-semibold tracking-tight">{title}</h1>

      {/* Stepper */}
      <ol className="mt-8 grid grid-cols-3 gap-3">
        {steps.map((label, i) => (
          <li key={label} className={`rounded-lg border p-3 text-sm ${i === step ? "border-primary bg-primary/5" : i < step ? "border-emerald-200 bg-emerald-50/50" : "border-border bg-card"}`}>
            <div className="flex items-center gap-2">
              <span className={`grid h-6 w-6 place-items-center rounded-full text-xs font-semibold ${i <= step ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                {i < step ? <Check className="h-3.5 w-3.5" /> : i + 1}
              </span>
              <span className="font-medium">{label}</span>
            </div>
          </li>
        ))}
      </ol>

      <div className="mt-8 rounded-2xl border border-border bg-card p-8 shadow-[var(--shadow-card)]">
        {step === 0 && (
          <div className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="company_name">{t("ob_field_company_name")}</Label>
                <Input id="company_name" required value={form.company_name} onChange={(e) => setForm({ ...form, company_name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="manager_email">{t("ob_field_manager_email")}</Label>
                <Input id="manager_email" type="email" required value={form.manager_email} onChange={(e) => setForm({ ...form, manager_email: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="manager_phone">{t("ob_field_manager_phone")}</Label>
                <Input id="manager_phone" required value={form.manager_phone} onChange={(e) => setForm({ ...form, manager_phone: e.target.value })} />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="volume">{t("ob_field_volume")}</Label>
                <Input
                  id="volume"
                  type="number"
                  min="0"
                  inputMode="numeric"
                  value={form.expected_monthly_volume}
                  onChange={(e) => setForm({ ...form, expected_monthly_volume: e.target.value })}
                />
                {type === "buyer" && (
                  <p className="text-xs text-muted-foreground">{t("ob_volume_help")}</p>
                )}
              </div>
            </div>
            <div className="flex justify-end">
              <Button onClick={saveCompanyInfo} disabled={saving} className="bg-primary text-primary-foreground hover:bg-primary/90">
                {saving && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
                {t("ob_save_continue")}
              </Button>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-3">
            {docList.map((d) => {
              const uploaded = docsByKind.get(d.kind);
              return (
                <div key={d.kind} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-background p-4">
                  <div>
                    <div className="font-medium">{t(d.labelKey)}</div>
                    <div className="text-xs text-muted-foreground">
                      {uploaded ? uploaded.file_name : d.hintKey ? t(d.hintKey) : t("ob_required")}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {uploaded && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-900">
                        <Check className="h-3 w-3" /> {t("ob_uploaded")}
                      </span>
                    )}
                    <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-input bg-background px-3 py-1.5 text-xs font-medium hover:bg-accent">
                      {uploadingKind === d.kind ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <FileUp className="h-3.5 w-3.5" />
                      )}
                      {uploaded ? t("ob_replace") : t("ob_upload")}
                      <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        className="hidden"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) onUpload(d.kind, f);
                          e.target.value = "";
                        }}
                      />
                    </label>
                    {uploaded && (
                      <button
                        onClick={() => onRemove(uploaded)}
                        className="rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                        aria-label="Remove"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
            {type === "buyer" && volume > HIGH_VOLUME_THRESHOLD && (
              <p className="rounded-md bg-gold/10 p-3 text-xs text-emerald-deep">
                {t("ob_doc_required_buyer_high")}
              </p>
            )}
            <div className="flex justify-between pt-2">
              <Button variant="outline" onClick={() => setStep(0)}>{t("ob_back")}</Button>
              <Button onClick={() => setStep(2)} disabled={!allUploaded} className="bg-primary text-primary-foreground hover:bg-primary/90">
                {t("ob_save_continue")}
              </Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5">
            <div>
              <h2 className="font-display text-xl font-semibold">{t("review_title")}</h2>
              <p className="text-sm text-muted-foreground">{t("review_sub")}</p>
              <p className="mt-2 text-sm text-emerald-deep">
                {type === "merchant" ? t("review_target_merchant") : t("review_target_buyer")}
              </p>
            </div>
            <dl className="grid gap-3 sm:grid-cols-2 text-sm">
              <ReviewRow label={t("ob_field_company_name")} value={form.company_name} />
              <ReviewRow label={t("ob_field_manager_email")} value={form.manager_email} />
              <ReviewRow label={t("ob_field_manager_phone")} value={form.manager_phone} />
              <ReviewRow label={t("ob_field_volume")} value={form.expected_monthly_volume ? `SAR ${Number(form.expected_monthly_volume).toLocaleString()}` : "—"} />
            </dl>
            <div className="rounded-lg border border-border bg-background p-4">
              <div className="text-xs uppercase tracking-widest text-muted-foreground">{t("case_documents")}</div>
              <ul className="mt-2 space-y-1 text-sm">
                {docList.map((d) => (
                  <li key={d.kind} className="flex justify-between">
                    <span>{t(d.labelKey)}</span>
                    <span className="text-emerald-deep">
                      {docsByKind.has(d.kind) ? <Check className="h-4 w-4" /> : "—"}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex justify-between pt-2">
              <Button variant="outline" onClick={() => setStep(1)}>{t("ob_back")}</Button>
              <Button onClick={submit} disabled={saving} className="bg-primary text-primary-foreground hover:bg-primary/90">
                {saving && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
                {t("ob_submit")}
              </Button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border bg-background p-3">
      <div className="text-xs uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="mt-0.5 font-medium">{value || "—"}</div>
    </div>
  );
}