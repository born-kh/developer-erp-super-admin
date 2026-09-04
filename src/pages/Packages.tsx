import { useMemo, useState } from "react";
import { toast } from "sonner";
import { type PackagePlan } from "../data/mock";
import { usePackages } from "../data/packagesStore";
import { PageHead } from "../AppShell";
import { AppPagination } from "@/components/AppPagination";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { EmptyState } from "@/components/EmptyState";
import { Field } from "@/components/Field";
import { ActiveBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

const PAGE_SIZE = 6;

type PackageForm = {
  name: string;
  description: string;
  active: boolean;
  modules: string[];
};

const emptyForm: PackageForm = {
  name: "",
  description: "",
  active: true,
  modules: [],
};

export function Packages() {
  const { packages, addPackage, updatePackage, deletePackage } = usePackages();
  const [page, setPage] = useState(1);

  const [modal, setModal] = useState<{ mode: "create" | "edit"; id?: string } | null>(null);
  const [form, setForm] = useState<PackageForm>(emptyForm);
  const [moduleDraft, setModuleDraft] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const pageCount = Math.max(1, Math.ceil(packages.length / PAGE_SIZE));
  const current = Math.min(page, pageCount);
  const pageItems = useMemo(
    () => packages.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE),
    [packages, current],
  );

  const set = <K extends keyof PackageForm>(key: K, value: PackageForm[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const openCreate = () => {
    setForm(emptyForm);
    setModuleDraft("");
    setModal({ mode: "create" });
  };

  const openEdit = (p: PackagePlan) => {
    setForm({
      name: p.name,
      description: p.description ?? "",
      active: p.active,
      modules: p.modules,
    });
    setModuleDraft("");
    setModal({ mode: "edit", id: p.id });
  };

  const addModule = () => {
    const value = moduleDraft.trim();
    if (!value) return;
    set("modules", [...form.modules, value]);
    setModuleDraft("");
  };

  const removeModule = (index: number) => {
    set(
      "modules",
      form.modules.filter((_, i) => i !== index),
    );
  };

  const submit = () => {
    if (!form.name.trim()) return;
    const payload = {
      name: form.name.trim(),
      description: form.description,
      active: form.active,
      modules: form.modules,
    };
    if (modal?.mode === "edit" && modal.id) {
      updatePackage(modal.id, payload);
      toast.success("Пакет сохранён");
    } else {
      addPackage(payload);
      toast.success("Пакет создан");
    }
    setModal(null);
  };

  const remove = (id: string) => {
    deletePackage(id);
    setConfirmDeleteId(null);
    toast.success("Пакет удалён");
  };

  return (
    <>
      <PageHead
        title="Пакеты"
        actions={
          <Button type="button" onClick={openCreate}>
            + Добавить пакет
          </Button>
        }
      />

      {pageItems.length === 0 ? (
        <EmptyState
          title="Пакетов пока нет."
          action={
            <Button type="button" onClick={openCreate}>
              Добавить пакет
            </Button>
          }
        />
      ) : (
        <Card>
          <CardContent className="px-4.5 py-1">
            {pageItems.map((p) => (
              <div className="pkg-row" key={p.id}>
                <div className="pkg-row-main">
                  <div className="pkg-row-title">
                    <b>{p.name}</b>
                    <ActiveBadge active={p.active} />
                  </div>
                  {p.description && <p className="text-sm text-muted-foreground pkg-row-desc">{p.description}</p>}
                  {p.modules.length > 0 && (
                    <div className="pkg-row-tags">
                      {p.modules.map((m) => (
                        <span className="tag-chip static" key={m}>
                          {m}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="owner-row-actions">
                  <Button type="button" variant="outline" size="sm" onClick={() => openEdit(p)}>
                    Изменить
                  </Button>
                  <Button type="button" variant="destructive" size="sm" onClick={() => setConfirmDeleteId(p.id)}>
                    Удалить
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <AppPagination page={current} pageCount={pageCount} onPage={setPage} />

      <ConfirmDialog
        open={Boolean(confirmDeleteId)}
        onOpenChange={(open) => !open && setConfirmDeleteId(null)}
        description="Пакет будет удалён без возможности восстановления."
        onConfirm={() => confirmDeleteId && remove(confirmDeleteId)}
      />

      <Dialog open={Boolean(modal)} onOpenChange={(open) => !open && setModal(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{modal?.mode === "edit" ? "Редактировать пакет" : "Новый пакет"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3">
            <Field label="Название">
              <Input value={form.name} onChange={(e) => set("name", e.target.value)} autoFocus />
            </Field>
            <Field label="Возможности">
              <div className="tag-input">
                {form.modules.length > 0 && (
                  <div className="tag-list">
                    {form.modules.map((m, i) => (
                      <span className="tag-chip" key={`${m}-${i}`}>
                        {m}
                        <button type="button" onClick={() => removeModule(i)} aria-label="Удалить">
                          ✕
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                <div className="tag-add">
                  <Input
                    value={moduleDraft}
                    onChange={(e) => setModuleDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addModule();
                      }
                    }}
                    placeholder="Введите и нажмите Enter"
                  />
                  <Button type="button" variant="outline" size="sm" onClick={addModule}>
                    Добавить
                  </Button>
                </div>
              </div>
            </Field>
            <Field label="Описание">
              <Textarea rows={3} value={form.description} onChange={(e) => set("description", e.target.value)} />
            </Field>
            <label className="flex items-center gap-2 text-sm font-medium">
              <Switch checked={form.active} onCheckedChange={(v) => set("active", v)} />
              Пакет активен
            </label>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setModal(null)}>
              Отмена
            </Button>
            <Button type="button" disabled={!form.name.trim()} onClick={submit}>
              {modal?.mode === "edit" ? "Сохранить" : "Создать"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
