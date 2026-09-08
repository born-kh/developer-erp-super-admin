import { useEffect, useRef, useState } from "react";
import { Copy, RefreshCw } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import {
  deleteCompanyById,
  getCompanyById,
  listCities,
  updateCompanyById,
  uploadCompanyPhoto,
  ApiRequestError,
  type CityListItem,
  type CompanyDetail as CompanyDetailData,
} from "../lib/api";
import { type PlatformUser } from "../data/mock";
import { useUsers } from "../data/usersStore";
import { useModuleSettings } from "../data/moduleSettingsStore";
import { randomPassword, slugify, formatDate } from "../lib/format";
import { useTranslation } from "../i18n/LanguageContext";
import { PageHead } from "../AppShell";
import { CompanyPhoto } from "@/components/CompanyPhoto";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { Field } from "@/components/Field";
import { CompanyStatusBadge } from "@/components/StatusBadge";
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

const CITY_NONE = "none";

type OwnerForm = { name: string; email: string; phone: string; login: string; password: string };
const emptyOwnerForm: OwnerForm = { name: "", email: "", phone: "", login: "", password: "" };

type Translations = Record<string, string>;

type CompanyForm = {
  name: string;
  phoneNumber: string;
  email: string;
  cityId: string;
  addressTranslations: Translations;
  descriptionTranslations: Translations;
};

function toTranslations(source: Record<string, string> | null | undefined, langs: string[]): Translations {
  return Object.fromEntries(langs.map((l) => [l, source?.[l] ?? ""]));
}

function errorMessage(err: unknown, fallback: string) {
  return err instanceof ApiRequestError ? err.message : fallback;
}

