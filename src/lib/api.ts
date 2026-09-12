import { getAccessToken, getRefreshToken, setTokens, clearTokens, isAccessTokenExpired } from "../auth";
import { getStoredLanguage, type Language } from "../i18n/LanguageContext";

// Empty by default so requests go to the same origin and are proxied
// server-side (see vercel.json / vite.config.ts), avoiding mixed-content
// blocks when the app is served over HTTPS but the backend is plain HTTP.
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";

// The backend uses "tg" for Tajik, while the app's internal language code is "tj".
const ACCEPT_LANGUAGE: Record<Language, string> = { ru: "ru", en: "en", tj: "tg" };

// Browsers don't expose the client's public IP directly, so it's resolved once
// via an external lookup and cached for the lifetime of the page.
let clientIpPromise: Promise<string | null> | null = null;

function getClientIp(): Promise<string | null> {
  if (!clientIpPromise) {
    clientIpPromise = fetch("https://api.ipify.org?format=json")
      .then((res) => res.json())
      .then((data) => (typeof data?.ip === "string" ? data.ip : null))
      .catch(() => null);
  }
  return clientIpPromise;
}

export type TokenInfo = {
  accessToken: string;
  refreshToken: string;
  expireTime: string;
};

export type UserDetail = {
  id: string;
  firstName?: string | null;
  lastName?: string | null;
  middleName?: string | null;
  fullName?: string | null;
  email?: string | null;
  emailVerifiedAt?: string | null;
  avatarName?: string | null;
  createdAt: string;
  type: UserType;
  companyId?: string | null;
  isActive: boolean;
};

type ApiSuccess<T> = {
  status?: string | null;
  data: T;
  message?: string | null;
  originalMessage?: string | null;
};

type ApiError = {
  status?: string | null;
  message?: string | null;
  originalMessage?: string | null;
  businessCode?: number;
};

export class ApiRequestError extends Error {
  businessCode?: number;
  status?: number;
  constructor(message: string, businessCode?: number, status?: number) {
    super(message);
    this.name = "ApiRequestError";
    this.businessCode = businessCode;
    this.status = status;
  }
}

async function performRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  let res: Response;
  try {
    const clientIp = await getClientIp();
    // Let the browser set its own multipart Content-Type (with boundary) for FormData bodies.
    const isFormData = options.body instanceof FormData;
    res = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers: {
        ...(isFormData ? {} : { "Content-Type": "application/json" }),
        "Accept-Language": ACCEPT_LANGUAGE[getStoredLanguage()],
        ...(clientIp ? { "X-Real-IP": clientIp } : {}),
        ...options.headers,
      },
    });
  } catch {
    throw new ApiRequestError("Не удалось подключиться к серверу.");
  }

  const body = await res.json().catch(() => null);

  if (!res.ok) {
    const err = body as ApiError | null;
    throw new ApiRequestError(
      err?.message || err?.originalMessage || "Ошибка запроса",
      err?.businessCode,
      res.status,
    );
  }

  return (body as ApiSuccess<T> | null)?.data as T;
}

// Two effects (e.g. React StrictMode's double-invoke in dev, or two components
// requesting the same data at once) can fire the identical GET back-to-back.
// Share the in-flight promise instead of hitting the network twice.
const inFlightGetRequests = new Map<string, Promise<unknown>>();

function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const method = (options.method ?? "GET").toUpperCase();
  if (method !== "GET") return performRequest<T>(path, options);

  const existing = inFlightGetRequests.get(path);
  if (existing) return existing as Promise<T>;

  const promise = performRequest<T>(path, options).finally(() => {
    inFlightGetRequests.delete(path);
  });
  inFlightGetRequests.set(path, promise);
  return promise;
}

let pendingRefresh: Promise<TokenInfo> | null = null;

function refreshTokens(): Promise<TokenInfo> {
  if (!pendingRefresh) {
    const refreshToken = getRefreshToken();
    if (!refreshToken) {
      return Promise.reject(new ApiRequestError("Отсутствует refresh-токен"));
    }
    pendingRefresh = refreshAccessToken(refreshToken)
      .then((tokens) => {
        setTokens(tokens);
        return tokens;
      })
      .finally(() => {
        pendingRefresh = null;
      });
  }
  return pendingRefresh;
}

