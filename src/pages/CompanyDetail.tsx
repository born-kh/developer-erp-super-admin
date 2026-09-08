import { useEffect, useRef, useState } from "react";
import { Copy, ImageUp, Pencil, RefreshCw, Trash2 } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import {
  deleteCompanyById,
  getAllCitiesCached,
  getCompanyById,
  listPackages,
  listTariffsWithPackages,
  updateCompanyById,
  updateCompanySubscription,
  uploadFile,
  ApiRequestError,
  type CityListItem,
  type CompanyDetail as CompanyDetailData,
  type CompanyStatus,
  type PackageListItem,
  type TariffIncludingPackages,
} from "../lib/api";
import { type PlatformUser } from "../data/mock";
import { useUsers } from "../data/usersStore";
import { useModuleSettings } from "../data/moduleSettingsStore";
import { randomPassword, slugify, formatDate, usd } from "../lib/format";
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
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Textarea } from "@/components/ui/textarea";

const CITY_NONE = "none";
const TARIFF_NONE = "none";
const TRIAL_DEFAULT_DAYS = 10;
const ACTIVE_SUBSCRIPTION_DAYS = 30;

type SubscriptionForm = {
  tariffId: string;
  status: CompanyStatus;
  startDate: string;
  packageIds: string[];
};

