import { useEffect, useMemo, useState } from "react";
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
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const PAGE_SIZE = 12;

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

  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState<UserForm>(emptyUserForm);
  const [submitting, setSubmitting] = useState(false);

  const fetchUsers = async () => {
    setLoadingList(true);
    try {
      const res = await listUsers({ pageSize: 100 });
      setUsers(res.items ?? []);
    } catch (err) {
      toast.error(errorMessage(err, t.users.errors.loadUsers));
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      (u) => (u.fullName ?? "").toLowerCase().includes(q) || (u.email ?? "").toLowerCase().includes(q),
    );
  }, [users, query]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(page, pageCount);
  const pageItems = useMemo(
    () => filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE),
    [filtered, current],
  );

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
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(1);
              }}
            />
            <Button type="button" onClick={openCreate}>
              {t.users.newUser}
            </Button>
          </div>
        }
      />

      {!loadingList && pageItems.length === 0 ? (
        <EmptyState
          title={query ? t.common.nothingFound : t.users.noUsersYet}
          action={
            !query ? (
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
                <TableHead>{t.users.tableUser}</TableHead>
                <TableHead>{t.users.tableEmail}</TableHead>
                <TableHead>{t.users.tableStatus}</TableHead>
                <TableHead className="w-8" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {loadingList ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    {t.common.loading}
                  </TableCell>
                </TableRow>
              ) : (
                pageItems.map((u) => (
                  <TableRow
                    key={u.id}
                    className="cursor-pointer"
                    tabIndex={0}
                    onClick={() => nav(`/users/${u.id}`)}
                    onKeyDown={(e) => e.key === "Enter" && nav(`/users/${u.id}`)}
                  >
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
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>
      )}

      <AppPagination page={current} pageCount={pageCount} onPage={setPage} />

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
