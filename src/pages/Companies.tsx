import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  createCompany,
  getAllCitiesCached,
  listCompanies,
  updateCompanyById,
  uploadFile,
  ApiRequestError,
  type CityListItem,
  type CompanyListItem,
} from "../lib/api";
import { useTranslation } from "../i18n/LanguageContext";
import { useModuleSettings } from "../data/moduleSettingsStore";
import { PageHead } from "../AppShell";
import { AppPagination } from "@/components/AppPagination";
import { CompanyPhoto } from "@/components/CompanyPhoto";
import { EmptyState } from "@/components/EmptyState";
import { Field } from "@/components/Field";
import { CompanyStatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const DEFAULT_PAGE_SIZE = 10;
const CITY_NONE = "none";

type Translations = Record<string, string>;

type CompanyForm = {
  name: string;
  phoneNumber: string;
  email: string;
  cityId: string;
  addressTranslations: Translations;
  descriptionTranslations: Translations;
};

const emptyTranslations = (langs: string[]): Translations =>
  Object.fromEntries(langs.map((l) => [l, ""]));

function errorMessage(err: unknown, fallback: string) {
  return err instanceof ApiRequestError ? err.message : fallback;
}

export function Companies() {
  const nav = useNavigate();
  const { t } = useTranslation();
  const { settings } = useModuleSettings();
  const langs = settings.supportedLanguages;
  const defaultLang = settings.defaultLanguage;
  const makeEmptyForm = (): CompanyForm => ({
    name: "",
    phoneNumber: "",
    email: "",
    cityId: "",
    addressTranslations: emptyTranslations(langs),
    descriptionTranslations: emptyTranslations(langs),
  });

  const [companies, setCompanies] = useState<CompanyListItem[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [hasPreviousPage, setHasPreviousPage] = useState(false);

  const [query, setQuery] = useState("");
  const [appliedQuery, setAppliedQuery] = useState("");

  const [cities, setCities] = useState<CityListItem[]>([]);
  const cityName = (id?: string | null) => (id && cities.find((c) => c.id === id)?.name) || "—";

  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState<CompanyForm>(() => makeEmptyForm());
  const [activeLang, setActiveLang] = useState(defaultLang);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    getAllCitiesCached()
      .then(setCities)
      .catch(() => {});
  }, []);

  useEffect(() => {
    const handle = setTimeout(() => {
      setAppliedQuery(query);
      setPage(1);
    }, 400);
    return () => clearTimeout(handle);
  }, [query]);

  const fetchCompanies = async (pageArg: number, pageSizeArg: number, search: string) => {
    setLoadingList(true);
    try {
      const res = await listCompanies({ page: pageArg, pageSize: pageSizeArg, search: search.trim() || undefined });
      setCompanies(res.items ?? []);
      setHasNextPage(res.pagination.hasNextPage);
      setHasPreviousPage(res.pagination.hasPreviousPage ?? pageArg > 1);
    } catch (err) {
      toast.error(errorMessage(err, t.companies.errors.loadCompanies));
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    fetchCompanies(page, pageSize, appliedQuery);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize, appliedQuery]);

  const changePageSize = (size: number) => {
    setPageSize(size);
    setPage(1);
  };

  const setField = <K extends keyof CompanyForm>(key: K, value: CompanyForm[K]) =>
    setForm((f) => ({ ...f, [key]: value }));
  const setAddress = (lang: string, value: string) =>
    setForm((f) => ({ ...f, addressTranslations: { ...f.addressTranslations, [lang]: value } }));
  const setDescription = (lang: string, value: string) =>
    setForm((f) => ({ ...f, descriptionTranslations: { ...f.descriptionTranslations, [lang]: value } }));

  const openCreate = () => {
    setForm(makeEmptyForm());
    setActiveLang(defaultLang);
    setPhotoFile(null);
    setPhotoPreview("");
    setShowCreate(true);
  };

  const pickPhoto = (file: File | undefined) => {
    if (!file) return;
    setPhotoFile(file);
    const reader = new FileReader();
    reader.onload = () => setPhotoPreview(String(reader.result));
    reader.readAsDataURL(file);
  };

  const collectTranslations = (translations: Translations) =>
    Object.fromEntries(langs.filter((l) => translations[l]?.trim()).map((l) => [l, translations[l].trim()]));

  const submitCreate = async () => {
    if (!form.name.trim() || submitting) return;
    setSubmitting(true);
    try {
      const addressTranslations = collectTranslations(form.addressTranslations);
      const descriptionTranslations = collectTranslations(form.descriptionTranslations);
      const id = await createCompany({
        name: form.name.trim(),
        phoneNumber: form.phoneNumber.trim() || undefined,
        email: form.email.trim() || undefined,
        cityId: form.cityId || undefined,
        addressTranslations,
        descriptionTranslations,
      });
      if (photoFile) {
        try {
          const photoName = await uploadFile(photoFile);
          await updateCompanyById(id, {
            name: form.name.trim(),
            phoneNumber: form.phoneNumber.trim() || undefined,
            email: form.email.trim() || undefined,
            cityId: form.cityId || undefined,
            photoName,
            addressTranslations,
            descriptionTranslations,
          });
        } catch (err) {
          toast.error(errorMessage(err, t.companies.errors.savePhoto));
        }
      }
      setShowCreate(false);
      toast.success(t.companies.created);
      nav(`/companies/${id}`);
    } catch (err) {
      toast.error(errorMessage(err, t.companies.errors.saveCompany));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <PageHead
        title={t.companies.title}
        sub={t.companies.sub}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Input
              className="w-56"
              placeholder={t.companies.searchPlaceholder}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <Button type="button" onClick={openCreate}>
              {t.companies.newCompany}
            </Button>
          </div>
        }
      />

      {!loadingList && companies.length === 0 ? (
        <EmptyState
          title={appliedQuery ? t.common.nothingFound : t.companies.noCompaniesYet}
          action={
            !appliedQuery ? (
              <Button type="button" onClick={openCreate}>
                {t.companies.createCompany}
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="grid grid-cols-4 gap-4 max-[1200px]:grid-cols-3 max-[700px]:grid-cols-2 max-[420px]:grid-cols-1">
          {loadingList
            ? Array.from({ length: Math.min(pageSize, 10) }, (_, i) => (
                <Card key={i} className="animate-in fade-in gap-0 overflow-hidden py-0 duration-300">
                  <Skeleton className="aspect-video w-full rounded-none" />
                  <div className="grid gap-2 p-3">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </Card>
              ))
            : companies.map((c) => (
                <Card
                  key={c.id}
                  className="cursor-pointer gap-0 overflow-hidden py-0 transition-shadow hover:shadow-md"
                  tabIndex={0}
                  onClick={() => nav(`/companies/${c.id}`)}
                  onKeyDown={(e) => e.key === "Enter" && nav(`/companies/${c.id}`)}
                >
                  <div className="aspect-video w-full overflow-hidden bg-secondary">
                    <CompanyPhoto photoName={c.photoName} alt={c.name ?? ""} />
                  </div>
                  <div className="grid gap-1 p-3">
                    <div className="flex items-start justify-between gap-2">
                      <span className="truncate font-medium">{c.name || "—"}</span>
                      <CompanyStatusBadge status={c.status ?? ""} />
                    </div>
                    <div className="truncate text-xs text-muted-foreground">{cityName(c.cityId)}</div>
                  </div>
                </Card>
              ))}
        </div>
      )}

      <AppPagination
        page={page}
        onPage={setPage}
        hasNextPage={hasNextPage}
        hasPreviousPage={hasPreviousPage}
        alwaysShow
        pageSize={pageSize}
        onPageSizeChange={changePageSize}
      />

      <p className="mt-4 text-sm text-muted-foreground">{t.companies.isolationNote}</p>

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{t.companies.dialogTitle}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3">
            <Field label={t.common.name} required>
              <Input value={form.name} onChange={(e) => setField("name", e.target.value)} autoFocus />
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
            <Field label={t.common.image}>
              <div className="image-pick">
                <div className="image-pick-preview">
                  {photoPreview ? <img src={photoPreview} alt="" /> : <span>{t.common.noPhoto}</span>}
                </div>
                <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>
                  {t.common.chooseImage}
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={(e) => pickPhoto(e.target.files?.[0])}
                />
              </div>
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
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setShowCreate(false)} disabled={submitting}>
              {t.common.cancel}
            </Button>
            <Button type="button" disabled={!form.name.trim() || submitting} onClick={submitCreate}>
              {submitting && <Loader2 className="size-4 animate-spin" />}
              {t.common.create}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
