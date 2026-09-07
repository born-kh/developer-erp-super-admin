import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { createUser, listUsers, ApiRequestError, type UserListItem } from "../lib/api";
import { randomPassword } from "../lib/format";
import { useTranslation } from "../i18n/LanguageContext";
import { PageHead } from "../AppShell";
import { AppPagination } from "@/components/AppPagination";
import { EmptyState } from "@/components/EmptyState";
import { Field } from "@/components/Field";
import { MotionTableRow } from "@/components/MotionTableRow";
import { ActiveBadge } from "@/components/StatusBadge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
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

const PAGE_SIZE = 10;

type UserForm = {
  firstName: string;
  lastName: string;
  middleName: string;
  nickName: string;
  email: string;
  avatarUrl: string;
  password: string;
  active: boolean;
};

const emptyUserForm: UserForm = {
  firstName: "",
  lastName: "",
  middleName: "",
  nickName: "",
  email: "",
  avatarUrl: "",
  password: "",
  active: true,
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
  const [users, setUsers] = useState<UserListItem[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState("");
  const [committedQuery, setCommittedQuery] = useState("");
  const [hasNextPage, setHasNextPage] = useState(false);
  const [hasPreviousPage, setHasPreviousPage] = useState(false);

  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState<UserForm>(emptyUserForm);
  const [submitting, setSubmitting] = useState(false);

  const fetchUsers = async (pageArg: number, searchArg: string) => {
    setLoadingList(true);
    try {
      const res = await listUsers({ page: pageArg, pageSize: PAGE_SIZE, search: searchArg || undefined });
      setUsers(res.items ?? []);
      setHasNextPage(res.pagination.hasNextPage);
      setHasPreviousPage(res.pagination.hasPreviousPage ?? pageArg > 1);
    } catch (err) {
      toast.error(errorMessage(err, t.users.errors.loadUsers));
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    const handle = setTimeout(() => {
      setCommittedQuery(query);
      setPage(1);
    }, 300);
    return () => clearTimeout(handle);
  }, [query]);

  useEffect(() => {
    fetchUsers(page, committedQuery);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, committedQuery]);

  const setField = <K extends keyof UserForm>(key: K, value: UserForm[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const openCreate = () => {
    setForm({ ...emptyUserForm, password: randomPassword() });
    setShowCreate(true);
  };

  const submit = async () => {
    if (!form.firstName.trim() || !form.email.trim() || submitting) return;
    setSubmitting(true);
    try {
      const created = await createUser({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim() || null,
        middleName: form.middleName.trim() || null,
        nickName: form.nickName.trim() || null,
        email: form.email.trim(),
        avatarUrl: form.avatarUrl.trim() || null,
        password: form.password.trim() || null,
        active: form.active,
      });
      toast.success(t.users.toasts.created);
      setShowCreate(false);
      nav(`/users/${created.id}`);
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
          <div className="flex flex-wrap items-center gap-2">
            <Input
              className="w-56"
              placeholder={t.users.searchPlaceholder}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <Button type="button" onClick={openCreate}>
              {t.users.newUser}
            </Button>
          </div>
        }
      />

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
                Array.from({ length: PAGE_SIZE }, (_, i) => (
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
                  <MotionTableRow
                    key={u.id}
                    index={index}
                    className="cursor-pointer"
                    tabIndex={0}
                    onClick={() => nav(`/users/${u.id}`)}
                    onKeyDown={(e) => e.key === "Enter" && nav(`/users/${u.id}`)}
                  >
                    <TableCell className="tabular-nums text-muted-foreground">
                      {(page - 1) * PAGE_SIZE + index + 1}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="size-8">
                          <AvatarImage src={u.avatarUrl ?? undefined} alt={u.fullName ?? ""} />
                          <AvatarFallback className="bg-secondary text-xs font-semibold text-muted-foreground">
                            {initials(u.fullName ?? "")}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{u.fullName}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{u.email}</TableCell>
                    <TableCell>
                      <ActiveBadge active={u.active} />
                    </TableCell>
                    <TableCell className="w-8 text-muted-foreground">
                      <ChevronRight className="size-4" />
                    </TableCell>
                  </MotionTableRow>
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
            <div className="grid grid-cols-2 gap-3 max-[860px]:grid-cols-1">
              <Field label={t.users.middleName}>
                <Input value={form.middleName} onChange={(e) => setField("middleName", e.target.value)} />
              </Field>
              <Field label={t.users.nickName}>
                <Input value={form.nickName} onChange={(e) => setField("nickName", e.target.value)} />
              </Field>
            </div>
            <Field label={t.common.email}>
              <Input value={form.email} onChange={(e) => setField("email", e.target.value)} />
            </Field>
            <Field label={t.users.avatarUrl}>
              <Input value={form.avatarUrl} onChange={(e) => setField("avatarUrl", e.target.value)} />
            </Field>
            <Field label={t.login.password}>
              <Input value={form.password} onChange={(e) => setField("password", e.target.value)} />
            </Field>
            <label className="flex items-center gap-2 text-sm font-medium">
              <Switch checked={form.active} onCheckedChange={(v) => setField("active", v)} />
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
