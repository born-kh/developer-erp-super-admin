import { useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { cities, users, type Company } from "../data/mock";
import { useCompanies } from "../data/companiesStore";
import { useTranslation } from "../i18n/LanguageContext";
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
  const { t } = useTranslation();
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
    toast.success(t.companies.created);
    nav(`/companies/${id}`);
  };

  return (
    <>
      <PageHead
        title={t.companies.title}
        sub={t.companies.sub}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Input
              className="w-56"
              placeholder={t.companies.searchPlaceholder}
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(1);
              }}
            />
            <Button type="button" onClick={openCreate}>
              {t.companies.newCompany}
            </Button>
          </div>
        }
      />

      {pageItems.length === 0 ? (
        <EmptyState
          title={query ? t.common.nothingFound : t.companies.noCompaniesYet}
          action={
            !query ? (
              <Button type="button" onClick={openCreate}>
                {t.companies.createCompany}
              </Button>
            ) : undefined
          }
        />
      ) : (
        <Card className="gap-0 overflow-hidden py-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t.companies.tableCompany}</TableHead>
                <TableHead>{t.common.city}</TableHead>
                <TableHead>{t.common.package}</TableHead>
                <TableHead>{t.common.status}</TableHead>
                <TableHead>{t.companies.tableUsers}</TableHead>
                <TableHead>{t.common.created}</TableHead>
                <TableHead className="w-8" />
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
                  <TableCell className="w-8 text-muted-foreground">
                    <ChevronRight className="size-4" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      <AppPagination page={current} pageCount={pageCount} onPage={setPage} />

      <p className="mt-4 text-sm text-muted-foreground">{t.companies.isolationNote}</p>

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{t.companies.dialogTitle}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3">
            <Field label={t.common.name}>
              <Input value={form.name} onChange={(e) => set("name", e.target.value)} autoFocus />
            </Field>
            <Field label={t.common.city}>
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
            <Field label={t.common.image}>
              <div className="image-pick">
                <div className="image-pick-preview">
                  {form.image ? <img src={form.image} alt="" /> : <span>{t.common.noPhoto}</span>}
                </div>
                <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>
                  {t.common.chooseImage}
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
              <Field label={t.common.package}>
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
              <Field label={t.common.status}>
                <Select value={form.status} onValueChange={(v) => set("status", v as Company["status"])}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">{t.common.statusActive}</SelectItem>
                    <SelectItem value="trial">{t.common.statusTrial}</SelectItem>
                    <SelectItem value="suspended">{t.common.statusSuspended}</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            </div>
            <Field label={t.common.phone}>
              <Input value={form.phone} onChange={(e) => set("phone", e.target.value)} />
            </Field>
            <Field label={t.common.email}>
              <Input value={form.email} onChange={(e) => set("email", e.target.value)} />
            </Field>
            <Field label={t.common.address}>
              <Input value={form.address} onChange={(e) => set("address", e.target.value)} />
            </Field>
            <Field label={t.common.description}>
              <Textarea rows={3} value={form.description} onChange={(e) => set("description", e.target.value)} />
            </Field>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setShowCreate(false)}>
              {t.common.cancel}
            </Button>
            <Button type="button" disabled={!form.name.trim()} onClick={submitCreate}>
              {t.common.create}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
