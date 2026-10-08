import { useEffect, useRef, useState } from "react";
import {
  Copy,
  CreditCard,
  ImageUp,
  Info,
  Loader2,
  Receipt,
  RefreshCw,
  UserRound,
  Users,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import {
  activateCompanySubscription,
  createOwnerUser,
  deleteCompanyById,
  deleteUser,
  getAllCitiesCached,
  getCompanyById,
  getCompanySubscription,
  getUserById,
  listTariffsWithPackages,
  listUsers,
  refundCompanyBalance,
  topUpCompanyBalance,
  updateCompanyById,
  updateCompanySubscription,
  updateUser,
  uploadFile,
  ApiRequestError,
  type CityListItem,
  type CompanyDetail as CompanyDetailData,
  type CompanyStatus,
  type CompanySubscriptionDetail,
  type PaymentMethod,
  type SubscriptionPriceLine,
  type TariffIncludingPackages,
  type UserListItem,
} from "../lib/api";
import { useModuleSettings } from "../data/moduleSettingsStore";
import { useFileUrl } from "../hooks/useFileUrl";
import { formatDate, formatMoney, randomPassword } from "../lib/format";
import { useTranslation } from "../i18n/LanguageContext";
import { PageHead } from "../AppShell";
import { CompanyPhoto } from "@/components/CompanyPhoto";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { Field } from "@/components/Field";
import { CompanyStatusBadge } from "@/components/StatusBadge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Textarea } from "@/components/ui/textarea";

const CITY_NONE = "none";
const TRIAL_DEFAULT_DAYS = 10;
const ACTIVE_SUBSCRIPTION_DAYS = 30;

type SubscriptionForm = {
  tariffId: string;
  status: CompanyStatus;
  startDate: string;
  discount: number;
};

type BalanceForm = {
  mode: "topup" | "refund";
  amount: string;
  paymentMethod: PaymentMethod;
};

const PAYMENT_METHODS: PaymentMethod[] = ["Cash", "Card", "BankTransfer", "Wallet", "Other"];

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

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

type OwnerForm = {
  firstName: string;
  lastName: string;
  middleName: string;
  email: string;
  avatarName: string;
  password: string;
  isActive: boolean;
};
const emptyOwnerForm: OwnerForm = {
  firstName: "",
  lastName: "",
  middleName: "",
  email: "",
  avatarName: "",
  password: "",
  isActive: true,
};

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

  const [owners, setOwners] = useState<UserListItem[]>([]);
  const [ownersLoading, setOwnersLoading] = useState(true);
  const [ownerModal, setOwnerModal] = useState<{ mode: "create" | "edit"; id?: string } | null>(null);
  const [ownerForm, setOwnerForm] = useState<OwnerForm>(emptyOwnerForm);
  const [ownerSubmitting, setOwnerSubmitting] = useState(false);
  const [ownerAvatarUploading, setOwnerAvatarUploading] = useState(false);
  const ownerFileInputRef = useRef<HTMLInputElement>(null);
  const [confirmDeleteOwnerId, setConfirmDeleteOwnerId] = useState<string | null>(null);

  const [tariffs, setTariffs] = useState<TariffIncludingPackages[]>([]);
  const [subscription, setSubscription] = useState<CompanySubscriptionDetail | null>(null);
  const [subscriptionLoading, setSubscriptionLoading] = useState(true);
  const [subscriptionModalOpen, setSubscriptionModalOpen] = useState(false);
  const [subForm, setSubForm] = useState<SubscriptionForm | null>(null);
  const [subSubmitting, setSubSubmitting] = useState(false);
  const [activating, setActivating] = useState(false);

  const [balanceForm, setBalanceForm] = useState<BalanceForm | null>(null);
  const [balanceSubmitting, setBalanceSubmitting] = useState(false);

  useEffect(() => {
    getAllCitiesCached()
      .then(setCities)
      .catch(() => {});
    listTariffsWithPackages({ pageSize: 100 })
      .then((res) => setTariffs(res.items ?? []))
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

  const loadSubscription = async () => {
    if (!id) return;
    setSubscriptionLoading(true);
    try {
      setSubscription(await getCompanySubscription(id));
    } catch {
      setSubscription(null);
    } finally {
      setSubscriptionLoading(false);
    }
  };

  const loadOwners = async () => {
    if (!id) return;
    setOwnersLoading(true);
    try {
      const res = await listUsers({ companyId: id, userType: "Owner", pageSize: 100 });
      setOwners(res.items ?? []);
    } catch (err) {
      toast.error(errorMessage(err, t.companyDetail.errors.loadOwners));
    } finally {
      setOwnersLoading(false);
    }
  };

  useEffect(() => {
    load();
    loadSubscription();
    loadOwners();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const ownerAvatarUrl = useFileUrl(ownerForm.avatarName);

  if (loading) {
    return (
      <>
        <PageHead title={t.common.loading} onBack={() => nav(-1)} />
      </>
    );
  }

  if (!company) {
    return (
      <>
        <PageHead title={t.companyDetail.notFoundTitle} onBack={() => nav(-1)} />
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

  const cityName = cities.find((c) => c.id === company.cityId)?.name || "—";
  const address = company.addressTranslations?.[language] || company.addressTranslations?.[defaultLang] || "—";
  const description =
    company.descriptionTranslations?.[language] || company.descriptionTranslations?.[defaultLang] || "—";

  const openCreateOwner = () => {
    setOwnerForm({ ...emptyOwnerForm, password: randomPassword() });
    setOwnerModal({ mode: "create" });
  };

  const openEditOwner = async (ownerId: string) => {
    try {
      const detail = await getUserById(ownerId);
      setOwnerForm({
        firstName: detail.firstName ?? "",
        lastName: detail.lastName ?? "",
        middleName: detail.middleName ?? "",
        email: detail.email ?? "",
        avatarName: detail.avatarName ?? "",
        password: "",
        isActive: detail.isActive,
      });
      setOwnerModal({ mode: "edit", id: ownerId });
    } catch (err) {
      toast.error(errorMessage(err, t.companyDetail.errors.loadOwners));
    }
  };

  const setOwnerField = <K extends keyof OwnerForm>(key: K, value: OwnerForm[K]) =>
    setOwnerForm((f) => ({ ...f, [key]: value }));

  const copyOwnerPassword = () => {
    if (!ownerForm.password) return;
    navigator.clipboard?.writeText(ownerForm.password).catch(() => {});
    toast.success(t.common.passwordCopied);
  };

  const pickOwnerAvatar = async (file: File | undefined) => {
    if (!file) return;
    setOwnerAvatarUploading(true);
    try {
      const avatarName = await uploadFile(file);
      setOwnerField("avatarName", avatarName);
    } catch (err) {
      toast.error(errorMessage(err, t.companyDetail.errors.saveOwner));
    } finally {
      setOwnerAvatarUploading(false);
    }
  };

  const submitOwner = async () => {
    if (!ownerForm.firstName.trim() || !ownerForm.email.trim() || ownerSubmitting) return;
    setOwnerSubmitting(true);
    try {
      if (ownerModal?.mode === "edit" && ownerModal.id) {
        await updateUser(ownerModal.id, {
          firstName: ownerForm.firstName.trim(),
          lastName: ownerForm.lastName.trim(),
          middleName: ownerForm.middleName.trim() || null,
          email: ownerForm.email.trim(),
          avatarName: ownerForm.avatarName.trim() || null,
          isActive: ownerForm.isActive,
        });
        toast.success(t.companyDetail.toasts.ownerSaved);
      } else {
        await createOwnerUser({
          companyId: company.id,
          firstName: ownerForm.firstName.trim(),
          lastName: ownerForm.lastName.trim() || null,
          middleName: ownerForm.middleName.trim() || null,
          email: ownerForm.email.trim(),
          avatarName: ownerForm.avatarName.trim() || null,
          password: ownerForm.password.trim() || null,
          isActive: ownerForm.isActive,
        });
        toast.success(t.companyDetail.toasts.ownerAdded);
      }
      setOwnerModal(null);
      await loadOwners();
    } catch (err) {
      toast.error(errorMessage(err, t.companyDetail.errors.saveOwner));
    } finally {
      setOwnerSubmitting(false);
    }
  };

  const removeOwner = async (ownerId: string) => {
    try {
      await deleteUser(ownerId);
      toast.success(t.companyDetail.toasts.ownerDeleted);
      await loadOwners();
    } catch (err) {
      toast.error(errorMessage(err, t.companyDetail.errors.deleteOwner));
    } finally {
      setConfirmDeleteOwnerId(null);
    }
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
      tariffId: subscription?.tariff?.id ?? "",
      status: subscription?.status ?? "Trial",
      startDate: subscription?.period.startDate?.slice(0, 10) ?? todayStr(),
      discount: subscription?.discount ?? 0,
    });
    setSubscriptionModalOpen(true);
  };

  const activateSubscription = async () => {
    if (activating) return;
    setActivating(true);
    try {
      await activateCompanySubscription(company.id);
      toast.success(t.companyDetail.toasts.subscriptionActivated);
      load();
      loadSubscription();
    } catch (err) {
      toast.error(errorMessage(err, t.companyDetail.errors.activateSubscription));
    } finally {
      setActivating(false);
    }
  };

  const openBalanceDialog = (mode: "topup" | "refund") => {
    setBalanceForm({ mode, amount: "", paymentMethod: "Cash" });
  };

  const setBalanceField = <K extends keyof BalanceForm>(key: K, value: BalanceForm[K]) =>
    setBalanceForm((f) => (f ? { ...f, [key]: value } : f));

  const submitBalance = async () => {
    if (!balanceForm || balanceSubmitting) return;
    const amount = Number(balanceForm.amount);
    if (!amount || amount <= 0) {
      toast.error(t.companyDetail.errors.invalidAmount);
      return;
    }
    setBalanceSubmitting(true);
    try {
      if (balanceForm.mode === "topup") {
        await topUpCompanyBalance(company.id, amount, balanceForm.paymentMethod);
        toast.success(t.companyDetail.toasts.balanceToppedUp);
      } else {
        await refundCompanyBalance(company.id, amount, balanceForm.paymentMethod);
        toast.success(t.companyDetail.toasts.balanceRefunded);
      }
      setBalanceForm(null);
      load();
    } catch (err) {
      toast.error(errorMessage(err, t.companyDetail.errors.saveBalance));
    } finally {
      setBalanceSubmitting(false);
    }
  };

  const setSubField = <K extends keyof SubscriptionForm>(key: K, value: SubscriptionForm[K]) =>
    setSubForm((f) => (f ? { ...f, [key]: value } : f));

  const submitSubscription = async () => {
    if (!subForm || !subForm.tariffId || subSubmitting) return;
    setSubSubmitting(true);
    try {
      await updateCompanySubscription(company.id, {
        tariffId: subForm.tariffId,
        status: subForm.status,
        startDate: subForm.startDate,
        discount: subForm.discount || 0,
      });
      toast.success(t.companyDetail.toasts.subscriptionSaved);
      setSubscriptionModalOpen(false);
      load();
      loadSubscription();
    } catch (err) {
      toast.error(errorMessage(err, t.companyDetail.errors.saveSubscription));
    } finally {
      setSubSubmitting(false);
    }
  };

  const subEndDate =
    subForm && subForm.status !== "Suspended"
      ? addDays(
          subForm.startDate,
          subForm.status === "Trial"
            ? settings.trialSubscriptionDurationInDays ?? TRIAL_DEFAULT_DAYS
            : ACTIVE_SUBSCRIPTION_DAYS,
        )
      : null;

  const subDiscount = subscription?.discount ?? 0;
  const subPriceInfo = subscription?.priceInformation;
  const subListPrice = subPriceInfo?.totalCost ?? 0;
  const subFinalPrice = subPriceInfo?.totalCostAfterDiscount ?? subListPrice;
  const canActivateSubscription =
    Boolean(subscription) && (subscription?.status === "Trial" || subscription?.status === "Suspended");

  const unitTypeLabel = (type: string) => {
    switch (type) {
      case "Residential":
        return t.tariffs.unitTypeResidential;
      case "Commercial":
        return t.tariffs.unitTypeCommercial;
      case "Parking":
        return t.tariffs.unitTypeParking;
      case "Basement":
        return t.tariffs.unitTypeBasement;
      default:
        return type;
    }
  };

  const groupPriceLines = (lines: SubscriptionPriceLine[] | null | undefined) => {
    const order: string[] = [];
    const map = new Map<string, { active?: SubscriptionPriceLine; completed?: SubscriptionPriceLine }>();
    for (const pl of lines ?? []) {
      if (!map.has(pl.unitType)) {
        order.push(pl.unitType);
        map.set(pl.unitType, {});
      }
      const entry = map.get(pl.unitType)!;
      if (pl.unitStage === "Active") entry.active = pl;
      else entry.completed = pl;
    }
    return order.map((type) => ({ type, ...map.get(type)! }));
  };

  const paymentMethodLabel = (method: string) => {
    switch (method) {
      case "Cash":
        return t.companyDetail.paymentMethodCash;
      case "Card":
        return t.companyDetail.paymentMethodCard;
      case "BankTransfer":
        return t.companyDetail.paymentMethodBankTransfer;
      case "Wallet":
        return t.companyDetail.paymentMethodWallet;
      case "Other":
        return t.companyDetail.paymentMethodOther;
      default:
        return method;
    }
  };

  return (
    <>
      <PageHead
        title={company.name || "—"}
        sub={t.companyDetail.sub}
        onBack={() => nav(-1)}
        actions={
          editing ? (
            <>
              <Button type="button" variant="outline" onClick={cancelEdit} disabled={submitting}>
                {t.common.cancel}
              </Button>
              <Button type="button" onClick={save} disabled={submitting}>
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

      <div className="detail-layout">
        <Card className="detail-media gap-0 overflow-hidden py-0">
          <div className="aspect-[4/3] w-full overflow-hidden bg-secondary">
            <CompanyPhoto photoName={company.photoName} alt={company.name ?? ""} />
          </div>
          <div className="flex items-center justify-center gap-3 p-3.5">
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
                <div className="mb-3 text-xl font-bold">{company.name || "—"}</div>
                <div className="mb-3">
                  <div className="text-[11px] font-semibold tracking-[0.06em] text-muted-foreground uppercase">
                    {t.common.status}
                  </div>
                  <div className="mt-1.5 flex gap-1.5">
                    <CompanyStatusBadge status={subscription?.status ?? ""} />
                  </div>
                </div>
                <div className="mb-4">
                  <div className="text-[11px] font-semibold tracking-[0.06em] text-muted-foreground uppercase">
                    {t.common.description}
                  </div>
                  <p className="mt-1 leading-relaxed text-muted-foreground">{description}</p>
                </div>
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
            <div className="flex gap-2">
              {canActivateSubscription && (
                <Button type="button" variant="success" size="sm" disabled={activating} onClick={activateSubscription}>
                  {activating && <Loader2 className="size-4 animate-spin" />}
                  {t.companyDetail.activateSubscription}
                </Button>
              )}
              <Button type="button" variant="outline" size="sm" onClick={openEditSubscription}>
                {t.common.edit}
              </Button>
            </div>
          </div>
          {subscriptionLoading ? (
            <p className="text-sm text-muted-foreground">{t.common.loading}</p>
          ) : subscription ? (
            <>
              <div className="grid grid-cols-5 gap-4 max-[1024px]:grid-cols-3 max-[640px]:grid-cols-2 max-[420px]:grid-cols-1">
                <div>
                  <div className="text-[11px] font-semibold tracking-[0.06em] text-muted-foreground uppercase">
                    {t.tariffs.title}
                  </div>
                  <div className="mt-1 font-semibold">
                    {subscription.tariff ? (
                      <button
                        type="button"
                        className="text-primary hover:underline"
                        onClick={() => nav("/tariffs")}
                      >
                        {subscription.tariff.code}
                      </button>
                    ) : (
                      t.companyDetail.noTariff
                    )}
                  </div>
                </div>
                <div>
                  <div className="text-[11px] font-semibold tracking-[0.06em] text-muted-foreground uppercase">
                    {t.tariffs.packagesLabel}
                  </div>
                  <div className="mt-1">
                    {subscription.packages?.length ? (
                      <div className="flex flex-wrap gap-1.5">
                        {subscription.packages.map((p) => (
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
                    <CompanyStatusBadge status={subscription.status} />
                  </div>
                </div>
                <div>
                  <div className="text-[11px] font-semibold tracking-[0.06em] text-muted-foreground uppercase">
                    {t.companyDetail.subscriptionStart}
                  </div>
                  <div className="mt-1 font-semibold">{formatDate(subscription.period.startDate, language)}</div>
                </div>
                <div>
                  <div className="text-[11px] font-semibold tracking-[0.06em] text-muted-foreground uppercase">
                    {t.companyDetail.subscriptionEnd}
                  </div>
                  <div className="mt-1 font-semibold">
                    {subscription.period.endDate ? formatDate(subscription.period.endDate, language) : "—"}
                  </div>
                </div>
              </div>
              {subPriceInfo ? (
                <div className="mt-4 rounded-xl border bg-muted/30 p-4 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">{t.companyDetail.tariffBaseCost}</span>
                    <span className="text-base font-semibold tabular-nums">
                      {formatMoney(subPriceInfo.baseCost, settings.subscriptionCurrencyCode)}
                    </span>
                  </div>
                  {groupPriceLines(subPriceInfo.priceLines).length > 0 && (
                    <>
                      <div className="mt-4 grid grid-cols-3 gap-2 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
                        <span>{t.tariffs.unitType}</span>
                        <span>{t.common.status}</span>
                        <span className="text-right">{t.companyDetail.paymentAmount}</span>
                      </div>
                      <div className="mt-2 divide-y">
                        {groupPriceLines(subPriceInfo.priceLines).map(({ type, active, completed }) => (
                          <div key={type} className="grid grid-cols-3 items-center gap-2 py-3">
                            <span className="font-semibold">{unitTypeLabel(type)}</span>
                            <div className="flex flex-col gap-1.5">
                              {active && (
                                <span className="text-muted-foreground whitespace-nowrap">
                                  {t.tariffs.unitStageActive} ({active.quantity} ×{" "}
                                  {formatMoney(active.unitCost, settings.subscriptionCurrencyCode)})
                                </span>
                              )}
                              {completed && (
                                <span className="text-muted-foreground whitespace-nowrap">
                                  {t.tariffs.unitStageCompleted} ({completed.quantity} ×{" "}
                                  {formatMoney(completed.unitCost, settings.subscriptionCurrencyCode)})
                                </span>
                              )}
                            </div>
                            <div className="flex flex-col items-end gap-1.5">
                              {active && (
                                <span className="font-semibold tabular-nums">
                                  {formatMoney(active.totalCost, settings.subscriptionCurrencyCode)}
                                </span>
                              )}
                              {completed && (
                                <span className="font-semibold tabular-nums">
                                  {formatMoney(completed.totalCost, settings.subscriptionCurrencyCode)}
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                  <div className="mt-4 flex items-center justify-between border-t pt-3">
                    <span className="text-base font-semibold">{t.companyDetail.totalAmount}</span>
                    <div className="flex items-center gap-2">
                      {subDiscount > 0 ? (
                        <span className="text-sm text-muted-foreground line-through">
                          {formatMoney(subListPrice, settings.subscriptionCurrencyCode)}
                        </span>
                      ) : null}
                      <span className="text-base font-semibold tabular-nums">
                        {formatMoney(subFinalPrice, settings.subscriptionCurrencyCode)}
                      </span>
                      {subDiscount > 0 ? (
                        <span className="text-sm font-semibold text-[var(--success)]">-{subDiscount}%</span>
                      ) : null}
                    </div>
                  </div>
                </div>
              ) : null}
            </>
          ) : (
            <p className="text-sm text-muted-foreground">{t.companyDetail.noSubscription}</p>
          )}
        </CardContent>
      </Card>

      <Card className="mt-3.5">
        <CardContent>
          <div className="list-head">
            <h3>{t.companyDetail.balanceTitle}</h3>
            <div className="flex gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => openBalanceDialog("topup")}>
                {t.companyDetail.topUpBalance}
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={() => openBalanceDialog("refund")}>
                {t.companyDetail.refundBalance}
              </Button>
            </div>
          </div>
          <div className="mt-1 text-2xl font-semibold">
            {formatMoney(company.balance, settings.nationalCurrencyCode)}
          </div>
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
          {ownersLoading ? (
            <p className="text-sm text-muted-foreground">{t.common.loading}</p>
          ) : owners.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t.companyDetail.noOwners}</p>
          ) : (
            owners.map((o) => (
              <div className="owner-row" key={o.id}>
                <div className="owner-row-main flex items-center gap-3">
                  <Avatar className="size-9 shrink-0">
                    <AvatarFallback className="bg-secondary text-xs font-semibold text-muted-foreground">
                      {initials(o.fullName ?? "")}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <b>{o.fullName}</b>
                    <div className="text-sm text-muted-foreground">{o.email}</div>
                  </div>
                </div>
                <div className="owner-row-actions">
                  <Button type="button" variant="outline" size="sm" onClick={() => openEditOwner(o.id)}>
                    {t.common.edit}
                  </Button>
                  <Button type="button" variant="destructive" size="sm" onClick={() => setConfirmDeleteOwnerId(o.id)}>
                    {t.common.delete}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => nav(`/users/${o.id}`)}
                    aria-label={t.common.view}
                  >
                    <Info />
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <div className="mt-3.5 grid grid-cols-2 gap-3 max-[480px]:grid-cols-1">
        <button
          type="button"
          className="flex flex-col items-start gap-3 rounded-lg border bg-card p-4 text-left transition-colors hover:border-primary/40 hover:bg-accent/50"
          onClick={() => nav(`/users?companyId=${company.id}&type=Worker`)}
        >
          <div className="flex size-9 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Users className="size-4.5" />
          </div>
          <span className="text-sm font-medium">{t.companyDetail.workersTitle}</span>
        </button>
        <button
          type="button"
          className="flex flex-col items-start gap-3 rounded-lg border bg-card p-4 text-left transition-colors hover:border-primary/40 hover:bg-accent/50"
          onClick={() => nav(`/users?companyId=${company.id}&type=Customer`)}
        >
          <div className="flex size-9 items-center justify-center rounded-full bg-primary/10 text-primary">
            <UserRound className="size-4.5" />
          </div>
          <span className="text-sm font-medium">{t.companyDetail.clientsTitle}</span>
        </button>
        <button
          type="button"
          className="flex flex-col items-start gap-3 rounded-lg border bg-card p-4 text-left transition-colors hover:border-primary/40 hover:bg-accent/50"
          onClick={() => nav(`/payment-histories?companyId=${company.id}`)}
        >
          <div className="flex size-9 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Receipt className="size-4.5" />
          </div>
          <span className="text-sm font-medium">{t.companyDetail.paymentHistoryTitle}</span>
        </button>
        <button
          type="button"
          className="flex flex-col items-start gap-3 rounded-lg border bg-card p-4 text-left transition-colors hover:border-primary/40 hover:bg-accent/50"
          onClick={() => nav(`/companies/${company.id}/subscription-payments`)}
        >
          <div className="flex size-9 items-center justify-center rounded-full bg-primary/10 text-primary">
            <CreditCard className="size-4.5" />
          </div>
          <span className="text-sm font-medium">{t.companyDetail.subPaymentHistoryTitle}</span>
        </button>
      </div>

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
            <div className="flex items-center gap-3">
              <Avatar className="size-16">
                <AvatarImage src={ownerAvatarUrl ?? undefined} alt="" />
                <AvatarFallback className="bg-secondary text-lg font-semibold text-muted-foreground">
                  {initials(`${ownerForm.firstName} ${ownerForm.lastName}`.trim())}
                </AvatarFallback>
              </Avatar>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={ownerAvatarUploading}
                onClick={() => ownerFileInputRef.current?.click()}
              >
                {ownerAvatarUploading && <Loader2 className="size-4 animate-spin" />}
                {t.common.chooseImage}
              </Button>
              <input
                ref={ownerFileInputRef}
                type="file"
                accept="image/*"
                hidden
                onChange={(e) => pickOwnerAvatar(e.target.files?.[0])}
              />
            </div>
            <div className="grid grid-cols-2 gap-3 max-[860px]:grid-cols-1">
              <Field label={t.users.firstName}>
                <Input value={ownerForm.firstName} onChange={(e) => setOwnerField("firstName", e.target.value)} autoFocus />
              </Field>
              <Field label={t.users.lastName}>
                <Input value={ownerForm.lastName} onChange={(e) => setOwnerField("lastName", e.target.value)} />
              </Field>
            </div>
            <Field label={t.users.middleName}>
              <Input value={ownerForm.middleName} onChange={(e) => setOwnerField("middleName", e.target.value)} />
            </Field>
            <Field label={t.common.email}>
              <Input value={ownerForm.email} onChange={(e) => setOwnerField("email", e.target.value)} />
            </Field>
            {ownerModal?.mode !== "edit" && (
              <Field label={t.login.password}>
                <div className="password-gen">
                  <Input value={ownerForm.password} onChange={(e) => setOwnerField("password", e.target.value)} />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={copyOwnerPassword}
                    aria-label={t.common.copyPassword}
                  >
                    <Copy />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setOwnerField("password", randomPassword())}
                  >
                    <RefreshCw />
                    {t.common.generate}
                  </Button>
                </div>
              </Field>
            )}
            <label className="flex items-center gap-2 text-sm font-medium">
              <Switch checked={ownerForm.isActive} onCheckedChange={(v) => setOwnerField("isActive", v)} />
              {t.users.userActive}
            </label>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOwnerModal(null)} disabled={ownerSubmitting}>
              {t.common.cancel}
            </Button>
            <Button
              type="button"
              disabled={!ownerForm.firstName.trim() || !ownerForm.email.trim() || ownerSubmitting}
              onClick={submitOwner}
            >
              {ownerSubmitting && <Loader2 className="size-4 animate-spin" />}
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
                <Select value={subForm.tariffId} onValueChange={(v) => setSubField("tariffId", v)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={t.companyDetail.noTariff} />
                  </SelectTrigger>
                  <SelectContent>
                    {tariffs
                      .filter((tr) => tr.isActive || tr.id === subForm.tariffId)
                      .map((tr) => (
                        <SelectItem key={tr.id} value={tr.id}>
                          {tr.code} ({formatMoney(tr.baseCost, settings.subscriptionCurrencyCode)})
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
              <Field label={`${t.companyDetail.discount} (%)`}>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  step="0.01"
                  value={subForm.discount || ""}
                  onChange={(e) => setSubField("discount", Number(e.target.value) || 0)}
                />
              </Field>
            </div>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setSubscriptionModalOpen(false)}>
              {t.common.cancel}
            </Button>
            <Button
              type="button"
              disabled={subSubmitting || !subForm || !subForm.tariffId}
              onClick={submitSubscription}
            >
              {t.common.save}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(balanceForm)} onOpenChange={(open) => !open && setBalanceForm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {balanceForm?.mode === "refund" ? t.companyDetail.refundBalance : t.companyDetail.topUpBalance}
            </DialogTitle>
          </DialogHeader>
          {balanceForm && (
            <div className="grid gap-3">
              <Field label={t.companyDetail.amount}>
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  value={balanceForm.amount}
                  onChange={(e) => setBalanceField("amount", e.target.value)}
                  autoFocus
                />
              </Field>
              <Field label={t.companyDetail.paymentMethod}>
                <Select
                  value={balanceForm.paymentMethod}
                  onValueChange={(v) => setBalanceField("paymentMethod", v as PaymentMethod)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PAYMENT_METHODS.map((m) => (
                      <SelectItem key={m} value={m}>
                        {paymentMethodLabel(m)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setBalanceForm(null)}>
              {t.common.cancel}
            </Button>
            <Button type="button" disabled={balanceSubmitting} onClick={submitBalance}>
              {balanceSubmitting && <Loader2 className="size-4 animate-spin" />}
              {t.common.save}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
