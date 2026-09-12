import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ChevronDown, ChevronRight, ChevronUp, Copy, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import {
  createAdminUser,
  listCompanies,
  listUsers,
  ApiRequestError,
  type CompanyListItem,
  type UserListItem,
  type UserType,
} from "../lib/api";
import { useCurrentUser } from "../data/currentUserStore";
import { randomPassword } from "../lib/format";
import { useTranslation } from "../i18n/LanguageContext";
import { PageHead } from "../AppShell";
import { AppPagination } from "@/components/AppPagination";
import { EmptyState } from "@/components/EmptyState";
import { Field } from "@/components/Field";
import { ActiveBadge } from "@/components/StatusBadge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
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
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const DEFAULT_PAGE_SIZE = 10;

const SELECTABLE_USER_TYPES: UserType[] = ["Admin", "Owner", "Worker", "Client"];
const IS_ACTIVE_ANY = "any";
const COMPANY_ANY = "any";
const SHOW_COMPANY_USERS_ANY = "any";

type UserForm = {
  firstName: string;
  lastName: string;
  middleName: string;
  email: string;
  password: string;
  isActive: boolean;
};

const emptyUserForm: UserForm = {
  firstName: "",
  lastName: "",
  middleName: "",
  email: "",
  password: "",
  isActive: true,
};

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

function errorMessage(err: unknown, fallback: string) {
  return err instanceof ApiRequestError ? err.message : fallback;
}