function formatDateInput(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function addDays(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  return formatDateInput(new Date(y, m - 1, d + days));
}

function todayStr(): string {
  return formatDateInput(new Date());
}

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

  const [tariffs, setTariffs] = useState<TariffIncludingPackages[]>([]);
  const [allPackages, setAllPackages] = useState<PackageListItem[]>([]);
  const [subscriptionModalOpen, setSubscriptionModalOpen] = useState(false);
  const [subForm, setSubForm] = useState<SubscriptionForm | null>(null);
  const [subSubmitting, setSubSubmitting] = useState(false);

  useEffect(() => {
    getAllCitiesCached()
      .then(setCities)
      .catch(() => {});
    listTariffsWithPackages({ pageSize: 100 })
      .then((res) => setTariffs(res.items ?? []))
      .catch(() => {});
    listPackages({ pageSize: 100 })
      .then((res) => setAllPackages(res.items ?? []))
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
        photoName: company.photoName ?? undefined,
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
      const photoName = await uploadFile(file);
      await updateCompanyById(company.id, {
        name: company.name ?? undefined,
        phoneNumber: company.phoneNumber ?? undefined,
        email: company.email ?? undefined,
        cityId: company.cityId ?? undefined,
        photoName,
        addressTranslations: company.addressTranslations ?? {},
        descriptionTranslations: company.descriptionTranslations ?? {},
      });
      load();
    } catch (err) {
      toast.error(errorMessage(err, t.companyDetail.errors.saveCompany));
    } finally {
      setPhotoUploading(false);
    }
  };

  const openEditSubscription = () => {
    setSubForm({
      tariffId: company.subscription?.tariffId ?? "",
      status: company.subscription?.status ?? "Trial",
      startDate: company.subscription?.date.startDate?.slice(0, 10) ?? todayStr(),
      packageIds: (company.subscription?.packages ?? []).map((p) => p.id),
    });
    setSubscriptionModalOpen(true);
  };

  const setSubField = <K extends keyof SubscriptionForm>(key: K, value: SubscriptionForm[K]) =>
    setSubForm((f) => (f ? { ...f, [key]: value } : f));

  const tariffPackageIds = (tariffId: string) =>
    (tariffs.find((tr) => tr.id === tariffId)?.packages ?? []).map((p) => p.id);

  const selectSubTariff = (tariffId: string) => {
    const newTariffId = tariffId === TARIFF_NONE ? "" : tariffId;
    setSubForm((f) => (f ? { ...f, tariffId: newTariffId, packageIds: tariffPackageIds(newTariffId) } : f));
  };

  const addPackageToSub = (pkgId: string) => {
    if (!pkgId || subForm?.packageIds.includes(pkgId)) return;
    setSubForm((f) => (f ? { ...f, tariffId: "", packageIds: [...f.packageIds, pkgId] } : f));
  };

  const removePackageFromSub = (pkgId: string) => {
    setSubForm((f) => {
      if (!f) return f;
      const isTariffPackage = tariffPackageIds(f.tariffId).includes(pkgId);
      return {
        ...f,
        tariffId: isTariffPackage ? "" : f.tariffId,
        packageIds: f.packageIds.filter((id) => id !== pkgId),
      };
    });
  };

  const submitSubscription = async () => {
    if (!subForm || subSubmitting) return;
    setSubSubmitting(true);
    try {
      await updateCompanySubscription(company.id, {
        tariffId: subForm.tariffId || undefined,
        status: subForm.status,
        startDate: subForm.startDate,
        packageIds: subForm.packageIds,
      });
      toast.success(t.companyDetail.toasts.subscriptionSaved);
      setSubscriptionModalOpen(false);
      load();
    } catch (err) {
      toast.error(errorMessage(err, t.companyDetail.errors.saveSubscription));
    } finally {
      setSubSubmitting(false);
    }
  };

  const selectedSubPackages = (subForm?.packageIds ?? [])
    .map((id) => allPackages.find((p) => p.id === id))
    .filter((p): p is PackageListItem => Boolean(p));
  const availableSubPackages = allPackages.filter((p) => !(subForm?.packageIds ?? []).includes(p.id));
  const subTariffPackageIds = tariffPackageIds(subForm?.tariffId ?? "");
  const subCost = selectedSubPackages.reduce((sum, p) => sum + p.cost, 0);
  const selectedFormTariff = tariffs.find((tr) => tr.id === subForm?.tariffId);
  const subExtraPackageIds = (subForm?.packageIds ?? []).filter((id) => !subTariffPackageIds.includes(id));
  const showTariffPrice = Boolean(selectedFormTariff) && subExtraPackageIds.length === 0;
  const subEndDate =
    subForm && subForm.status !== "Suspended"
      ? addDays(
          subForm.startDate,
          subForm.status === "Trial"
            ? settings.trialSubscriptionDurationInDays ?? TRIAL_DEFAULT_DAYS
            : ACTIVE_SUBSCRIPTION_DAYS,
        )
      : null;

  const subscriptionTariff = tariffs.find((tr) => tr.id === company.subscription?.tariffId);
  const subscriptionTariffPackageIds = (subscriptionTariff?.packages ?? []).map((p) => p.id);
  const subscriptionExtraPackages = (company.subscription?.packages ?? []).filter(
    (p) => !subscriptionTariffPackageIds.includes(p.id),
  );
  const showSubscriptionTariffPrice = Boolean(subscriptionTariff) && subscriptionExtraPackages.length === 0;

  return (
    <>
      <PageHead title={company.name || "—"} sub={t.companyDetail.sub} onBack={() => nav("/companies")} />

      <div className="detail-layout">
        <Card className="detail-media gap-0 overflow-hidden py-0">
          <div className="aspect-[4/3] w-full overflow-hidden bg-secondary">
            <CompanyPhoto photoName={company.photoName} alt={company.name ?? ""} />
          </div>
          <div className="flex items-center justify-center gap-3 p-3.5">
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
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      disabled={photoUploading}
                      onClick={() => fileInputRef.current?.click()}
                      aria-label={t.common.chooseImage}
                    >
                      <ImageUp />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>{t.common.chooseImage}</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button type="button" variant="outline" size="icon" onClick={startEdit} aria-label={t.common.edit}>
                      <Pencil />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>{t.common.edit}</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      onClick={() => setConfirmingDelete(true)}
                      aria-label={t.common.delete}
                    >
                      <Trash2 />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>{t.common.delete}</TooltipContent>
                </Tooltip>
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
            <Button type="button" variant="outline" size="sm" onClick={openEditSubscription}>
              {t.common.edit}
            </Button>
          </div>
          {company.subscription ? (
            <div className="grid grid-cols-6 gap-4 max-[1024px]:grid-cols-3 max-[640px]:grid-cols-2 max-[420px]:grid-cols-1">
              <div>
                <div className="text-[11px] font-semibold tracking-[0.06em] text-muted-foreground uppercase">
                  {t.tariffs.title}
                </div>
                <div className="mt-1 font-semibold">{subscriptionTariff?.code || t.companyDetail.noTariff}</div>
              </div>
              <div>
                <div className="text-[11px] font-semibold tracking-[0.06em] text-muted-foreground uppercase">
                  {t.tariffs.packagesLabel}
                </div>
                <div className="mt-1">
                  {company.subscription.packages?.length ? (
                    <div className="flex flex-wrap gap-1.5">
                      {company.subscription.packages.map((p) => (
                        <span className="tag-chip static" key={p.id}>
                          {p.title}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </div>
              </div>
              <div>
                <div className="text-[11px] font-semibold tracking-[0.06em] text-muted-foreground uppercase">
                  {t.common.status}
                </div>
                <div className="mt-1.5">
                  <CompanyStatusBadge status={company.subscription.status} />
                </div>
              </div>
              <div>
                <div className="text-[11px] font-semibold tracking-[0.06em] text-muted-foreground uppercase">
                  {t.companyDetail.subscriptionStart}
                </div>
                <div className="mt-1 font-semibold">{formatDate(company.subscription.date.startDate, language)}</div>
              </div>
              <div>
                <div className="text-[11px] font-semibold tracking-[0.06em] text-muted-foreground uppercase">
                  {t.companyDetail.subscriptionEnd}
                </div>
                <div className="mt-1 font-semibold">
                  {company.subscription.date.endDate ? formatDate(company.subscription.date.endDate, language) : "—"}
                </div>
              </div>
              <div>
                <div className="text-[11px] font-semibold tracking-[0.06em] text-muted-foreground uppercase">
                  {t.companyDetail.subscriptionPrice}
                </div>
                <div className="mt-1 font-semibold">
                  {usd(showSubscriptionTariffPrice ? subscriptionTariff!.cost : company.subscription.originalCost)}
                </div>
                {showSubscriptionTariffPrice && (
                  <div className="text-xs text-muted-foreground line-through">
                    {usd(company.subscription.originalCost)}
                  </div>
                )}
              </div>
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

      <Dialog open={subscriptionModalOpen} onOpenChange={(open) => !open && setSubscriptionModalOpen(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.companyDetail.subscriptionTitle}</DialogTitle>
          </DialogHeader>
          {subForm && (
            <div className="grid gap-3">
              <Field label={t.tariffs.title}>
                <Select value={subForm.tariffId || TARIFF_NONE} onValueChange={selectSubTariff}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={t.companyDetail.noTariff} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={TARIFF_NONE}>{t.companyDetail.noTariff}</SelectItem>
                    {tariffs
                      .filter((tr) => tr.isActive || tr.id === subForm.tariffId)
                      .map((tr) => (
                        <SelectItem key={tr.id} value={tr.id}>
                          {tr.code}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </Field>
              <div className="grid grid-cols-2 gap-3 max-[860px]:grid-cols-1">
                <Field label={t.common.status}>
                  <Select value={subForm.status} onValueChange={(v) => setSubField("status", v as CompanyStatus)}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Trial">{t.common.statusTrial}</SelectItem>
                      <SelectItem value="Active">{t.common.statusActive}</SelectItem>
                      <SelectItem value="Suspended">{t.common.statusSuspended}</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
                <Field label={t.companyDetail.subscriptionStart}>
                  <Input
                    type="date"
                    min={todayStr()}
                    value={subForm.startDate}
                    onChange={(e) => setSubField("startDate", e.target.value)}
                  />
                </Field>
              </div>
              {subEndDate && (
                <p className="-mt-1.5 text-xs text-muted-foreground">
                  {t.companyDetail.subscriptionEnd}: <span className="font-medium text-foreground">{formatDate(subEndDate, language)}</span>
                </p>
              )}
              <Field label={t.tariffs.packagesLabel}>
                <div className="tag-input">
                  {selectedSubPackages.length > 0 && (
                    <div className="tag-list">
                      {selectedSubPackages.map((p) => (
                        <span
                          className={`tag-chip ${subTariffPackageIds.includes(p.id) ? "tag-chip-tariff" : ""}`}
                          key={p.id}
                          title={subTariffPackageIds.includes(p.id) ? t.companyDetail.fromTariff : undefined}
                        >
                          {subTariffPackageIds.includes(p.id) && <span className="tag-chip-dot" aria-hidden />}
                          {p.title}
                          <button type="button" onClick={() => removePackageFromSub(p.id)} aria-label={t.common.delete}>
                            ✕
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                  {availableSubPackages.length > 0 && (
                    <Select key={subForm.packageIds.join(",")} onValueChange={addPackageToSub}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder={t.tariffs.choosePackage} />
                      </SelectTrigger>
                      <SelectContent>
                        {availableSubPackages.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </Field>
              <div className="rounded-md border bg-muted/40 px-3 py-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">{t.companyDetail.subscriptionPrice}</span>
                  <span className="font-semibold">{usd(showTariffPrice ? selectedFormTariff!.cost : subCost)}</span>
                </div>
                {showTariffPrice && (
                  <div className="mt-1 flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">{t.companyDetail.subscriptionRealCost}</span>
                    <span className="text-xs text-muted-foreground line-through">{usd(selectedFormTariff!.originalCost)}</span>
                  </div>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setSubscriptionModalOpen(false)}>
              {t.common.cancel}
            </Button>
            <Button
              type="button"
              disabled={subSubmitting || !subForm || subForm.packageIds.length === 0}
              onClick={submitSubscription}
            >
              {t.common.save}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
