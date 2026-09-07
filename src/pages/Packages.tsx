import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  createPackage,
  listPackagesAllIncludingPermissionGroups,
  ApiRequestError,
  type PackageListItemWithGroups,
} from "../lib/api";
import { useTranslation } from "../i18n/LanguageContext";
import { useModuleSettings } from "../data/moduleSettingsStore";
import { PageHead } from "../AppShell";
import { AppPagination } from "@/components/AppPagination";
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

type Translations = Record<string, string>;

type PackageForm = {
  title: Translations;
  description: Translations;
  cost: string;
  active: boolean;
};

const emptyTranslations = (langs: string[]): Translations =>
  Object.fromEntries(langs.map((l) => [l, ""]));

function errorMessage(err: unknown, fallback: string) {
  return err instanceof ApiRequestError ? err.message : fallback;
}

export function Packages() {
  const nav = useNavigate();
  const { t } = useTranslation();
  const { settings } = useModuleSettings();
  const langs = settings.supportedLanguages;
  const defaultLang = settings.defaultLanguage;
  const makeEmptyForm = (): PackageForm => ({
    title: emptyTranslations(langs),
    description: emptyTranslations(langs),
    cost: "",
    active: true,
  });
  const [packages, setPackages] = useState<PackageListItemWithGroups[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [page, setPage] = useState(1);

  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState<PackageForm>(() => makeEmptyForm());
  const [activeLang, setActiveLang] = useState<string>(defaultLang);
  const [submitting, setSubmitting] = useState(false);

  const fetchPackages = async () => {
    setLoadingList(true);
    try {
      const list = await listPackagesAllIncludingPermissionGroups({ pageSize: 100 });
      setPackages(list.items ?? []);
    } catch (err) {
      toast.error(errorMessage(err, t.packages.errors.loadPackages));
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    fetchPackages();
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

  const setTitle = (lang: string, value: string) =>
    setForm((f) => ({ ...f, title: { ...f.title, [lang]: value } }));

  const setDescription = (lang: string, value: string) =>
    setForm((f) => ({ ...f, description: { ...f.description, [lang]: value } }));

  const openCreate = () => {
    setForm(makeEmptyForm());
    setActiveLang(defaultLang);
    setShowCreate(true);
  };

  const collectTranslations = (translations: Translations) =>
    Object.fromEntries(langs.filter((l) => translations[l]?.trim()).map((l) => [l, translations[l].trim()]));

  const submit = async () => {
    if (!form.title[defaultLang]?.trim() || submitting) return;
    setSubmitting(true);
    const payload = {
      cost: Number(form.cost) || 0,
      isActive: form.active,
      titleTranslations: collectTranslations(form.title),
      descriptionTranslations: collectTranslations(form.description),
    };
    try {
      const beforeIds = new Set(packages.map((p) => p.id));
      await createPackage(payload);
      const list = await listPackagesAllIncludingPermissionGroups({ pageSize: 100 });
      const created = (list.items ?? []).find((p) => !beforeIds.has(p.id));
      toast.success(t.packages.toasts.created);
      setShowCreate(false);
      if (created) {
        nav(`/packages/${created.id}`);
      } else {
        await fetchPackages();
      }
    } catch (err) {
      toast.error(errorMessage(err, t.packages.errors.savePackage));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <PageHead
        title={t.packages.title}
        actions={
          <Button type="button" onClick={openCreate}>
            {t.packages.addPackage}
          </Button>
        }
      />

      {!loadingList && pageItems.length === 0 ? (
        <EmptyState
          title={t.packages.noPackagesYet}
          action={
            <Button type="button" onClick={openCreate}>
              {t.packages.addPackageAction}
            </Button>
          }
        />
      ) : (
        <Card className="gap-0 overflow-hidden py-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t.common.name}</TableHead>
                <TableHead>{t.packages.tablePrice}</TableHead>
                <TableHead>{t.packages.tablePermissionGroups}</TableHead>
                <TableHead>{t.common.status}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loadingList ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    {t.common.loading}
                  </TableCell>
                </TableRow>
              ) : (
                pageItems.map((p) => (
                  <TableRow
                    key={p.id}
                    className="cursor-pointer"
                    tabIndex={0}
                    onClick={() => nav(`/packages/${p.id}`)}
                    onKeyDown={(e) => e.key === "Enter" && nav(`/packages/${p.id}`)}
                  >
                    <TableCell>
                      <div className={p.title ? "font-medium" : "text-muted-foreground"}>
                        {p.title || "—"}
                      </div>
                      {p.description && (
                        <div className="mt-0.5 max-w-[220px] truncate text-xs text-muted-foreground">
                          {p.description}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="tabular-nums">{p.cost}</TableCell>
                    <TableCell>
                      {p.permissionGroupCodes.length === 0 ? (
                        <span className="text-muted-foreground">—</span>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {p.permissionGroupCodes.map((code) => (
                            <span className="tag-chip static" key={code}>
                              {code}
                            </span>
                          ))}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <ActiveBadge active={p.isActive} />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>
      )}

      <AppPagination page={current} pageCount={pageCount} onPage={setPage} />

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{t.packages.modalTitleCreate}</DialogTitle>
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
                  {l === defaultLang && !form.title[defaultLang]?.trim() ? " *" : ""}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-3 max-[860px]:grid-cols-1">
              <Field label={t.packages.nameLang(activeLang.toUpperCase())}>
                <Input
                  value={form.title[activeLang] ?? ""}
                  onChange={(e) => setTitle(activeLang, e.target.value)}
                  autoFocus
                />
              </Field>
              <Field label={t.common.price}>
                <Input
                  type="number"
                  min="0"
                  value={form.cost}
                  onChange={(e) => set("cost", e.target.value)}
                />
              </Field>
            </div>
            <Field label={t.packages.descLang(activeLang.toUpperCase())}>
              <Textarea
                rows={3}
                value={form.description[activeLang] ?? ""}
                onChange={(e) => setDescription(activeLang, e.target.value)}
              />
            </Field>
            <label className="flex items-center gap-2 text-sm font-medium">
              <Switch checked={form.active} onCheckedChange={(v) => set("active", v)} />
              {t.packages.packageActive}
            </label>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setShowCreate(false)}>
              {t.common.cancel}
            </Button>
            <Button type="button" disabled={!form.title[defaultLang]?.trim() || submitting} onClick={submit}>
              {t.common.create}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
