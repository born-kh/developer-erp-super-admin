import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { cityCatalog as initialCities, type CityItem } from "./mock";
import { slugify } from "../lib/format";

type CityCatalogContextValue = {
  cityCatalog: CityItem[];
  addCity: (city: Omit<CityItem, "id">) => string;
  updateCity: (id: string, patch: Partial<CityItem>) => void;
  deleteCity: (id: string) => void;
};

const CityCatalogContext = createContext<CityCatalogContextValue | null>(null);

function makeId(name: string) {
  const base = slugify(name);
  return `${base || "city"}-${Date.now().toString(36)}`;
}

export function CityCatalogProvider({ children }: { children: ReactNode }) {
  const [cityCatalog, setCityCatalog] = useState<CityItem[]>(initialCities);

  const value = useMemo<CityCatalogContextValue>(
    () => ({
      cityCatalog,
      addCity: (city) => {
        const id = makeId(city.name);
        setCityCatalog((prev) => [...prev, { ...city, id }]);
        return id;
      },
      updateCity: (id, patch) =>
        setCityCatalog((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c))),
      deleteCity: (id) => setCityCatalog((prev) => prev.filter((c) => c.id !== id)),
    }),
    [cityCatalog],
  );

  return <CityCatalogContext.Provider value={value}>{children}</CityCatalogContext.Provider>;
}

export function useCityCatalog() {
  const ctx = useContext(CityCatalogContext);
  if (!ctx) throw new Error("useCityCatalog must be used within CityCatalogProvider");
  return ctx;
}