async function authRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  let accessToken = getAccessToken();
  if (!accessToken) {
    clearTokens();
    redirectToLogin();
    throw new ApiRequestError("Сессия истекла, войдите снова.", undefined, 401);
  }

  // Proactively refresh if the stored expireTime says we're already past (or about to hit) expiry,
  // instead of always waiting for a 401 round-trip first.
  if (isAccessTokenExpired()) {
    try {
      accessToken = (await refreshTokens()).accessToken;
    } catch {
      clearTokens();
      redirectToLogin();
      throw new ApiRequestError("Сессия истекла, войдите снова.", undefined, 401);
    }
  }

  const withAuth = (token: string): RequestInit => ({
    ...options,
    headers: { ...options.headers, Authorization: `Bearer ${token}` },
  });

  try {
    return await request<T>(path, withAuth(accessToken));
  } catch (err) {
    if (err instanceof ApiRequestError && err.status === 401) {
      try {
        const refreshed = await refreshTokens();
        return await request<T>(path, withAuth(refreshed.accessToken));
      } catch {
        clearTokens();
        redirectToLogin();
      }
    }
    throw err;
  }
}

function redirectToLogin() {
  if (typeof window !== "undefined" && window.location.pathname !== "/login") {
    window.location.assign("/login");
  }
}

const PLATFORM_TYPE_HEADER = { "X-Platform": "SuperAdminPanel" };

export function login(email: string, password: string) {
  return request<TokenInfo>("/core/api/auth/token", {
    method: "POST",
    headers: PLATFORM_TYPE_HEADER,
    body: JSON.stringify({ email, password }),
  });
}

export function logout() {
  return authRequest<unknown>("/core/api/auth/logout", {
    method: "POST",
    headers: PLATFORM_TYPE_HEADER,
  });
}

export function refreshAccessToken(refreshToken: string) {
  return request<TokenInfo>("/core/api/auth/refresh-token", {
    method: "POST",
    body: JSON.stringify({ refreshToken }),
  });
}

