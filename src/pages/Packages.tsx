import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  addPackagePermissions,
  createPackage,
  deletePackage,
  getPackage,
  getPackagePermissions,
  listPackages,
  listPermissionGroups,
  removePackagePermissions,
  updatePackage,
  ApiRequestError,
  type PackageDetail,
  type PermissionGroupWithPermissions,
} from "../lib/api";
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

const PAGE_SIZE = 6;
const LANGS = ["ru", "en", "tg"] as const;
type Lang = (typeof LANGS)[number];
const LANG_LABEL: Record<Lang, string> = { ru: "RU", en: "EN", tg: "TG" };

type Translations = Record<Lang, string>;

type PackageForm = {
  title: Translations;
  description: Translations;
  cost: string;
  active: boolean;
  permissionIds: string[];
};

const emptyTranslations = (): Translations => ({ ru: "", en: "", tg: "" });

const emptyForm: PackageForm = {
  title: emptyTranslations(),
  description: emptyTranslations(),
  cost: "",
  active: true,
  permissionIds: [],
};

function toTranslations(source: Record<string, string> | null | undefined): Translations {
  return { ru: source?.ru ?? "", en: source?.en ?? "", tg: source?.tg ?? "" };
}

function errorMessage(err: unknown, fallback: string) {
  return err instanceof ApiRequestError ? err.message : fallback;
}

