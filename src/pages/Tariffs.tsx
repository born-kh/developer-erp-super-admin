import { useEffect, useState } from "react";
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
import { useTranslation } from "../i18n/LanguageContext";
import { useModuleSettings } from "../data/moduleSettingsStore";
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

const PAGE_SIZE = 10;

type Translations = Record<string, string>;

type TariffForm = {
  code: string;
  cost: string;
  description: Translations;
  active: boolean;
  packageIds: string[];
};

const emptyTranslations = (langs: string[]): Translations =>
  Object.fromEntries(langs.map((l) => [l, ""]));

function toTranslations(source: Record<string, string> | null | undefined, langs: string[]): Translations {
  return Object.fromEntries(langs.map((l) => [l, source?.[l] ?? ""]));
}

function errorMessage(err: unknown, fallback: string) {
  return err instanceof ApiRequestError ? err.message : fallback;
}

export function Tariffs() {
  const { t } = useTranslation();
  const { settings } = useModuleSettings();
  const langs = settings.supportedLanguages;
  const defaultLang = settings.defaultLanguage;
  const makeEmptyForm = (): TariffForm => ({
    code: "",
    cost: "",
    description: emptyTranslations(langs),
    active: true,
    packageIds: [],
  });
  const [tariffs, setTariffs] = useState<TariffIncludingPackages[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [allPackages, setAllPackages] = useState<PackageListItem[]>([]);
  const [page, setPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [hasPreviousPage, setHasPreviousPage] = useState(false);

  const [modal, setModal] = useState<{ mode: "create" | "edit"; id?: string } | null>(null);
  const [form, setForm] = useState<TariffForm>(() => makeEmptyForm());
  const [activeLang, setActiveLang] = useState<string>(defaultLang);
  const [originalPackageIds, setOriginalPackageIds] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const fetchTariffs = async (pageArg: number) => {
    setLoadingList(true);
    try {
      const res = await listTariffsWithPackages({ page: pageArg, pageSize: PAGE_SIZE });
      setTariffs(res.items ?? []);
      setHasNextPage(res.pagination.hasNextPage);
      setHasPreviousPage(res.pagination.hasPreviousPage ?? pageArg > 1);
    } catch (err) {
      toast.error(errorMessage(err, t.tariffs.errors.loadTariffs));
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    fetchTariffs(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  useEffect(() => {
    listPackages({ pageSize: 100 })
      .then((res) => setAllPackages(res.items ?? []))
      .catch((err) => toast.error(errorMessage(err, t.tariffs.errors.loadPackages)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const set = <K extends keyof TariffForm>(key: K, value: TariffForm[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const setDescription = (lang: string, value: string) =>
    setForm((f) => ({ ...f, description: { ...f.description, [lang]: value } }));

  const openCreate = () => {
    setForm(makeEmptyForm());
    setActiveLang(defaultLang);
    setOriginalPackageIds([]);
    setConfirmDelete(false);
    setModal({ mode: "create" });
  };

  const openEdit = async (row: TariffIncludingPackages) => {
    const packageIds = (row.packages ?? []).map((p) => p.id);
    setForm(makeEmptyForm());
    setOriginalPackageIds(packageIds);
    setActiveLang(defaultLang);
    setConfirmDelete(false);
    setModal({ mode: "edit", id: row.id });
    try {
      const detail = await getTariff(row.id);
      setForm({
        code: detail.code ?? row.code ?? "",
        cost: String(detail.cost),
        description: toTranslations(detail.description, langs),
        active: detail.isActive,
        packageIds,
      });
    } catch (err) {
      toast.error(errorMessage(err, t.tariffs.errors.loadTariffs));
    }
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

  const collectTranslations = (translations: Translations) =>
    Object.fromEntries(langs.filter((l) => translations[l]?.trim()).map((l) => [l, translations[l].trim()]));

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
        toast.success(t.tariffs.toasts.saved);
      } else {
        const beforeIds = new Set(
          (await listTariffsWithPackages({ pageSize: 100 })).items?.map((row) => row.id) ?? [],
        );
        await createTariff(payload);
        const list = await listTariffsWithPackages({ pageSize: 100 });
        const created = list.items?.find((row) => !beforeIds.has(row.id));
        if (created && form.packageIds.length) {
          await addTariffPackages(created.id, form.packageIds);
        }
        toast.success(t.tariffs.toasts.created);
      }
      await fetchTariffs(page);
      setModal(null);
    } catch (err) {
      toast.error(errorMessage(err, t.tariffs.errors.saveTariff));
    } finally {
      setSubmitting(false);
    }
  };

  const remove = async () => {
    if (modal?.mode !== "edit" || !modal.id) return;
    try {
      await deleteTariff(modal.id);
      toast.success(t.tariffs.toasts.deleted);
      setModal(null);
      await fetchTariffs(page);
    } catch (err) {
      toast.error(errorMessage(err, t.tariffs.errors.deleteTariff));
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
        title={t.tariffs.title}
        actions={
          <Button type="button" onClick={openCreate}>
            {t.tariffs.addTariff}
          </Button>
        }
      />

      {!loadingList && tariffs.length === 0 ? (
        <EmptyState
          title={t.tariffs.noTariffsYet}
          action={
            <Button type="button" onClick={openCreate}>
              {t.tariffs.addTariffAction}
            </Button>
          }
        />
      ) : (
        <Card className="gap-0 overflow-hidden py-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">{t.common.rowNumber}</TableHead>
                <TableHead>{t.tariffs.tableTariff}</TableHead>
                <TableHead>{t.common.description}</TableHead>
                <TableHead>{t.common.price}</TableHead>
                <TableHead>{t.tariffs.tablePackages}</TableHead>
                <TableHead>{t.common.status}</TableHead>
                <TableHead className="text-right">{t.common.actions}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loadingList ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    {t.common.loading}
                  </TableCell>
                </TableRow>
              ) : (
                tariffs.map((row, index) => {
                  const pkgs = row.packages ?? [];
                  return (
                    <TableRow key={row.id}>
                      <TableCell className="tabular-nums text-muted-foreground">
                        {(page - 1) * PAGE_SIZE + index + 1}
                      </TableCell>
                      <TableCell className="font-medium">{row.code}</TableCell>
                      <TableCell className="max-w-[220px]">
                        <div className={row.description ? "" : "text-muted-foreground"}>
                          {row.description || "—"}
                        </div>
                      </TableCell>
                      <TableCell className="tabular-nums font-medium">
                        {usd(row.cost)} {t.tariffs.perMonth}
                        {row.originalCost > row.cost && (
                          <div className="text-xs text-muted-foreground line-through">
                            {usd(row.originalCost)}
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
                              <span className="tag-chip static text-muted-foreground">+{pkgs.length - 3}</span>
                            )}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <ActiveBadge active={row.isActive} />
                      </TableCell>
                      <TableCell className="text-right">
                        <Button type="button" variant="outline" size="sm" onClick={() => openEdit(row)}>
                          {t.common.edit}
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

      <AppPagination
        page={page}
        onPage={setPage}
        hasNextPage={hasNextPage}
        hasPreviousPage={hasPreviousPage}
        alwaysShow
      />

      <Dialog open={Boolean(modal)} onOpenChange={(open) => !open && setModal(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{modal?.mode === "edit" ? t.tariffs.modalTitleEdit : t.tariffs.modalTitleCreate}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3">
            <div className="grid grid-cols-2 gap-3 max-[860px]:grid-cols-1">
              <Field label={t.tariffs.code}>
                <Input value={form.code} onChange={(e) => set("code", e.target.value)} autoFocus />
              </Field>
              <Field label={t.common.price}>
                <Input type="number" min="0" value={form.cost} onChange={(e) => set("cost", e.target.value)} />
              </Field>
            </div>
            <Field label={t.tariffs.packagesLabel}>
              <div className="tag-input">
                {selectedPackages.length > 0 && (
                  <div className="tag-list">
                    {selectedPackages.map((p) => (
                      <span className="tag-chip" key={p.id}>
                        {p.title}
                        <button type="button" onClick={() => removePackageFromForm(p.id)} aria-label={t.common.delete}>
                          ✕
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                {availablePackages.length > 0 && (
                  <Select key={form.packageIds.join(",")} onValueChange={addPackageToForm}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={t.tariffs.choosePackage} />
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
              {langs.map((l) => (
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
                  {l.toUpperCase()}
                </button>
              ))}
            </div>
            <Field label={t.tariffs.descLang(activeLang.toUpperCase())}>
              <Textarea
                rows={3}
                value={form.description[activeLang] ?? ""}
                onChange={(e) => setDescription(activeLang, e.target.value)}
              />
            </Field>
            <label className="flex items-center gap-2 text-sm font-medium">
              <Switch checked={form.active} onCheckedChange={(v) => set("active", v)} />
              {t.tariffs.tariffActive}
            </label>
          </div>
          <DialogFooter className="sm:justify-between">
            {modal?.mode === "edit" ? (
              <Button type="button" variant="destructive" onClick={() => setConfirmDelete(true)}>
                {t.common.delete}
              </Button>
            ) : (
              <span />
            )}
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => setModal(null)}>
                {t.common.cancel}
              </Button>
              <Button type="button" disabled={!form.code.trim() || submitting} onClick={submit}>
                {modal?.mode === "edit" ? t.common.save : t.common.create}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title={t.tariffs.deleteTariffTitle}
        description={t.tariffs.deleteTariffDesc(form.code)}
        onConfirm={remove}
      />
    </>
  );
}