export function Users() {
  const nav = useNavigate();
  const { t } = useTranslation();
  const { user: currentUser } = useCurrentUser();
  const [searchParams, setSearchParams] = useSearchParams();

  const initialType = searchParams.get("type");
  const initialUserType: UserType = SELECTABLE_USER_TYPES.includes(initialType as UserType)
    ? (initialType as UserType)
    : "Admin";
  const initialSearch = searchParams.get("search") ?? "";
  const initialPage = Number(searchParams.get("page")) || 1;
  const initialIsActive = searchParams.get("isActive") ?? "";
  const initialCompanyId = searchParams.get("companyId") ?? "";
  const initialShowCompanyUsers = searchParams.get("showCompanyUsers") ?? "";

  const [users, setUsers] = useState<UserListItem[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [page, setPage] = useState(initialPage);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [query, setQuery] = useState(initialSearch);
  const [committedQuery, setCommittedQuery] = useState(initialSearch);
  const [userType, setUserType] = useState<UserType>(initialUserType);
  const [isActive, setIsActive] = useState(initialIsActive);
  const [companyId, setCompanyId] = useState(initialCompanyId);
  const [shouldShowCompanyTypeUsers, setShouldShowCompanyTypeUsers] = useState(initialShowCompanyUsers);

  const [companies, setCompanies] = useState<CompanyListItem[]>([]);
  const [companiesLoaded, setCompaniesLoaded] = useState(false);
  const [companiesLoading, setCompaniesLoading] = useState(false);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [hasPreviousPage, setHasPreviousPage] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(true);

  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState<UserForm>(emptyUserForm);
  const [submitting, setSubmitting] = useState(false);

  const typeLabels: Record<UserType, string> = {
    SuperAdmin: "",
    Admin: t.users.typeAdmin,
    Owner: t.users.typeOwner,
    Worker: t.users.typeWorker,
    Client: t.users.typeClient,
    Unknown: "",
  };

  const fetchUsers = async (
    pageArg: number,
    pageSizeArg: number,
    searchArg: string,
    userTypeArg: UserType,
    isActiveArg: string,
    companyIdArg: string,
    showCompanyUsersArg: string,
  ) => {
    setLoadingList(true);
    try {
      const res = await listUsers({
        page: pageArg,
        pageSize: pageSizeArg,
        search: searchArg || undefined,
        userType: userTypeArg,
        isActive: isActiveArg === "" ? undefined : isActiveArg === "true",
        companyId: companyIdArg || undefined,
        shouldShowCompanyTypeUsers: showCompanyUsersArg === "" ? undefined : showCompanyUsersArg === "true",
      });
      setUsers(res.items ?? []);
      setHasNextPage(res.pagination.hasNextPage);
      setHasPreviousPage(res.pagination.hasPreviousPage ?? pageArg > 1);
    } catch (err) {
      toast.error(errorMessage(err, t.users.errors.loadUsers));
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
      .catch((err) => toast.error(errorMessage(err, t.users.errors.loadUsers)))
      .finally(() => setCompaniesLoading(false));
  };

  useEffect(() => {
    if (query === committedQuery) return;
    const handle = setTimeout(() => {
      setCommittedQuery(query);
      setPage(1);
    }, 300);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  useEffect(() => {
    fetchUsers(page, pageSize, committedQuery, userType, isActive, companyId, shouldShowCompanyTypeUsers);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize, committedQuery, userType, isActive, companyId, shouldShowCompanyTypeUsers]);

  useEffect(() => {
    const params: Record<string, string> = { type: userType };
    if (committedQuery) params.search = committedQuery;
    if (page > 1) params.page = String(page);
    if (isActive) params.isActive = isActive;
    if (companyId) params.companyId = companyId;
    if (shouldShowCompanyTypeUsers) params.showCompanyUsers = shouldShowCompanyTypeUsers;
    setSearchParams(params, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userType, committedQuery, page, isActive, companyId, shouldShowCompanyTypeUsers]);

  const changePageSize = (size: number) => {
    setPageSize(size);
    setPage(1);
  };

  const changeUserType = (value: UserType) => {
    setUserType(value);
    setPage(1);
  };

  const changeIsActive = (value: string) => {
    setIsActive(value === IS_ACTIVE_ANY ? "" : value);
    setPage(1);
  };

  const changeCompanyId = (value: string) => {
    setCompanyId(value === COMPANY_ANY ? "" : value);
    setPage(1);
  };

  const changeShouldShowCompanyTypeUsers = (value: string) => {
    setShouldShowCompanyTypeUsers(value === SHOW_COMPANY_USERS_ANY ? "" : value);
    setPage(1);
  };

  const setField = <K extends keyof UserForm>(key: K, value: UserForm[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const openCreate = () => {
    setForm({ ...emptyUserForm, password: randomPassword() });
    setShowCreate(true);
  };

  const copyPassword = () => {
    if (!form.password) return;
    navigator.clipboard?.writeText(form.password).catch(() => {});
    toast.success(t.common.passwordCopied);
  };

  const submit = async () => {
    if (!form.firstName.trim() || !form.email.trim() || submitting) return;
    setSubmitting(true);
    try {
      const created = await createAdminUser({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim() || null,
        middleName: form.middleName.trim() || null,
        email: form.email.trim(),
        password: form.password.trim() || null,
        isActive: form.isActive,
      });
      toast.success(t.users.toasts.created);
      setShowCreate(false);
      nav(`/users/${created.userId}`);
    } catch (err) {
      toast.error(errorMessage(err, t.users.errors.saveUser));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <PageHead
        title={t.users.title}
        actions={
          <Button type="button" onClick={openCreate}>
            {t.users.newUser}
          </Button>
        }
      />

      <Card className="mb-4">
        <CardContent className="grid gap-3">
          <Collapsible open={filtersOpen} onOpenChange={setFiltersOpen}>
            <CollapsibleContent className="grid gap-3">
              <div className="grid grid-cols-4 gap-3 max-[1100px]:grid-cols-3 max-[700px]:grid-cols-2 max-[420px]:grid-cols-1">
                <Field label={t.users.filters.search}>
                  <Input
                    placeholder={t.users.searchPlaceholder}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                </Field>
                <Field label={t.userDetail.type}>
                  <Select value={userType} onValueChange={(v) => changeUserType(v as UserType)}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SELECTABLE_USER_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>
                          {typeLabels[type]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label={t.common.status}>
                  <Select value={isActive || IS_ACTIVE_ANY} onValueChange={changeIsActive}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={IS_ACTIVE_ANY}>{t.activityLogs.filters.typeNotSelected}</SelectItem>
                      <SelectItem value="true">{t.common.active}</SelectItem>
                      <SelectItem value="false">{t.common.disabled}</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
                <Field label={t.users.filters.companyId}>
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
                <Field label={t.users.filters.showCompanyUsers}>
                  <Select
                    value={shouldShowCompanyTypeUsers || SHOW_COMPANY_USERS_ANY}
                    onValueChange={changeShouldShowCompanyTypeUsers}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={SHOW_COMPANY_USERS_ANY}>{t.activityLogs.filters.typeNotSelected}</SelectItem>
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

      {!loadingList && users.length === 0 ? (
        <EmptyState
          title={committedQuery ? t.common.nothingFound : t.users.noUsersYet}
          action={
            !committedQuery ? (
              <Button type="button" onClick={openCreate}>
                {t.users.createUser}
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
                <TableHead>{t.users.tableUser}</TableHead>
                <TableHead>{t.users.tableEmail}</TableHead>
                <TableHead>{t.users.tableStatus}</TableHead>
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
                      <div className="flex items-center gap-3">
                        <Skeleton className="size-8 shrink-0 rounded-full" />
                        <Skeleton className="h-4 w-32" />
                      </div>
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-40" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-5 w-16 rounded-full" />
                    </TableCell>
                    <TableCell className="w-8">
                      <Skeleton className="h-4 w-4" />
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                users.map((u, index) => (
                  <TableRow
                    key={u.id}
                    className="cursor-pointer"
                    tabIndex={0}
                    onClick={() => nav(`/users/${u.id}`)}
                    onKeyDown={(e) => e.key === "Enter" && nav(`/users/${u.id}`)}
                  >
                    <TableCell className="tabular-nums text-muted-foreground">
                      {(page - 1) * pageSize + index + 1}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="size-8">
                          <AvatarFallback className="bg-secondary text-xs font-semibold text-muted-foreground">
                            {initials(u.fullName ?? "")}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{u.fullName}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{u.email}</TableCell>
                    <TableCell>
                      {u.id !== currentUser?.id && <ActiveBadge active={u.isActive} />}
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
            <DialogTitle>{t.users.modalTitleCreate}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3">
            <div className="grid grid-cols-2 gap-3 max-[860px]:grid-cols-1">
              <Field label={t.users.firstName}>
                <Input value={form.firstName} onChange={(e) => setField("firstName", e.target.value)} autoFocus />
              </Field>
              <Field label={t.users.lastName}>
                <Input value={form.lastName} onChange={(e) => setField("lastName", e.target.value)} />
              </Field>
            </div>
            <Field label={t.users.middleName}>
              <Input value={form.middleName} onChange={(e) => setField("middleName", e.target.value)} />
            </Field>
            <Field label={t.common.email}>
              <Input value={form.email} onChange={(e) => setField("email", e.target.value)} />
            </Field>
            <Field label={t.login.password}>
              <div className="password-gen">
                <Input value={form.password} onChange={(e) => setField("password", e.target.value)} />
                <Button type="button" variant="outline" size="icon" onClick={copyPassword} aria-label={t.common.copyPassword}>
                  <Copy />
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={() => setField("password", randomPassword())}>
                  <RefreshCw />
                  {t.common.generate}
                </Button>
              </div>
            </Field>
            <label className="flex items-center gap-2 text-sm font-medium">
              <Switch checked={form.isActive} onCheckedChange={(v) => setField("isActive", v)} />
              {t.users.userActive}
            </label>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setShowCreate(false)}>
              {t.common.cancel}
            </Button>
            <Button type="button" disabled={!form.firstName.trim() || !form.email.trim() || submitting} onClick={submit}>
              {t.common.create}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
