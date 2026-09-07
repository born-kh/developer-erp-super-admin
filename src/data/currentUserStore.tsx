import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { getAccessToken } from "../auth";
import { getCurrentUser, type UserDetail } from "../lib/api";

const STORAGE_KEY = "derp-sa-current-user";

function loadCachedUser(): UserDetail | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as UserDetail) : null;
  } catch {
    return null;
  }
}

type CurrentUserContextValue = {
  user: UserDetail | null;
  loading: boolean;
  refresh: () => Promise<void>;
  clear: () => void;
};

const CurrentUserContext = createContext<CurrentUserContextValue | null>(null);

export function CurrentUserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserDetail | null>(() => loadCachedUser());
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!getAccessToken()) return;
    setLoading(true);
    try {
      const detail = await getCurrentUser();
      setUser(detail);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(detail));
    } catch {
      // getCurrentUser already handles token refresh / forced logout on failure
    } finally {
      setLoading(false);
    }
  }, []);

  const clear = useCallback(() => {
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  useEffect(() => {
    // Revalidate (and, via authRequest, silently refresh an expired access token) on every app load,
    // not only when there's no cached user yet.
    if (getAccessToken()) {
      refresh();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <CurrentUserContext.Provider value={{ user, loading, refresh, clear }}>
      {children}
    </CurrentUserContext.Provider>
  );
}

export function useCurrentUser() {
  const ctx = useContext(CurrentUserContext);
  if (!ctx) throw new Error("useCurrentUser must be used within CurrentUserProvider");
  return ctx;
}
