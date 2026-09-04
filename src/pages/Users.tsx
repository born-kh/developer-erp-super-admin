import { useMemo, useRef, useState } from "react";
import { Copy, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { type PlatformUser } from "../data/mock";
import { useUsers } from "../data/usersStore";
import { randomPassword, slugify } from "../lib/format";
import { PageHead } from "../AppShell";
import { AppPagination } from "@/components/AppPagination";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { EmptyState } from "@/components/EmptyState";
import { Field } from "@/components/Field";
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
  email: string;
  login: string;
  password: string;
  image: string;
};

const emptyUserForm: UserForm = {
  firstName: "",
  lastName: "",
  email: "",
  login: "",
  password: "",
  image: "",
};

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

export function Users() {
  const { users, addUser, updateUser, deleteUser } = useUsers();
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState("");

  const [modal, setModal] = useState<{ mode: "create" | "edit"; id?: string } | null>(null);
  const [form, setForm] = useState<UserForm>(emptyUserForm);
  const [loginTouched, setLoginTouched] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      (u) => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || (u.login ?? "").toLowerCase().includes(q),
    );
  }, [users, query]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(page, pageCount);
  const pageItems = useMemo(
    () => filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE),
    [filtered, current],
  );

  const setField = <K extends keyof UserForm>(key: K, value: UserForm[K]) => {
    setForm((f) => {
      const next = { ...f, [key]: value };
      if ((key === "firstName" || key === "lastName") && !loginTouched) {
        next.login = slugify(`${next.firstName} ${next.lastName}`.trim());
      }
      return next;
    });
    if (key === "login") setLoginTouched(true);
  };

  const openCreate = () => {
    setForm({ ...emptyUserForm, password: randomPassword() });
    setLoginTouched(false);
    setModal({ mode: "create" });
  };

  const openEdit = (u: PlatformUser) => {
    const [firstName, ...rest] = u.name.split(" ");
    setForm({
      firstName: firstName ?? "",
      lastName: rest.join(" "),
      email: u.email,
      login: u.login ?? "",
      password: u.password ?? "",
      image: u.image ?? "",
    });
    setLoginTouched(true);
    setModal({ mode: "edit", id: u.id });
  };

  const pickImage = (file: File | undefined) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setField("image", String(reader.result));
    reader.readAsDataURL(file);
  };

  const copyPassword = () => {
    if (!form.password) return;
    navigator.clipboard?.writeText(form.password).catch(() => {});
    toast.success("Пароль скопирован");
  };

  const submit = () => {
    const name = `${form.firstName.trim()} ${form.lastName.trim()}`.trim();
    if (!name) return;
    const payload = {
      name,
      email: form.email,
      login: form.login,
      password: form.password,
      image: form.image,
    };
    if (modal?.mode === "edit" && modal.id) {
      updateUser(modal.id, payload);
      toast.success("Пользователь сохранён");
    } else {
      addUser({ ...payload, role: "user", companyId: "" });
      toast.success("Пользователь создан");
    }
    setModal(null);
  };

  const remove = (id: string) => {
    deleteUser(id);
    setConfirmDeleteId(null);
    toast.success("Пользователь удалён");
  };

  return (
    <>
      <PageHead
        title="Пользователи платформы"
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Input
              className="w-56"
              placeholder="Поиск по имени или email"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(1);
              }}
            />
            <Button type="button" onClick={openCreate}>
              + Новый пользователь
            </Button>
          </div>
        }
      />

      {pageItems.length === 0 ? (
        <EmptyState
          title={query ? "Ничего не найдено." : "Пользователей пока нет."}
          action={
            !query ? (
              <Button type="button" onClick={openCreate}>
                Создать пользователя
              </Button>
            ) : undefined
          }
        />
      ) : (
        <Card className="gap-0 overflow-hidden py-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Пользователь</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Логин</TableHead>
                <TableHead className="text-right">Действия</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pageItems.map((u) => (
                <TableRow key={u.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="size-8">
                        <AvatarImage src={u.image} alt={u.name} />
                        <AvatarFallback className="bg-secondary text-xs font-semibold text-muted-foreground">
                          {initials(u.name)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{u.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{u.email}</TableCell>
                  <TableCell className="text-muted-foreground">{u.login || "—"}</TableCell>
                  <TableCell className="text-right">
                    <div className="inline-flex gap-1.5">
                      <Button type="button" variant="outline" size="sm" onClick={() => openEdit(u)}>
                        Изменить
                      </Button>
                      <Button type="button" variant="destructive" size="sm" onClick={() => setConfirmDeleteId(u.id)}>
                        Удалить
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      <AppPagination page={current} pageCount={pageCount} onPage={setPage} />

      <ConfirmDialog
        open={Boolean(confirmDeleteId)}
        onOpenChange={(open) => !open && setConfirmDeleteId(null)}
        description="Пользователь будет удалён без возможности восстановления."
        onConfirm={() => confirmDeleteId && remove(confirmDeleteId)}
      />

      <Dialog open={Boolean(modal)} onOpenChange={(open) => !open && setModal(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{modal?.mode === "edit" ? "Редактировать пользователя" : "Новый пользователь"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3">
            <Field label="Изображение">
              <div className="image-pick">
                <div className="image-pick-preview">
                  {form.image ? <img src={form.image} alt="" /> : <span>Нет фото</span>}
                </div>
                <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>
                  Выбрать изображение
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={(e) => pickImage(e.target.files?.[0])}
                />
              </div>
            </Field>
            <div className="grid grid-cols-2 gap-3 max-[860px]:grid-cols-1">
              <Field label="Имя">
                <Input value={form.firstName} onChange={(e) => setField("firstName", e.target.value)} autoFocus />
              </Field>
              <Field label="Фамилия">
                <Input value={form.lastName} onChange={(e) => setField("lastName", e.target.value)} />
              </Field>
            </div>
            <Field label="Email">
              <Input value={form.email} onChange={(e) => setField("email", e.target.value)} />
            </Field>
            <Field label="Логин">
              <Input value={form.login} onChange={(e) => setField("login", e.target.value)} />
            </Field>
            <Field label="Пароль">
              <div className="password-gen">
                <Input value={form.password} onChange={(e) => setField("password", e.target.value)} />
                <Button type="button" variant="outline" size="icon" onClick={copyPassword} aria-label="Копировать пароль">
                  <Copy />
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={() => setField("password", randomPassword())}>
                  <RefreshCw />
                  Сгенерировать
                </Button>
              </div>
            </Field>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setModal(null)}>
              Отмена
            </Button>
            <Button type="button" disabled={!form.firstName.trim()} onClick={submit}>
              {modal?.mode === "edit" ? "Сохранить" : "Создать"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
