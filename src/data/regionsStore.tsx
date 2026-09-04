import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { regions as initialRegions, type Region } from "./mock";
import { slugify } from "../lib/format";

type RegionsContextValue = {
  regions: Region[];
  addRegion: (region: Omit<Region, "id">) => string;
  updateRegion: (id: string, patch: Partial<Region>) => void;
  deleteRegion: (id: string) => void;
};

const RegionsContext = createContext<RegionsContextValue | null>(null);

function makeId(name: string) {
  const base = slugify(name);
  return `${base || "region"}-${Date.now().toString(36)}`;
}

export function RegionsProvider({ children }: { children: ReactNode }) {
  const [regions, setRegions] = useState<Region[]>(initialRegions);

  const value = useMemo<RegionsContextValue>(
    () => ({
      regions,
      addRegion: (region) => {
        const id = makeId(region.name);
        setRegions((prev) => [...prev, { ...region, id }]);
        return id;
      },
      updateRegion: (id, patch) =>
        setRegions((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r))),
      deleteRegion: (id) => setRegions((prev) => prev.filter((r) => r.id !== id)),
    }),
    [regions],
  );

  return <RegionsContext.Provider value={value}>{children}</RegionsContext.Provider>;
}

export function useRegions() {
  const ctx = useContext(RegionsContext);
  if (!ctx) throw new Error("useRegions must be used within RegionsProvider");
  return ctx;
}
