import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Search } from "lucide-react";
import { toast } from "sonner";
import {
  addRolePermissions,
  deleteRole,
  duplicateRole,
  getRole,
  getRolePermissions,
  listPermissionGroups,
  removeRolePermissions,
  removeRoleUser,
  updateRole,
  ApiRequestError,
  type RoleDetail as RoleDetailData,
  type PermissionGroupWithPermissions,
} from "../lib/api";
import { useTranslation } from "../i18n/LanguageContext";
import { useModuleSettings } from "../data/moduleSettingsStore";
import { PageHead } from "../AppShell";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { Field } from "@/components/Field";
import { PermissionManagerDialog } from "@/components/PermissionManagerDialog";
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

type Translations = Record<string, string>;

type RoleForm = {
  code: string;
  title: Translations;
};

function toTranslations(source: Record<string, string> | null | undefined, langs: string[]): Translations {
  return Object.fromEntries(langs.map((l) => [l, source?.[l] ?? ""]));
}

const emptyTranslations = (langs: string[]): Translations =>
  Object.fromEntries(langs.map((l) => [l, ""]));

function errorMessage(err: unknown, fallback: string) {
  return err instanceof ApiRequestError ? err.message : fallback;
}

export function RoleDetail() {
  const { id } = useParams<{ id: string }>();
  const nav = useNavigate();
  const { t } = useTranslation();
  const { settings } = useModuleSettings();
  const langs = settings.supportedLanguages;
  const defaultLang = settings.defaultLanguage;

  const [role, setRole] = useState<RoleDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<RoleForm | null>(null);
  const [activeLang, setActiveLang] = useState<string>(defaultLang);
  const [saving, setSaving] = useState(false);

  const [assignedIds, setAssignedIds] = useState<string[]>([]);
  const [groups, setGroups] = useState<PermissionGroupWithPermissions[]>([]);
  const [groupsLoading, setGroupsLoading] = useState(true);
  const [permissionManagerOpen, setPermissionManagerOpen] = useState(false);
  const [permissionSearch, setPermissionSearch] = useState("");

  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [removingUserId, setRemovingUserId] = useState<string | null>(null);

  const [duplicateOpen, setDuplicateOpen] = useState(false);
  const [duplicateForm, setDuplicateForm] = useState<RoleForm>({ code: "", title: emptyTranslations(langs) });
  const [duplicateActiveLang, setDuplicateActiveLang] = useState<string>(defaultLang);
  const [duplicating, setDuplicating] = useState(false);

  const load = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [detail, perms] = await Promise.all([getRole(id), getRolePermissions(id)]);
      setRole(detail);
      setAssignedIds((perms ?? []).map((p) => p.id));
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
      .catch((err) => toast.error(errorMessage(err, t.roleDetail.errors.loadPermissions)))
      .finally(() => setGroupsLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (loading) {
    return <PageHead title={t.common.loading} onBack={() => nav("/roles")} />;
  }

  if (notFound || !role) {
    return (
      <>
        <PageHead title={t.roleDetail.notFoundTitle} onBack={() => nav("/roles")} />
        <Card>
          <CardContent className="grid gap-3">
            <p className="text-sm text-muted-foreground">{t.roleDetail.notFoundText}</p>
            <Button type="button" variant="outline" onClick={() => nav("/roles")}>
              {t.roleDetail.backToList}
            </Button>
          </CardContent>
        </Card>
      </>
    );
  }

  const displayTitle =
    role.titleTranslations?.[defaultLang] || Object.values(role.titleTranslations ?? {}).find(Boolean) || role.code || role.id;

  const startEdit = () => {
    setForm({
      code: role.code ?? "",
      title: toTranslations(role.titleTranslations, langs),
    });
    setActiveLang(defaultLang);
    setEditing(true);
  };

  const cancelEdit = () => {
    setEditing(false);
    setForm(null);
  };

  const setTitleLang = (lang: string, value: string) =>
    setForm((f) => (f ? { ...f, title: { ...f.title, [lang]: value } } : f));

  const collectTranslations = (translations: Translations) =>
    Object.fromEntries(langs.filter((l) => translations[l]?.trim()).map((l) => [l, translations[l].trim()]));

  const save = async () => {
    if (!form || !id || !form.code.trim() || !form.title[defaultLang]?.trim() || saving) return;
    setSaving(true);
    try {
      await updateRole(id, {
        code: form.code.trim(),
        titleTranslations: collectTranslations(form.title),
      });
      toast.success(t.roleDetail.toasts.saved);
      setEditing(false);
      setForm(null);
      await load();
    } catch (err) {
      toast.error(errorMessage(err, t.roleDetail.errors.saveRole));
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!id) return;
    try {
      await deleteRole(id);
      toast.success(t.roleDetail.toasts.deleted);
      nav("/roles");
    } catch (err) {
      toast.error(errorMessage(err, t.roleDetail.errors.deleteRole));
      setConfirmingDelete(false);
    }
  };

  const savePermissions = async (toAdd: string[], toRemove: string[]) => {
    if (!id) return;
    try {
      if (toAdd.length) await addRolePermissions(id, toAdd);
      if (toRemove.length) await removeRolePermissions(id, toRemove);
      toast.success(t.roleDetail.toasts.permissionsUpdated);
      await load();
    } catch (err) {
      toast.error(errorMessage(err, t.roleDetail.errors.savePermissions));
    }
  };

  const confirmRemoveUser = async () => {
    if (!id || !removingUserId) return;
    try {
      await removeRoleUser(id, removingUserId);
      toast.success(t.roleDetail.toasts.userRemoved);
      setRemovingUserId(null);
      await load();
    } catch (err) {
      toast.error(errorMessage(err, t.roleDetail.errors.removeUser));
      setRemovingUserId(null);
    }
  };

  const openDuplicate = () => {
    setDuplicateForm({
      code: role.code ? `${role.code}-copy` : "",
      title: toTranslations(role.titleTranslations, langs),
    });
    setDuplicateActiveLang(defaultLang);
    setDuplicateOpen(true);
  };

  const setDuplicateTitleLang = (lang: string, value: string) =>
    setDuplicateForm((f) => ({ ...f, title: { ...f.title, [lang]: value } }));

  const submitDuplicate = async () => {
    if (!id || !duplicateForm.code.trim() || !duplicateForm.title[defaultLang]?.trim() || duplicating) return;
    setDuplicating(true);
    try {
      const created = await duplicateRole(id, {
        code: duplicateForm.code.trim(),
        titleTranslations: collectTranslations(duplicateForm.title),
      });
      toast.success(t.roleDetail.toasts.duplicated);
      setDuplicateOpen(false);
      nav(`/roles/${created.id}`);
    } catch (err) {
      toast.error(errorMessage(err, t.roleDetail.errors.duplicateRole));
    } finally {
      setDuplicating(false);
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

  const users = role.users ?? [];

  return (
    <>
      <PageHead
        title={displayTitle}
        sub={t.roleDetail.sub}
        onBack={() => nav("/roles")}
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
              <Button type="button" variant="outline" onClick={openDuplicate}>
                {t.roleDetail.duplicateRole}
              </Button>
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
              <Field label={t.roleDetail.code}>
                <Input value={form.code} onChange={(e) => setForm((f) => (f ? { ...f, code: e.target.value } : f))} />
              </Field>
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
                <Field label={t.roles.nameLang(activeLang.toUpperCase())}>
                  <Input value={form.title[activeLang] ?? ""} onChange={(e) => setTitleLang(activeLang, e.target.value)} />
                </Field>
              </div>
            </div>
          ) : (
            <div className="grid gap-3">
              <div>
                <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  {t.roleDetail.code}
                </dt>
                <dd className="mt-1">
                  {role.code ? <span className="tag-chip static">{role.code}</span> : <span className="text-muted-foreground">—</span>}
                </dd>
              </div>
              <div className="rounded-md border p-3">
                <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {t.common.name}
                </div>
                <dl className="detail-dl">
                  {langs.map((l) => (
                    <div key={l}>
                      <dt>{l.toUpperCase()}</dt>
                      <dd>{role.titleTranslations?.[l] || "—"}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="mt-3.5">
        <CardContent>
          <div className="list-head">
            <h3>{t.roleDetail.assignedPermissions}</h3>
            <Button type="button" size="sm" onClick={() => setPermissionManagerOpen(true)}>
              {t.roleDetail.managePermissions}
            </Button>
          </div>
          {assignedGroups.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t.roleDetail.noPermissionsAssigned}</p>
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

      <Card className="mt-3.5">
        <CardContent>
          <div className="list-head">
            <h3>{t.roleDetail.assignedUsers}</h3>
          </div>
          {users.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t.roleDetail.noUsersAssigned}</p>
          ) : (
            <div className="grid gap-1.5">
              {users.map((u) => (
                <div key={u.userId} className="flex items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm">
                  <span className="font-medium">{u.fullName || u.userId}</span>
                  <Button type="button" variant="ghost" size="sm" onClick={() => setRemovingUserId(u.userId)}>
                    {t.common.delete}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={confirmingDelete}
        onOpenChange={setConfirmingDelete}
        title={t.roleDetail.deleteRoleTitle}
        description={t.roleDetail.deleteRoleDesc(displayTitle)}
        onConfirm={remove}
      />

      <ConfirmDialog
        open={removingUserId !== null}
        onOpenChange={(open) => !open && setRemovingUserId(null)}
        title={t.roleDetail.removeUserTitle}
        description={t.roleDetail.removeUserDesc(
          users.find((u) => u.userId === removingUserId)?.fullName || "",
        )}
        onConfirm={confirmRemoveUser}
      />

      <PermissionManagerDialog
        open={permissionManagerOpen}
        onOpenChange={setPermissionManagerOpen}
        title={t.roleDetail.managePermissionsTitle}
        groups={groups}
        loadingGroups={groupsLoading}
        assignedIds={assignedIds}
        onSave={savePermissions}
      />

      <Dialog open={duplicateOpen} onOpenChange={setDuplicateOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{t.roleDetail.duplicateRoleTitle}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">{t.roleDetail.duplicateRoleDesc}</p>
          <div className="grid gap-3">
            <Field label={t.roleDetail.code}>
              <Input
                value={duplicateForm.code}
                onChange={(e) => setDuplicateForm((f) => ({ ...f, code: e.target.value }))}
                autoFocus
              />
            </Field>
            <div className="grid gap-3 rounded-md border p-3">
              <div className="flex gap-1">
                {langs.map((l) => (
                  <button
                    key={l}
                    type="button"
                    onClick={() => setDuplicateActiveLang(l)}
                    className={`rounded-md border px-2.5 py-1 text-xs font-semibold ${
                      duplicateActiveLang === l
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-input text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {l.toUpperCase()}
                    {l === defaultLang && !duplicateForm.title[defaultLang]?.trim() ? " *" : ""}
                  </button>
                ))}
              </div>
              <Field label={t.roles.nameLang(duplicateActiveLang.toUpperCase())}>
                <Input
                  value={duplicateForm.title[duplicateActiveLang] ?? ""}
                  onChange={(e) => setDuplicateTitleLang(duplicateActiveLang, e.target.value)}
                />
              </Field>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDuplicateOpen(false)}>
              {t.common.cancel}
            </Button>
            <Button
              type="button"
              disabled={!duplicateForm.code.trim() || !duplicateForm.title[defaultLang]?.trim() || duplicating}
              onClick={submitDuplicate}
            >
              {t.common.create}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
