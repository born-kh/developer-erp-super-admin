import { useEffect, useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";
import {
  listCompanies,
  listPaymentHistories,
  ApiRequestError,
  type CompanyListItem,
  type CompanyPaymentHistoryItem,
  type PaymentType,
} from "../lib/api";
import { formatDate, formatMoney } from "../lib/format";
import { useTranslation } from "../i18n/LanguageContext";
import { useModuleSettings } from "../data/moduleSettingsStore";
import { PageHead } from "../AppShell";
import { AppPagination } from "@/components/AppPagination";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
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
      <PageHead title={t.paymentHistories.title} />

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
                <TableHead>{t.common.created}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loadingList ? (
                Array.from({ length: Math.min(pageSize, 10) }, (_, i) => (
                  <TableRow key={i} className="animate-in fade-in duration-300">
                    <TableCell colSpan={6}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.companyName || "—"}</TableCell>
                    <TableCell>{formatMoney(item.amount, settings.nationalCurrencyCode)}</TableCell>
                    <TableCell>{typeLabel(item.type)}</TableCell>
                    <TableCell>{item.method ? methodLabel(item.method) : "—"}</TableCell>
                    <TableCell>{item.receiverInfo?.name || "—"}</TableCell>
                    <TableCell className="text-muted-foreground">{formatDate(item.createdAt, language)}</TableCell>
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
    </>
  );
}
