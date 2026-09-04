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
import { AUTH_KEY } from "./auth";
import { ThemeToggle } from "@/components/ThemeToggle";
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

const links = [
  { to: "/", label: "Обзор", icon: LayoutDashboard },
  { to: "/companies", label: "Компании", icon: Building2 },
  { to: "/tariffs", label: "Тарифы", icon: CreditCard },
  { to: "/packages", label: "Пакеты", icon: Boxes },
  { to: "/users", label: "Пользователи", icon: Users },
  { to: "/cities", label: "Города", icon: MapPin },
];

export function AppShell() {
  const nav = useNavigate();
  const loc = useLocation();
  const [more, setMore] = useState(false);

  useEffect(() => {
    setMore(false);
  }, [loc.pathname]);

  const logout = () => {
    localStorage.removeItem(AUTH_KEY);
    nav("/login");
  };

  return (
    <TooltipProvider delayDuration={0}>
      <SidebarProvider>
        <Sidebar collapsible="none" className="hidden h-svh sticky top-0 min-[861px]:flex border-r-0">
          <SidebarHeader className="px-3 pt-4 pb-2">
            <div className="flex flex-col gap-0.5 px-1">
              <strong className="font-serif text-2xl font-normal text-sidebar-foreground">
                Developer ERP
              </strong>
              <i className="text-[13px] text-sidebar-primary italic">Super Admin</i>
            </div>
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel className="px-3 text-[10px] tracking-[0.14em] uppercase text-sidebar-foreground/40">
                Платформа
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
            <p className="px-2 text-xs text-sidebar-foreground/55">Управление тенантами</p>
            <ThemeToggle />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="w-full justify-start text-sidebar-foreground/70 hover:text-sidebar-accent-foreground"
              onClick={logout}
            >
              <LogOut />
              Выйти
            </Button>
          </SidebarFooter>
        </Sidebar>
        <SidebarInset className="min-w-0 bg-background">
          <div className="main-pad">
            <Outlet />
          </div>
        </SidebarInset>
        <nav className="bottom-nav">
          <NavLink to="/" end>
            Обзор
          </NavLink>
          <NavLink to="/companies">Компании</NavLink>
          <NavLink to="/packages">Пакеты</NavLink>
          <button type="button" className={more ? "active" : ""} onClick={() => setMore(true)}>
            Ещё
          </button>
        </nav>
        <Sheet open={more} onOpenChange={setMore}>
          <SheetContent side="bottom" className="rounded-t-2xl pb-[calc(1rem+env(safe-area-inset-bottom))]">
            <SheetHeader>
              <SheetTitle>Все разделы</SheetTitle>
            </SheetHeader>
            <nav className="flex flex-col gap-1 px-4 pb-4">
              {links.map((l) => (
                <NavLink
                  key={l.to}
                  to={l.to}
                  end={l.to === "/"}
                  className={({ isActive }) =>
                    `flex items-center gap-2 rounded-xl px-3 py-3 font-semibold ${
                      isActive ? "bg-sidebar text-sidebar-primary" : "bg-background"
                    }`
                  }
                >
                  <l.icon className="size-4" />
                  {l.label}
                </NavLink>
              ))}
              <Separator className="my-2" />
              <ThemeToggle className="text-foreground" />
              <Button type="button" variant="outline" className="mt-1 w-full" onClick={logout}>
                Выйти
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
  return (
    <div className="mb-5.5 flex flex-wrap items-start justify-between gap-4">
      <div>
        <div className="flex items-center gap-2.5">
          {onBack && (
            <Button type="button" variant="outline" size="sm" onClick={onBack} aria-label="Назад">
              ← Назад
            </Button>
          )}
          <h1 className="m-0 text-[28px] font-semibold tracking-[-0.03em] max-[860px]:text-[22px]">{title}</h1>
        </div>
        <p className="mt-1 mb-0 text-sm text-muted-foreground">
          Super Admin · управление платформой{sub ? ` · ${sub}` : ""}
        </p>
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