export function forgotPassword(email: string) {
  return request<string | null>("/core/api/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export function resetPassword(email: string, verificationCode: string, password: string, verifyPassword: string) {
  return request<string | null>("/core/api/auth/reset-password", {
    method: "POST",
    body: JSON.stringify({ email, verificationCode, password, verifyPassword }),
  });
}

export function getCurrentUser() {
  return authRequest<UserDetail>("/core/api/users/current-user-info");
}

export function getUserById(id: string) {
  return authRequest<UserDetail>(`/core/api/users/${id}`);
}

export type UserListItem = {
  id: string;
  fullName?: string | null;
  email?: string | null;
  isActive: boolean;
};

export type UserType = "SuperAdmin" | "Admin" | "Owner" | "Worker" | "Client" | "Unknown";

export type CreateAdminUserInput = {
  firstName: string;
  lastName?: string | null;
  middleName?: string | null;
  email: string;
  avatarName?: string | null;
  password?: string | null;
  isActive: boolean;
};

export type CreateOwnerUserInput = {
  companyId: string;
  firstName: string;
  lastName?: string | null;
  middleName?: string | null;
  email: string;
  avatarName?: string | null;
  password?: string | null;
  isActive: boolean;
};

export type CreateUserResponse = { userId: string };

export type UpdateUserInput = {
  firstName: string;
  lastName: string;
  middleName?: string | null;
  email: string;
  avatarName?: string | null;
  isActive: boolean;
};

export function listUsers(
  params: {
    search?: string;
    isActive?: boolean;
    userType?: UserType;
    companyId?: string;
    shouldShowCompanyTypeUsers?: boolean;
    page?: number;
    pageSize?: number;
  } = {},
) {
  const query = new URLSearchParams();
  if (params.search) query.set("Search", params.search);
  if (params.isActive !== undefined) query.set("IsActive", String(params.isActive));
  if (params.userType) query.set("UserType", params.userType);
  if (params.companyId) query.set("CompanyId", params.companyId);
  if (params.shouldShowCompanyTypeUsers !== undefined) {
    query.set("ShouldShowCompanyTypeUsers", String(params.shouldShowCompanyTypeUsers));
  }
  query.set("Page", String(params.page ?? 1));
  query.set("PageSize", String(params.pageSize ?? 100));
  return authRequest<PagedResult<UserListItem>>(`/core/api/users?${query.toString()}`);
}

export function createAdminUser(data: CreateAdminUserInput) {
  return authRequest<CreateUserResponse>("/core/api/users/admin", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function createOwnerUser(data: CreateOwnerUserInput) {
  return authRequest<CreateUserResponse>("/core/api/users/owner", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateUser(id: string, data: UpdateUserInput) {
  return authRequest<unknown>(`/core/api/users/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export function deleteUser(id: string) {
  return authRequest<unknown>(`/core/api/users/${id}`, { method: "DELETE" });
}

export function activateUser(id: string) {
  return authRequest<unknown>(`/core/api/users/${id}/activate`, { method: "PUT" });
}

export function deactivateUser(id: string) {
  return authRequest<unknown>(`/core/api/users/${id}/deactivate`, { method: "PUT" });
}

export function updateUserPassword(id: string, password: string, verifyPassword: string) {
  return authRequest<unknown>(`/core/api/users/${id}/password`, {
    method: "PUT",
    body: JSON.stringify({ password, verifyPassword }),
  });
}

export type UserRole = {
  roleId: string;
  code?: string | null;
  title?: string | null;
  description?: string | null;
};

export function getUserRoles(userId: string) {
  return authRequest<PagedResult<UserRole>>(`/core/api/users/${userId}/roles`);
}

export function assignUserRoles(userId: string, roleIds: string[]) {
  return authRequest<{ changed: boolean }>(`/core/api/users/${userId}/roles`, {
    method: "POST",
    body: JSON.stringify({ roleIds }),
  });
}

export function unassignUserRoles(userId: string, roleIds: string[]) {
  return authRequest<{ changed: boolean }>(`/core/api/users/${userId}/roles`, {
    method: "DELETE",
    body: JSON.stringify(roleIds),
  });
}

export type UserPermission = {
  id: string;
  code?: string | null;
  group?: string | null;
  title?: string | null;
  moduleName?: string | null;
  moduleDisplayName?: string | null;
};

export function getUserPermissions(userId: string) {
  return authRequest<UserPermission[]>(`/core/api/users/${userId}/permissions`);
}

export function getCurrentUserPermissions() {
  return authRequest<UserPermission[]>("/core/api/users/current-user-permissions");
}

export type RoleLookup = {
  id: string;
  code?: string | null;
  title?: string | null;
};

export function listRoles(
  params: {
    search?: string;
    companyId?: string;
    shouldShowCompanyRoles?: boolean;
    page?: number;
    pageSize?: number;
  } = {},
) {
  const query = new URLSearchParams();
  if (params.search) query.set("Search", params.search);
  if (params.companyId) query.set("CompanyId", params.companyId);
  if (params.shouldShowCompanyRoles !== undefined) {
    query.set("ShouldShowCompanyRoles", String(params.shouldShowCompanyRoles));
  }
  query.set("Page", String(params.page ?? 1));
  query.set("PageSize", String(params.pageSize ?? 100));
  return authRequest<PagedResult<RoleLookup>>(`/core/api/roles?${query.toString()}`);
}

export type RoleUser = {
  userId: string;
  fullName?: string | null;
};

export type RoleDetail = {
  id: string;
  code?: string | null;
  titleTranslations?: Record<string, string> | null;
  users?: RoleUser[] | null;
};

export type RoleInput = {
  code: string;
  titleTranslations: Record<string, string>;
};

export function getRole(id: string) {
  return authRequest<RoleDetail>(`/core/api/roles/${id}`);
}

export function createRole(data: RoleInput) {
  return authRequest<RoleDetail>("/core/api/roles", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateRole(id: string, data: RoleInput) {
  return authRequest<RoleDetail>(`/core/api/roles/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export function deleteRole(id: string) {
  return authRequest<unknown>(`/core/api/roles/${id}`, { method: "DELETE" });
}

export function duplicateRole(id: string, data: RoleInput) {
  return authRequest<RoleDetail>(`/core/api/roles/${id}/duplicate`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function removeRoleUser(roleId: string, userId: string) {
  return authRequest<RoleDetail>(`/core/api/roles/${roleId}/users/${userId}`, { method: "DELETE" });
}

// The backend's OpenAPI schema for this endpoint is mislabeled (named after the
// item type, no Page/PageSize params) but it returns a flat list, not a single item.
export function getRolePermissions(roleId: string, search?: string) {
  const query = new URLSearchParams();
  if (search) query.set("Search", search);
  const qs = query.toString();
  return authRequest<PermissionLookup[]>(`/core/api/roles/${roleId}/permissions${qs ? `?${qs}` : ""}`);
}

export function addRolePermissions(roleId: string, permissionIds: string[]) {
  return authRequest<{ changed: boolean }>(`/core/api/roles/${roleId}/permissions`, {
    method: "POST",
    body: JSON.stringify(permissionIds),
  });
}

export function removeRolePermissions(roleId: string, permissionIds: string[]) {
  return authRequest<{ changed: boolean }>(`/core/api/roles/${roleId}/permissions`, {
    method: "DELETE",
    body: JSON.stringify(permissionIds),
  });
}

export type ModuleDefaultOptions = {
  defaultLanguage: string;
  nationalCurrencyCode: string;
  supportedLanguages: string[];
  /** Not yet returned by the backend in all environments — treat as optional. */
  trialSubscriptionDurationInDays?: number;
};

export function getModuleDefaultOptions() {
  return authRequest<ModuleDefaultOptions>("/core/api/module-settings/module-default-options");
}

export type Pagination = {
  hasNextPage: boolean;
  hasPreviousPage?: boolean;
  pageSize: number;
  currentPage: number;
};

export type PagedResult<T> = {
  items: T[] | null;
  pagination: Pagination;
};

export type PackageListItem = {
  id: string;
  cost: number;
  isActive: boolean;
  title?: string | null;
  description?: string | null;
};

export type PackageListItemWithGroups = {
  id: string;
  cost: number;
  isActive: boolean;
  title: string;
  description: string;
  permissionGroupCodes: string[];
};

export type PackageDetail = {
  id: string;
  cost: number;
  isActive: boolean;
  title?: Record<string, string> | null;
  description?: Record<string, string> | null;
};

export type PackageInput = {
  cost: number;
  isActive: boolean;
  titleTranslations: Record<string, string>;
  descriptionTranslations: Record<string, string>;
};

export type PermissionLookup = {
  id: string;
  code: string;
  title?: string | null;
};

export type PermissionGroupWithPermissions = {
  code?: string | null;
  title?: string | null;
  moduleDisplayName?: string | null;
  permissions: PermissionLookup[] | null;
};

export function listPackages(params: { search?: string; page?: number; pageSize?: number } = {}) {
  const query = new URLSearchParams();
  if (params.search) query.set("Search", params.search);
  query.set("Page", String(params.page ?? 1));
  query.set("PageSize", String(params.pageSize ?? 100));
  return authRequest<PagedResult<PackageListItem>>(`/core/api/packages?${query.toString()}`);
}

export function listPackagesAllIncludingPermissionGroups(
  params: { search?: string; page?: number; pageSize?: number } = {},
) {
  const query = new URLSearchParams();
  if (params.search) query.set("Search", params.search);
  query.set("Page", String(params.page ?? 1));
  query.set("PageSize", String(params.pageSize ?? 100));
  return authRequest<PagedResult<PackageListItemWithGroups>>(
    `/core/api/packages/all-including-permissiongroups?${query.toString()}`,
  );
}

export function getPackage(id: string) {
  return authRequest<PackageDetail>(`/core/api/packages/${id}`);
}

export function createPackage(data: PackageInput) {
  return authRequest<unknown>("/core/api/packages", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updatePackage(id: string, data: PackageInput) {
  return authRequest<unknown>(`/core/api/packages/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export function deletePackage(id: string) {
  return authRequest<unknown>(`/core/api/packages/${id}`, { method: "DELETE" });
}

export function getPackagePermissions(packageId: string) {
  return authRequest<PagedResult<PermissionLookup>>(`/core/api/packages/${packageId}/permissions`);
}

export function addPackagePermissions(packageId: string, permissionIds: string[]) {
  return authRequest<{ changed: boolean }>(`/core/api/packages/${packageId}/permissions`, {
    method: "POST",
    body: JSON.stringify(permissionIds),
  });
}

export function removePackagePermissions(packageId: string, permissionIds: string[]) {
  return authRequest<{ changed: boolean }>(`/core/api/packages/${packageId}/permissions`, {
    method: "DELETE",
    body: JSON.stringify(permissionIds),
  });
}

export function listPermissionGroups() {
  return authRequest<PagedResult<PermissionGroupWithPermissions>>(
    "/core/api/permissions/group-with-permissions",
  );
}

export type PermissionGroupListItem = {
  id: string;
  code?: string | null;
  title?: string | null;
};

export type PermissionGroupDetail = {
  id: string;
  code?: string | null;
  titleTranslations?: Record<string, string> | null;
};

export type PermissionDetail = {
  id: string;
  code?: string | null;
  group?: string | null;
  titleTranslations?: Record<string, string> | null;
};

export function listPermissionGroupsFlat() {
  return authRequest<PagedResult<PermissionGroupListItem>>("/core/api/permissions/groups");
}

export function getPermissionGroup(id: string) {
  return authRequest<PermissionGroupDetail>(`/core/api/permissions/groups/${id}`);
}

export function updatePermissionGroup(id: string, titleTranslations: Record<string, string>) {
  return authRequest<unknown>(`/core/api/permissions/groups/${id}`, {
    method: "PUT",
    body: JSON.stringify({ titleTranslations }),
  });
}

export function getPermission(id: string) {
  return authRequest<PermissionDetail>(`/core/api/permissions/${id}`);
}

export function updatePermission(id: string, titleTranslations: Record<string, string>) {
  return authRequest<unknown>(`/core/api/permissions/${id}`, {
    method: "PUT",
    body: JSON.stringify({ titleTranslations }),
  });
}

export type TariffListItem = {
  id: string;
  code?: string | null;
  cost: number;
  isActive: boolean;
  description?: string | null;
};

export type TariffDetail = {
  id: string;
  code?: string | null;
  cost: number;
  isActive: boolean;
  description?: Record<string, string> | null;
};

export type TariffIncludingPackages = {
  id: string;
  code?: string | null;
  cost: number;
  isActive: boolean;
  description?: string | null;
  originalCost: number;
  packages: PackageListItem[] | null;
};

export type TariffInput = {
  code: string;
  cost: number;
  isActive: boolean;
  descriptionTranslations: Record<string, string>;
};

export function listTariffs(params: { search?: string; page?: number; pageSize?: number } = {}) {
  const query = new URLSearchParams();
  if (params.search) query.set("Search", params.search);
  query.set("Page", String(params.page ?? 1));
  query.set("PageSize", String(params.pageSize ?? 100));
  return authRequest<PagedResult<TariffListItem>>(`/core/api/tariffs?${query.toString()}`);
}

export function listTariffsWithPackages(
  params: { search?: string; page?: number; pageSize?: number } = {},
) {
  const query = new URLSearchParams();
  if (params.search) query.set("Search", params.search);
  query.set("Page", String(params.page ?? 1));
  query.set("PageSize", String(params.pageSize ?? 100));
  return authRequest<PagedResult<TariffIncludingPackages>>(
    `/core/api/tariffs/all-including-packages?${query.toString()}`,
  );
}

export function getTariff(id: string) {
  return authRequest<TariffDetail>(`/core/api/tariffs/${id}`);
}

export function createTariff(data: TariffInput) {
  return authRequest<unknown>("/core/api/tariffs", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateTariff(id: string, data: TariffInput) {
  return authRequest<unknown>(`/core/api/tariffs/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export function deleteTariff(id: string) {
  return authRequest<unknown>(`/core/api/tariffs/${id}`, { method: "DELETE" });
}

export function getTariffPackages(tariffId: string) {
  return authRequest<PackageListItem[]>(`/core/api/tariffs/${tariffId}/packages`);
}

export function addTariffPackages(tariffId: string, packageIds: string[]) {
  return authRequest<{ changed: boolean }>(`/core/api/tariffs/${tariffId}/packages`, {
    method: "POST",
    body: JSON.stringify(packageIds),
  });
}

export function removeTariffPackages(tariffId: string, packageIds: string[]) {
  return authRequest<{ changed: boolean }>(`/core/api/tariffs/${tariffId}/packages`, {
    method: "DELETE",
    body: JSON.stringify(packageIds),
  });
}

export type CityListItem = {
  id: string;
  name?: string | null;
  order: number;
};

export type CityDetail = {
  id: string;
  nameTranslations?: Record<string, string> | null;
  order: number;
};

export type CreateCityInput = {
  nameTranslations: Record<string, string>;
};

export type UpdateCityInput = {
  order: number;
  nameTranslations: Record<string, string>;
};

export function listCities(
  params: { search?: string; page?: number; pageSize?: number } = {},
) {
  const query = new URLSearchParams();
  if (params.search) query.set("Search", params.search);
  query.set("Page", String(params.page ?? 1));
  query.set("PageSize", String(params.pageSize ?? 100));
  return authRequest<PagedResult<CityListItem>>(`/core/api/cities?${query.toString()}`);
}

export function getCity(id: string) {
  return authRequest<CityDetail>(`/core/api/cities/${id}`);
}

export function createCity(data: CreateCityInput) {
  return authRequest<unknown>("/core/api/cities", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateCity(id: string, data: UpdateCityInput) {
  return authRequest<unknown>(`/core/api/cities/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export function deleteCity(id: string) {
  return authRequest<unknown>(`/core/api/cities/${id}`, { method: "DELETE" });
}

// Several pages (Companies, CompanyDetail, Overview) only need the full city
// list for a name lookup / dropdown, not real pagination. Fetch it once and
// share the result instead of every page issuing its own request.
let allCitiesCache: CityListItem[] | null = null;
let allCitiesPromise: Promise<CityListItem[]> | null = null;

export function getAllCitiesCached(): Promise<CityListItem[]> {
  if (allCitiesCache) return Promise.resolve(allCitiesCache);
  if (!allCitiesPromise) {
    allCitiesPromise = listCities({ pageSize: 200 })
      .then((res) => {
        allCitiesCache = res.items ?? [];
        return allCitiesCache;
      })
      .finally(() => {
        allCitiesPromise = null;
      });
  }
  return allCitiesPromise;
}

/** Call after creating/updating/deleting a city so other pages refetch fresh data. */
export function invalidateAllCitiesCache() {
  allCitiesCache = null;
}

export type ActivityLogItem = {
  id: string;
  entityId?: string | null;
  creatorId: string;
  creatorName?: string | null;
  creatorType?: UserType | null;
  activityCode?: string | null;
  activityTitle?: string | null;
  serviceName?: string | null;
  type?: string | null;
  createdAt: string;
};

export type ActivityLogDetail = ActivityLogItem & {
  payload?: string | null;
  entityType?: string | null;
  sessionId?: string | null;
  requestId?: string | null;
  creatorEmail?: string | null;
  creatorIpAddress?: string | null;
};

export function listActivityLogs(
  params: {
    entityId?: string;
    activityCode?: string;
    serviceName?: string;
    sessionId?: string;
    requestId?: string;
    type?: string;
    creatorId?: string;
    creatorType?: UserType;
    creatorIpAddress?: string;
    creatorEmail?: string;
    createdFrom?: string;
    createdTo?: string;
    page?: number;
    pageSize?: number;
  } = {},
) {
  const query = new URLSearchParams();
  if (params.entityId) query.set("EntityId", params.entityId);
  if (params.activityCode) query.set("ActivityCode", params.activityCode);
  if (params.serviceName) query.set("ServiceName", params.serviceName);
  if (params.sessionId) query.set("SessionId", params.sessionId);
  if (params.requestId) query.set("RequestId", params.requestId);
  if (params.type) query.set("Type", params.type);
  if (params.creatorId) query.set("CreatorId", params.creatorId);
  if (params.creatorType) query.set("CreatorType", params.creatorType);
  if (params.creatorIpAddress) query.set("CreatorIpAddress", params.creatorIpAddress);
  if (params.creatorEmail) query.set("CreatorEmail", params.creatorEmail);
  if (params.createdFrom) query.set("CreatedFrom", params.createdFrom);
  if (params.createdTo) query.set("CreatedTo", params.createdTo);
  query.set("Page", String(params.page ?? 1));
  query.set("PageSize", String(params.pageSize ?? 100));
  return authRequest<PagedResult<ActivityLogItem>>(`/core/api/activity-logs?${query.toString()}`);
}

export function getActivityLog(id: string) {
  return authRequest<ActivityLogDetail>(`/core/api/activity-logs/${id}`);
}

export type CompanyStatus = "Trial" | "Active" | "Suspended";

export type CompanyListItem = {
  id: string;
  name?: string | null;
  cityId?: string | null;
  photoName?: string | null;
  status?: CompanyStatus | null;
};

export type CompanySubscription = {
  tariffId?: string | null;
  status: CompanyStatus;
  date: { startDate: string; endDate?: string | null };
  packages?: PackageListItem[] | null;
  originalCost: number;
};

export type CompanyDetail = {
  id: string;
  name?: string | null;
  phoneNumber?: string | null;
  email?: string | null;
  cityId?: string | null;
  photoName?: string | null;
  addressTranslations?: Record<string, string> | null;
  descriptionTranslations?: Record<string, string> | null;
  createdAt: string;
  subscription?: CompanySubscription | null;
};

export type CreateCompanyInput = {
  name: string;
  phoneNumber?: string | null;
  email?: string | null;
  cityId?: string | null;
  addressTranslations: Record<string, string>;
  descriptionTranslations: Record<string, string>;
};

export type UpdateCompanyInput = {
  name?: string | null;
  phoneNumber?: string | null;
  email?: string | null;
  cityId?: string | null;
  photoName?: string | null;
  addressTranslations: Record<string, string>;
  descriptionTranslations: Record<string, string>;
};

export function listCompanies(
  params: {
    search?: string;
    status?: CompanyStatus;
    page?: number;
    pageSize?: number;
    orderBy?: string;
    orderDirection?: "asc" | "desc";
  } = {},
) {
  const query = new URLSearchParams();
  if (params.search) query.set("Search", params.search);
  if (params.status) query.set("Status", params.status);
  if (params.orderBy) query.set("OrderBy", params.orderBy);
  if (params.orderDirection) query.set("OrderDirection", params.orderDirection);
  query.set("Page", String(params.page ?? 1));
  query.set("PageSize", String(params.pageSize ?? 100));
  return authRequest<PagedResult<CompanyListItem>>(`/core/api/companies?${query.toString()}`);
}

export function getCompanyById(id: string) {
  return authRequest<CompanyDetail>(`/core/api/companies/${id}`);
}

export function createCompany(data: CreateCompanyInput) {
  return authRequest<string>("/core/api/companies", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateCompanyById(id: string, data: UpdateCompanyInput) {
  return authRequest<unknown>(`/core/api/companies/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export function deleteCompanyById(id: string) {
  return authRequest<unknown>(`/core/api/companies/${id}`, { method: "DELETE" });
}

export type UpdateSubscriptionInput = {
  tariffId?: string | null;
  status: CompanyStatus;
  startDate: string;
  packageIds: string[];
};

export function updateCompanySubscription(id: string, data: UpdateSubscriptionInput) {
  return authRequest<unknown>(`/core/api/companies/${id}/subscription`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function uploadFile(file: File) {
  const formData = new FormData();
  formData.append("file", file);
  const res = await authRequest<{ fileName: string }>("/core/api/files", {
    method: "POST",
    body: formData,
  });
  return res.fileName;
}

export function getFileUrl(fileName: string) {
  return `${API_BASE_URL}/core/api/files/${fileName}`;
}
