import { useState } from "react";
import { Copy, RefreshCw } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { type Company, type PlatformUser } from "../data/mock";
import { useCompanies } from "../data/companiesStore";
import { useUsers } from "../data/usersStore";
import { randomPassword, slugify } from "../lib/format";
import { useTranslation } from "../i18n/LanguageContext";
import { PageHead } from "../AppShell";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { Field } from "@/components/Field";
import { CompanyStatusBadge, StatusBadge } from "@/components/StatusBadge";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

type OwnerForm = { name: string; email: string; phone: string; login: string; password: string };

const emptyOwnerForm: OwnerForm = { name: "", email: "", phone: "", login: "", password: "" };

export function CompanyDetail() {
  const { id } = useParams<{ id: string }>();
  const nav = useNavigate();
  const { t } = useTranslation();
  const { getCompany, updateCompany, deleteCompany } = useCompanies();
  const { users, addUser, updateUser, deleteUser } = useUsers();
  const company = id ? getCompany(id) : undefined;
  const [editing, setEditing] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [form, setForm] = useState<Company | null>(company ?? null);

  const [ownerModal, setOwnerModal] = useState<{ mode: "create" | "edit"; id?: string } | null>(null);
  const [ownerForm, setOwnerForm] = useState<OwnerForm>(emptyOwnerForm);
  const [loginTouched, setLoginTouched] = useState(false);
  const [confirmDeleteOwnerId, setConfirmDeleteOwnerId] = useState<string | null>(null);

  if (!company) {
    return (
      <>
        <PageHead title={t.companyDetail.notFoundTitle} onBack={() => nav("/companies")} />
        <Card>
          <CardContent className="grid gap-3">
            <p className="text-sm text-muted-foreground">{t.companyDetail.notFoundText}</p>
            <Button type="button" variant="outline" onClick={() => nav("/companies")}>
              {t.companyDetail.backToList}
            </Button>
          </CardContent>
        </Card>
      </>
    );
  }

  const owners = users.filter((u) => u.companyId === company.id && u.role === "owner");

  const openCreateOwner = () => {
    setOwnerForm({ ...emptyOwnerForm, password: randomPassword() });
    setLoginTouched(false);
    setOwnerModal({ mode: "create" });
  };

  const openEditOwner = (o: PlatformUser) => {
    setOwnerForm({ name: o.name, email: o.email, phone: o.phone ?? "", login: o.login ?? "", password: o.password ?? "" });
    setLoginTouched(true);
    setOwnerModal({ mode: "edit", id: o.id });
  };

  const setOwnerField = <K extends keyof OwnerForm>(key: K, value: OwnerForm[K]) => {
    setOwnerForm((f) => {
      const next = { ...f, [key]: value };
      if (key === "name" && !loginTouched) next.login = slugify(value as string);
      return next;
    });
    if (key === "login") setLoginTouched(true);
  };

  const submitOwner = () => {
    if (!ownerForm.name.trim()) return;
    if (ownerModal?.mode === "edit" && ownerModal.id) {
      updateUser(ownerModal.id, { ...ownerForm, role: "owner", companyId: company.id });
      toast.success(t.companyDetail.toasts.ownerSaved);
    } else {
      addUser({ ...ownerForm, role: "owner", companyId: company.id });
      toast.success(t.companyDetail.toasts.ownerAdded);
    }
    setOwnerModal(null);
  };

  const removeOwner = (ownerId: string) => {
    deleteUser(ownerId);
    setConfirmDeleteOwnerId(null);
    toast.success(t.companyDetail.toasts.ownerDeleted);
  };

  const copyPassword = (o: PlatformUser) => {
    if (!o.password) return;
    navigator.clipboard?.writeText(o.password).catch(() => {});
    toast.success(t.common.passwordCopied);
  };

  const copyModalPassword = () => {
    if (!ownerForm.password) return;
    navigator.clipboard?.writeText(ownerForm.password).catch(() => {});
    toast.success(t.common.passwordCopied);
  };

  const startEdit = () => {
    setForm(company);
    setEditing(true);
  };

  const cancelEdit = () => {
    setForm(company);
    setEditing(false);
  };

  const save = () => {
    if (!form) return;
    updateCompany(company.id, form);
    setEditing(false);
    toast.success(t.companyDetail.toasts.companySaved);
  };

  const remove = () => {
    deleteCompany(company.id);
    toast.success(t.companyDetail.toasts.companyDeleted);
    nav("/companies");
  };

  const set = <K extends keyof Company>(key: K, value: Company[K]) =>
    setForm((f) => (f ? { ...f, [key]: value } : f));

  return (
    <>
      <PageHead title={company.name} sub={t.companyDetail.sub} onBack={() => nav("/companies")} />

      <div className="detail-layout">
        <Card className="detail-media gap-0 py-0 overflow-hidden">
          <img src={company.image} alt={company.name} />
          <div className="flex gap-2 p-3.5">
            {editing ? (
              <>
                <Button type="button" className="flex-1" onClick={save}>
                  {t.common.save}
                </Button>
                <Button type="button" variant="outline" className="flex-1" onClick={cancelEdit}>
                  {t.common.cancel}
                </Button>
              </>
            ) : (
              <>
                <Button type="button" variant="outline" className="flex-1" onClick={startEdit}>
                  {t.common.edit}
                </Button>
                <Button type="button" variant="destructive" className="flex-1" onClick={() => setConfirmingDelete(true)}>
                  {t.common.delete}
                </Button>
              </>
            )}
          </div>
        </Card>

        <Card>
          <CardContent>
            {editing && form ? (
              <div className="grid gap-3">
                <Field label={t.common.name}>
                  <Input value={form.name} onChange={(e) => set("name", e.target.value)} />
                </Field>
                <Field label={t.common.city}>
                  <Input value={form.city} onChange={(e) => set("city", e.target.value)} />
                </Field>
                <div className="grid grid-cols-2 gap-3 max-[860px]:grid-cols-1">
                  <Field label={t.common.package}>
                    <Select value={form.package} onValueChange={(v) => set("package", v as Company["package"])}>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="basic">basic</SelectItem>
                        <SelectItem value="pro">pro</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field label={t.common.status}>
                    <Select value={form.status} onValueChange={(v) => set("status", v as Company["status"])}>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">{t.common.statusActive}</SelectItem>
                        <SelectItem value="trial">{t.common.statusTrial}</SelectItem>
                        <SelectItem value="suspended">{t.common.statusSuspended}</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                </div>
                <Field label={t.common.phone}>
                  <Input value={form.phone} onChange={(e) => set("phone", e.target.value)} />
                </Field>
                <Field label={t.common.email}>
                  <Input value={form.email} onChange={(e) => set("email", e.target.value)} />
                </Field>
                <Field label={t.common.address}>
                  <Input value={form.address} onChange={(e) => set("address", e.target.value)} />
                </Field>
                <Field label={t.common.description}>
                  <Textarea rows={3} value={form.description} onChange={(e) => set("description", e.target.value)} />
                </Field>
              </div>
            ) : (
              <>
                <div className="mb-2.5 flex gap-1.5">
                  <StatusBadge tone="success">{company.package}</StatusBadge>
                  <CompanyStatusBadge status={company.status} />
                </div>
                <p className="mb-4 text-muted-foreground leading-relaxed">{company.description}</p>
                <dl className="detail-dl">
                  <div>
                    <dt>{t.common.city}</dt>
                    <dd>{company.city}</dd>
                  </div>
                  <div>
                    <dt>{t.common.address}</dt>
                    <dd>{company.address}</dd>
                  </div>
                  <div>
                    <dt>{t.common.phone}</dt>
                    <dd>{company.phone}</dd>
                  </div>
                  <div>
                    <dt>{t.common.email}</dt>
                    <dd>{company.email}</dd>
                  </div>
                  <div>
                    <dt>{t.common.created}</dt>
                    <dd>{company.createdAt}</dd>
                  </div>
                  <div>
                    <dt>{t.companyDetail.ownersCount}</dt>
                    <dd>{owners.length}</dd>
                  </div>
                </dl>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="mt-3.5">
        <CardContent>
          <div className="list-head">
            <h3>{t.companyDetail.ownersTitle}</h3>
            <Button type="button" size="sm" onClick={openCreateOwner}>
              {t.companyDetail.addOwner}
            </Button>
          </div>
          {owners.length === 0 && <p className="text-sm text-muted-foreground">{t.companyDetail.noOwners}</p>}
          {owners.map((o) => (
            <div className="owner-row" key={o.id}>
              <div className="owner-row-main">
                <b>{o.name}</b>
                <div className="text-sm text-muted-foreground">
                  {o.email}
                  {o.phone ? ` · ${o.phone}` : ""}
                </div>
                {o.login && <div className="text-sm text-muted-foreground">{t.companyDetail.loginLabel} {o.login}</div>}
              </div>
              <div className="owner-row-actions">
                {o.password && (
                  <Button type="button" variant="outline" size="sm" onClick={() => copyPassword(o)}>
                    {t.common.copyPassword}
                  </Button>
                )}
                <Button type="button" variant="outline" size="sm" onClick={() => openEditOwner(o)}>
                  {t.common.edit}
                </Button>
                <Button type="button" variant="destructive" size="sm" onClick={() => setConfirmDeleteOwnerId(o.id)}>
                  {t.common.delete}
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={confirmingDelete}
        onOpenChange={setConfirmingDelete}
        title={t.companyDetail.deleteCompanyTitle}
        description={t.companyDetail.deleteCompanyDesc(company.name)}
        onConfirm={remove}
      />
      <ConfirmDialog
        open={Boolean(confirmDeleteOwnerId)}
        onOpenChange={(open) => !open && setConfirmDeleteOwnerId(null)}
        description={t.companyDetail.ownerWillBeDeleted}
        onConfirm={() => confirmDeleteOwnerId && removeOwner(confirmDeleteOwnerId)}
      />

      <Dialog open={Boolean(ownerModal)} onOpenChange={(open) => !open && setOwnerModal(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{ownerModal?.mode === "edit" ? t.companyDetail.ownerModalTitleEdit : t.companyDetail.ownerModalTitleCreate}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3">
            <Field label={t.companyDetail.fullName}>
              <Input value={ownerForm.name} onChange={(e) => setOwnerField("name", e.target.value)} autoFocus />
            </Field>
            <Field label={t.common.email}>
              <Input value={ownerForm.email} onChange={(e) => setOwnerField("email", e.target.value)} />
            </Field>
            <Field label={t.common.phone}>
              <Input value={ownerForm.phone} onChange={(e) => setOwnerField("phone", e.target.value)} />
            </Field>
            <Field label={t.users.tableLogin}>
              <Input value={ownerForm.login} onChange={(e) => setOwnerField("login", e.target.value)} />
            </Field>
            <Field label={t.login.password}>
              <div className="password-gen">
                <Input value={ownerForm.password} onChange={(e) => setOwnerField("password", e.target.value)} />
                <Button type="button" variant="outline" size="icon" onClick={copyModalPassword} aria-label={t.common.copyPassword}>
                  <Copy />
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={() => setOwnerField("password", randomPassword())}>
                  <RefreshCw />
                  {t.common.generate}
                </Button>
              </div>
            </Field>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOwnerModal(null)}>
              {t.common.cancel}
            </Button>
            <Button type="button" disabled={!ownerForm.name.trim()} onClick={submitOwner}>
              {ownerModal?.mode === "edit" ? t.common.save : t.common.create}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
