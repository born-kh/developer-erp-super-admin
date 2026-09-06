import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  addTariffPackages,
  createTariff,
  deleteTariff,
  getTariff,
  listPackages,
  listTariffsWithPackages,
  removeTariffPackages,
  updateTariff,
  ApiRequestError,
  type PackageListItem,
  type TariffIncludingPackages,
} from "../lib/api";
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
const LANGS = ["ru", "en", "tg"] as const;
type Lang = (typeof LANGS)[number];
const LANG_LABEL: Record<Lang, string> = { ru: "RU", en: "EN", tg: "TG" };

type Translations = Record<Lang, string>;

type TariffForm = {
  code: string;
  cost: string;
  description: Translations;
  active: boolean;
  packageIds: string[];
};

const emptyTranslations = (): Translations => ({ ru: "", en: "", tg: "" });

const emptyForm: TariffForm = {
  code: "",
  cost: "",
  description: emptyTranslations(),
  active: true,
  packageIds: [],
};

function toTranslations(source: Record<string, string> | null | undefined): Translations {
  return { ru: source?.ru ?? "", en: source?.en ?? "", tg: source?.tg ?? "" };
}

function errorMessage(err: unknown, fallback: string) {
  return err instanceof ApiRequestError ? err.message : fallback;
}

type TariffRow = Omit<TariffIncludingPackages, "description"> & { description: Translations };

