import { useEffect, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Copy, Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import {
  assignUserRoles,
  deleteUser,
  getCompanyById,
  getUserById,
  getUserPermissions,
  getUserRoles,
  listRoles,
  unassignUserRoles,
  updateUser,
  updateUserPassword,
  uploadFile,
  ApiRequestError,
  type RoleLookup,
  type UserDetail as UserDetailData,
  type UserPermission,
  type UserRole,
  type UserType,
} from "../lib/api";
import { useCurrentUser } from "../data/currentUserStore";
import { useFileUrl } from "../hooks/useFileUrl";
import { useTranslation } from "../i18n/LanguageContext";
import { formatDate, randomPassword } from "../lib/format";
import { PageHead } from "../AppShell";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { Field } from "@/components/Field";
import { RoleManagerDialog } from "@/components/RoleManagerDialog";
import { ActiveBadge } from "@/components/StatusBadge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";

type UserForm = {
  firstName: string;
  lastName: string;
  middleName: string;
  email: string;
  avatarName: string;
  isActive: boolean;
};

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

function errorMessage(err: unknown, fallback: string) {
  return err instanceof ApiRequestError ? err.message : fallback;
}

function canShowRoles(type: UserType) {
  return type !== "SuperAdmin" && type !== "Owner";
}

export function UserDetail() {
  const { id } = useParams<{ id: string }>();
  const nav = useNavigate();
  const { t, language } = useTranslation();
  const { user: currentUser } = useCurrentUser();

  const [user, setUser] = useState<UserDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<UserForm | null>(null);
  const [saving, setSaving] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  const [assignedRoles, setAssignedRoles] = useState<UserRole[]>([]);
  const [allRoles, setAllRoles] = useState<RoleLookup[]>([]);
  const [rolesLoading, setRolesLoading] = useState(true);
  const [roleManagerOpen, setRoleManagerOpen] = useState(false);

  const [permissions, setPermissions] = useState<UserPermission[]>([]);
  const [permissionsLoading, setPermissionsLoading] = useState(true);

  const [companyName, setCompanyName] = useState<string | null>(null);

  const loadPermissions = async () => {
    if (!id) return;
    setPermissionsLoading(true);
    try {
      setPermissions(await getUserPermissions(id));
    } catch (err) {
      toast.error(errorMessage(err, t.userDetail.errors.loadPermissions));
    } finally {
      setPermissionsLoading(false);
    }
  };

  const load = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const detail = await getUserById(id);
      setUser(detail);
      if (canShowRoles(detail.type)) {
        const rolesRes = await getUserRoles(id);
        setAssignedRoles(rolesRes.items ?? []);
      }
    } catch {
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    if (!user || !canShowRoles(user.type)) {
      setRolesLoading(false);
      setPermissionsLoading(false);
      return;
    }
    loadPermissions();
    listRoles({ pageSize: 100 })
      .then((res) => setAllRoles(res.items ?? []))
      .catch((err) => toast.error(errorMessage(err, t.userDetail.errors.loadRoles)))
      .finally(() => setRolesLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  useEffect(() => {
    if (!user?.companyId || user.type === "Admin") {
      setCompanyName(null);
      return;
    }
    let cancelled = false;
    getCompanyById(user.companyId)
      .then((c) => {
        if (!cancelled) setCompanyName(c.name ?? null);
      })
      .catch((err) => {
        if (!cancelled) toast.error(errorMessage(err, t.userDetail.errors.loadCompany));
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.companyId, user?.type]);

  const avatarUrl = useFileUrl(editing ? form?.avatarName : user?.avatarName);

  if (loading) {
    return <PageHead title={t.common.loading} onBack={() => nav(-1)} />;
  }

  if (notFound || !user) {
    return (
      <>
        <PageHead title={t.userDetail.notFoundTitle} onBack={() => nav(-1)} />
        <Card>
          <CardContent className="grid gap-3">
            <p className="text-sm text-muted-foreground">{t.userDetail.notFoundText}</p>
            <Button type="button" variant="outline" onClick={() => nav("/users")}>
              {t.userDetail.backToList}
            </Button>
          </CardContent>
        </Card>
      </>
    );
  }

  const displayName = user.fullName || user.email || user.id;

  const startEdit = () => {
    setForm({
      firstName: user.firstName ?? "",
      lastName: user.lastName ?? "",
      middleName: user.middleName ?? "",
      email: user.email ?? "",
      avatarName: user.avatarName ?? "",
      isActive: user.isActive,
    });
    setEditing(true);
  };

  const cancelEdit = () => {
    setEditing(false);
    setForm(null);
  };

  const setField = <K extends keyof UserForm>(key: K, value: UserForm[K]) =>
    setForm((f) => (f ? { ...f, [key]: value } : f));

  const pickAvatar = async (file: File | undefined) => {
    if (!file) return;
    setAvatarUploading(true);
    try {
      const avatarName = await uploadFile(file);
      setField("avatarName", avatarName);
    } catch (err) {
      toast.error(errorMessage(err, t.userDetail.errors.uploadAvatar));
    } finally {
      setAvatarUploading(false);
    }
  };

  const save = async () => {
    if (!form || !id || !form.firstName.trim() || !form.lastName.trim() || saving) return;
    setSaving(true);
    try {
      await updateUser(id, {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        middleName: form.middleName.trim() || null,
        email: form.email.trim(),
        avatarName: form.avatarName.trim() || null,
        isActive: form.isActive,
      });
      toast.success(t.userDetail.toasts.saved);
      setEditing(false);
      setForm(null);
      await load();
    } catch (err) {
      toast.error(errorMessage(err, t.userDetail.errors.saveUser));
    } finally {
      setSaving(false);
    }
  };

  const openChangePassword = () => {
    setNewPassword(randomPassword());
    setConfirmPassword("");
    setPasswordDialogOpen(true);
  };

  const copyNewPassword = () => {
    if (!newPassword) return;
    navigator.clipboard?.writeText(newPassword).catch(() => {});
    toast.success(t.common.passwordCopied);
  };

  const changePassword = async () => {
    if (!id || changingPassword) return;
    if (!newPassword.trim()) {
      toast.error(t.userDetail.errors.passwordEmpty);
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error(t.userDetail.errors.passwordMismatch);
      return;
    }
    setChangingPassword(true);
    try {
      await updateUserPassword(id, newPassword, confirmPassword);
      toast.success(t.userDetail.toasts.passwordChanged);
      setPasswordDialogOpen(false);
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      toast.error(errorMessage(err, t.userDetail.errors.changePassword));
    } finally {
      setChangingPassword(false);
    }
  };

  const remove = async () => {
    if (!id) return;
    try {
      await deleteUser(id);
      toast.success(t.userDetail.toasts.deleted);
      nav("/users");
    } catch (err) {
      toast.error(errorMessage(err, t.userDetail.errors.deleteUser));
      setConfirmingDelete(false);
    }
  };

  const saveRoles = async (toAdd: string[], toRemove: string[]) => {
    if (!id) return;
    try {
      if (toAdd.length) await assignUserRoles(id, toAdd);
      if (toRemove.length) await unassignUserRoles(id, toRemove);
      toast.success(t.userDetail.toasts.rolesUpdated);
      await load();
    } catch (err) {
      toast.error(errorMessage(err, t.userDetail.errors.saveUser));
    }
  };

  const isSelf = currentUser?.id === user.id;
  const showRoles = canShowRoles(user.type);
  const canManageRoles = user.type === "Admin";
  const roleTitleById = new Map(allRoles.map((role) => [role.id, role.title]));

  const permissionGroups = new Map<string, UserPermission[]>();
  for (const p of permissions) {
    const key = p.group || p.moduleDisplayName || "—";
    if (!permissionGroups.has(key)) permissionGroups.set(key, []);
    permissionGroups.get(key)!.push(p);
  }

  return (
    <>
      <PageHead
        title={displayName}
        sub={t.userDetail.sub}
        onBack={() => nav(-1)}
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
              <Button type="button" variant="outline" onClick={openChangePassword}>
                {t.userDetail.changePassword}
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
              <div className="flex items-center gap-4">
                <Avatar className="size-24">
                  <AvatarImage src={avatarUrl ?? undefined} alt={displayName} />
                  <AvatarFallback className="bg-secondary text-2xl font-semibold text-muted-foreground">
                    {initials(displayName)}
                  </AvatarFallback>
                </Avatar>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={avatarUploading}
                  onClick={() => fileInputRef.current?.click()}
                >
                  {avatarUploading && <Loader2 className="size-4 animate-spin" />}
                  {t.common.chooseImage}
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={(e) => pickAvatar(e.target.files?.[0])}
                />
              </div>
              <div className="grid grid-cols-2 gap-3 max-[860px]:grid-cols-1">
                <Field label={t.users.firstName}>
                  <Input value={form.firstName} onChange={(e) => setField("firstName", e.target.value)} autoFocus />
                </Field>
                <Field label={t.users.lastName}>
                  <Input value={form.lastName} onChange={(e) => setField("lastName", e.target.value)} />
                </Field>
              </div>
              <Field label={t.users.middleName}>
                <Input value={form.middleName} onChange={(e) => setField("middleName", e.target.value)} />
              </Field>
              <Field label={t.common.email}>
                <Input value={form.email} onChange={(e) => setField("email", e.target.value)} />
              </Field>
              {!isSelf && (
                <label className="flex items-center gap-2 text-sm font-medium">
                  <Switch checked={form.isActive} onCheckedChange={(v) => setField("isActive", v)} />
                  {t.users.userActive}
                </label>
              )}
            </div>
          ) : (
            <>
              <div className="mb-4 flex items-center gap-4">
                <Avatar className="size-24">
                  <AvatarImage src={avatarUrl ?? undefined} alt={displayName} />
                  <AvatarFallback className="bg-secondary text-2xl font-semibold text-muted-foreground">
                    {initials(displayName)}
                  </AvatarFallback>
                </Avatar>
                {!isSelf && <ActiveBadge active={user.isActive} />}
              </div>
              <dl className="detail-dl">
                <div>
                  <dt>{t.users.firstName}</dt>
                  <dd>{user.firstName || "—"}</dd>
                </div>
                <div>
                  <dt>{t.users.lastName}</dt>
                  <dd>{user.lastName || "—"}</dd>
                </div>
                <div>
                  <dt>{t.users.middleName}</dt>
                  <dd>{user.middleName || "—"}</dd>
                </div>
                <div>
                  <dt>{t.common.email}</dt>
                  <dd>{user.email || "—"}</dd>
                </div>
                <div>
                  <dt>{t.userDetail.emailVerified}</dt>
                  <dd>
                    {user.emailVerifiedAt
                      ? `${t.userDetail.verified} · ${formatDate(user.emailVerifiedAt, language)}`
                      : t.userDetail.notVerified}
                  </dd>
                </div>
                <div>
                  <dt>{t.userDetail.type}</dt>
                  <dd>{user.type}</dd>
                </div>
                {user.type !== "Admin" && user.companyId && (
                  <div>
                    <dt>{t.userDetail.company}</dt>
                    <dd>
                      <button
                        type="button"
                        className="font-semibold text-primary hover:underline"
                        onClick={() => nav(`/companies/${user.companyId}`)}
                      >
                        {companyName ?? "—"}
                      </button>
                    </dd>
                  </div>
                )}
                <div>
                  <dt>{t.common.created}</dt>
                  <dd>{formatDate(user.createdAt, language)}</dd>
                </div>
              </dl>
            </>
          )}
        </CardContent>
      </Card>

      {showRoles && (
        <Card className="mt-3.5">
          <CardContent>
            <div className="list-head">
              <h3>{t.userDetail.assignedRoles}</h3>
              {canManageRoles && (
                <Button type="button" size="sm" onClick={() => setRoleManagerOpen(true)}>
                  {t.userDetail.manageRoles}
                </Button>
              )}
            </div>
            {assignedRoles.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t.userDetail.noRolesAssigned}</p>
            ) : (
              <div className="flex flex-wrap gap-1">
                {assignedRoles.map((r) => (
                  <span className="tag-chip static" key={r.roleId}>
                    {roleTitleById.get(r.roleId) || r.title || r.code}
                  </span>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {showRoles && (
        <Card className="mt-3.5">
          <CardContent>
            <div className="list-head">
              <h3>{t.userDetail.assignedPermissions}</h3>
            </div>
            {permissionsLoading ? (
              <p className="text-sm text-muted-foreground">{t.common.loading}</p>
            ) : permissions.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t.userDetail.noPermissionsAssigned}</p>
            ) : (
              <div className="grid gap-3">
                {Array.from(permissionGroups.entries()).map(([group, perms]) => (
                  <div key={group} className="grid gap-1.5">
                    <div className="text-xs font-semibold text-muted-foreground">{group}</div>
                    <div className="flex flex-wrap gap-1">
                      {perms.map((p) => (
                        <span className="tag-chip static" key={p.id}>
                          {p.title}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <ConfirmDialog
        open={confirmingDelete}
        onOpenChange={setConfirmingDelete}
        title={t.userDetail.deleteUserTitle}
        description={t.userDetail.deleteUserDesc(displayName)}
        onConfirm={remove}
      />

      <RoleManagerDialog
        open={roleManagerOpen}
        onOpenChange={setRoleManagerOpen}
        roles={allRoles}
        loadingRoles={rolesLoading}
        assignedIds={assignedRoles.map((r) => r.roleId)}
        onSave={saveRoles}
      />

      <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.userDetail.changePasswordTitle}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3">
            <Field label={t.userDetail.newPassword}>
              <div className="password-gen">
                <Input value={newPassword} onChange={(e) => setNewPassword(e.target.value)} autoFocus />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={copyNewPassword}
                  aria-label={t.common.copyPassword}
                >
                  <Copy />
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={() => setNewPassword(randomPassword())}>
                  <RefreshCw />
                  {t.common.generate}
                </Button>
              </div>
            </Field>
            <Field label={t.userDetail.confirmPassword}>
              <Input value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
            </Field>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setPasswordDialogOpen(false)} disabled={changingPassword}>
              {t.common.cancel}
            </Button>
            <Button type="button" onClick={changePassword} disabled={changingPassword}>
              {changingPassword && <Loader2 className="size-4 animate-spin" />}
              {t.common.save}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
