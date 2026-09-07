import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { income } from "../data/mock";
import { useCompanies } from "../data/companiesStore";
import { useUsers } from "../data/usersStore";
import { useCityCatalog } from "../data/cityCatalogStore";
import { listPackages, listTariffs } from "../lib/api";
import { usd } from "../lib/format";
import { useTranslation } from "../i18n/LanguageContext";
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
  const { t } = useTranslation();
  const { companies } = useCompanies();
  const { users } = useUsers();
  const { cityCatalog } = useCityCatalog();
  const [packageStats, setPackageStats] = useState({ total: 0, active: 0 });
  const [tariffStats, setTariffStats] = useState({ total: 0, active: 0 });

  useEffect(() => {
    listPackages({ pageSize: 100 })
      .then((res) => {
        const items = res.items ?? [];
        setPackageStats({ total: items.length, active: items.filter((p) => p.isActive).length });
      })
      .catch(() => {});
    listTariffs({ pageSize: 100 })
      .then((res) => {
        const items = res.items ?? [];
        setTariffStats({ total: items.length, active: items.filter((t) => t.isActive).length });
      })
      .catch(() => {});
  }, []);

  const activeCompanies = companies.filter((c) => c.status === "active").length;
  const recent = [...companies]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 6);

  const kpis = [
    { label: t.nav.companies, value: companies.length, hint: `${activeCompanies} ${t.overview.activeSuffix}` },
    { label: t.overview.incomeMonth, value: usd(income.thisMonth), hint: `${t.overview.lastMonthPrefix} ${usd(income.lastMonth)}` },
    { label: t.overview.users, value: users.length, hint: t.overview.allTenants },
    { label: t.nav.packages, value: packageStats.total, hint: `${packageStats.active} ${t.overview.activeSuffix}` },
    { label: t.nav.tariffs, value: tariffStats.total, hint: `${tariffStats.active} ${t.overview.activeSuffix}` },
    { label: t.nav.cities, value: cityCatalog.length, hint: t.overview.catalog },
  ];

  return (
    <>
      <PageHead title={t.overview.title} />
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
          <h3 className="m-0 text-sm font-semibold">{t.overview.recentCompanies}</h3>
          <Button asChild variant="ghost" size="sm">
            <Link to="/companies">{t.overview.viewAll}</Link>
          </Button>
        </div>
        {recent.length === 0 ? (
          <p className="px-4 py-6 text-sm text-muted-foreground">
            {t.overview.noCompanies}{" "}
            <Link to="/companies" className="font-medium text-primary underline-offset-4 hover:underline">
              {t.overview.createTenant}
            </Link>
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t.common.name}</TableHead>
                <TableHead>{t.common.city}</TableHead>
                <TableHead>{t.common.status}</TableHead>
                <TableHead>{t.common.created}</TableHead>
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
