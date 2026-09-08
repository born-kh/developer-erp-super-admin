import { useEffect, useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  createCity,
  deleteCity,
  getCity,
  invalidateAllCitiesCache,
  listCities,
  updateCity,
  ApiRequestError,
  type CityListItem,
} from "../lib/api";
import { useTranslation } from "../i18n/LanguageContext";
import { useModuleSettings } from "../data/moduleSettingsStore";
import { PageHead } from "../AppShell";
import { AppPagination } from "@/components/AppPagination";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { EmptyState } from "@/components/EmptyState";
import { Field } from "@/components/Field";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const DEFAULT_PAGE_SIZE = 10;

type Translations = Record<string, string>;

type CityForm = {
  nameTranslations: Translations;
  order: string;
};

const emptyTranslations = (langs: string[]): Translations =>
  Object.fromEntries(langs.map((l) => [l, ""]));

function toTranslations(source: Record<string, string> | null | undefined, langs: string[]): Translations {
  return Object.fromEntries(langs.map((l) => [l, source?.[l] ?? ""]));
}

function errorMessage(err: unknown, fallback: string) {
  return err instanceof ApiRequestError ? err.message : fallback;
}

export function Cities() {
  const { t } = useTranslation();
  const { settings } = useModuleSettings();
  const langs = settings.supportedLanguages;
  const defaultLang = settings.defaultLanguage;
  const makeEmptyForm = (): CityForm => ({ nameTranslations: emptyTranslations(langs), order: "0" });

  const [cities, setCities] = useState<CityListItem[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [hasPreviousPage, setHasPreviousPage] = useState(false);

  const [modal, setModal] = useState<{ mode: "create" | "edit"; id?: string } | null>(null);
  const [form, setForm] = useState<CityForm>(() => makeEmptyForm());
  const [activeLang, setActiveLang] = useState<string>(defaultLang);
  const [submitting, setSubmitting] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const fetchCities = async (pageArg: number, pageSizeArg: number) => {
    setLoadingList(true);
    try {
      const res = await listCities({ page: pageArg, pageSize: pageSizeArg });
      setCities(res.items ?? []);
      setHasNextPage(res.pagination.hasNextPage);
      setHasPreviousPage(res.pagination.hasPreviousPage ?? pageArg > 1);
    } catch (err) {
      toast.error(errorMessage(err, t.cities.errors.loadCities));
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    fetchCities(page, pageSize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize]);

  const changePageSize = (size: number) => {
    setPageSize(size);
    setPage(1);
  };

  const setName = (lang: string, value: string) =>
    setForm((f) => ({ ...f, nameTranslations: { ...f.nameTranslations, [lang]: value } }));

  const openCreate = () => {
    setForm(makeEmptyForm());
    setActiveLang(defaultLang);
    setModal({ mode: "create" });
  };

  const openEdit = async (row: CityListItem) => {
    setForm(makeEmptyForm());
    setActiveLang(defaultLang);
    setModal({ mode: "edit", id: row.id });
    try {
      const detail = await getCity(row.id);
      setForm({
        nameTranslations: toTranslations(detail.nameTranslations, langs),
        order: String(detail.order),
      });
    } catch (err) {
      toast.error(errorMessage(err, t.cities.errors.loadCities));
    }
  };

  const collectTranslations = (translations: Translations) =>
    Object.fromEntries(langs.filter((l) => translations[l]?.trim()).map((l) => [l, translations[l].trim()]));

  const submit = async () => {
    if (!form.nameTranslations[defaultLang]?.trim() || submitting) return;
    setSubmitting(true);
    try {
      if (modal?.mode === "edit" && modal.id) {
        await updateCity(modal.id, {
          order: Number(form.order) || 0,
          nameTranslations: collectTranslations(form.nameTranslations),
        });
        toast.success(t.cities.toasts.citySaved);
      } else {
        await createCity({ nameTranslations: collectTranslations(form.nameTranslations) });
        toast.success(t.cities.toasts.cityCreated);
      }
      invalidateAllCitiesCache();
      await fetchCities(page, pageSize);
      setModal(null);
    } catch (err) {
      toast.error(errorMessage(err, t.cities.errors.saveCity));
    } finally {
      setSubmitting(false);
    }
  };

  const remove = async (id: string) => {
    try {
      await deleteCity(id);
      toast.success(t.cities.toasts.cityDeleted);
      invalidateAllCitiesCache();
      await fetchCities(page, pageSize);
    } catch (err) {
      toast.error(errorMessage(err, t.cities.errors.deleteCity));
    } finally {
      setConfirmDeleteId(null);
    }
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

      {!loadingList && cities.length === 0 ? (
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
                <TableHead className="w-10">{t.common.rowNumber}</TableHead>
                <TableHead>{t.common.city}</TableHead>
                <TableHead className="w-24">{t.cities.order}</TableHead>
                <TableHead className="text-right">{t.common.actions}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className={cn("transition-opacity duration-200", loadingList && cities.length > 0 && "opacity-50")}>
              {loadingList && cities.length === 0 ? (
                Array.from({ length: Math.min(pageSize, 10) }, (_, i) => (
                  <TableRow key={i} className="animate-in fade-in duration-300">
                    <TableCell>
                      <Skeleton className="h-4 w-5" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-40" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-8" />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="inline-flex gap-1.5">
                        <Skeleton className="h-8 w-16" />
                        <Skeleton className="h-8 w-16" />
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                cities.map((c, index) => (
                  <TableRow key={c.id}>
                    <TableCell className="tabular-nums text-muted-foreground">
                      {(page - 1) * pageSize + index + 1}
                    </TableCell>
                    <TableCell className="font-medium">{c.name || "—"}</TableCell>
                    <TableCell className="tabular-nums text-muted-foreground">{c.order}</TableCell>
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
                ))
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
                  {l === defaultLang && !form.nameTranslations[defaultLang]?.trim() ? " *" : ""}
                </button>
              ))}
            </div>
            <Field label={t.cities.nameLang(activeLang.toUpperCase())}>
              <Input
                value={form.nameTranslations[activeLang] ?? ""}
                onChange={(e) => setName(activeLang, e.target.value)}
                autoFocus
              />
            </Field>
            {modal?.mode === "edit" && (
              <Field label={t.cities.order}>
                <Input
                  type="number"
                  value={form.order}
                  onChange={(e) => setForm((f) => ({ ...f, order: e.target.value }))}
                />
              </Field>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setModal(null)}>
              {t.common.cancel}
            </Button>
            <Button
              type="button"
              disabled={!form.nameTranslations[defaultLang]?.trim() || submitting}
              onClick={submit}
            >
              {modal?.mode === "edit" ? t.common.save : t.common.create}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
