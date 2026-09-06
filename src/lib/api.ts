import { getAccessToken, getRefreshToken, setTokens, clearTokens, isAccessTokenExpired } from "../auth";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://195.246.102.223:9595";

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
  nickName?: string | null;
  email?: string | null;
  avatarUrl?: string | null;
  createdAt: string;
  active: boolean;
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

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
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

export function login(email: string, password: string) {
  return request<TokenInfo>("/core/api/auth/token", {
    method: "POST",
    body: JSON.stringify({ email, password }),
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

export function resetPassword(token: string, password: string, verifyPassword: string) {
  return request<string | null>("/core/api/auth/reset-password", {
    method: "POST",
    body: JSON.stringify({ token, password, verifyPassword }),
  });
}

export function getCurrentUser() {
  return authRequest<UserDetail>("/core/api/users/current-user-info");
}

export function getUserById(id: string) {
  return authRequest<UserDetail>(`/core/api/users/${id}`);
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