export function CompanyDetail() {
  const { id } = useParams<{ id: string }>();
  const nav = useNavigate();
  const { t, language } = useTranslation();
  const { settings } = useModuleSettings();
  const langs = settings.supportedLanguages;
  const defaultLang = settings.defaultLanguage;
  const { users, addUser, updateUser, deleteUser } = useUsers();

  const [company, setCompany] = useState<CompanyDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [cities, setCities] = useState<CityListItem[]>([]);

  const [editing, setEditing] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [form, setForm] = useState<CompanyForm | null>(null);
  const [activeLang, setActiveLang] = useState(defaultLang);
  const [submitting, setSubmitting] = useState(false);
  const [photoUploading, setPhotoUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [ownerModal, setOwnerModal] = useState<{ mode: "create" | "edit"; id?: string } | null>(null);
  const [ownerForm, setOwnerForm] = useState<OwnerForm>(emptyOwnerForm);
  const [loginTouched, setLoginTouched] = useState(false);
  const [confirmDeleteOwnerId, setConfirmDeleteOwnerId] = useState<string | null>(null);

  useEffect(() => {
    listCities({ pageSize: 200 })
      .then((res) => setCities(res.items ?? []))
      .catch(() => {});
  }, []);

  const load = () => {
    if (!id) return;
    setLoading(true);
    getCompanyById(id)
      .then((data) => setCompany(data))
      .catch((err) => {
        toast.error(errorMessage(err, t.companyDetail.errors.loadCompany));
        setCompany(null);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (loading) {
    return (
      <>
        <PageHead title={t.common.loading} onBack={() => nav("/companies")} />
      </>
    );
  }

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
  const cityName = cities.find((c) => c.id === company.cityId)?.name || "—";
  const address = company.addressTranslations?.[language] || company.addressTranslations?.[defaultLang] || "—";
  const description =
    company.descriptionTranslations?.[language] || company.descriptionTranslations?.[defaultLang] || "—";

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
    setForm({
      name: company.name ?? "",
      phoneNumber: company.phoneNumber ?? "",
      email: company.email ?? "",
      cityId: company.cityId ?? "",
      addressTranslations: toTranslations(company.addressTranslations, langs),
      descriptionTranslations: toTranslations(company.descriptionTranslations, langs),
    });
    setActiveLang(defaultLang);
    setEditing(true);
  };

  const cancelEdit = () => {
    setForm(null);
    setEditing(false);
  };

  const setField = <K extends keyof CompanyForm>(key: K, value: CompanyForm[K]) =>
    setForm((f) => (f ? { ...f, [key]: value } : f));
  const setAddress = (lang: string, value: string) =>
    setForm((f) => (f ? { ...f, addressTranslations: { ...f.addressTranslations, [lang]: value } } : f));
  const setDescription = (lang: string, value: string) =>
    setForm((f) => (f ? { ...f, descriptionTranslations: { ...f.descriptionTranslations, [lang]: value } } : f));

  const collectTranslations = (translations: Translations) =>
    Object.fromEntries(langs.filter((l) => translations[l]?.trim()).map((l) => [l, translations[l].trim()]));

  const save = async () => {
    if (!form || !form.name.trim() || submitting) return;
    setSubmitting(true);
    try {
      await updateCompanyById(company.id, {
        name: form.name.trim(),
        phoneNumber: form.phoneNumber.trim() || undefined,
        email: form.email.trim() || undefined,
        cityId: form.cityId || undefined,
        addressTranslations: collectTranslations(form.addressTranslations),
        descriptionTranslations: collectTranslations(form.descriptionTranslations),
      });
      toast.success(t.companyDetail.toasts.companySaved);
      setEditing(false);
      load();
    } catch (err) {
      toast.error(errorMessage(err, t.companyDetail.errors.saveCompany));
    } finally {
      setSubmitting(false);
    }
  };

  const remove = async () => {
    try {
      await deleteCompanyById(company.id);
      toast.success(t.companyDetail.toasts.companyDeleted);
      nav("/companies");
    } catch (err) {
      toast.error(errorMessage(err, t.companyDetail.errors.deleteCompany));
    } finally {
      setConfirmingDelete(false);
    }
  };

  const pickPhoto = async (file: File | undefined) => {
    if (!file) return;
    setPhotoUploading(true);
    try {
      await uploadCompanyPhoto(company.id, file);
      load();
    } catch (err) {
      toast.error(errorMessage(err, t.companyDetail.errors.saveCompany));
    } finally {
      setPhotoUploading(false);
    }
  };

  return (
    <>
      <PageHead title={company.name || "—"} sub={t.companyDetail.sub} onBack={() => nav("/companies")} />

      <div className="detail-layout">
        <Card className="detail-media gap-0 overflow-hidden py-0">
          <div className="aspect-[4/3] w-full overflow-hidden bg-secondary">
            <CompanyPhoto photoName={company.photoName} alt={company.name ?? ""} />
          </div>
          <div className="flex gap-2 p-3.5">
            {editing ? (
              <>
                <Button type="button" className="flex-1" disabled={submitting} onClick={save}>
                  {t.common.save}
                </Button>
                <Button type="button" variant="outline" className="flex-1" onClick={cancelEdit}>
                  {t.common.cancel}
                </Button>
              </>
            ) : (
              <>
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  disabled={photoUploading}
                  onClick={() => fileInputRef.current?.click()}
                >
                  {t.common.chooseImage}
                </Button>
                <Button type="button" variant="outline" className="flex-1" onClick={startEdit}>
                  {t.common.edit}
                </Button>
                <Button type="button" variant="destructive" className="flex-1" onClick={() => setConfirmingDelete(true)}>
                  {t.common.delete}
                </Button>
              </>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            hidden
            onChange={(e) => pickPhoto(e.target.files?.[0])}
          />
        </Card>

        <Card>
          <CardContent>
            {editing && form ? (
              <div className="grid gap-3">
                <Field label={t.common.name}>
                  <Input value={form.name} onChange={(e) => setField("name", e.target.value)} />
                </Field>
                <Field label={t.common.city}>
                  <Select
                    value={form.cityId || CITY_NONE}
                    onValueChange={(v) => setField("cityId", v === CITY_NONE ? "" : v)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={t.companies.cityNotSelected} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={CITY_NONE}>{t.companies.cityNotSelected}</SelectItem>
                      {cities.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <div className="grid grid-cols-2 gap-3 max-[860px]:grid-cols-1">
                  <Field label={t.common.phone}>
                    <Input value={form.phoneNumber} onChange={(e) => setField("phoneNumber", e.target.value)} />
                  </Field>
                  <Field label={t.common.email}>
                    <Input value={form.email} onChange={(e) => setField("email", e.target.value)} />
                  </Field>
                </div>
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
                <Field label={t.companies.addressLang(activeLang.toUpperCase())}>
                  <Input
                    value={form.addressTranslations[activeLang] ?? ""}
                    onChange={(e) => setAddress(activeLang, e.target.value)}
                  />
                </Field>
                <Field label={t.companies.descriptionLang(activeLang.toUpperCase())}>
                  <Textarea
                    rows={3}
                    value={form.descriptionTranslations[activeLang] ?? ""}
                    onChange={(e) => setDescription(activeLang, e.target.value)}
                  />
                </Field>
              </div>
            ) : (
              <>
                <div className="mb-2.5 flex gap-1.5">
                  <CompanyStatusBadge status={company.subscription?.status ?? ""} />
                </div>
                <p className="mb-4 leading-relaxed text-muted-foreground">{description}</p>
                <dl className="detail-dl">
                  <div>
                    <dt>{t.common.city}</dt>
                    <dd>{cityName}</dd>
                  </div>
                  <div>
                    <dt>{t.common.address}</dt>
                    <dd>{address}</dd>
                  </div>
                  <div>
                    <dt>{t.common.phone}</dt>
                    <dd>{company.phoneNumber || "—"}</dd>
                  </div>
                  <div>
                    <dt>{t.common.email}</dt>
                    <dd>{company.email || "—"}</dd>
                  </div>
                  <div>
                    <dt>{t.common.created}</dt>
                    <dd>{formatDate(company.createdAt, language)}</dd>
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
            <h3>{t.companyDetail.subscriptionTitle}</h3>
          </div>
          {company.subscription?.packages?.length ? (
            <div className="flex flex-wrap gap-1.5">
              {company.subscription.packages.map((p) => (
                <span className="tag-chip static" key={p.id}>
                  {p.title}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">{t.companyDetail.noSubscription}</p>
          )}
        </CardContent>
      </Card>

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
        description={t.companyDetail.deleteCompanyDesc(company.name ?? "")}
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
            <Field label={t.companyDetail.loginLabel}>
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
