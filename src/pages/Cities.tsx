import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { type CityItem } from "../data/mock";
import { useCityCatalog } from "../data/cityCatalogStore";
import { useRegions } from "../data/regionsStore";
import { useTranslation } from "../i18n/LanguageContext";
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
  const { t } = useTranslation();
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
      toast.success(t.cities.toasts.citySaved);
    } else {
      addCity(payload);
      toast.success(t.cities.toasts.cityCreated);
    }
    setModal(null);
  };

  const remove = (id: string) => {
    deleteCity(id);
    setConfirmDeleteId(null);
    toast.success(t.cities.toasts.cityDeleted);
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
    toast.success(t.cities.toasts.regionCreated);
  };

  return (
    <>
      <PageHead
        title={t.cities.title}
        actions={
          <Button type="button" onClick={openCreate}>
            {t.cities.addCity}
          </Button>
        }
      />

      {pageItems.length === 0 ? (
        <EmptyState
          title={t.cities.noCitiesYet}
          action={
            <Button type="button" onClick={openCreate}>
              {t.cities.addCityAction}
            </Button>
          }
        />
      ) : (
        <Card className="gap-0 overflow-hidden py-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t.common.city}</TableHead>
                <TableHead>{t.common.region}</TableHead>
                <TableHead>{t.common.description}</TableHead>
                <TableHead className="text-right">{t.common.actions}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pageItems.map((c) => {
                const region = regions.find((r) => r.id === c.regionId);
                return (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.name}</TableCell>
                    <TableCell className="text-muted-foreground">{region?.name ?? t.cities.noRegion}</TableCell>
                    <TableCell className="max-w-xs truncate text-muted-foreground">{c.description || "—"}</TableCell>
                    <TableCell className="text-right">
                      <div className="inline-flex gap-1.5">
                        <Button type="button" variant="outline" size="sm" onClick={() => openEdit(c)}>
                          {t.common.edit}
                        </Button>
                        <Button type="button" variant="destructive" size="sm" onClick={() => setConfirmDeleteId(c.id)}>
                          {t.common.delete}
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
        description={t.cities.deleteDesc}
        onConfirm={() => confirmDeleteId && remove(confirmDeleteId)}
      />

      <Dialog open={Boolean(modal)} onOpenChange={(open) => !open && setModal(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{modal?.mode === "edit" ? t.cities.modalTitleEdit : t.cities.modalTitleCreate}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3">
            <Field label={t.common.name}>
              <Input value={form.name} onChange={(e) => set("name", e.target.value)} autoFocus />
            </Field>
            <Field label={t.common.region}>
              <div className="region-pick">
                <Select value={form.regionId || undefined} onValueChange={(v) => set("regionId", v)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={t.cities.noRegions} />
                  </SelectTrigger>
                  <SelectContent>
                    {regions.map((r) => (
                      <SelectItem key={r.id} value={r.id}>
                        {r.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button type="button" variant="outline" size="icon" onClick={openRegionModal} aria-label={t.cities.addRegionLabel}>
                  <Plus />
                </Button>
              </div>
            </Field>
            <Field label={t.common.description}>
              <Textarea rows={3} value={form.description} onChange={(e) => set("description", e.target.value)} />
            </Field>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setModal(null)}>
              {t.common.cancel}
            </Button>
            <Button type="button" disabled={!form.name.trim() || !form.regionId} onClick={submit}>
              {modal?.mode === "edit" ? t.common.save : t.common.create}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={regionModalOpen} onOpenChange={setRegionModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.cities.newRegionTitle}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3">
            <Field label={t.common.name}>
              <Input
                value={regionForm.name}
                onChange={(e) => setRegionForm((f) => ({ ...f, name: e.target.value }))}
                autoFocus
              />
            </Field>
            <Field label={t.common.description}>
              <Textarea
                rows={3}
                value={regionForm.description}
                onChange={(e) => setRegionForm((f) => ({ ...f, description: e.target.value }))}
              />
            </Field>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setRegionModalOpen(false)}>
              {t.common.cancel}
            </Button>
            <Button type="button" disabled={!regionForm.name.trim()} onClick={submitRegion}>
              {t.common.create}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
