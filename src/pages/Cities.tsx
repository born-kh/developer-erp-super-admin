import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { type CityItem } from "../data/mock";
import { useCityCatalog } from "../data/cityCatalogStore";
import { useRegions } from "../data/regionsStore";
import { PageHead } from "../AppShell";
import { AppPagination } from "@/components/AppPagination";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { EmptyState } from "@/components/EmptyState";
import { Field } from "@/components/Field";
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

type CityForm = {
  name: string;
  regionId: string;
  description: string;
};

type RegionForm = {
  name: string;
  description: string;
};

const emptyCityForm: CityForm = { name: "", regionId: "", description: "" };
const emptyRegionForm: RegionForm = { name: "", description: "" };

export function Cities() {
  const { cityCatalog, addCity, updateCity, deleteCity } = useCityCatalog();
  const { regions, addRegion } = useRegions();
  const [page, setPage] = useState(1);

  const [modal, setModal] = useState<{ mode: "create" | "edit"; id?: string } | null>(null);
  const [form, setForm] = useState<CityForm>(emptyCityForm);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const [regionModalOpen, setRegionModalOpen] = useState(false);
  const [regionForm, setRegionForm] = useState<RegionForm>(emptyRegionForm);

  const pageCount = Math.max(1, Math.ceil(cityCatalog.length / PAGE_SIZE));
  const current = Math.min(page, pageCount);
  const pageItems = useMemo(
    () => cityCatalog.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE),
    [cityCatalog, current],
  );

  const set = <K extends keyof CityForm>(key: K, value: CityForm[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const openCreate = () => {
    setForm({ ...emptyCityForm, regionId: regions[0]?.id ?? "" });
    setModal({ mode: "create" });
  };

  const openEdit = (c: CityItem) => {
    setForm({ name: c.name, regionId: c.regionId, description: c.description ?? "" });
    setModal({ mode: "edit", id: c.id });
  };

  const submit = () => {
    if (!form.name.trim() || !form.regionId) return;
    const payload = {
      name: form.name.trim(),
      regionId: form.regionId,
      description: form.description,
    };
    if (modal?.mode === "edit" && modal.id) {
      updateCity(modal.id, payload);
      toast.success("Город сохранён");
    } else {
      addCity(payload);
      toast.success("Город создан");
    }
    setModal(null);
  };

  const remove = (id: string) => {
    deleteCity(id);
    setConfirmDeleteId(null);
    toast.success("Город удалён");
  };

  const openRegionModal = () => {
    setRegionForm(emptyRegionForm);
    setRegionModalOpen(true);
  };

  const submitRegion = () => {
    if (!regionForm.name.trim()) return;
    const id = addRegion({ name: regionForm.name.trim(), description: regionForm.description });
    set("regionId", id);
    setRegionModalOpen(false);
    toast.success("Регион создан");
  };

  return (
    <>
      <PageHead
        title="Города"
        actions={
          <Button type="button" onClick={openCreate}>
            + Добавить город
          </Button>
        }
      />

      {pageItems.length === 0 ? (
        <EmptyState
          title="Городов пока нет."
          action={
            <Button type="button" onClick={openCreate}>
              Добавить город
            </Button>
          }
        />
      ) : (
        <Card className="gap-0 overflow-hidden py-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Город</TableHead>
                <TableHead>Регион</TableHead>
                <TableHead>Описание</TableHead>
                <TableHead className="text-right">Действия</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pageItems.map((c) => {
                const region = regions.find((r) => r.id === c.regionId);
                return (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.name}</TableCell>
                    <TableCell className="text-muted-foreground">{region?.name ?? "Без региона"}</TableCell>
                    <TableCell className="max-w-xs truncate text-muted-foreground">{c.description || "—"}</TableCell>
                    <TableCell className="text-right">
                      <div className="inline-flex gap-1.5">
                        <Button type="button" variant="outline" size="sm" onClick={() => openEdit(c)}>
                          Изменить
                        </Button>
                        <Button type="button" variant="destructive" size="sm" onClick={() => setConfirmDeleteId(c.id)}>
                          Удалить
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      )}

      <AppPagination page={current} pageCount={pageCount} onPage={setPage} />

      <ConfirmDialog
        open={Boolean(confirmDeleteId)}
        onOpenChange={(open) => !open && setConfirmDeleteId(null)}
        description="Город будет удалён из каталога."
        onConfirm={() => confirmDeleteId && remove(confirmDeleteId)}
      />

      <Dialog open={Boolean(modal)} onOpenChange={(open) => !open && setModal(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{modal?.mode === "edit" ? "Редактировать город" : "Новый город"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3">
            <Field label="Название">
              <Input value={form.name} onChange={(e) => set("name", e.target.value)} autoFocus />
            </Field>
            <Field label="Регион">
              <div className="region-pick">
                <Select value={form.regionId || undefined} onValueChange={(v) => set("regionId", v)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Нет регионов" />
                  </SelectTrigger>
                  <SelectContent>
                    {regions.map((r) => (
                      <SelectItem key={r.id} value={r.id}>
                        {r.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button type="button" variant="outline" size="icon" onClick={openRegionModal} aria-label="Добавить регион">
                  <Plus />
                </Button>
              </div>
            </Field>
            <Field label="Описание">
              <Textarea rows={3} value={form.description} onChange={(e) => set("description", e.target.value)} />
            </Field>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setModal(null)}>
              Отмена
            </Button>
            <Button type="button" disabled={!form.name.trim() || !form.regionId} onClick={submit}>
              {modal?.mode === "edit" ? "Сохранить" : "Создать"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={regionModalOpen} onOpenChange={setRegionModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Новый регион</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3">
            <Field label="Название">
              <Input
                value={regionForm.name}
                onChange={(e) => setRegionForm((f) => ({ ...f, name: e.target.value }))}
                autoFocus
              />
            </Field>
            <Field label="Описание">
              <Textarea
                rows={3}
                value={regionForm.description}
                onChange={(e) => setRegionForm((f) => ({ ...f, description: e.target.value }))}
              />
            </Field>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setRegionModalOpen(false)}>
              Отмена
            </Button>
            <Button type="button" disabled={!regionForm.name.trim()} onClick={submitRegion}>
              Создать
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
