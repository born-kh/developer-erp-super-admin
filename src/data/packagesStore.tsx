import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { packages as initialPackages, type PackagePlan } from "./mock";
import { slugify } from "../lib/format";

type PackagesContextValue = {
  packages: PackagePlan[];
  addPackage: (pkg: Omit<PackagePlan, "id">) => string;
  updatePackage: (id: string, patch: Partial<PackagePlan>) => void;
  deletePackage: (id: string) => void;
};

const PackagesContext = createContext<PackagesContextValue | null>(null);

function makeId(name: string) {
  const base = slugify(name);
  return `${base || "package"}-${Date.now().toString(36)}`;
}

export function PackagesProvider({ children }: { children: ReactNode }) {
  const [packages, setPackages] = useState<PackagePlan[]>(initialPackages);

  const value = useMemo<PackagesContextValue>(
    () => ({
      packages,
      addPackage: (pkg) => {
        const id = makeId(pkg.name);
        setPackages((prev) => [...prev, { ...pkg, id }]);
        return id;
      },
      updatePackage: (id, patch) =>
        setPackages((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p))),
      deletePackage: (id) => setPackages((prev) => prev.filter((p) => p.id !== id)),
    }),
    [packages],
  );

  return <PackagesContext.Provider value={value}>{children}</PackagesContext.Provider>;
}

export function usePackages() {
  const ctx = useContext(PackagesContext);
  if (!ctx) throw new Error("usePackages must be used within PackagesProvider");
  return ctx;
}
