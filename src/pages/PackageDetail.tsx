import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Search } from "lucide-react";
import { toast } from "sonner";
import {
  addPackagePermissions,
  deletePackage,
  getPackage,
  getPackagePermissions,
  listPermissionGroups,
  removePackagePermissions,
  updatePackage,
  ApiRequestError,
  type PackageDetail as PackageDetailData,
  type PermissionGroupWithPermissions,
} from "../lib/api";
import { useTranslation } from "../i18n/LanguageContext";
import { useModuleSettings } from "../data/moduleSettingsStore";
import { PageHead } from "../AppShell";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { Field } from "@/components/Field";
import { PermissionManagerDialog } from "@/components/PermissionManagerDialog";
import { ActiveBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

type Translations = Record<string, string>;

type PackageForm = {
  title: Translations;
  description: Translations;
  cost: string;
  active: boolean;
};

function toTranslations(source: Record<string, string> | null | undefined, langs: string[]): Translations {
  return Object.fromEntries(langs.map((l) => [l, source?.[l] ?? ""]));
}

function errorMessage(err: unknown, fallback: string) {
  return err instanceof ApiRequestError ? err.message : fallback;
}

export function PackageDetail() {
  const { id } = useParams<{ id: string }>();
  const nav = useNavigate();
  const { t } = useTranslation();
  const { settings } = useModuleSettings();
  const langs = settings.supportedLanguages;
  const defaultLang = settings.defaultLanguage;

  const [pkg, setPkg] = useState<PackageDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<PackageForm | null>(null);
  const [activeLang, setActiveLang] = useState<string>(defaultLang);
  const [saving, setSaving] = useState(false);

  const [assignedIds, setAssignedIds] = useState<string[]>([]);
  const [groups, setGroups] = useState<PermissionGroupWithPermissions[]>([]);
  const [groupsLoading, setGroupsLoading] = useState(true);
  const [permissionManagerOpen, setPermissionManagerOpen] = useState(false);
  const [permissionSearch, setPermissionSearch] = useState("");

  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const load = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [detail, permsRes] = await Promise.all([getPackage(id), getPackagePermissions(id)]);
      setPkg(detail);
      setAssignedIds((permsRes.items ?? []).map((p) => p.id));
    } catch {
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    listPermissionGroups()
      .then((res) => setGroups(res.items ?? []))
      .catch((err) => toast.error(errorMessage(err, t.packages.errors.loadPermissions)))
      .finally(() => setGroupsLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (loading) {
    return <PageHead title={t.common.loading} onBack={() => nav("/packages")} />;
  }

  if (notFound || !pkg) {
    return (
      <>
        <PageHead title={t.packageDetail.notFoundTitle} onBack={() => nav("/packages")} />
        <Card>
          <CardContent className="grid gap-3">
            <p className="text-sm text-muted-foreground">{t.packageDetail.notFoundText}</p>
            <Button type="button" variant="outline" onClick={() => nav("/packages")}>
              {t.packageDetail.backToList}
            </Button>
          </CardContent>
        </Card>
      </>
    );
  }

  const displayTitle = pkg.title?.[defaultLang] || Object.values(pkg.title ?? {}).find(Boolean) || pkg.id;

  const startEdit = () => {
    setForm({
      title: toTranslations(pkg.title, langs),
      description: toTranslations(pkg.description, langs),
      cost: String(pkg.cost),
      active: pkg.isActive,
    });
    setActiveLang(defaultLang);
    setEditing(true);
  };

  const cancelEdit = () => {
    setEditing(false);
    setForm(null);
  };

  const setField = <K extends keyof PackageForm>(key: K, value: PackageForm[K]) =>
    setForm((f) => (f ? { ...f, [key]: value } : f));

  const setTitleLang = (lang: string, value: string) =>
    setForm((f) => (f ? { ...f, title: { ...f.title, [lang]: value } } : f));

  const setDescriptionLang = (lang: string, value: string) =>
    setForm((f) => (f ? { ...f, description: { ...f.description, [lang]: value } } : f));

  const collectTranslations = (translations: Translations) =>
    Object.fromEntries(langs.filter((l) => translations[l]?.trim()).map((l) => [l, translations[l].trim()]));

  const save = async () => {
    if (!form || !id || !form.title[defaultLang]?.trim() || saving) return;
    setSaving(true);
    try {
      await updatePackage(id, {
        cost: Number(form.cost) || 0,
        isActive: form.active,
        titleTranslations: collectTranslations(form.title),
        descriptionTranslations: collectTranslations(form.description),
      });
      toast.success(t.packageDetail.toasts.saved);
      setEditing(false);
      setForm(null);
      await load();
    } catch (err) {
      toast.error(errorMessage(err, t.packages.errors.savePackage));
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!id) return;
    try {
      await deletePackage(id);
      toast.success(t.packageDetail.toasts.deleted);
      nav("/packages");
    } catch (err) {
      toast.error(errorMessage(err, t.packages.errors.deletePackage));
      setConfirmingDelete(false);
    }
  };

  const savePermissions = async (toAdd: string[], toRemove: string[]) => {
    if (!id) return;
    try {
      if (toAdd.length) await addPackagePermissions(id, toAdd);
      if (toRemove.length) await removePackagePermissions(id, toRemove);
      toast.success(t.packageDetail.toasts.permissionsUpdated);
      await load();
    } catch (err) {
      toast.error(errorMessage(err, t.packages.errors.savePackage));
    }
  };

  const assignedGroups = groups
    .map((g) => ({ ...g, permissions: (g.permissions ?? []).filter((p) => assignedIds.includes(p.id)) }))
    .filter((g) => g.permissions.length > 0);

  const permQuery = permissionSearch.trim().toLowerCase();
  const visibleAssignedGroups = permQuery
    ? assignedGroups
        .map((g) => ({
          ...g,
          permissions: g.permissions.filter(
            (p) =>
              (p.title ?? "").toLowerCase().includes(permQuery) ||
              (g.title ?? "").toLowerCase().includes(permQuery),
          ),
        }))
        .filter((g) => g.permissions.length > 0)
    : assignedGroups;

  return (
    <>
      <PageHead
        title={displayTitle}
        sub={t.packageDetail.sub}
        onBack={() => nav("/packages")}
        actions={
          editing ? (
            <>
              <Button type="button" variant="outline" onClick={cancelEdit} disabled={saving}>
                {t.common.cancel}
              </Button>
              <Button type="button" onClick={save} disabled={saving}>
                {t.common.save}
              </Button>
            </>
          ) : (
            <>
              <Button type="button" variant="outline" onClick={startEdit}>
                {t.common.edit}
              </Button>
              <Button type="button" variant="destructive" onClick={() => setConfirmingDelete(true)}>
                {t.common.delete}
              </Button>
            </>
          )
        }
      />

      <Card>
        <CardContent>
          {editing && form ? (
            <div className="grid gap-3">
              <div className="grid gap-3 rounded-md border p-3">
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
                <Field label={t.packages.nameLang(activeLang.toUpperCase())}>
                  <Input value={form.title[activeLang] ?? ""} onChange={(e) => setTitleLang(activeLang, e.target.value)} />
                </Field>
                <Field label={t.packages.descLang(activeLang.toUpperCase())}>
                  <Textarea
                    rows={3}
                    value={form.description[activeLang] ?? ""}
                    onChange={(e) => setDescriptionLang(activeLang, e.target.value)}
                  />
                </Field>
              </div>
              <Field label={t.common.price}>
                <Input type="number" min="0" value={form.cost} onChange={(e) => setField("cost", e.target.value)} />
              </Field>
              <label className="flex items-center gap-2 text-sm font-medium">
                <Switch checked={form.active} onCheckedChange={(v) => setField("active", v)} />
                {t.packages.packageActive}
              </label>
            </div>
          ) : (
            <>
              <div className="mb-3 flex gap-1.5">
                <ActiveBadge active={pkg.isActive} />
              </div>
              <div className="grid gap-3">
                <div className="rounded-md border p-3">
                  <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {t.common.name}
                  </div>
                  <dl className="detail-dl">
                    {langs.map((l) => (
                      <div key={l}>
                        <dt>{l.toUpperCase()}</dt>
                        <dd>{pkg.title?.[l] || "—"}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
                <div className="rounded-md border p-3">
                  <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {t.common.description}
                  </div>
                  <dl className="detail-dl">
                    {langs.map((l) => (
                      <div key={l}>
                        <dt>{l.toUpperCase()}</dt>
                        <dd>{pkg.description?.[l] || "—"}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
                <div>
                  <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    {t.common.price}
                  </dt>
                  <dd className="mt-1 font-semibold">{pkg.cost}</dd>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card className="mt-3.5">
        <CardContent>
          <div className="list-head">
            <h3>{t.packageDetail.assignedPermissions}</h3>
            <Button type="button" size="sm" onClick={() => setPermissionManagerOpen(true)}>
              {t.packageDetail.managePermissions}
            </Button>
          </div>
          {assignedGroups.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t.packageDetail.noPermissionsAssigned}</p>
          ) : (
            <>
              <div className="relative mb-3">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="pl-8"
                  placeholder={t.permissionsPicker.filterPlaceholder}
                  value={permissionSearch}
                  onChange={(e) => setPermissionSearch(e.target.value)}
                />
              </div>
              {visibleAssignedGroups.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t.permissionsPicker.noResults}</p>
              ) : (
                <div className="grid gap-3">
                  {visibleAssignedGroups.map((g) => (
                    <div key={g.code} className="grid gap-1.5">
                      <div className="text-xs font-semibold text-muted-foreground">{g.title}</div>
                      <div className="flex flex-wrap gap-1">
                        {g.permissions.map((p) => (
                          <span className="tag-chip static" key={p.id}>
                            {p.title}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={confirmingDelete}
        onOpenChange={setConfirmingDelete}
        title={t.packageDetail.deletePackageTitle}
        description={t.packageDetail.deletePackageDesc(displayTitle)}
        onConfirm={remove}
      />

      <PermissionManagerDialog
        open={permissionManagerOpen}
        onOpenChange={setPermissionManagerOpen}
        groups={groups}
        loadingGroups={groupsLoading}
        assignedIds={assignedIds}
        onSave={savePermissions}
      />
    </>
  );
}
