import { Link } from "react-router-dom";
import { income } from "../data/mock";
import { useCompanies } from "../data/companiesStore";
import { useUsers } from "../data/usersStore";
import { usePackages } from "../data/packagesStore";
import { useTariffs } from "../data/tariffsStore";
import { useCityCatalog } from "../data/cityCatalogStore";
import { usd } from "../lib/format";
import { PageHead } from "../AppShell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/EmptyState";

export function Overview() {
  const { companies } = useCompanies();
  const { users } = useUsers();
  const { packages } = usePackages();
  const { tariffs } = useTariffs();
  const { cityCatalog } = useCityCatalog();

  const activeCompanies = companies.filter((c) => c.status === "active").length;
  const activePackages = packages.filter((p) => p.active).length;
  const activeTariffs = tariffs.filter((t) => t.active).length;

  const kpis = [
    { label: "Компании", value: companies.length, hint: `${activeCompanies} активных`, hero: true },
    { label: "Доход", value: usd(income.thisMonth), hint: `Прошлый месяц: ${usd(income.lastMonth)}` },
    { label: "Пользователи", value: users.length, hint: "во всех тенантах" },
    { label: "Пакеты", value: packages.length, hint: `${activePackages} активных` },
    { label: "Тарифы", value: tariffs.length, hint: `${activeTariffs} активных` },
    { label: "Города", value: cityCatalog.length, hint: "во всех регионах" },
  ];

  return (
    <>
      <PageHead title="Обзор платформы" sub="сводка по тенантам" />
      <div className="grid grid-cols-3 gap-3.5 max-[860px]:grid-cols-1">
        {kpis.map((k) => (
          <Card
            key={k.label}
            className={`kpi gap-0 py-4 shadow-sm ${k.hero ? "hero border-0 bg-[var(--navy)] text-[#f4efe6]" : ""}`}
          >
            <CardContent className="px-4.5">
              <div className="label text-[13px] text-muted-foreground">{k.label}</div>
              <div className="value mt-1.5 text-[28px] font-semibold tracking-[-0.04em]">{k.value}</div>
              <div className="hint mt-1.5 text-xs text-muted-foreground">{k.hint}</div>
            </CardContent>
          </Card>
        ))}
      </div>
      {companies.length === 0 && (
        <div className="mt-4">
          <EmptyState
            title="Компаний пока нет — создайте первого тенанта."
            action={
              <Button asChild>
                <Link to="/companies">К компаниям</Link>
              </Button>
            }
          />
        </div>
      )}
    </>
  );
}
