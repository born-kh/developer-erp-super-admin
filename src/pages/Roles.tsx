import { roleCards } from "../data/mock";
import { PageHead } from "../AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function Roles() {
  return (
    <>
      <PageHead title="Роли и права" sub="уровень платформы и компании" />
      <div className="grid grid-cols-2 gap-3.5 max-[860px]:grid-cols-1">
        {roleCards.map((r) => (
          <Card key={r.title}>
            <CardHeader>
              <CardTitle className="text-[13px] font-semibold uppercase tracking-wider text-muted-foreground">
                {r.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground">{r.text}</div>
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
}
