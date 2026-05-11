import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/signup")({
  validateSearch: (search: Record<string, unknown>) => ({
    role: search.role === "merchant" || search.role === "buyer" ? search.role : "buyer",
  }),
  component: SignupPage,
});

function SignupPage() {
  const { t, lang } = useI18n();
  const navigate = useNavigate();
  const { refreshRoles } = useAuth();
  const { role } = Route.useSearch();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [company, setCompany] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/onboarding`,
        data: {
          full_name: fullName,
          phone,
          company_name: company,
          preferred_lang: lang,
          role,
        },
      },
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    await refreshRoles();
    toast.success(t("ob_submitted"));
    navigate({ to: "/onboarding" });
  };

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <div className="mx-auto flex max-w-md flex-col gap-6 px-6 py-16">
        <div>
          <h1 className="font-display text-4xl font-semibold tracking-tight">{t("signup_title")}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{t("signup_sub")}</p>
          <p className="mt-3 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-3 py-1 text-xs font-medium text-emerald-deep">
            {role === "merchant" ? t("role_merchant") : t("role_buyer")}
          </p>
        </div>
        <form onSubmit={onSubmit} className="space-y-4 rounded-xl border border-border bg-card p-6 shadow-[var(--shadow-card)]">
          <div className="space-y-2">
            <Label htmlFor="full_name">{t("field_full_name")}</Label>
            <Input id="full_name" required value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="company">{t("field_company")}</Label>
            <Input id="company" required value={company} onChange={(e) => setCompany(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">{t("field_phone")}</Label>
            <Input id="phone" type="tel" required value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">{t("field_email")}</Label>
            <Input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">{t("field_password")}</Label>
            <Input id="password" type="password" autoComplete="new-password" minLength={8} required value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <Button type="submit" disabled={loading} className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
            {t("submit_signup")}
          </Button>
        </form>
        <p className="text-center text-sm text-muted-foreground">
          {t("have_account")} <Link to="/login" className="font-medium text-emerald-deep underline-offset-4 hover:underline">{t("nav_login")}</Link>
        </p>
      </div>
    </div>
  );
}