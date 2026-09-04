import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const tones = {
  success: "border-transparent bg-[var(--success-bg)] text-[var(--success)]",
  warning: "border-transparent bg-[var(--warning-bg)] text-[var(--warning)]",
  destructive: "border-transparent bg-[var(--destructive-bg)] text-destructive",
  info: "border-transparent bg-[var(--info-bg)] text-[var(--info)]",
} as const;

export type StatusTone = keyof typeof tones;

const companyStatus: Record<string, { tone: StatusTone; label: string }> = {
  active: { tone: "success", label: "Активна" },
  trial: { tone: "warning", label: "Триал" },
  suspended: { tone: "destructive", label: "Приостановлена" },
};

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
  const item = companyStatus[status] ?? { tone: "info" as const, label: status };
  return <StatusBadge tone={item.tone}>{item.label}</StatusBadge>;
}

export function ActiveBadge({ active }: { active: boolean }) {
  return (
    <StatusBadge tone={active ? "success" : "destructive"}>
      {active ? "Активен" : "Отключен"}
    </StatusBadge>
  );
}
