import { useMemo, useState } from "react";
import { toast } from "sonner";
import { type TariffPlan } from "../data/mock";
import { useTariffs } from "../data/tariffsStore";
import { usePackages } from "../data/packagesStore";
import { usd } from "../lib/format";
import { PageHead } from "../AppShell";
import { AppPagination } from "@/components/AppPagination";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { EmptyState } from "@/components/EmptyState";
import { Field } from "@/components/Field";
import { ActiveBadge } from "@/components/StatusBadge";
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
import { Switch } from "@/components/ui/switch";
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

type TariffForm = {
  name: string;
  price: string;
  description: string;
  active: boolean;
  packageIds: string[];
};

const emptyForm: TariffForm = {
  name: "",
  price: "",
  description: "",
  active: true,
  packageIds: [],
};

export function Tariffs() {
  const { tariffs, addTariff, updateTariff, deleteTariff } = useTariffs();
  const { packages } = usePackages();
  const [page, setPage] = useState(1);

  const [modal, setModal] = useState<{ mode: "create" | "edit"; id?: string } | null>(null);
  const [form, setForm] = useState<TariffForm>(emptyForm);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const pageCount = Math.max(1, Math.ceil(tariffs.length / PAGE_SIZE));
  const current = Math.min(page, pageCount);
  const pageItems = useMemo(
    () => tariffs.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE),
    [tariffs, current],
  );

  const set = <K extends keyof TariffForm>(key: K, value: TariffForm[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const openCreate = () => {
    setForm(emptyForm);
    setConfirmDelete(false);
    setModal({ mode: "create" });
  };

  const openEdit = (t: TariffPlan) => {
    setForm({
      name: t.name,
      price: String(t.price),
      description: t.description ?? "",
      active: t.active,
      packageIds: t.packageIds,
    });
    setConfirmDelete(false);
    setModal({ mode: "edit", id: t.id });
  };

  const addPackageToForm = (pkgId: string) => {
    if (!pkgId || form.packageIds.includes(pkgId)) return;
    set("packageIds", [...form.packageIds, pkgId]);
  };

  const removePackageFromForm = (pkgId: string) => {
    set(
      "packageIds",
      form.packageIds.filter((id) => id !== pkgId),
    );
  };

  const submit = () => {
    if (!form.name.trim()) return;
    const payload = {
      name: form.name.trim(),
      price: Number(form.price) || 0,
      description: form.description,
      active: form.active,
      packageIds: form.packageIds,
    };
    if (modal?.mode === "edit" && modal.id) {
      updateTariff(modal.id, payload);
      toast.success("Тариф сохранён");
    } else {
      addTariff(payload);
      toast.success("Тариф создан");
    }
    setModal(null);
  };

  const remove = () => {
    if (modal?.mode === "edit" && modal.id) {
      deleteTariff(modal.id);
      toast.success("Тариф удалён");
    }
    setModal(null);
    setConfirmDelete(false);
  };

  const selectedPackages = form.packageIds
    .map((id) => packages.find((p) => p.id === id))
    .filter((p): p is NonNullable<typeof p> => Boolean(p));
  const availablePackages = packages.filter((p) => !form.packageIds.includes(p.id));

  return (
    <>
      <PageHead
        title="Тарифы"
        actions={
          <Button type="button" onClick={openCreate}>
            + Добавить тариф
          </Button>
        }
      />

      {pageItems.length === 0 ? (
        <EmptyState
          title="Тарифные планы пока не настроены."
          action={
            <Button type="button" onClick={openCreate}>
              Добавить тариф
            </Button>
          }
        />
      ) : (
        <Card className="gap-0 overflow-hidden py-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Тариф</TableHead>
                <TableHead>Цена</TableHead>
                <TableHead>Пакеты</TableHead>
                <TableHead>Статус</TableHead>
                <TableHead className="text-right">Действия</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pageItems.map((t) => (
                <TableRow key={t.id}>
                  <TableCell>
                    <div className="font-medium">{t.name}</div>
                    {t.description && (
                      <div className="mt-0.5 max-w-md truncate text-xs text-muted-foreground">{t.description}</div>
                    )}
                  </TableCell>
                  <TableCell className="tabular-nums font-medium">{usd(t.price)} / мес</TableCell>
                  <TableCell>
                    {t.packageIds.length === 0 ? (
                      <span className="text-muted-foreground">—</span>
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {t.packageIds.slice(0, 3).map((id) => {
                          const pkg = packages.find((p) => p.id === id);
                          return (
                            <span className="tag-chip static" key={id}>
                              {pkg?.name ?? id}
                            </span>
                          );
                        })}
                        {t.packageIds.length > 3 && (
                          <span className="text-xs text-muted-foreground">+{t.packageIds.length - 3}</span>
                        )}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <ActiveBadge active={t.active} />
                  </TableCell>
                  <TableCell className="text-right">
                    <Button type="button" variant="outline" size="sm" onClick={() => openEdit(t)}>
                      Изменить
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      <AppPagination page={current} pageCount={pageCount} onPage={setPage} />

      <Dialog open={Boolean(modal)} onOpenChange={(open) => !open && setModal(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{modal?.mode === "edit" ? "Редактировать тариф" : "Новый тариф"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3">
            <div className="grid grid-cols-2 gap-3 max-[860px]:grid-cols-1">
              <Field label="Название">
                <Input value={form.name} onChange={(e) => set("name", e.target.value)} autoFocus />
              </Field>
              <Field label="Цена, $/мес">
                <Input type="number" min="0" value={form.price} onChange={(e) => set("price", e.target.value)} />
              </Field>
            </div>
            <Field label="Пакеты">
              <div className="tag-input">
                {selectedPackages.length > 0 && (
                  <div className="tag-list">
                    {selectedPackages.map((p) => (
                      <span className="tag-chip" key={p.id}>
                        {p.name}
                        <button type="button" onClick={() => removePackageFromForm(p.id)} aria-label="Удалить">
                          ✕
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                {availablePackages.length > 0 && (
                  <Select key={form.packageIds.join(",")} onValueChange={addPackageToForm}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Выберите пакет…" />
                    </SelectTrigger>
                    <SelectContent>
                      {availablePackages.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </Field>
            <Field label="Описание">
              <Textarea rows={3} value={form.description} onChange={(e) => set("description", e.target.value)} />
            </Field>
            <label className="flex items-center gap-2 text-sm font-medium">
              <Switch checked={form.active} onCheckedChange={(v) => set("active", v)} />
              Тариф активен
            </label>
          </div>
          <DialogFooter className="sm:justify-between">
            {modal?.mode === "edit" ? (
              <Button type="button" variant="destructive" onClick={() => setConfirmDelete(true)}>
                Удалить
              </Button>
            ) : (
              <span />
            )}
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => setModal(null)}>
                Отмена
              </Button>
              <Button type="button" disabled={!form.name.trim()} onClick={submit}>
                {modal?.mode === "edit" ? "Сохранить" : "Создать"}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="Удалить тариф?"
        description={`Удалить тариф «${form.name}»? Это действие необратимо.`}
        onConfirm={remove}
      />
    </>
  );
}