export function Tariffs() {
  const [tariffs, setTariffs] = useState<TariffRow[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [allPackages, setAllPackages] = useState<PackageListItem[]>([]);
  const [page, setPage] = useState(1);

  const [modal, setModal] = useState<{ mode: "create" | "edit"; id?: string } | null>(null);
  const [form, setForm] = useState<TariffForm>(emptyForm);
  const [activeLang, setActiveLang] = useState<Lang>("ru");
  const [originalPackageIds, setOriginalPackageIds] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const fetchTariffs = async () => {
    setLoadingList(true);
    try {
      const res = await listTariffsWithPackages({ pageSize: 100 });
      const items = res.items ?? [];
      const withDescriptions = await Promise.all(
        items.map(async (t): Promise<TariffRow> => {
          const detail = await getTariff(t.id);
          return { ...t, description: toTranslations(detail.description) };
        }),
      );
      setTariffs(withDescriptions);
    } catch (err) {
      toast.error(errorMessage(err, "Не удалось загрузить тарифы"));
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    fetchTariffs();
    listPackages({ pageSize: 100 })
      .then((res) => setAllPackages(res.items ?? []))
      .catch((err) => toast.error(errorMessage(err, "Не удалось загрузить пакеты")));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pageCount = Math.max(1, Math.ceil(tariffs.length / PAGE_SIZE));
  const current = Math.min(page, pageCount);
  const pageItems = useMemo(
    () => tariffs.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE),
    [tariffs, current],
  );

  const set = <K extends keyof TariffForm>(key: K, value: TariffForm[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const setDescription = (lang: Lang, value: string) =>
    setForm((f) => ({ ...f, description: { ...f.description, [lang]: value } }));

  const openCreate = () => {
    setForm(emptyForm);
    setActiveLang("ru");
    setOriginalPackageIds([]);
    setConfirmDelete(false);
    setModal({ mode: "create" });
  };

  const openEdit = (t: TariffRow) => {
    const packageIds = (t.packages ?? []).map((p) => p.id);
    setForm({
      code: t.code ?? "",
      cost: String(t.cost),
      description: t.description,
      active: t.isActive,
      packageIds,
    });
    setOriginalPackageIds(packageIds);
    setActiveLang("ru");
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

  const collectTranslations = (t: Translations) =>
    Object.fromEntries(LANGS.filter((l) => t[l].trim()).map((l) => [l, t[l].trim()]));

  const submit = async () => {
    if (!form.code.trim() || submitting) return;
    setSubmitting(true);
    const payload = {
      code: form.code.trim(),
      cost: Number(form.cost) || 0,
      isActive: form.active,
      descriptionTranslations: collectTranslations(form.description),
    };
    try {
      if (modal?.mode === "edit" && modal.id) {
        await updateTariff(modal.id, payload);
        const toAdd = form.packageIds.filter((id) => !originalPackageIds.includes(id));
        const toRemove = originalPackageIds.filter((id) => !form.packageIds.includes(id));
        if (toAdd.length) await addTariffPackages(modal.id, toAdd);
        if (toRemove.length) await removeTariffPackages(modal.id, toRemove);
        toast.success("Тариф сохранён");
      } else {
        const beforeIds = new Set(tariffs.map((t) => t.id));
        await createTariff(payload);
        const list = await listTariffsWithPackages({ pageSize: 100 });
        const created = list.items?.find((t) => !beforeIds.has(t.id));
        if (created && form.packageIds.length) {
          await addTariffPackages(created.id, form.packageIds);
        }
        toast.success("Тариф создан");
      }
      await fetchTariffs();
      setModal(null);
    } catch (err) {
      toast.error(errorMessage(err, "Не удалось сохранить тариф"));
    } finally {
      setSubmitting(false);
    }
  };

  const remove = async () => {
    if (modal?.mode !== "edit" || !modal.id) return;
    try {
      await deleteTariff(modal.id);
      setTariffs((prev) => prev.filter((t) => t.id !== modal.id));
      toast.success("Тариф удалён");
      setModal(null);
    } catch (err) {
      toast.error(errorMessage(err, "Не удалось удалить тариф"));
    } finally {
      setConfirmDelete(false);
    }
  };

  const selectedPackages = form.packageIds
    .map((id) => allPackages.find((p) => p.id === id))
    .filter((p): p is PackageListItem => Boolean(p));
  const availablePackages = allPackages.filter((p) => !form.packageIds.includes(p.id));

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

      {!loadingList && pageItems.length === 0 ? (
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
                {LANGS.map((l) => (
                  <TableHead key={l}>{LANG_LABEL[l]}</TableHead>
                ))}
                <TableHead>Цена</TableHead>
                <TableHead>Пакеты</TableHead>
                <TableHead>Статус</TableHead>
                <TableHead className="text-right">Действия</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loadingList ? (
                <TableRow>
                  <TableCell colSpan={LANGS.length + 5} className="text-center text-muted-foreground">
                    Загрузка...
                  </TableCell>
                </TableRow>
              ) : (
                pageItems.map((t) => {
                  const pkgs = t.packages ?? [];
                  return (
                    <TableRow key={t.id}>
                      <TableCell className="font-medium">{t.code}</TableCell>
                      {LANGS.map((l) => (
                        <TableCell key={l} className="max-w-[160px]">
                          <div className={t.description[l] ? "" : "text-muted-foreground"}>
                            {t.description[l] || "—"}
                          </div>
                        </TableCell>
                      ))}
                      <TableCell className="tabular-nums font-medium">
                        {usd(t.cost)} / мес
                        {t.originalCost > t.cost && (
                          <div className="text-xs text-muted-foreground line-through">
                            {usd(t.originalCost)}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {pkgs.length === 0 ? (
                          <span className="text-muted-foreground">—</span>
                        ) : (
                          <div className="flex flex-wrap gap-1">
                            {pkgs.slice(0, 3).map((p) => (
                              <span className="tag-chip static" key={p.id}>
                                {p.title}
                              </span>
                            ))}
                            {pkgs.length > 3 && (
                              <span className="text-xs text-muted-foreground">+{pkgs.length - 3}</span>
                            )}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <ActiveBadge active={t.isActive} />
                      </TableCell>
                      <TableCell className="text-right">
                        <Button type="button" variant="outline" size="sm" onClick={() => openEdit(t)}>
                          Изменить
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
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
              <Field label="Код тарифа">
                <Input value={form.code} onChange={(e) => set("code", e.target.value)} autoFocus />
              </Field>
              <Field label="Цена, $/мес">
                <Input type="number" min="0" value={form.cost} onChange={(e) => set("cost", e.target.value)} />
              </Field>
            </div>
            <Field label="Пакеты">
              <div className="tag-input">
                {selectedPackages.length > 0 && (
                  <div className="tag-list">
                    {selectedPackages.map((p) => (
                      <span className="tag-chip" key={p.id}>
                        {p.title}
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
                          {p.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </Field>
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
                </button>
              ))}
            </div>
            <Field label={`Описание (${LANG_LABEL[activeLang]})`}>
              <Textarea
                rows={3}
                value={form.description[activeLang]}
                onChange={(e) => setDescription(activeLang, e.target.value)}
              />
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
              <Button type="button" disabled={!form.code.trim() || submitting} onClick={submit}>
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
        description={`Удалить тариф «${form.code}»? Это действие необратимо.`}
        onConfirm={remove}
      />
    </>
  );
}