export function Packages() {
  const [packages, setPackages] = useState<PackageDetail[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [groups, setGroups] = useState<PermissionGroupWithPermissions[]>([]);
  const [page, setPage] = useState(1);

  const [modal, setModal] = useState<{ mode: "create" | "edit"; id?: string } | null>(null);
  const [form, setForm] = useState<PackageForm>(emptyForm);
  const [activeLang, setActiveLang] = useState<Lang>("ru");
  const [originalPermissionIds, setOriginalPermissionIds] = useState<string[]>([]);
  const [permissionsLoading, setPermissionsLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const fetchPackages = async () => {
    setLoadingList(true);
    try {
      const list = await listPackages({ pageSize: 100 });
      const details = await Promise.all((list.items ?? []).map((p) => getPackage(p.id)));
      setPackages(details);
    } catch (err) {
      toast.error(errorMessage(err, "Не удалось загрузить пакеты"));
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    fetchPackages();
    listPermissionGroups()
      .then((res) => setGroups(res.items ?? []))
      .catch((err) => toast.error(errorMessage(err, "Не удалось загрузить права доступа")));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pageCount = Math.max(1, Math.ceil(packages.length / PAGE_SIZE));
  const current = Math.min(page, pageCount);
  const pageItems = useMemo(
    () => packages.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE),
    [packages, current],
  );

  const set = <K extends keyof PackageForm>(key: K, value: PackageForm[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const setTitle = (lang: Lang, value: string) =>
    setForm((f) => ({ ...f, title: { ...f.title, [lang]: value } }));

  const setDescription = (lang: Lang, value: string) =>
    setForm((f) => ({ ...f, description: { ...f.description, [lang]: value } }));

  const openCreate = () => {
    setForm(emptyForm);
    setActiveLang("ru");
    setOriginalPermissionIds([]);
    setModal({ mode: "create" });
  };

  const openEdit = async (p: PackageDetail) => {
    setForm({
      title: toTranslations(p.title),
      description: toTranslations(p.description),
      cost: String(p.cost),
      active: p.isActive,
      permissionIds: [],
    });
    setActiveLang("ru");
    setModal({ mode: "edit", id: p.id });
    setPermissionsLoading(true);
    try {
      const res = await getPackagePermissions(p.id);
      const ids = (res.items ?? []).map((x) => x.id);
      setForm((f) => ({ ...f, permissionIds: ids }));
      setOriginalPermissionIds(ids);
    } catch (err) {
      toast.error(errorMessage(err, "Не удалось загрузить права пакета"));
    } finally {
      setPermissionsLoading(false);
    }
  };

  const togglePermission = (id: string) => {
    setForm((f) => ({
      ...f,
      permissionIds: f.permissionIds.includes(id)
        ? f.permissionIds.filter((p) => p !== id)
        : [...f.permissionIds, id],
    }));
  };

  const collectTranslations = (t: Translations) =>
    Object.fromEntries(LANGS.filter((l) => t[l].trim()).map((l) => [l, t[l].trim()]));

  const submit = async () => {
    if (!form.title.ru.trim() || submitting) return;
    setSubmitting(true);
    const payload = {
      cost: Number(form.cost) || 0,
      isActive: form.active,
      titleTranslations: collectTranslations(form.title),
      descriptionTranslations: collectTranslations(form.description),
    };
    try {
      if (modal?.mode === "edit" && modal.id) {
        await updatePackage(modal.id, payload);
        const toAdd = form.permissionIds.filter((id) => !originalPermissionIds.includes(id));
        const toRemove = originalPermissionIds.filter((id) => !form.permissionIds.includes(id));
        if (toAdd.length) await addPackagePermissions(modal.id, toAdd);
        if (toRemove.length) await removePackagePermissions(modal.id, toRemove);
        toast.success("Пакет сохранён");
      } else {
        const beforeIds = new Set(packages.map((p) => p.id));
        await createPackage(payload);
        const list = await listPackages({ pageSize: 100 });
        const created = (list.items ?? []).find((p) => !beforeIds.has(p.id));
        if (created && form.permissionIds.length) {
          await addPackagePermissions(created.id, form.permissionIds);
        }
        toast.success("Пакет создан");
      }
      await fetchPackages();
      setModal(null);
    } catch (err) {
      toast.error(errorMessage(err, "Не удалось сохранить пакет"));
    } finally {
      setSubmitting(false);
    }
  };

  const remove = async (id: string) => {
    try {
      await deletePackage(id);
      setPackages((prev) => prev.filter((p) => p.id !== id));
      toast.success("Пакет удалён");
    } catch (err) {
      toast.error(errorMessage(err, "Не удалось удалить пакет"));
    } finally {
      setConfirmDeleteId(null);
    }
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

      {!loadingList && pageItems.length === 0 ? (
        <EmptyState
          title="Пакетов пока нет."
          action={
            <Button type="button" onClick={openCreate}>
              Добавить пакет
            </Button>
          }
        />
      ) : (
        <Card className="gap-0 overflow-hidden py-0">
          <Table>
            <TableHeader>
              <TableRow>
                {LANGS.map((l) => (
                  <TableHead key={l}>{LANG_LABEL[l]}</TableHead>
                ))}
                <TableHead>Цена</TableHead>
                <TableHead>Статус</TableHead>
                <TableHead className="text-right">Действия</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loadingList ? (
                <TableRow>
                  <TableCell colSpan={LANGS.length + 3} className="text-center text-muted-foreground">
                    Загрузка...
                  </TableCell>
                </TableRow>
              ) : (
                pageItems.map((p) => (
                  <TableRow key={p.id}>
                    {LANGS.map((l) => (
                      <TableCell key={l}>
                        <div className={p.title?.[l] ? "font-medium" : "text-muted-foreground"}>
                          {p.title?.[l] || "—"}
                        </div>
                        {p.description?.[l] && (
                          <div className="mt-0.5 max-w-[180px] truncate text-xs text-muted-foreground">
                            {p.description[l]}
                          </div>
                        )}
                      </TableCell>
                    ))}
                    <TableCell className="tabular-nums">{p.cost}</TableCell>
                    <TableCell>
                      <ActiveBadge active={p.isActive} />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="inline-flex gap-1.5">
                        <Button type="button" variant="outline" size="sm" onClick={() => openEdit(p)}>
                          Изменить
                        </Button>
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() => setConfirmDeleteId(p.id)}
                        >
                          Удалить
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
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
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{modal?.mode === "edit" ? "Редактировать пакет" : "Новый пакет"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3">
            <div className="flex gap-1">
              {LANGS.map((l) => (
                <button
                  key={l}
                  type="button"
                  onClick={() => setActiveLang(l)}
                  className={`rounded-md border px-2.5 py-1 text-xs font-semibold ${
                    activeLang === l
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-input text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {LANG_LABEL[l]}
                  {l === "ru" && !form.title.ru.trim() ? " *" : ""}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-3 max-[860px]:grid-cols-1">
              <Field label={`Название (${LANG_LABEL[activeLang]})`}>
                <Input
                  value={form.title[activeLang]}
                  onChange={(e) => setTitle(activeLang, e.target.value)}
                  autoFocus
                />
              </Field>
              <Field label="Цена, $/мес">
                <Input
                  type="number"
                  min="0"
                  value={form.cost}
                  onChange={(e) => set("cost", e.target.value)}
                />
              </Field>
            </div>
            <Field label={`Описание (${LANG_LABEL[activeLang]})`}>
              <Textarea
                rows={3}
                value={form.description[activeLang]}
                onChange={(e) => setDescription(activeLang, e.target.value)}
              />
            </Field>
            <Field label="Права доступа">
              {permissionsLoading ? (
                <p className="text-sm text-muted-foreground">Загрузка...</p>
              ) : groups.length === 0 ? (
                <p className="text-sm text-muted-foreground">Нет доступных прав.</p>
              ) : (
                <div className="grid max-h-64 gap-3 overflow-y-auto rounded-md border p-3">
                  {groups.map((g) => (
                    <div key={g.code} className="grid gap-1.5">
                      <div className="text-xs font-semibold text-muted-foreground">
                        {g.title}
                        {g.moduleDisplayName ? ` · ${g.moduleDisplayName}` : ""}
                      </div>
                      <div className="grid gap-1 pl-1">
                        {(g.permissions ?? []).map((perm) => (
                          <label key={perm.id} className="flex items-center gap-2 text-sm">
                            <input
                              type="checkbox"
                              className="size-4 accent-primary"
                              checked={form.permissionIds.includes(perm.id)}
                              onChange={() => togglePermission(perm.id)}
                            />
                            {perm.title}
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
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
            <Button type="button" disabled={!form.title.ru.trim() || submitting} onClick={submit}>
              {modal?.mode === "edit" ? "Сохранить" : "Создать"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
