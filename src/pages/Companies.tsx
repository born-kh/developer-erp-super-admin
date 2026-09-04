import { useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { cities, users, type Company } from "../data/mock";
import { useCompanies } from "../data/companiesStore";
import { PageHead } from "../AppShell";
import { AppPagination } from "@/components/AppPagination";
import { EmptyState } from "@/components/EmptyState";
import { Field } from "@/components/Field";
import { CompanyStatusBadge, StatusBadge } from "@/components/StatusBadge";
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

const PAGE_SIZE = 8;

const emptyForm: Omit<Company, "id"> = {
  name: "",
  city: cities[0],
  package: "basic",
  status: "trial",
  image: "",
  phone: "",
  email: "",
  address: "",
  createdAt: new Date().toISOString().slice(0, 10),
  description: "",
};

export function Companies() {
  const nav = useNavigate();
  const { companies, addCompany } = useCompanies();
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState<Omit<Company, "id">>(emptyForm);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return companies;
    return companies.filter((c) => c.name.toLowerCase().includes(q) || c.city.toLowerCase().includes(q));
  }, [companies, query]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(page, pageCount);
  const pageItems = useMemo(
    () => filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE),
    [filtered, current],
  );

  const set = <K extends keyof Omit<Company, "id">>(key: K, value: Company[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const openCreate = () => {
    setForm(emptyForm);
    setShowCreate(true);
  };

  const pickImage = (file: File | undefined) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => set("image", String(reader.result));
    reader.readAsDataURL(file);
  };

  const submitCreate = () => {
    if (!form.name.trim()) return;
    const id = addCompany({
      ...form,
      image: form.image.trim() || `https://picsum.photos/seed/${encodeURIComponent(form.name)}/480/320`,
    });
    setShowCreate(false);
    toast.success("Компания создана");
    nav(`/companies/${id}`);
  };

  return (
    <>
      <PageHead
        title="Компании"
        sub="создание и управление тенантами"
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Input
              className="w-56"
              placeholder="Поиск по названию или городу"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(1);
              }}
            />
            <Button type="button" onClick={openCreate}>
              + Новая компания
            </Button>
          </div>
        }
      />

      {pageItems.length === 0 ? (
        <EmptyState
          title={query ? "Ничего не найдено." : "Компаний пока нет."}
          action={
            !query ? (
              <Button type="button" onClick={openCreate}>
                Создать компанию
              </Button>
            ) : undefined
          }
        />
      ) : (
        <Card className="gap-0 overflow-hidden py-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Компания</TableHead>
                <TableHead>Город</TableHead>
                <TableHead>Пакет</TableHead>
                <TableHead>Статус</TableHead>
                <TableHead>Пользователи</TableHead>
                <TableHead>Создана</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pageItems.map((c) => (
                <TableRow
                  key={c.id}
                  className="cursor-pointer"
                  tabIndex={0}
                  onClick={() => nav(`/companies/${c.id}`)}
                  onKeyDown={(e) => e.key === "Enter" && nav(`/companies/${c.id}`)}
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <img
                        src={c.image}
                        alt=""
                        className="size-9 rounded-md object-cover bg-secondary"
                      />
                      <span className="font-medium">{c.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{c.city}</TableCell>
                  <TableCell>
                    <StatusBadge tone="success">{c.package}</StatusBadge>
                  </TableCell>
                  <TableCell>
                    <CompanyStatusBadge status={c.status} />
                  </TableCell>
                  <TableCell className="tabular-nums text-muted-foreground">
                    {users.filter((u) => u.companyId === c.id).length}
                  </TableCell>
                  <TableCell className="tabular-nums text-muted-foreground">{c.createdAt}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      <AppPagination page={current} pageCount={pageCount} onPage={setPage} />

      <p className="mt-4 text-sm text-muted-foreground">
        Данные компаний изолированы. Каждая компания работает только внутри своего пакета.
      </p>

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Новая компания</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3">
            <Field label="Название">
              <Input value={form.name} onChange={(e) => set("name", e.target.value)} autoFocus />
            </Field>
            <Field label="Город">
              <Select value={form.city} onValueChange={(v) => set("city", v)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {cities.map((city) => (
                    <SelectItem key={city} value={city}>
                      {city}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
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
              <Field label="Пакет">
                <Select value={form.package} onValueChange={(v) => set("package", v as Company["package"])}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="basic">basic</SelectItem>
                    <SelectItem value="pro">pro</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Статус">
                <Select value={form.status} onValueChange={(v) => set("status", v as Company["status"])}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Активна</SelectItem>
                    <SelectItem value="trial">Триал</SelectItem>
                    <SelectItem value="suspended">Приостановлена</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            </div>
            <Field label="Телефон">
              <Input value={form.phone} onChange={(e) => set("phone", e.target.value)} />
            </Field>
            <Field label="Email">
              <Input value={form.email} onChange={(e) => set("email", e.target.value)} />
            </Field>
            <Field label="Адрес">
              <Input value={form.address} onChange={(e) => set("address", e.target.value)} />
            </Field>
            <Field label="Описание">
              <Textarea rows={3} value={form.description} onChange={(e) => set("description", e.target.value)} />
            </Field>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setShowCreate(false)}>
              Отмена
            </Button>
            <Button type="button" disabled={!form.name.trim()} onClick={submitCreate}>
              Создать
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
