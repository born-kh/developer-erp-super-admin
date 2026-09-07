import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Camera, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { updateUser, ApiRequestError } from "../lib/api";
import { useCurrentUser } from "../data/currentUserStore";
import { useTranslation } from "../i18n/LanguageContext";
import { PageHead } from "../AppShell";
import { Field } from "@/components/Field";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type ProfileForm = {
  firstName: string;
  lastName: string;
  middleName: string;
  nickName: string;
  email: string;
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

export function Profile() {
  const nav = useNavigate();
  const { t } = useTranslation();
  const { user, refresh } = useCurrentUser();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<ProfileForm | null>(null);
  const [saving, setSaving] = useState(false);
  const [avatarSaving, setAvatarSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!user) {
    return <PageHead title={t.common.loading} />;
  }

  const displayName = user.fullName || user.email || user.id;

  const startEdit = () => {
    setForm({
      firstName: user.firstName ?? "",
      lastName: user.lastName ?? "",
      middleName: user.middleName ?? "",
      nickName: user.nickName ?? "",
      email: user.email ?? "",
    });
    setEditing(true);
  };

  const cancelEdit = () => {
    setEditing(false);
    setForm(null);
  };

  const setField = <K extends keyof ProfileForm>(key: K, value: ProfileForm[K]) =>
    setForm((f) => (f ? { ...f, [key]: value } : f));

  const save = async () => {
    if (!form || !form.firstName.trim() || !form.lastName.trim() || saving) return;
    setSaving(true);
    try {
      await updateUser(user.id, {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        middleName: form.middleName.trim() || null,
        nickName: form.nickName.trim() || null,
        email: form.email.trim(),
        avatarUrl: user.avatarUrl,
        active: user.active,
      });
      toast.success(t.profile.toasts.saved);
      setEditing(false);
      setForm(null);
      await refresh();
    } catch (err) {
      toast.error(errorMessage(err, t.profile.errors.saveProfile));
    } finally {
      setSaving(false);
    }
  };

  const pickAvatar = (file: File | undefined) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      setAvatarSaving(true);
      try {
        await updateUser(user.id, {
          firstName: user.firstName ?? "",
          lastName: user.lastName ?? "",
          middleName: user.middleName,
          nickName: user.nickName,
          email: user.email ?? "",
          avatarUrl: String(reader.result),
          active: user.active,
        });
        toast.success(t.profile.toasts.saved);
        await refresh();
      } catch (err) {
        toast.error(errorMessage(err, t.profile.errors.saveProfile));
      } finally {
        setAvatarSaving(false);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <>
      <div className="flex justify-end">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => nav("/")}
          aria-label={t.common.close}
        >
          <X />
        </Button>
      </div>

      <div className="flex flex-col items-center gap-3 py-6 text-center">
        <div className="relative">
          <Avatar className="size-32">
            <AvatarImage src={user.avatarUrl ?? undefined} alt={displayName} />
            <AvatarFallback className="bg-secondary text-3xl font-semibold text-muted-foreground">
              {initials(displayName)}
            </AvatarFallback>
          </Avatar>
          <button
            type="button"
            className="absolute bottom-0 right-0 grid size-10 place-items-center rounded-full bg-primary text-primary-foreground shadow ring-2 ring-background hover:bg-primary/90 disabled:opacity-60"
            onClick={() => fileInputRef.current?.click()}
            aria-label={t.profile.changeAvatar}
            disabled={avatarSaving}
          >
            {avatarSaving ? <Loader2 className="size-4 animate-spin" /> : <Camera className="size-4" />}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            hidden
            onChange={(e) => pickAvatar(e.target.files?.[0])}
          />
        </div>
        <div className="min-w-0">
          <div className="truncate text-lg font-semibold">{displayName}</div>
          <div className="truncate text-sm text-muted-foreground">{user.email}</div>
        </div>
        {editing ? (
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={cancelEdit} disabled={saving}>
              {t.common.cancel}
            </Button>
            <Button type="button" onClick={save} disabled={saving}>
              {t.common.save}
            </Button>
          </div>
        ) : (
          <Button type="button" variant="outline" onClick={startEdit}>
            {t.common.edit}
          </Button>
        )}
      </div>

      <Card className="mx-auto max-w-3xl">
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
              </div>
            ) : (
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
            )}
          </CardContent>
        </Card>
    </>
  );
}
