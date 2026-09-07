import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import {
  assignUserRoles,
  deleteUser,
  getUserById,
  getUserRoles,
  listRoles,
  unassignUserRoles,
  updateUser,
  ApiRequestError,
  type RoleLookup,
  type UserDetail as UserDetailData,
  type UserRole,
} from "../lib/api";
import { useTranslation } from "../i18n/LanguageContext";
import { PageHead } from "../AppShell";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { Field } from "@/components/Field";
import { RoleManagerDialog } from "@/components/RoleManagerDialog";
import { ActiveBadge } from "@/components/StatusBadge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";

type UserForm = {
  firstName: string;
  lastName: string;
  middleName: string;
  nickName: string;
  email: string;
  avatarUrl: string;
  active: boolean;
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

export function UserDetail() {
  const { id } = useParams<{ id: string }>();
  const nav = useNavigate();
  const { t } = useTranslation();

  const [user, setUser] = useState<UserDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<UserForm | null>(null);
  const [saving, setSaving] = useState(false);

  const [assignedRoles, setAssignedRoles] = useState<UserRole[]>([]);
  const [allRoles, setAllRoles] = useState<RoleLookup[]>([]);
  const [rolesLoading, setRolesLoading] = useState(true);
  const [roleManagerOpen, setRoleManagerOpen] = useState(false);

  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const load = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [detail, rolesRes] = await Promise.all([getUserById(id), getUserRoles(id)]);
      setUser(detail);
      setAssignedRoles(rolesRes.items ?? []);
    } catch {
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    listRoles({ pageSize: 100 })
      .then((res) => setAllRoles(res.items ?? []))
      .catch((err) => toast.error(errorMessage(err, t.userDetail.errors.loadRoles)))
      .finally(() => setRolesLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (loading) {
    return <PageHead title={t.common.loading} onBack={() => nav("/users")} />;
  }

  if (notFound || !user) {
    return (
      <>
        <PageHead title={t.userDetail.notFoundTitle} onBack={() => nav("/users")} />
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
      nickName: user.nickName ?? "",
      email: user.email ?? "",
      avatarUrl: user.avatarUrl ?? "",
      active: user.active,
    });
    setEditing(true);
  };

  const cancelEdit = () => {
    setEditing(false);
    setForm(null);
  };

  const setField = <K extends keyof UserForm>(key: K, value: UserForm[K]) =>
    setForm((f) => (f ? { ...f, [key]: value } : f));

  const save = async () => {
    if (!form || !id || !form.firstName.trim() || !form.lastName.trim() || saving) return;
    setSaving(true);
    try {
      await updateUser(id, {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        middleName: form.middleName.trim() || null,
        nickName: form.nickName.trim() || null,
        email: form.email.trim(),
        avatarUrl: form.avatarUrl.trim() || null,
        active: form.active,
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

  return (
    <>
      <PageHead
        title={displayName}
        sub={t.userDetail.sub}
        onBack={() => nav("/users")}
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
              <div className="grid grid-cols-2 gap-3 max-[860px]:grid-cols-1">
                <Field label={t.users.firstName}>
                  <Input value={form.firstName} onChange={(e) => setField("firstName", e.target.value)} autoFocus />
                </Field>
                <Field label={t.users.lastName}>
                  <Input value={form.lastName} onChange={(e) => setField("lastName", e.target.value)} />
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-3 max-[860px]:grid-cols-1">
                <Field label={t.users.middleName}>
                  <Input value={form.middleName} onChange={(e) => setField("middleName", e.target.value)} />
                </Field>
                <Field label={t.users.nickName}>
                  <Input value={form.nickName} onChange={(e) => setField("nickName", e.target.value)} />
                </Field>
              </div>
              <Field label={t.common.email}>
                <Input value={form.email} onChange={(e) => setField("email", e.target.value)} />
              </Field>
              <Field label={t.users.avatarUrl}>
                <Input value={form.avatarUrl} onChange={(e) => setField("avatarUrl", e.target.value)} />
              </Field>
              <label className="flex items-center gap-2 text-sm font-medium">
                <Switch checked={form.active} onCheckedChange={(v) => setField("active", v)} />
                {t.users.userActive}
              </label>
            </div>
          ) : (
            <>
              <div className="mb-4 flex items-center gap-3">
                <Avatar className="size-12">
                  <AvatarImage src={user.avatarUrl ?? undefined} alt={displayName} />
                  <AvatarFallback className="bg-secondary text-sm font-semibold text-muted-foreground">
                    {initials(displayName)}
                  </AvatarFallback>
                </Avatar>
                <ActiveBadge active={user.active} />
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
                  <dt>{t.users.nickName}</dt>
                  <dd>{user.nickName || "—"}</dd>
                </div>
                <div>
                  <dt>{t.common.email}</dt>
                  <dd>{user.email || "—"}</dd>
                </div>
                <div>
                  <dt>{t.common.created}</dt>
                  <dd>{user.createdAt?.slice(0, 10)}</dd>
                </div>
              </dl>
            </>
          )}
        </CardContent>
      </Card>

      <Card className="mt-3.5">
        <CardContent>
          <div className="list-head">
            <h3>{t.userDetail.assignedRoles}</h3>
            <Button type="button" size="sm" onClick={() => setRoleManagerOpen(true)}>
              {t.userDetail.manageRoles}
            </Button>
          </div>
          {assignedRoles.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t.userDetail.noRolesAssigned}</p>
          ) : (
            <div className="flex flex-wrap gap-1">
              {assignedRoles.map((r) => (
                <span className="tag-chip static" key={r.roleId}>
                  {r.title || r.code}
                </span>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

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
    </>
  );
}
