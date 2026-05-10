import { Link, useNavigate } from "@tanstack/react-router";
import { Globe, LogOut } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";

export function SiteHeader() {
  const { t, lang, setLang } = useI18n();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <Link to="/" className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-md bg-[var(--gradient-prestige)] text-gold shadow-[var(--shadow-card)]">
            <span className="font-display text-lg font-bold">Y</span>
          </span>
          <span className="font-display text-xl font-semibold tracking-tight">
            {t("brand")}
          </span>
        </Link>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setLang(lang === "en" ? "ar" : "en")}
            className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label="Toggle language"
          >
            <Globe className="h-4 w-4" />
            {lang === "en" ? "العربية" : "English"}
          </button>
          {user ? (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link to="/dashboard">{t("nav_dashboard")}</Link>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  await signOut();
                  navigate({ to: "/" });
                }}
              >
                <LogOut className="h-4 w-4 me-1.5" />
                {t("nav_logout")}
              </Button>
            </>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link to="/login">{t("nav_login")}</Link>
              </Button>
              <Button asChild size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">
                <Link to="/signup">{t("nav_signup")}</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}