import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { tariffs as initialTariffs, type TariffPlan } from "./mock";
import { slugify } from "../lib/format";

type TariffsContextValue = {
  tariffs: TariffPlan[];
  addTariff: (tariff: Omit<TariffPlan, "id">) => string;
  updateTariff: (id: string, patch: Partial<TariffPlan>) => void;
  deleteTariff: (id: string) => void;
};

const TariffsContext = createContext<TariffsContextValue | null>(null);

function makeId(name: string) {
  const base = slugify(name);
  return `${base || "tariff"}-${Date.now().toString(36)}`;
}

export function TariffsProvider({ children }: { children: ReactNode }) {
  const [tariffs, setTariffs] = useState<TariffPlan[]>(initialTariffs);

  const value = useMemo<TariffsContextValue>(
    () => ({
      tariffs,
      addTariff: (tariff) => {
        const id = makeId(tariff.name);
        setTariffs((prev) => [...prev, { ...tariff, id }]);
        return id;
      },
      updateTariff: (id, patch) =>
        setTariffs((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t))),
      deleteTariff: (id) => setTariffs((prev) => prev.filter((t) => t.id !== id)),
    }),
    [tariffs],
  );

  return <TariffsContext.Provider value={value}>{children}</TariffsContext.Provider>;
}

export function useTariffs() {
  const ctx = useContext(TariffsContext);
  if (!ctx) throw new Error("useTariffs must be used within TariffsProvider");
  return ctx;
}
