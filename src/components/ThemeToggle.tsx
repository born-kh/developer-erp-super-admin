import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/i18n/LanguageContext";

export function ThemeToggle({ className, iconOnly }: { className?: string; iconOnly?: boolean }) {
  const { theme, setTheme } = useTheme();
  const { t } = useTranslation();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (iconOnly) {
    const isDark = mounted && theme === "dark";
    return (
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className={cn("text-foreground", className)}
        aria-label={isDark ? t.sidebar.lightTheme : t.sidebar.darkTheme}
        disabled={!mounted}
        onClick={() => setTheme(isDark ? "light" : "dark")}
      >
        {isDark ? <Sun /> : <Moon />}
      </Button>
    );
  }

  if (!mounted) {
    return (
      <Button variant="ghost" size="sm" className={cn("w-full justify-start", className ?? "text-sidebar-foreground/70")} disabled>
        <Sun />
        {t.sidebar.lightTheme}
      </Button>
    );
  }

  const isDark = theme === "dark";

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className={cn(
        "w-full justify-start",
        className ?? "text-sidebar-foreground/80 hover:text-sidebar-accent-foreground",
      )}
      onClick={() => setTheme(isDark ? "light" : "dark")}
    >
      {isDark ? <Sun /> : <Moon />}
      {isDark ? t.sidebar.lightTheme : t.sidebar.darkTheme}
    </Button>
  );
}
