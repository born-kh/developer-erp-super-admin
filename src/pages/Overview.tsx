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
import { CompanyStatusBadge } from "@/components/StatusBadge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export function Overview() {
  const { companies } = useCompanies();
  const { users } = useUsers();
  const { packages } = usePackages();
  const { tariffs } = useTariffs();
  const { cityCatalog } = useCityCatalog();

  const activeCompanies = companies.filter((c) => c.status === "active").length;
  const activePackages = packages.filter((p) => p.active).length;
  const activeTariffs = tariffs.filter((t) => t.active).length;
  const recent = [...companies]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 6);

  const kpis = [
    { label: "Компании", value: companies.length, hint: `${activeCompanies} активных` },
    { label: "Доход / мес", value: usd(income.thisMonth), hint: `прошлый: ${usd(income.lastMonth)}` },
    { label: "Пользователи", value: users.length, hint: "во всех тенантах" },
    { label: "Пакеты", value: packages.length, hint: `${activePackages} активных` },
    { label: "Тарифы", value: tariffs.length, hint: `${activeTariffs} активных` },
    { label: "Города", value: cityCatalog.length, hint: "каталог" },
  ];

  return (
    <>
      <PageHead title="Обзор платформы" />
      <div className="grid grid-cols-6 gap-3 max-[1200px]:grid-cols-3 max-[860px]:grid-cols-2">
        {kpis.map((k) => (
          <Card key={k.label} className="kpi gap-0 py-3">
            <CardContent className="px-4">
              <div className="text-xs text-muted-foreground">{k.label}</div>
              <div className="value mt-1 text-[22px] font-semibold tracking-tight">{k.value}</div>
              <div className="mt-1 text-[11px] text-muted-foreground">{k.hint}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="mt-4 gap-0 overflow-hidden py-0">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h3 className="m-0 text-sm font-semibold">Последние компании</h3>
          <Button asChild variant="ghost" size="sm">
            <Link to="/companies">Все</Link>
          </Button>
        </div>
        {recent.length === 0 ? (
          <p className="px-4 py-6 text-sm text-muted-foreground">
            Компаний пока нет.{" "}
            <Link to="/companies" className="font-medium text-primary underline-offset-4 hover:underline">
              Создать тенанта
            </Link>
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Название</TableHead>
                <TableHead>Город</TableHead>
                <TableHead>Статус</TableHead>
                <TableHead>Создана</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recent.map((c) => (
                <TableRow key={c.id} className="cursor-pointer">
                  <TableCell className="font-medium">
                    <Link to={`/companies/${c.id}`} className="hover:text-primary">
                      {c.name}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{c.city}</TableCell>
                  <TableCell>
                    <CompanyStatusBadge status={c.status} />
                  </TableCell>
                  <TableCell className="text-muted-foreground tabular-nums">{c.createdAt}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </>
  );
}
