import type { TokenInfo } from "./lib/api";

const ACCESS_TOKEN_KEY = "derp-sa-access-token";
const REFRESH_TOKEN_KEY = "derp-sa-refresh-token";
const EXPIRE_AT_KEY = "derp-sa-token-expire-at";

export function getAccessToken(): string | null {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function setTokens(tokens: TokenInfo) {
  localStorage.setItem(ACCESS_TOKEN_KEY, tokens.accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
  localStorage.setItem(EXPIRE_AT_KEY, tokens.expireTime);
}

export function clearTokens() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(EXPIRE_AT_KEY);
}

export function isAuthenticated(): boolean {
  return Boolean(getAccessToken());
}

// Treat the token as expired slightly early to cover request latency and clock skew.
const EXPIRY_BUFFER_MS = 15_000;

export function isAccessTokenExpired(): boolean {
  const expireAt = localStorage.getItem(EXPIRE_AT_KEY);
  if (!expireAt) return false;
  const expiryMs = Date.parse(expireAt);
  if (Number.isNaN(expiryMs)) return false;
  return Date.now() + EXPIRY_BUFFER_MS >= expiryMs;
}

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const payload = token.split(".")[1];
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
    return JSON.parse(atob(padded));
  } catch {
    return null;
  }
}

export function getUserIdFromAccessToken(): string | null {
  const token = getAccessToken();
  if (!token) return null;
  const sub = decodeJwtPayload(token)?.sub;
  return typeof sub === "string" ? sub : null;
}
