import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronDown, ChevronRight, ChevronUp } from "lucide-react";
import { toast } from "sonner";
import {
  confirmTopUpRequest,
  listCompanies,
  listTopUpRequests,
  rejectTopUpRequest,
  ApiRequestError,
  type CompanyListItem,
  type CompanyPaymentHistoryItem,
} from "../lib/api";
import { formatDateTime, formatMoney } from "../lib/format";
import { useTranslation } from "../i18n/LanguageContext";
import { useModuleSettings } from "../data/moduleSettingsStore";
import { useFileUrl } from "../hooks/useFileUrl";
import { PageHead } from "../AppShell";
import { AppPagination } from "@/components/AppPagination";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { PaymentStatusBadge } from "@/components/StatusBadge";
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
import { Textarea } from "@/components/ui/textarea";

const DEFAULT_PAGE_SIZE = 10;
const COMPANY_ANY = "any";

type Filters = {
  companyId: string;
  createdFrom: string;
  createdTo: string;
};

const emptyFilters: Filters = { companyId: "", createdFrom: "", createdTo: "" };

function errorMessage(err: unknown, fallback: string) {
  return err instanceof ApiRequestError ? err.message : fallback;
}

export function TopUpRequests() {
  const { t, language } = useTranslation();
  const { settings } = useModuleSettings();

  const [items, setItems] = useState<CompanyPaymentHistoryItem[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [hasPreviousPage, setHasPreviousPage] = useState(false);

  const [filters, setFilters] = useState<Filters>(emptyFilters);
  const [appliedFilters, setAppliedFilters] = useState<Filters>(emptyFilters);
  const [filtersOpen, setFiltersOpen] = useState(true);

  const [companies, setCompanies] = useState<CompanyListItem[]>([]);
  const [companiesLoaded, setCompaniesLoaded] = useState(false);
  const [companiesLoading, setCompaniesLoading] = useState(false);

  const [receiptItem, setReceiptItem] = useState<CompanyPaymentHistoryItem | null>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [confirmItem, setConfirmItem] = useState<CompanyPaymentHistoryItem | null>(null);
  const [rejectItem, setRejectItem] = useState<CompanyPaymentHistoryItem | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [rejecting, setRejecting] = useState(false);

  const receiptUrl = useFileUrl(receiptItem?.receiptPhotoName);

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
    const handle = setTimeout(() => {
      setAppliedFilters(filters);
      setPage(1);
    }, 300);
    return () => clearTimeout(handle);
  }, [filters]);

  const fetchItems = async (pageArg: number, pageSizeArg: number, f: Filters) => {
    setLoadingList(true);
    try {
      const res = await listTopUpRequests({
        page: pageArg,
        pageSize: pageSizeArg,
        companyId: f.companyId || undefined,
        createdAtFrom: f.createdFrom ? new Date(f.createdFrom).toISOString() : undefined,
        createdAtTo: f.createdTo ? new Date(f.createdTo).toISOString() : undefined,
      });
      setItems(res.items ?? []);
      setHasNextPage(res.pagination.hasNextPage);
      setHasPreviousPage(res.pagination.hasPreviousPage ?? pageArg > 1);
    } catch (err) {
      toast.error(errorMessage(err, t.topUpRequests.errors.loadList));
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

  const handleConfirm = async (item: CompanyPaymentHistoryItem) => {
    setConfirmingId(item.id);
    try {
      await confirmTopUpRequest(item.id);
      toast.success(t.companyDetail.toasts.topUpConfirmed);
      setConfirmItem(null);
      setReceiptItem(null);
      fetchItems(page, pageSize, appliedFilters);
    } catch (err) {
      toast.error(errorMessage(err, t.companyDetail.errors.confirmTopUp));
    } finally {
      setConfirmingId(null);
    }
  };

  const openReject = (item: CompanyPaymentHistoryItem) => {
    setRejectItem(item);
    setRejectReason("");
  };

  const handleReject = async () => {
    if (!rejectItem) return;
    setRejecting(true);
    try {
      await rejectTopUpRequest(rejectItem.id, rejectReason.trim() || null);
      toast.success(t.companyDetail.toasts.topUpRejected);
      setRejectItem(null);
      setReceiptItem(null);
      fetchItems(page, pageSize, appliedFilters);
    } catch (err) {
      toast.error(errorMessage(err, t.companyDetail.errors.rejectTopUp));
    } finally {
      setRejecting(false);
    }
  };

  return (
    <>
      <PageHead title={t.topUpRequests.title} />

      <Card className="mb-4">
        <CardContent className="grid gap-3">
          <Collapsible open={filtersOpen} onOpenChange={setFiltersOpen}>
            <CollapsibleContent className="grid gap-3">
              <div className="grid grid-cols-3 gap-3 max-[900px]:grid-cols-2 max-[500px]:grid-cols-1">
                <Field label={t.topUpRequests.filters.company}>
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
        <EmptyState title={t.topUpRequests.noItemsYet} />
      ) : (
        <Card className="gap-0 overflow-hidden py-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t.topUpRequests.tableCompany}</TableHead>
                <TableHead>{t.companyDetail.paymentRequester}</TableHead>
                <TableHead>{t.companyDetail.paymentAmount}</TableHead>
                <TableHead>{t.companyDetail.paymentMethod}</TableHead>
                <TableHead>{t.common.status}</TableHead>
                <TableHead>{t.companyDetail.paymentDate}</TableHead>
                <TableHead className="w-8" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {loadingList ? (
                Array.from({ length: Math.min(pageSize, 10) }, (_, i) => (
                  <TableRow key={i} className="animate-in fade-in duration-300">
                    <TableCell colSpan={7}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                items.map((item) => (
                  <TableRow
                    key={item.id}
                    className="cursor-pointer"
                    tabIndex={0}
                    onClick={() => setReceiptItem(item)}
                    onKeyDown={(e) => e.key === "Enter" && setReceiptItem(item)}
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
                    <TableCell>
                      {item.requesterInfo?.executedBy ? (
                        <Link
                          to={`/users/${item.requesterInfo.executedBy.id}`}
                          className="hover:text-primary hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {item.requesterInfo.executedBy.name || "—"}
                        </Link>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell>{formatMoney(item.amount, settings.nationalCurrencyCode)}</TableCell>
                    <TableCell>{item.method ? methodLabel(item.method) : "—"}</TableCell>
                    <TableCell>
                      <PaymentStatusBadge status={item.status} />
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDateTime(item.operationDateTime, language)}
                    </TableCell>
                    <TableCell className="w-8 text-muted-foreground">
                      <ChevronRight className="size-4" />
                    </TableCell>
                  </TableRow>
                ))
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

      <Dialog open={Boolean(receiptItem)} onOpenChange={(open) => !open && setReceiptItem(null)}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{t.companyDetail.receiptPhoto}</DialogTitle>
          </DialogHeader>
          {receiptItem && (
            <div className="grid gap-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{t.companyDetail.paymentAmount}</span>
                <span className="text-base font-semibold tabular-nums">
                  {formatMoney(receiptItem.amount, settings.nationalCurrencyCode)}
                </span>
              </div>
              {receiptItem.receiptPhotoName ? (
                receiptUrl ? (
                  <img
                    src={receiptUrl}
                    alt={t.companyDetail.receiptPhoto}
                    className="max-h-[70vh] w-full rounded-lg object-contain"
                  />
                ) : (
                  <p className="text-sm text-muted-foreground">{t.common.loading}</p>
                )
              ) : (
                <p className="text-sm text-muted-foreground">{t.common.noPhoto}</p>
              )}
              {receiptItem.status === "Pending" && (
                <div className="flex justify-end gap-2 border-t pt-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => openReject(receiptItem)}
                  >
                    {t.companyDetail.rejectTopUp}
                  </Button>
                  <Button
                    type="button"
                    disabled={confirmingId === receiptItem.id}
                    onClick={() => setConfirmItem(receiptItem)}
                  >
                    {t.companyDetail.confirmTopUp}
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(rejectItem)} onOpenChange={(open) => !open && setRejectItem(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t.companyDetail.rejectTopUpTitle}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3">
            <Field label={t.companyDetail.rejectReasonLabel}>
              <Textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} />
            </Field>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setRejectItem(null)}>
                {t.common.cancel}
              </Button>
              <Button type="button" variant="destructive" disabled={rejecting} onClick={handleReject}>
                {t.companyDetail.rejectTopUp}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={Boolean(confirmItem)}
        onOpenChange={(open) => !open && setConfirmItem(null)}
        title={t.companyDetail.confirmTopUpTitle}
        confirmLabel={t.companyDetail.confirmTopUp}
        variant="success"
        onConfirm={() => confirmItem && handleConfirm(confirmItem)}
      />
    </>
  );
}
