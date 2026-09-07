import { useEffect, useState, type ReactNode } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  Boxes,
  Building2,
  CreditCard,
  LayoutDashboard,
  LogOut,
  MapPin,
  Users,
} from "lucide-react";
import { clearTokens } from "./auth";
import { useCurrentUser } from "./data/currentUserStore";
import { initials } from "./lib/format";
import { useTranslation } from "./i18n/LanguageContext";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
} from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";

export function AppShell() {
  const nav = useNavigate();
  const loc = useLocation();
  const [more, setMore] = useState(false);
  const { user, clear: clearCurrentUser } = useCurrentUser();
  const { t } = useTranslation();

  const links = [
    { to: "/", label: t.nav.overview, icon: LayoutDashboard },
    { to: "/companies", label: t.nav.companies, icon: Building2 },
    { to: "/tariffs", label: t.nav.tariffs, icon: CreditCard },
    { to: "/packages", label: t.nav.packages, icon: Boxes },
    { to: "/users", label: t.nav.users, icon: Users },
    { to: "/cities", label: t.nav.cities, icon: MapPin },
  ];

  const titles: Record<string, string> = {
    "/": t.nav.overview,
    "/companies": t.nav.companies,
    "/tariffs": t.nav.tariffs,
    "/packages": t.nav.packages,
    "/users": t.nav.users,
    "/cities": t.nav.cities,
  };

  const currentTitle = (pathname: string) => {
    if (pathname.startsWith("/companies/")) return t.titles.companyDetail;
    if (pathname.startsWith("/packages/")) return t.titles.packageDetail;
    return titles[pathname] ?? t.titles.dashboard;
  };

  useEffect(() => {
    setMore(false);
  }, [loc.pathname]);

  const logout = () => {
    clearTokens();
    clearCurrentUser();
    nav("/login");
  };

  return (
    <TooltipProvider delayDuration={0}>
      <SidebarProvider>
        <Sidebar collapsible="none" className="hidden h-svh sticky top-0 min-[861px]:flex border-r border-sidebar-border">
          <SidebarHeader className="px-3 pt-4 pb-3">
            <div className="flex items-center gap-2.5 px-1">
              <span className="grid size-8 place-items-center rounded-md bg-sidebar-primary text-[11px] font-bold text-sidebar-primary-foreground">
                SA
              </span>
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold text-sidebar-foreground">Developer ERP</div>
                <div className="text-[11px] text-sidebar-foreground/50">Super Admin</div>
              </div>
            </div>
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel className="px-3 text-[11px] uppercase tracking-wider text-sidebar-foreground/40">
                {t.nav.group}
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {links.map((l) => (
                    <SidebarMenuItem key={l.to}>
                      <SidebarMenuButton asChild isActive={l.to === "/" ? loc.pathname === "/" : loc.pathname.startsWith(l.to)}>
                        <NavLink to={l.to} end={l.to === "/"}>
                          <l.icon />
                          <span>{l.label}</span>
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
          <SidebarFooter className="px-2 pb-4">
            <ThemeToggle className="text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground" />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="w-full justify-start text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              onClick={logout}
            >
              <LogOut />
              {t.sidebar.logout}
            </Button>
          </SidebarFooter>
        </Sidebar>
        <SidebarInset className="min-w-0 bg-background">
          <header className="sticky top-0 z-10 flex h-12 items-center justify-between border-b bg-card px-6 max-[860px]:px-3">
            <span className="text-sm font-medium">{currentTitle(loc.pathname)}</span>
            <div className="flex items-center gap-2">
              <LanguageSwitcher />
              <span className="text-xs font-medium text-foreground max-[500px]:hidden">
                {user?.fullName || user?.email || ""}
              </span>
              <Avatar size="sm">
                {user?.avatarUrl && <AvatarImage src={user.avatarUrl} alt={user.fullName ?? ""} />}
                <AvatarFallback>{user?.fullName ? initials(user.fullName) : "?"}</AvatarFallback>
              </Avatar>
            </div>
          </header>
          <div className="main-pad">
            <Outlet />
          </div>
        </SidebarInset>
        <nav className="bottom-nav">
          <NavLink to="/" end>
            {t.nav.overview}
          </NavLink>
          <NavLink to="/companies">{t.nav.companies}</NavLink>
          <NavLink to="/packages">{t.nav.packages}</NavLink>
          <button type="button" className={more ? "active" : ""} onClick={() => setMore(true)}>
            {t.bottomNav.more}
          </button>
        </nav>
        <Sheet open={more} onOpenChange={setMore}>
          <SheetContent side="bottom" className="rounded-t-2xl pb-[calc(1rem+env(safe-area-inset-bottom))]">
            <SheetHeader>
              <SheetTitle>{t.bottomNav.allSections}</SheetTitle>
            </SheetHeader>
            <nav className="flex flex-col gap-1 px-4 pb-4">
              {links.map((l) => (
                <NavLink
                  key={l.to}
                  to={l.to}
                  end={l.to === "/"}
                  className={({ isActive }) =>
                    `flex items-center gap-2 rounded-md px-3 py-3 font-medium ${
                      isActive ? "bg-muted text-foreground" : "text-muted-foreground"
                    }`
                  }
                >
                  <l.icon className="size-4" />
                  {l.label}
                </NavLink>
              ))}
              <Separator className="my-2" />
              <ThemeToggle className="text-foreground" />
              <LanguageSwitcher className="w-full justify-between" />
              <Button type="button" variant="outline" className="mt-1 w-full" onClick={logout}>
                {t.sidebar.logout}
              </Button>
            </nav>
          </SheetContent>
        </Sheet>
      </SidebarProvider>
    </TooltipProvider>
  );
}

export function PageHead({
  title,
  sub,
  actions,
  onBack,
}: {
  title: string;
  sub?: string;
  actions?: ReactNode;
  onBack?: () => void;
}) {
  const { t } = useTranslation();
  return (
    <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
      <div>
        <div className="flex items-center gap-2.5">
          {onBack && (
            <Button type="button" variant="outline" size="sm" onClick={onBack} aria-label={t.common.back}>
              ← {t.common.back}
            </Button>
          )}
          <h1 className="m-0 text-xl font-semibold tracking-tight max-[860px]:text-lg">{title}</h1>
        </div>
        {sub && <p className="mt-1 mb-0 text-sm text-muted-foreground">{sub}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
