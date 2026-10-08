import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useCityCatalog } from "../data/cityCatalogStore";
import { useModuleSettings } from "../data/moduleSettingsStore";
import {
  getAllCitiesCached,
  listCompanies,
  listPackages,
  listPaymentHistories,
  listTariffs,
  listTopUpRequests,
  listUsers,
  type CityListItem,
  type CompanyListItem,
} from "../lib/api";
import { formatMoney } from "../lib/format";
import { useTranslation } from "../i18n/LanguageContext";
import { PageHead } from "../AppShell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CompanyPhoto } from "@/components/CompanyPhoto";
import { CompanyStatusBadge } from "@/components/StatusBadge";

function monthRange(monthOffset: number) {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1);
  const end = new Date(now.getFullYear(), now.getMonth() + monthOffset + 1, 1);
  return { start, end };
}

async function sumAddPayments(from: Date, to: Date): Promise<number> {
  let total = 0;
  let page = 1;
  for (;;) {
    const res = await listPaymentHistories({
      type: "Add",
      createdAtFrom: from.toISOString(),
      createdAtTo: to.toISOString(),
      page,
      pageSize: 200,
    });
    for (const item of res.items ?? []) total += item.amount;
    if (!res.pagination.hasNextPage) break;
    page += 1;
  }
  return total;
}

async function countPendingTopUps(): Promise<number> {
  let count = 0;
  let page = 1;
  for (;;) {
    const res = await listTopUpRequests({ page, pageSize: 200 });
    for (const item of res.items ?? []) if (item.status === "Pending") count += 1;
    if (!res.pagination.hasNextPage) break;
    page += 1;
  }
  return count;
}

export function Overview() {
  const { t } = useTranslation();
  const { cityCatalog } = useCityCatalog();
  const { settings } = useModuleSettings();
  const [companies, setCompanies] = useState<CompanyListItem[]>([]);
  const [cities, setCities] = useState<CityListItem[]>([]);
  const [packageStats, setPackageStats] = useState({ total: 0, active: 0 });
  const [tariffStats, setTariffStats] = useState({ total: 0, active: 0 });
  const [userCount, setUserCount] = useState(0);
  const [income, setIncome] = useState({ thisMonth: 0, lastMonth: 0 });
  const [pendingTopUps, setPendingTopUps] = useState(0);

  useEffect(() => {
    listCompanies({ pageSize: 200, orderBy: "CreatedAt", orderDirection: "desc" })
      .then((res) => setCompanies(res.items ?? []))
      .catch(() => {});
    getAllCitiesCached()
      .then(setCities)
      .catch(() => {});
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
    listUsers({ pageSize: 100 })
      .then((res) => setUserCount((res.items ?? []).length))
      .catch(() => {});
    const thisMonth = monthRange(0);
    const lastMonth = monthRange(-1);
    Promise.all([
      sumAddPayments(thisMonth.start, thisMonth.end),
      sumAddPayments(lastMonth.start, lastMonth.end),
    ])
      .then(([thisMonthTotal, lastMonthTotal]) => setIncome({ thisMonth: thisMonthTotal, lastMonth: lastMonthTotal }))
      .catch(() => {});
    countPendingTopUps()
      .then(setPendingTopUps)
      .catch(() => {});
  }, []);

  const cityName = (id?: string | null) => (id && cities.find((c) => c.id === id)?.name) || "—";
  const activeCompanies = companies.filter((c) => (c.status ?? "").toLowerCase() === "active").length;
  const recent = companies.slice(0, 6);

  const kpis: { label: string; value: string | number; hint: string; href?: string }[] = [
    { label: t.nav.companies, value: companies.length, hint: `${activeCompanies} ${t.overview.activeSuffix}` },
    {
      label: t.overview.incomeMonth,
      value: formatMoney(income.thisMonth, settings.nationalCurrencyCode),
      hint: `${t.overview.lastMonthPrefix} ${formatMoney(income.lastMonth, settings.nationalCurrencyCode)}`,
    },
    { label: t.overview.users, value: userCount, hint: t.overview.allTenants },
    { label: t.nav.packages, value: packageStats.total, hint: `${packageStats.active} ${t.overview.activeSuffix}` },
    { label: t.nav.tariffs, value: tariffStats.total, hint: `${tariffStats.active} ${t.overview.activeSuffix}` },
    { label: t.nav.cities, value: cityCatalog.length, hint: t.overview.catalog },
    { label: t.overview.pendingTopUps, value: pendingTopUps, hint: t.overview.pendingTopUpsHint, href: "/top-up-requests" },
  ];

  const renderKpi = (k: (typeof kpis)[number]) => {
    const card = (
      <Card className={`kpi gap-0 py-3 ${k.href ? "h-full transition-colors hover:border-primary/40" : ""}`}>
        <CardContent className="px-4">
          <div className="text-xs text-muted-foreground">{k.label}</div>
          <div className="value mt-1 text-[22px] font-semibold tracking-tight">{k.value}</div>
          <div className="mt-1 text-[11px] text-muted-foreground">{k.hint}</div>
        </CardContent>
      </Card>
    );
    return k.href ? (
      <Link key={k.label} to={k.href} className="block">
        {card}
      </Link>
    ) : (
      <div key={k.label}>{card}</div>
    );
  };

  const kpiRow1 = kpis.slice(0, 4);
  const kpiRow2 = kpis.slice(4);

  return (
    <>
      <PageHead title={t.overview.title} />
      <div className="grid grid-cols-4 gap-3 max-[1100px]:grid-cols-2 max-[500px]:grid-cols-1">
        {kpiRow1.map(renderKpi)}
      </div>
      <div className="mt-3 grid grid-cols-3 gap-3 max-[1100px]:grid-cols-2 max-[500px]:grid-cols-1">
        {kpiRow2.map(renderKpi)}
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
          <div className="divide-y">
            {recent.map((c) => (
              <Link
                key={c.id}
                to={`/companies/${c.id}`}
                className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/40"
              >
                <div className="size-9 shrink-0 overflow-hidden rounded-full">
                  <CompanyPhoto photoName={c.photoName} alt={c.name ?? ""} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">{c.name || "—"}</div>
                  <div className="truncate text-xs text-muted-foreground">{cityName(c.cityId)}</div>
                </div>
                <CompanyStatusBadge status={c.status ?? ""} />
              </Link>
            ))}
          </div>
        )}
      </Card>
    </>
  );
}
