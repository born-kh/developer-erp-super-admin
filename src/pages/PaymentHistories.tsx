import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ChevronDown, ChevronUp, Info } from "lucide-react";
import { toast } from "sonner";
import {
  getSubscriptionPaymentHistory,
  listCompanies,
  listPaymentHistories,
  listTariffsWithPackages,
  ApiRequestError,
  type CompanyListItem,
  type CompanyPaymentHistoryItem,
  type PaymentType,
  type SubscriptionPaymentHistoryItem,
  type SubscriptionPriceLine,
  type TariffIncludingPackages,
} from "../lib/api";
import { formatDate, formatMoney } from "../lib/format";
import { useTranslation } from "../i18n/LanguageContext";
import { useModuleSettings } from "../data/moduleSettingsStore";
import { PageHead } from "../AppShell";
import { AppPagination } from "@/components/AppPagination";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/EmptyState";
import { Field } from "@/components/Field";
import { PaymentStatusBadge } from "@/components/StatusBadge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const DEFAULT_PAGE_SIZE = 10;
const COMPANY_ANY = "any";
const TYPE_ANY = "any";
const PAYMENT_TYPES: PaymentType[] = ["Add", "Withdraw", "Refund"];

type Filters = {
  companyId: string;
  type: PaymentType | "";
  createdFrom: string;
  createdTo: string;
};

const emptyFilters: Filters = {
  companyId: "",
  type: "",
  createdFrom: "",
  createdTo: "",
};

function errorMessage(err: unknown, fallback: string) {
  return err instanceof ApiRequestError ? err.message : fallback;
}

