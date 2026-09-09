import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronDown, ChevronRight, ChevronUp } from "lucide-react";
import { toast } from "sonner";
import {
  createRole,
  listCompanies,
  listRoles,
  ApiRequestError,
  type CompanyListItem,
  type RoleLookup,
} from "../lib/api";
import { useTranslation } from "../i18n/LanguageContext";
import { useModuleSettings } from "../data/moduleSettingsStore";
import { PageHead } from "../AppShell";
import { AppPagination } from "@/components/AppPagination";
import { Card, CardContent } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { EmptyState } from "@/components/EmptyState";
import { Field } from "@/components/Field";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
const COMPANY_ANY = "any";
const SHOW_COMPANY_ROLES_ANY = "any";

type Translations = Record<string, string>;

type RoleForm = {
  code: string;
  title: Translations;
};

const emptyTranslations = (langs: string[]): Translations =>
  Object.fromEntries(langs.map((l) => [l, ""]));

function errorMessage(err: unknown, fallback: string) {
  return err instanceof ApiRequestError ? err.message : fallback;
}

export function Roles() {
  const nav = useNavigate();
  const { t } = useTranslation();
  const { settings } = useModuleSettings();
  const langs = settings.supportedLanguages;
  const defaultLang = settings.defaultLanguage;
  const makeEmptyForm = (): RoleForm => ({ code: "", title: emptyTranslations(langs) });

  const [roles, setRoles] = useState<RoleLookup[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [query, setQuery] = useState("");
  const [committedQuery, setCommittedQuery] = useState("");
  const [companyId, setCompanyId] = useState("");
  const [shouldShowCompanyRoles, setShouldShowCompanyRoles] = useState("");
  const [hasNextPage, setHasNextPage] = useState(false);
  const [hasPreviousPage, setHasPreviousPage] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(true);

  const [companies, setCompanies] = useState<CompanyListItem[]>([]);
  const [companiesLoaded, setCompaniesLoaded] = useState(false);
  const [companiesLoading, setCompaniesLoading] = useState(false);

  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState<RoleForm>(() => makeEmptyForm());
  const [activeLang, setActiveLang] = useState<string>(defaultLang);
  const [submitting, setSubmitting] = useState(false);

  const fetchRoles = async (
    pageArg: number,
    pageSizeArg: number,
    searchArg: string,
    companyIdArg: string,
    showCompanyRolesArg: string,
  ) => {
    setLoadingList(true);
    try {
      const res = await listRoles({
        page: pageArg,
        pageSize: pageSizeArg,
        search: searchArg || undefined,
        companyId: companyIdArg || undefined,
        shouldShowCompanyRoles: showCompanyRolesArg === "" ? undefined : showCompanyRolesArg === "true",
      });
      setRoles(res.items ?? []);
      setHasNextPage(res.pagination.hasNextPage);
      setHasPreviousPage(res.pagination.hasPreviousPage ?? pageArg > 1);
    } catch (err) {
      toast.error(errorMessage(err, t.roles.errors.loadRoles));
    } finally {
      setLoadingList(false);
    }
  };

  const loadCompaniesOnce = () => {
    if (companiesLoaded || companiesLoading) return;
    setCompaniesLoading(true);
    listCompanies({ pageSize: 200 })
      .then((res) => {
        setCompanies(res.items ?? []);
        setCompaniesLoaded(true);
      })
      .catch((err) => toast.error(errorMessage(err, t.roles.errors.loadRoles)))
      .finally(() => setCompaniesLoading(false));
  };

  useEffect(() => {
    const handle = setTimeout(() => {
      setCommittedQuery(query);
      setPage(1);
    }, 300);
    return () => clearTimeout(handle);
  }, [query]);

  useEffect(() => {
    fetchRoles(page, pageSize, committedQuery, companyId, shouldShowCompanyRoles);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize, committedQuery, companyId, shouldShowCompanyRoles]);

  const changePageSize = (size: number) => {
    setPageSize(size);
    setPage(1);
  };

  const changeCompanyId = (value: string) => {
    setCompanyId(value === COMPANY_ANY ? "" : value);
    setPage(1);
  };

  const changeShouldShowCompanyRoles = (value: string) => {
    setShouldShowCompanyRoles(value === SHOW_COMPANY_ROLES_ANY ? "" : value);
    setPage(1);
  };

  const setTitle = (lang: string, value: string) =>
    setForm((f) => ({ ...f, title: { ...f.title, [lang]: value } }));

  const openCreate = () => {
    setForm(makeEmptyForm());
    setActiveLang(defaultLang);
    setShowCreate(true);
  };

  const collectTranslations = (translations: Translations) =>
    Object.fromEntries(langs.filter((l) => translations[l]?.trim()).map((l) => [l, translations[l].trim()]));

  const submit = async () => {
    if (!form.code.trim() || !form.title[defaultLang]?.trim() || submitting) return;
    setSubmitting(true);
    try {
      const created = await createRole({
        code: form.code.trim(),
        titleTranslations: collectTranslations(form.title),
      });
      toast.success(t.roles.toasts.created);
      setShowCreate(false);
      nav(`/roles/${created.id}`);
    } catch (err) {
      toast.error(errorMessage(err, t.roles.errors.saveRole));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <PageHead
        title={t.roles.title}
        actions={
          <Button type="button" onClick={openCreate}>
            {t.roles.addRole}
          </Button>
        }
      />

      <Card className="mb-4">
        <CardContent className="grid gap-3">
          <Collapsible open={filtersOpen} onOpenChange={setFiltersOpen}>
            <CollapsibleContent className="grid gap-3">
              <div className="grid grid-cols-3 gap-3 max-[900px]:grid-cols-2 max-[500px]:grid-cols-1">
                <Field label={t.roles.filters.search}>
                  <Input
                    placeholder={t.roles.searchPlaceholder}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                </Field>
                <Field label={t.roles.filters.companyId}>
                  <Select
                    value={companyId || COMPANY_ANY}
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
                <Field label={t.roles.filters.showCompanyRoles}>
                  <Select
                    value={shouldShowCompanyRoles || SHOW_COMPANY_ROLES_ANY}
                    onValueChange={changeShouldShowCompanyRoles}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={SHOW_COMPANY_ROLES_ANY}>{t.activityLogs.filters.typeNotSelected}</SelectItem>
                      <SelectItem value="true">{t.common.yes}</SelectItem>
                      <SelectItem value="false">{t.common.no}</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
              </div>
            </CollapsibleContent>
            <div className="flex justify-end">
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

      {!loadingList && roles.length === 0 ? (
        <EmptyState
          title={committedQuery ? t.common.nothingFound : t.roles.noRolesYet}
          action={
            !committedQuery ? (
              <Button type="button" onClick={openCreate}>
                {t.roles.addRoleAction}
              </Button>
            ) : undefined
          }
        />
      ) : (
        <Card className="gap-0 overflow-hidden py-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">{t.common.rowNumber}</TableHead>
                <TableHead>{t.roles.tableRole}</TableHead>
                <TableHead>{t.roles.tableCode}</TableHead>
                <TableHead className="w-8" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {loadingList ? (
                Array.from({ length: Math.min(pageSize, 10) }, (_, i) => (
                  <TableRow key={i} className="animate-in fade-in duration-300">
                    <TableCell>
                      <Skeleton className="h-4 w-5" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-32" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-24" />
                    </TableCell>
                    <TableCell className="w-8">
                      <Skeleton className="h-4 w-4" />
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                roles.map((r, index) => (
                  <TableRow
                    key={r.id}
                    className="cursor-pointer"
                    tabIndex={0}
                    onClick={() => nav(`/roles/${r.id}`)}
                    onKeyDown={(e) => e.key === "Enter" && nav(`/roles/${r.id}`)}
                  >
                    <TableCell className="tabular-nums text-muted-foreground">
                      {(page - 1) * pageSize + index + 1}
                    </TableCell>
                    <TableCell className="font-medium">{r.title || "—"}</TableCell>
                    <TableCell>
                      {r.code ? <span className="tag-chip static">{r.code}</span> : <span className="text-muted-foreground">—</span>}
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

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{t.roles.modalTitleCreate}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3">
            <Field label={t.roles.code}>
              <Input value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))} autoFocus />
            </Field>
            <div className="grid gap-3 rounded-md border p-3">
              <div className="flex gap-1">
                {langs.map((l) => (
                  <button
                    key={l}
                    type="button"
                    onClick={() => setActiveLang(l)}
                    className={`rounded-md border px-2.5 py-1 text-xs font-semibold ${
                      activeLang === l
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-input text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {l.toUpperCase()}
                    {l === defaultLang && !form.title[defaultLang]?.trim() ? " *" : ""}
                  </button>
                ))}
              </div>
              <Field label={t.roles.nameLang(activeLang.toUpperCase())}>
                <Input value={form.title[activeLang] ?? ""} onChange={(e) => setTitle(activeLang, e.target.value)} />
              </Field>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setShowCreate(false)}>
              {t.common.cancel}
            </Button>
            <Button
              type="button"
              disabled={!form.code.trim() || !form.title[defaultLang]?.trim() || submitting}
              onClick={submit}
            >
              {t.common.create}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
