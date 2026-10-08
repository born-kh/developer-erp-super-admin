import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Info } from "lucide-react";
import { toast } from "sonner";
import {
  getCompanyById,
  listCompanySubscriptionPaymentHistories,
  listTariffsWithPackages,
  ApiRequestError,
  type CompanyDetail,
  type SubscriptionPaymentHistoryItem,
  type SubscriptionPriceLine,
  type TariffIncludingPackages,
} from "../lib/api";
import { formatDate, formatMoney } from "../lib/format";
import { useTranslation } from "../i18n/LanguageContext";
import { useModuleSettings } from "../data/moduleSettingsStore";
import { PageHead } from "../AppShell";
import { AppPagination } from "@/components/AppPagination";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const DEFAULT_PAGE_SIZE = 10;

function errorMessage(err: unknown, fallback: string) {
  return err instanceof ApiRequestError ? err.message : fallback;
}

export function CompanySubscriptionPayments() {
  const { id } = useParams<{ id: string }>();
  const nav = useNavigate();
  const { t, language } = useTranslation();
  const { settings } = useModuleSettings();

  const [company, setCompany] = useState<CompanyDetail | null>(null);
  const [tariffs, setTariffs] = useState<TariffIncludingPackages[]>([]);
  const [items, setItems] = useState<SubscriptionPaymentHistoryItem[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [page, setPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [hasPreviousPage, setHasPreviousPage] = useState(false);
  const [detail, setDetail] = useState<SubscriptionPaymentHistoryItem | null>(null);

  useEffect(() => {
    if (!id) return;
    getCompanyById(id)
      .then(setCompany)
      .catch(() => {});
    listTariffsWithPackages({ pageSize: 100 })
      .then((res) => setTariffs(res.items ?? []))
      .catch(() => {});
  }, [id]);

  useEffect(() => {
    if (!id) return;
    setLoadingList(true);
    listCompanySubscriptionPaymentHistories(id, { page, pageSize: DEFAULT_PAGE_SIZE })
      .then((res) => {
        setItems(res.items ?? []);
        setHasNextPage(res.pagination.hasNextPage);
        setHasPreviousPage(res.pagination.hasPreviousPage ?? page > 1);
      })
      .catch((err) => toast.error(errorMessage(err, t.companyDetail.errors.loadPaymentHistory)))
      .finally(() => setLoadingList(false));
  }, [id, page, t.companyDetail.errors.loadPaymentHistory]);

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

  return (
    <>
      <PageHead
        title={t.companyDetail.subPaymentHistoryTitle}
        sub={company?.name ?? undefined}
        onBack={() => nav(`/companies/${id}`)}
      />

      {!loadingList && items.length === 0 ? (
        <EmptyState title={t.companyDetail.noPaymentHistory} />
      ) : (
        <Card className="gap-0 overflow-hidden py-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t.tariffs.title}</TableHead>
                <TableHead>{t.companyDetail.paymentSubscriptionPeriod}</TableHead>
                <TableHead>{t.companyDetail.discount}</TableHead>
                <TableHead>{t.companyDetail.paymentAmount}</TableHead>
                <TableHead>{t.companyDetail.paymentDate}</TableHead>
                <TableHead className="w-8" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {loadingList ? (
                Array.from({ length: DEFAULT_PAGE_SIZE }, (_, i) => (
                  <TableRow key={i} className="animate-in fade-in duration-300">
                    <TableCell colSpan={6}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                items.map((sp) => (
                  <TableRow
                    key={sp.id}
                    className="cursor-pointer"
                    tabIndex={0}
                    onClick={() => setDetail(sp)}
                    onKeyDown={(e) => e.key === "Enter" && setDetail(sp)}
                  >
                    <TableCell className="font-medium">
                      {tariffs.find((tr) => tr.id === sp.tariffId) ? (
                        <button
                          type="button"
                          className="text-primary hover:underline"
                          onClick={(e) => {
                            e.stopPropagation();
                            nav("/tariffs");
                          }}
                        >
                          {tariffs.find((tr) => tr.id === sp.tariffId)?.code}
                        </button>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(sp.subscriptionPeriod.startDate, language)} –{" "}
                      {formatDate(sp.subscriptionPeriod.endDate, language)}
                    </TableCell>
                    <TableCell>{sp.discount ? `-${sp.discount}%` : "—"}</TableCell>
                    <TableCell>
                      {formatMoney(sp.totalCostAfterDiscount, settings.subscriptionCurrencyCode)}
                      {sp.discount ? (
                        <span className="ml-1 text-xs text-muted-foreground line-through">
                          {formatMoney(sp.totalCost, settings.subscriptionCurrencyCode)}
                        </span>
                      ) : null}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{formatDate(sp.createdAt, language)}</TableCell>
                    <TableCell className="w-8 text-muted-foreground">
                      <Info className="size-4" />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>
      )}

      <AppPagination page={page} onPage={setPage} hasNextPage={hasNextPage} hasPreviousPage={hasPreviousPage} alwaysShow />

      <Dialog open={Boolean(detail)} onOpenChange={(open) => !open && setDetail(null)}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{t.companyDetail.subPaymentHistoryTitle}</DialogTitle>
          </DialogHeader>
          {detail && (
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
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
