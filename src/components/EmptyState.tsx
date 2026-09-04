import type { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";

export function EmptyState({
  title,
  action,
}: {
  title: string;
  action?: ReactNode;
}) {
  return (
    <Card>
      <CardContent className="flex flex-col items-start gap-3 py-2">
        <p className="text-sm text-muted-foreground">{title}</p>
        {action}
      </CardContent>
    </Card>
  );
}
