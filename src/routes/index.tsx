import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { ShieldCheck, Banknote, FileSignature, Receipt, ArrowRight } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const { t } = useI18n();
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main>
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div
            aria-hidden
            className="absolute inset-0 -z-10"
            style={{
              background:
                "radial-gradient(80% 60% at 70% 0%, oklch(0.78 0.12 85 / 0.18), transparent 60%), radial-gradient(60% 40% at 0% 100%, oklch(0.32 0.08 160 / 0.18), transparent 60%)",
            }}
          />
          <div className="mx-auto max-w-7xl px-6 pb-24 pt-20 lg:pt-28">
            <div className="grid gap-16 lg:grid-cols-[1.2fr_1fr] lg:items-center">
              <div>
                <span className="inline-flex items-center gap-2 rounded-full border border-gold/40 bg-gold/10 px-3 py-1 text-xs font-medium tracking-wide text-emerald-deep uppercase">
                  Phase 1 · Onboarding
                </span>
                <h1 className="mt-6 font-display text-5xl font-semibold leading-[1.05] tracking-tight text-foreground md:text-6xl lg:text-7xl">
                  {t("hero_title")}
                </h1>
                <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
                  {t("hero_sub")}
                </p>
                <div className="mt-10 flex flex-wrap gap-3">
                  <Button asChild size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90">
                    <Link to="/signup" search={{ role: "buyer" }}>
                      {t("cta_become_buyer")} <ArrowRight className="ms-2 h-4 w-4" />
                    </Link>
                  </Button>
                  <Button asChild size="lg" variant="outline" className="border-primary/30">
                    <Link to="/signup" search={{ role: "merchant" }}>{t("cta_become_merchant")}</Link>
                  </Button>
                </div>
              </div>

              {/* Decorative card */}
              <div className="relative">
                <div
                  className="rounded-2xl border border-border bg-card p-8 shadow-[var(--shadow-prestige)]"
                  style={{ background: "var(--gradient-prestige)" }}
                >
                  <div className="space-y-5 text-primary-foreground">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-xs uppercase tracking-widest opacity-70">Approved limit</div>
                        <div className="font-display text-4xl font-semibold text-gold">SAR 250,000</div>
                      </div>
                      <ShieldCheck className="h-8 w-8 text-gold" />
                    </div>
                    <div className="rounded-lg bg-white/5 p-4 ring-1 ring-white/10">
                      <div className="text-xs uppercase tracking-widest opacity-70">Invoice #INV-204</div>
                      <div className="mt-1 font-display text-2xl">SAR 48,000</div>
                      <div className="mt-3 grid grid-cols-3 gap-2">
                        {["Advance", "Month 1", "Month 2"].map((p, i) => (
                          <div key={p} className="rounded-md bg-gold/15 p-2 text-center">
                            <div className="text-[10px] uppercase opacity-70">{p}</div>
                            <div className="text-sm font-semibold text-gold">SAR {[16, 16, 16][i]}k</div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="text-xs opacity-70">Settled via Ida'at · Backed by guarantees</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="border-t border-border/60 bg-secondary/40">
          <div className="mx-auto grid max-w-7xl gap-px bg-border/60 px-0 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: ShieldCheck, label: t("feature_1") },
              { icon: Banknote, label: t("feature_2") },
              { icon: FileSignature, label: t("feature_3") },
              { icon: Receipt, label: t("feature_4") },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-3 bg-background px-6 py-6">
                <Icon className="h-5 w-5 text-emerald-mid" />
                <span className="text-sm font-medium">{label}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Two paths */}
        <section className="mx-auto max-w-7xl px-6 py-24">
          <div className="grid gap-6 md:grid-cols-2">
            {[
              { title: t("for_merchants"), desc: t("for_merchants_desc"), cta: t("cta_become_merchant"), role: "merchant" as const },
              { title: t("for_buyers"), desc: t("for_buyers_desc"), cta: t("cta_become_buyer"), role: "buyer" as const },
            ].map((card) => (
              <div
                key={card.title}
                className="group relative overflow-hidden rounded-2xl border border-border bg-card p-10 shadow-[var(--shadow-card)] transition-transform hover:-translate-y-0.5"
              >
                <h2 className="font-display text-3xl font-semibold tracking-tight">{card.title}</h2>
                <p className="mt-3 max-w-md text-muted-foreground">{card.desc}</p>
                <Button asChild variant="ghost" className="mt-6 px-0 text-emerald-deep hover:bg-transparent">
                  <Link to="/signup" search={{ role: card.role }}>
                    {card.cta} <ArrowRight className="ms-1.5 h-4 w-4" />
                  </Link>
                </Button>
                <div
                  aria-hidden
                  className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full opacity-30 blur-3xl"
                  style={{ background: "var(--gradient-gold)" }}
                />
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-border/60 py-8 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} {t("brand")} · KSA
      </footer>
    </div>
  );
}