export function PaymentHistories() {
  const { t, language } = useTranslation();
  const { settings } = useModuleSettings();
  const nav = useNavigate();
  const [searchParams] = useSearchParams();
  const initialCompanyId = searchParams.get("companyId") ?? "";

  const [items, setItems] = useState<CompanyPaymentHistoryItem[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [hasPreviousPage, setHasPreviousPage] = useState(false);

  const [tariffs, setTariffs] = useState<TariffIncludingPackages[]>([]);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detail, setDetail] = useState<SubscriptionPaymentHistoryItem | null>(null);

  const [filters, setFilters] = useState<Filters>({ ...emptyFilters, companyId: initialCompanyId });
  const [appliedFilters, setAppliedFilters] = useState<Filters>({ ...emptyFilters, companyId: initialCompanyId });
  const [filtersOpen, setFiltersOpen] = useState(true);

  const [companies, setCompanies] = useState<CompanyListItem[]>([]);
  const [companiesLoaded, setCompaniesLoaded] = useState(false);
  const [companiesLoading, setCompaniesLoading] = useState(false);

  const setFilter = <K extends keyof Filters>(key: K, value: Filters[K]) =>
    setFilters((f) => ({ ...f, [key]: value }));

  const loadCompaniesOnce = () => {
    if (companiesLoaded || companiesLoading) return;
    setCompaniesLoading(true);
    listCompanies({ pageSize: 200 })
      .then((res) => {
        setCompanies(res.items ?? []);
        setCompaniesLoaded(true);
      })
      .catch(() => {})
      .finally(() => setCompaniesLoading(false));
  };

  useEffect(() => {
    if (initialCompanyId) loadCompaniesOnce();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    listTariffsWithPackages({ pageSize: 100 })
      .then((res) => setTariffs(res.items ?? []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const handle = setTimeout(() => {
      setAppliedFilters(filters);
      setPage(1);
    }, 300);
    return () => clearTimeout(handle);
  }, [filters]);

  const fetchItems = async (pageArg: number, pageSizeArg: number, f: Filters) => {
    setLoadingList(true);
    try {
      const res = await listPaymentHistories({
        page: pageArg,
        pageSize: pageSizeArg,
        companyId: f.companyId || undefined,
        type: f.type || undefined,
        createdAtFrom: f.createdFrom ? new Date(f.createdFrom).toISOString() : undefined,
        createdAtTo: f.createdTo ? new Date(f.createdTo).toISOString() : undefined,
      });
      setItems(res.items ?? []);
      setHasNextPage(res.pagination.hasNextPage);
      setHasPreviousPage(res.pagination.hasPreviousPage ?? pageArg > 1);
    } catch (err) {
      toast.error(errorMessage(err, t.paymentHistories.errors.loadList));
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    fetchItems(page, pageSize, appliedFilters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize, appliedFilters]);

  const changePageSize = (size: number) => {
    setPageSize(size);
    setPage(1);
  };

  const changeCompanyId = (v: string) => setFilter("companyId", v === COMPANY_ANY ? "" : v);
  const changeType = (v: string) => setFilter("type", v === TYPE_ANY ? "" : (v as PaymentType));

  const openDetail = (paymentHistoryId: string) => {
    setDetailOpen(true);
    setDetailLoading(true);
    setDetail(null);
    getSubscriptionPaymentHistory(paymentHistoryId)
      .then(setDetail)
      .catch((err) => toast.error(errorMessage(err, t.paymentHistories.errors.loadList)))
      .finally(() => setDetailLoading(false));
  };

  const unitTypeLabel = (type: string) => {
    switch (type) {
      case "Residential":
        return t.tariffs.unitTypeResidential;
      case "Commercial":
        return t.tariffs.unitTypeCommercial;
      case "Parking":
        return t.tariffs.unitTypeParking;
      case "Basement":
        return t.tariffs.unitTypeBasement;
      default:
        return type;
    }
  };

  const groupPriceLines = (lines: SubscriptionPriceLine[] | null | undefined) => {
    const order: string[] = [];
    const map = new Map<string, { active?: SubscriptionPriceLine; completed?: SubscriptionPriceLine }>();
    for (const pl of lines ?? []) {
      if (!map.has(pl.unitType)) {
        order.push(pl.unitType);
        map.set(pl.unitType, {});
      }
      const entry = map.get(pl.unitType)!;
      if (pl.unitStage === "Active") entry.active = pl;
      else entry.completed = pl;
    }
    return order.map((type) => ({ type, ...map.get(type)! }));
  };

  const typeLabel = (type: string) => {
    switch (type) {
      case "Add":
        return t.companyDetail.paymentTypeAdd;
      case "Withdraw":
        return t.companyDetail.paymentTypeWithdraw;
      case "Refund":
        return t.companyDetail.paymentTypeRefund;
      default:
        return type;
    }
  };

  const methodLabel = (method: string) => {
    switch (method) {
      case "Cash":
        return t.companyDetail.paymentMethodCash;
      case "Card":
        return t.companyDetail.paymentMethodCard;
      case "BankTransfer":
        return t.companyDetail.paymentMethodBankTransfer;
      case "Wallet":
        return t.companyDetail.paymentMethodWallet;
      case "Other":
        return t.companyDetail.paymentMethodOther;
      default:
        return method;
    }
  };

  return (
    <>
      <PageHead title={t.paymentHistories.title} onBack={initialCompanyId ? () => nav(-1) : undefined} />

      <Card className="mb-4">
        <CardContent className="grid gap-3">
          <Collapsible open={filtersOpen} onOpenChange={setFiltersOpen}>
            <CollapsibleContent className="grid gap-3">
              <div className="grid grid-cols-4 gap-3 max-[1100px]:grid-cols-2 max-[500px]:grid-cols-1">
                <Field label={t.paymentHistories.filters.company}>
                  <Select
                    value={filters.companyId || COMPANY_ANY}
                    onValueChange={changeCompanyId}
                    onOpenChange={(open) => open && loadCompaniesOnce()}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={t.activityLogs.filters.typeNotSelected} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={COMPANY_ANY}>{t.activityLogs.filters.typeNotSelected}</SelectItem>
                      {companiesLoading ? (
                        <div className="px-3 py-2 text-sm text-muted-foreground">{t.common.loading}</div>
                      ) : (
                        companies.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.name || c.id}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label={t.paymentHistories.filters.type}>
                  <Select value={filters.type || TYPE_ANY} onValueChange={changeType}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={t.activityLogs.filters.typeNotSelected} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={TYPE_ANY}>{t.activityLogs.filters.typeNotSelected}</SelectItem>
                      {PAYMENT_TYPES.map((pt) => (
                        <SelectItem key={pt} value={pt}>
                          {typeLabel(pt)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label={t.activityLogs.filters.periodFrom}>
                  <Input
                    type="datetime-local"
                    value={filters.createdFrom}
                    onChange={(e) => setFilter("createdFrom", e.target.value)}
                  />
                </Field>
                <Field label={t.activityLogs.filters.periodTo}>
                  <Input
                    type="datetime-local"
                    value={filters.createdTo}
                    onChange={(e) => setFilter("createdTo", e.target.value)}
                  />
                </Field>
              </div>
            </CollapsibleContent>
            <div className="mt-3 flex justify-end">
              <CollapsibleTrigger asChild>
                <Button type="button" variant="outline" size="sm">
                  {filtersOpen ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
                  {t.activityLogs.filters.toggle}
                </Button>
              </CollapsibleTrigger>
            </div>
          </Collapsible>
        </CardContent>
      </Card>

      {!loadingList && items.length === 0 ? (
        <EmptyState title={t.paymentHistories.noItemsYet} />
      ) : (
        <Card className="gap-0 overflow-hidden py-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t.paymentHistories.tableCompany}</TableHead>
                <TableHead>{t.companyDetail.paymentAmount}</TableHead>
                <TableHead>{t.companyDetail.paymentType}</TableHead>
                <TableHead>{t.companyDetail.paymentMethod}</TableHead>
                <TableHead>{t.companyDetail.paymentReceiver}</TableHead>
                <TableHead>{t.common.status}</TableHead>
                <TableHead>{t.companyDetail.paymentDate}</TableHead>
                <TableHead className="w-8" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {loadingList ? (
                Array.from({ length: Math.min(pageSize, 10) }, (_, i) => (
                  <TableRow key={i} className="animate-in fade-in duration-300">
                    <TableCell colSpan={8}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                items.map((item) => {
                  const isWithdraw = item.type === "Withdraw";
                  return (
                    <TableRow
                      key={item.id}
                      className={isWithdraw ? "cursor-pointer" : undefined}
                      tabIndex={isWithdraw ? 0 : undefined}
                      onClick={() => isWithdraw && openDetail(item.id)}
                      onKeyDown={(e) => isWithdraw && e.key === "Enter" && openDetail(item.id)}
                    >
                      <TableCell className="font-medium">
                        <Link
                          to={`/companies/${item.companyId}`}
                          className="hover:text-primary hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {item.companyName || "—"}
                        </Link>
                      </TableCell>
                      <TableCell>{formatMoney(item.amount, settings.nationalCurrencyCode)}</TableCell>
                      <TableCell>{typeLabel(item.type)}</TableCell>
                      <TableCell>{item.method ? methodLabel(item.method) : "—"}</TableCell>
                      <TableCell>{item.receiverInfo?.executedBy?.name || "—"}</TableCell>
                      <TableCell><PaymentStatusBadge status={item.status} /></TableCell>
                      <TableCell className="text-muted-foreground">{formatDate(item.operationDateTime, language)}</TableCell>
                      <TableCell className="w-8 text-muted-foreground">{isWithdraw && <Info className="size-4" />}</TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </Card>
      )}

      <AppPagination
        page={page}
        onPage={setPage}
        hasNextPage={hasNextPage}
        hasPreviousPage={hasPreviousPage}
        alwaysShow
        pageSize={pageSize}
        onPageSizeChange={changePageSize}
      />

      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{t.companyDetail.subPaymentHistoryTitle}</DialogTitle>
          </DialogHeader>
          {detailLoading ? (
            <p className="text-sm text-muted-foreground">{t.common.loading}</p>
          ) : detail ? (
            <div className="grid gap-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{t.tariffs.title}</span>
                {tariffs.find((tr) => tr.id === detail.tariffId) ? (
                  <button type="button" className="text-primary hover:underline" onClick={() => nav("/tariffs")}>
                    {tariffs.find((tr) => tr.id === detail.tariffId)?.code}
                  </button>
                ) : (
                  <span>—</span>
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{t.companyDetail.paymentSubscriptionPeriod}</span>
                <span>
                  {formatDate(detail.subscriptionPeriod.startDate, language)} –{" "}
                  {formatDate(detail.subscriptionPeriod.endDate, language)}
                </span>
              </div>
              <div className="rounded-xl border bg-muted/30 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">{t.companyDetail.tariffBaseCost}</span>
                  <span className="text-base font-semibold tabular-nums">
                    {formatMoney(detail.baseCost, settings.subscriptionCurrencyCode)}
                  </span>
                </div>
                {groupPriceLines(detail.priceLines).length > 0 && (
                  <>
                    <div className="mt-4 grid grid-cols-3 gap-2 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
                      <span>{t.tariffs.unitType}</span>
                      <span>{t.common.status}</span>
                      <span className="text-right">{t.companyDetail.paymentAmount}</span>
                    </div>
                    <div className="mt-2 divide-y">
                      {groupPriceLines(detail.priceLines).map(({ type, active, completed }) => (
                        <div key={type} className="grid grid-cols-3 items-center gap-2 py-3">
                          <span className="font-semibold">{unitTypeLabel(type)}</span>
                          <div className="flex flex-col gap-1.5">
                            {active && (
                              <span className="text-muted-foreground whitespace-nowrap">
                                {t.tariffs.unitStageActive} ({active.quantity} ×{" "}
                                {formatMoney(active.unitCost, settings.subscriptionCurrencyCode)})
                              </span>
                            )}
                            {completed && (
                              <span className="text-muted-foreground whitespace-nowrap">
                                {t.tariffs.unitStageCompleted} ({completed.quantity} ×{" "}
                                {formatMoney(completed.unitCost, settings.subscriptionCurrencyCode)})
                              </span>
                            )}
                          </div>
                          <div className="flex flex-col items-end gap-1.5">
                            {active && (
                              <span className="font-semibold tabular-nums">
                                {formatMoney(active.totalCost, settings.subscriptionCurrencyCode)}
                              </span>
                            )}
                            {completed && (
                              <span className="font-semibold tabular-nums">
                                {formatMoney(completed.totalCost, settings.subscriptionCurrencyCode)}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
                <div className="mt-4 flex items-center justify-between border-t pt-3">
                  <span className="text-base font-semibold">{t.companyDetail.totalAmount}</span>
                  <div className="flex items-center gap-2">
                    {detail.discount ? (
                      <span className="text-sm text-muted-foreground line-through">
                        {formatMoney(detail.totalCost, settings.subscriptionCurrencyCode)}
                      </span>
                    ) : null}
                    <span className="text-base font-semibold tabular-nums">
                      {formatMoney(detail.totalCostAfterDiscount, settings.subscriptionCurrencyCode)}
                    </span>
                    {detail.discount ? (
                      <span className="text-sm font-semibold text-[var(--success)]">-{detail.discount}%</span>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}
