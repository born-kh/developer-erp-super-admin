import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/i18n/LanguageContext";
import type { UserType } from "@/lib/api";

const tones = {
  success: "border-transparent bg-[var(--success-bg)] text-[var(--success)]",
  warning: "border-transparent bg-[var(--warning-bg)] text-[var(--warning)]",
  destructive: "border-transparent bg-[var(--destructive-bg)] text-destructive",
  info: "border-transparent bg-[var(--info-bg)] text-[var(--info)]",
} as const;

export type StatusTone = keyof typeof tones;

export function StatusBadge({
  tone,
  children,
  className,
}: {
  tone: StatusTone;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Badge className={cn(tones[tone], className)}>
      {children}
    </Badge>
  );
}

export function CompanyStatusBadge({ status }: { status: string }) {
  const { t } = useTranslation();
  const companyStatus: Record<string, { tone: StatusTone; label: string }> = {
    active: { tone: "success", label: t.common.statusActive },
    trial: { tone: "warning", label: t.common.statusTrial },
    suspended: { tone: "destructive", label: t.common.statusSuspended },
  };
  const item = companyStatus[status.toLowerCase()] ?? { tone: "info" as const, label: status || "—" };
  return <StatusBadge tone={item.tone}>{item.label}</StatusBadge>;
}

export function ActiveBadge({ active }: { active: boolean }) {
  const { t } = useTranslation();
  return (
    <StatusBadge tone={active ? "success" : "destructive"}>
      {active ? t.common.active : t.common.disabled}
    </StatusBadge>
  );
}

export function UserTypeBadge({ type, className }: { type: UserType; className?: string }) {
  const { t } = useTranslation();
  const userTypes: Record<UserType, { tone: StatusTone; label: string }> = {
    SuperAdmin: { tone: "destructive", label: t.users.typeSuperAdmin },
    Admin: { tone: "info", label: t.users.typeAdmin },
    Owner: { tone: "warning", label: t.users.typeOwner },
    Worker: { tone: "success", label: t.users.typeWorker },
    Client: { tone: "info", label: t.users.typeClient },
    Unknown: { tone: "info", label: type },
  };
  const item = userTypes[type];
  return (
    <StatusBadge tone={item.tone} className={className}>
      {item.label}
    </StatusBadge>
  );
}
