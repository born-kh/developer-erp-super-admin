import { useEffect, useState } from "react";
import { Pencil } from "lucide-react";
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
  type BillableUnitCategoryType,
  type BillableUnitStage,
  type PackageListItem,
  type TariffIncludingPackages,
  type TariffInput,
  type TariffPriceLine,
} from "../lib/api";
import { formatMoney } from "../lib/format";
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
import { Skeleton } from "@/components/ui/skeleton";
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

const DEFAULT_PAGE_SIZE = 10;
const UNIT_TYPES: BillableUnitCategoryType[] = ["Residential", "Commercial", "Parking", "Basement"];
const UNIT_STAGES: BillableUnitStage[] = ["Active", "Completed"];

type Translations = Record<string, string>;

type PriceLineForm = {
  unitType: BillableUnitCategoryType;
  unitStage: BillableUnitStage;
  cost: string;
};

type TariffForm = {
  code: string;
  baseCost: string;
  description: Translations;
  active: boolean;
  packageIds: string[];
  priceLines: PriceLineForm[];
};

function nextAvailableLine(
  used: { unitType: BillableUnitCategoryType; unitStage: BillableUnitStage }[],
): PriceLineForm | null {
  for (const ut of UNIT_TYPES) {
    for (const us of UNIT_STAGES) {
      if (!used.some((pl) => pl.unitType === ut && pl.unitStage === us)) {
        return { unitType: ut, unitStage: us, cost: "" };
      }
    }
  }
  return null;
}

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
    baseCost: "",
    description: emptyTranslations(langs),
    active: true,
    packageIds: [],
    priceLines: [],
  });
  const [tariffs, setTariffs] = useState<TariffIncludingPackages[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [allPackages, setAllPackages] = useState<PackageListItem[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [hasPreviousPage, setHasPreviousPage] = useState(false);

  const [modal, setModal] = useState<{ mode: "create" | "edit"; id?: string } | null>(null);
  const [form, setForm] = useState<TariffForm>(() => makeEmptyForm());
  const [activeLang, setActiveLang] = useState<string>(defaultLang);
  const [originalPackageIds, setOriginalPackageIds] = useState<string[]>([]);
  const [newLine, setNewLine] = useState<PriceLineForm | null>(() => nextAvailableLine([]));
  const [editingLineIndex, setEditingLineIndex] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const fetchTariffs = async (pageArg: number, pageSizeArg: number) => {
    setLoadingList(true);
    try {
      const res = await listTariffsWithPackages({ page: pageArg, pageSize: pageSizeArg });
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
    fetchTariffs(page, pageSize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize]);

  const changePageSize = (size: number) => {
    setPageSize(size);
    setPage(1);
  };

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
    setNewLine(nextAvailableLine([]));
    setEditingLineIndex(null);
    setConfirmDelete(false);
    setModal({ mode: "create" });
  };

  const openEdit = async (row: TariffIncludingPackages) => {
    const packageIds = (row.packages ?? []).map((p) => p.id);
    setForm(makeEmptyForm());
    setOriginalPackageIds(packageIds);
    setActiveLang(defaultLang);
    setNewLine(nextAvailableLine([]));
    setEditingLineIndex(null);
    setConfirmDelete(false);
    setModal({ mode: "edit", id: row.id });
    try {
      const detail = await getTariff(row.id);
      setForm({
        code: detail.code ?? row.code ?? "",
        baseCost: String(detail.baseCost),
        description: toTranslations(detail.description, langs),
        active: detail.isActive,
        packageIds,
        priceLines: (detail.priceLines ?? []).map((pl) => ({
          unitType: pl.unitType,
          unitStage: pl.unitStage,
          cost: String(pl.cost),
        })),
      });
      setNewLine(nextAvailableLine(detail.priceLines ?? []));
    } catch (err) {
      toast.error(errorMessage(err, t.tariffs.errors.loadTariffs));
    }
  };

  const addPackageToForm = (pkgId: string) => {
    if (!pkgId || form.packageIds.includes(pkgId)) return;
    set("packageIds", [...form.packageIds, pkgId]);
  };

  const updatePriceLineCost = (index: number, cost: string) => {
    set(
      "priceLines",
      form.priceLines.map((pl, i) => (i === index ? { ...pl, cost } : pl)),
    );
  };

  const addPriceLine = () => {
    if (!newLine || !newLine.cost.trim()) return;
    if (form.priceLines.some((pl) => pl.unitType === newLine.unitType && pl.unitStage === newLine.unitStage)) return;
    const updated = [...form.priceLines, newLine];
    set("priceLines", updated);
    setNewLine(nextAvailableLine(updated));
  };

  const removePriceLine = (index: number) => {
    const updated = form.priceLines.filter((_, i) => i !== index);
    set("priceLines", updated);
    setNewLine((l) => l ?? nextAvailableLine(updated));
    setEditingLineIndex(null);
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
    const payload: TariffInput = {
      code: form.code.trim(),
      baseCost: Number(form.baseCost) || 0,
      isActive: form.active,
      descriptionTranslations: collectTranslations(form.description),
      priceLines: form.priceLines.map((pl): TariffPriceLine => ({
        unitType: pl.unitType,
        unitStage: pl.unitStage,
        cost: Number(pl.cost) || 0,
      })),
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
      await fetchTariffs(page, pageSize);
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
      await fetchTariffs(page, pageSize);
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

  const unitTypeLabel = (type: BillableUnitCategoryType) => {
    switch (type) {
      case "Residential":
        return t.tariffs.unitTypeResidential;
      case "Commercial":
        return t.tariffs.unitTypeCommercial;
      case "Parking":
        return t.tariffs.unitTypeParking;
      case "Basement":
        return t.tariffs.unitTypeBasement;
      default:
        return type;
    }
  };

  const unitStageLabel = (stage: BillableUnitStage) =>
    stage === "Active" ? t.tariffs.unitStageActive : t.tariffs.unitStageCompleted;

  const stagesForType = (ut: BillableUnitCategoryType) =>
    UNIT_STAGES.filter((us) => !form.priceLines.some((pl) => pl.unitType === ut && pl.unitStage === us));
  const availableUnitTypes = UNIT_TYPES.filter((ut) => stagesForType(ut).length > 0);

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
                <TableHead>{t.common.price(settings.subscriptionCurrencyCode || "USD")}</TableHead>
                <TableHead>{t.tariffs.tablePackages}</TableHead>
                <TableHead>{t.common.status}</TableHead>
                <TableHead className="text-right">{t.common.actions}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loadingList ? (
                Array.from({ length: Math.min(pageSize, 10) }, (_, i) => (
                  <TableRow key={i} className="animate-in fade-in duration-300">
                    <TableCell>
                      <Skeleton className="h-4 w-5" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-24" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-40" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-20" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-32" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-5 w-16 rounded-full" />
                    </TableCell>
                    <TableCell className="text-right">
                      <Skeleton className="ml-auto h-8 w-16" />
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                tariffs.map((row, index) => {
                  const pkgs = row.packages ?? [];
                  return (
                    <TableRow key={row.id}>
                      <TableCell className="tabular-nums text-muted-foreground">
                        {(page - 1) * pageSize + index + 1}
                      </TableCell>
                      <TableCell className="font-medium">{row.code}</TableCell>
                      <TableCell className="max-w-[220px]">
                        <div className={row.description ? "" : "text-muted-foreground"}>
                          {row.description || "—"}
                        </div>
                      </TableCell>
                      <TableCell className="tabular-nums font-medium">
                        {formatMoney(row.baseCost, settings.subscriptionCurrencyCode)} {t.tariffs.perMonth}
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
        pageSize={pageSize}
        onPageSizeChange={changePageSize}
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
              <Field label={t.common.price(settings.subscriptionCurrencyCode || "USD")}>
                <Input type="number" min="0" value={form.baseCost} onChange={(e) => set("baseCost", e.target.value)} />
              </Field>
            </div>
            <Field label={t.tariffs.priceLines}>
              <div className="grid gap-2">
                {form.priceLines.length > 0 && (
                  <div className="rounded-md border divide-y">
                    {form.priceLines.map((pl, idx) => (
                      <div
                        key={`${pl.unitType}-${pl.unitStage}`}
                        className="flex items-center justify-between gap-2 px-3 py-2 text-sm"
                      >
                        <span>
                          {unitTypeLabel(pl.unitType)} · {unitStageLabel(pl.unitStage)}
                        </span>
                        <div className="flex items-center gap-2">
                          {editingLineIndex === idx ? (
                            <Input
                              type="number"
                              min="0"
                              autoFocus
                              className="h-7 w-24 text-right tabular-nums"
                              value={pl.cost}
                              onChange={(e) => updatePriceLineCost(idx, e.target.value)}
                              onBlur={() => setEditingLineIndex(null)}
                              onKeyDown={(e) => e.key === "Enter" && setEditingLineIndex(null)}
                            />
                          ) : (
                            <>
                              <span className="font-medium tabular-nums">
                                {formatMoney(Number(pl.cost) || 0, settings.subscriptionCurrencyCode)}
                              </span>
                              <button
                                type="button"
                                onClick={() => setEditingLineIndex(idx)}
                                aria-label={t.common.edit}
                                className="text-muted-foreground hover:text-foreground"
                              >
                                <Pencil className="size-3.5" />
                              </button>
                            </>
                          )}
                          <button
                            type="button"
                            onClick={() => removePriceLine(idx)}
                            aria-label={t.common.delete}
                            className="text-muted-foreground hover:text-foreground"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {newLine ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <Select
                      value={newLine.unitType}
                      onValueChange={(v) => {
                        const ut = v as BillableUnitCategoryType;
                        const stages = stagesForType(ut);
                        setNewLine((l) =>
                          l ? { ...l, unitType: ut, unitStage: stages.includes(l.unitStage) ? l.unitStage : stages[0] } : l,
                        );
                      }}
                    >
                      <SelectTrigger className="w-36">
                        <SelectValue placeholder={t.tariffs.unitType} />
                      </SelectTrigger>
                      <SelectContent>
                        {availableUnitTypes.map((ut) => (
                          <SelectItem key={ut} value={ut}>
                            {unitTypeLabel(ut)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select
                      value={newLine.unitStage}
                      onValueChange={(v) => setNewLine((l) => (l ? { ...l, unitStage: v as BillableUnitStage } : l))}
                    >
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder={t.tariffs.unitStage} />
                      </SelectTrigger>
                      <SelectContent>
                        {stagesForType(newLine.unitType).map((us) => (
                          <SelectItem key={us} value={us}>
                            {unitStageLabel(us)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      type="number"
                      min="0"
                      className="w-28"
                      placeholder={t.common.price(settings.subscriptionCurrencyCode || "USD")}
                      value={newLine.cost}
                      onChange={(e) => setNewLine((l) => (l ? { ...l, cost: e.target.value } : l))}
                    />
                    <Button type="button" variant="outline" size="sm" onClick={addPriceLine}>
                      {t.tariffs.addPriceLine}
                    </Button>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">{t.tariffs.allPriceLinesAdded}</p>
                )}
              </div>
            </Field>
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
