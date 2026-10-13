import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { listTopUpRequests } from "../lib/api";

type TopUpRequestsContextValue = {
  badge: string | null;
  refresh: () => void;
};

const TopUpRequestsContext = createContext<TopUpRequestsContextValue>({
  badge: null,
  refresh: () => {},
});

export function TopUpRequestsProvider({ children }: { children: ReactNode }) {
  const [badge, setBadge] = useState<string | null>(null);

  const refresh = useCallback(() => {
    listTopUpRequests({ pageSize: 50 })
      .then((res) => {
        const count = (res.items ?? []).length;
        setBadge(count === 0 ? null : res.pagination.hasNextPage ? `${count}+` : String(count));
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return <TopUpRequestsContext.Provider value={{ badge, refresh }}>{children}</TopUpRequestsContext.Provider>;
}

export function useTopUpRequestsBadge() {
  return useContext(TopUpRequestsContext);
}
