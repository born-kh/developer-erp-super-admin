import { useEffect, useMemo, useState } from "react";
import { ChevronDown, ChevronRight, Pencil, Search } from "lucide-react";
import { toast } from "sonner";
import {
  ApiRequestError,
  getPermission,
  getPermissionGroup,
  listPermissionGroups,
  listPermissionGroupsFlat,
  updatePermission,
  updatePermissionGroup,
  type PermissionGroupWithPermissions,
  type PermissionLookup,
} from "../lib/api";
import { useTranslation } from "../i18n/LanguageContext";
import { useModuleSettings } from "../data/moduleSettingsStore";
import { PageHead } from "../AppShell";
import { Card } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/EmptyState";
import { Field } from "@/components/Field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type Translations = Record<string, string>;

type EditTarget = {
  kind: "group" | "permission";
  id: string;
  code?: string | null;
};

const emptyTranslations = (langs: string[]): Translations =>
  Object.fromEntries(langs.map((l) => [l, ""]));

function errorMessage(err: unknown, fallback: string) {
  return err instanceof ApiRequestError ? err.message : fallback;
}

export function Permissions() {
  const { t } = useTranslation();
  const { settings } = useModuleSettings();
  const langs = settings.supportedLanguages;
  const defaultLang = settings.defaultLanguage;

  const [groups, setGroups] = useState<PermissionGroupWithPermissions[]>([]);
  const [groupIdByCode, setGroupIdByCode] = useState<Map<string, string>>(new Map());
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [closedModules, setClosedModules] = useState<Set<string>>(new Set());
  const [closedGroups, setClosedGroups] = useState<Set<string>>(new Set());

  const [editTarget, setEditTarget] = useState<EditTarget | null>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [editForm, setEditForm] = useState<Translations>(() => emptyTranslations(langs));
  const [editActiveLang, setEditActiveLang] = useState(defaultLang);
  const [saving, setSaving] = useState(false);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [groupsRes, flatRes] = await Promise.all([listPermissionGroups(), listPermissionGroupsFlat()]);
      setGroups(groupsRes.items ?? []);
      setGroupIdByCode(new Map((flatRes.items ?? []).map((g) => [g.code ?? "", g.id])));
    } catch (err) {
      toast.error(errorMessage(err, t.permissionsPage.errors.loadPermissions));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const q = query.trim().toLowerCase();

  const modules = useMemo(() => {
    const map = new Map<string, PermissionGroupWithPermissions[]>();
    for (const g of groups) {
      const key = g.moduleDisplayName?.trim() || t.permissionsPicker.otherModule;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(g);
    }
    return Array.from(map.entries()).map(([key, groupsInModule]) => ({ key, groups: groupsInModule }));
  }, [groups, t]);

  const groupMatches = (group: PermissionGroupWithPermissions) => {
    if (!q) return true;
    if ((group.title ?? "").toLowerCase().includes(q)) return true;
    return (group.permissions ?? []).some((p) => (p.title ?? "").toLowerCase().includes(q));
  };

  const visibleModules = modules
    .map((m) => ({ ...m, groups: m.groups.filter(groupMatches) }))
    .filter((m) => m.groups.length > 0);

  const toggleModule = (key: string) =>
    setClosedModules((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  const toggleGroupOpen = (code: string) =>
    setClosedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });

  const setEditField = (lang: string, value: string) =>
    setEditForm((f) => ({ ...f, [lang]: value }));

  const collectTranslations = (translations: Translations) =>
    Object.fromEntries(langs.filter((l) => translations[l]?.trim()).map((l) => [l, translations[l].trim()]));

  const openEditGroup = async (group: PermissionGroupWithPermissions) => {
    const id = groupIdByCode.get(group.code ?? "");
    if (!id) {
      toast.error(errorMessage(null, t.permissionsPage.errors.loadDetail));
      return;
    }
    setEditTarget({ kind: "group", id, code: group.code });
    setEditActiveLang(defaultLang);
    setEditForm(emptyTranslations(langs));
    setEditLoading(true);
    try {
      const detail = await getPermissionGroup(id);
      setEditForm({ ...emptyTranslations(langs), ...(detail.titleTranslations ?? {}) });
    } catch (err) {
      toast.error(errorMessage(err, t.permissionsPage.errors.loadDetail));
      setEditTarget(null);
    } finally {
      setEditLoading(false);
    }
  };

  const openEditPermission = async (perm: PermissionLookup) => {
    setEditTarget({ kind: "permission", id: perm.id });
    setEditActiveLang(defaultLang);
    setEditForm(emptyTranslations(langs));
    setEditLoading(true);
    try {
      const detail = await getPermission(perm.id);
      setEditForm({ ...emptyTranslations(langs), ...(detail.titleTranslations ?? {}) });
    } catch (err) {
      toast.error(errorMessage(err, t.permissionsPage.errors.loadDetail));
      setEditTarget(null);
    } finally {
      setEditLoading(false);
    }
  };

  const saveEdit = async () => {
    if (!editTarget || saving) return;
    setSaving(true);
    const translations = collectTranslations(editForm);
    try {
      if (editTarget.kind === "group") {
        await updatePermissionGroup(editTarget.id, translations);
        toast.success(t.permissionsPage.toasts.groupUpdated);
      } else {
        await updatePermission(editTarget.id, translations);
        toast.success(t.permissionsPage.toasts.permissionUpdated);
      }
      setEditTarget(null);
      await fetchAll();
    } catch (err) {
      toast.error(
        errorMessage(
          err,
          editTarget.kind === "group" ? t.permissionsPage.errors.saveGroup : t.permissionsPage.errors.savePermission,
        ),
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <PageHead
        title={t.permissionsPage.title}
        actions={
          <div className="relative w-64 max-[500px]:w-full">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-8"
              placeholder={t.permissionsPage.searchPlaceholder}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
        }
      />

      {loading ? (
        <p className="text-sm text-muted-foreground">{t.common.loading}</p>
      ) : visibleModules.length === 0 ? (
        <EmptyState title={q ? t.permissionsPicker.noResults : t.permissionsPicker.noPermissions} />
      ) : (
        <Card className="gap-0 overflow-hidden py-0">
          {visibleModules.map((m) => {
            const moduleOpen = Boolean(q) || !closedModules.has(m.key);
            return (
              <Collapsible key={m.key} open={moduleOpen} onOpenChange={() => toggleModule(m.key)}>
                <CollapsibleTrigger className="flex w-full items-center gap-2 border-b bg-muted/50 px-3 py-2 text-left text-sm font-semibold last:border-b-0">
                  {moduleOpen ? <ChevronDown className="size-4 shrink-0" /> : <ChevronRight className="size-4 shrink-0" />}
                  {m.key}
                </CollapsibleTrigger>
                <CollapsibleContent>
                  {m.groups.map((g) => {
                    const code = g.code ?? g.title ?? "";
                    const groupOpen = Boolean(q) || !closedGroups.has(code);
                    const perms = g.permissions ?? [];
                    return (
                      <Collapsible key={code} open={groupOpen} onOpenChange={() => toggleGroupOpen(code)}>
                        <div className="flex items-center gap-1 border-b bg-muted/20 pr-2">
                          <CollapsibleTrigger className="flex flex-1 items-center gap-2 py-2 pr-2 pl-7 text-left text-sm font-semibold">
                            {groupOpen ? <ChevronDown className="size-4 shrink-0" /> : <ChevronRight className="size-4 shrink-0" />}
                            {g.title}
                            {g.code && <span className="tag-chip static text-muted-foreground">{g.code}</span>}
                          </CollapsibleTrigger>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-xs"
                            className="shrink-0 text-muted-foreground hover:text-foreground"
                            aria-label={t.permissionsPage.editGroup}
                            onClick={() => openEditGroup(g)}
                          >
                            <Pencil />
                          </Button>
                        </div>
                        <CollapsibleContent className="border-b bg-background py-2 pr-2 pl-11">
                          <div className="grid gap-0.5">
                            {perms.map((perm) => (
                              <div
                                key={perm.id}
                                className="flex items-center justify-between gap-2 rounded-md py-1 pl-2 text-sm font-normal text-foreground/90 hover:bg-muted/40"
                              >
                                <span>{perm.title}</span>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon-xs"
                                  className="shrink-0 text-muted-foreground hover:text-foreground"
                                  aria-label={t.permissionsPage.editPermission}
                                  onClick={() => openEditPermission(perm)}
                                >
                                  <Pencil />
                                </Button>
                              </div>
                            ))}
                          </div>
                        </CollapsibleContent>
                      </Collapsible>
                    );
                  })}
                </CollapsibleContent>
              </Collapsible>
            );
          })}
        </Card>
      )}

      <Dialog open={editTarget !== null} onOpenChange={(open) => !open && setEditTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editTarget?.kind === "group" ? t.permissionsPage.editGroupTitle : t.permissionsPage.editPermissionTitle}
            </DialogTitle>
          </DialogHeader>
          {editLoading ? (
            <p className="text-sm text-muted-foreground">{t.common.loading}</p>
          ) : (
            <div className="grid gap-3 rounded-md border p-3">
              <div className="flex gap-1">
                {langs.map((l) => (
                  <button
                    key={l}
                    type="button"
                    onClick={() => setEditActiveLang(l)}
                    className={`rounded-md border px-2.5 py-1 text-xs font-semibold ${
                      editActiveLang === l
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-input text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {l.toUpperCase()}
                    {l === defaultLang && !editForm[defaultLang]?.trim() ? " *" : ""}
                  </button>
                ))}
              </div>
              <Field label={t.packages.nameLang(editActiveLang.toUpperCase())}>
                <Input
                  value={editForm[editActiveLang] ?? ""}
                  onChange={(e) => setEditField(editActiveLang, e.target.value)}
                  autoFocus
                />
              </Field>
            </div>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setEditTarget(null)}>
              {t.common.cancel}
            </Button>
            <Button
              type="button"
              disabled={editLoading || saving || !editForm[defaultLang]?.trim()}
              onClick={saveEdit}
            >
              {t.common.save}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
