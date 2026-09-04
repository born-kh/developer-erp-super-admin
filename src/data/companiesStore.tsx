import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { companies as initialCompanies, type Company } from "./mock";

type CompaniesContextValue = {
  companies: Company[];
  getCompany: (id: string) => Company | undefined;
  addCompany: (company: Omit<Company, "id">) => string;
  updateCompany: (id: string, patch: Partial<Company>) => void;
  deleteCompany: (id: string) => void;
};

const CompaniesContext = createContext<CompaniesContextValue | null>(null);

function slugify(name: string) {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `${base || "company"}-${Date.now().toString(36)}`;
}

export function CompaniesProvider({ children }: { children: ReactNode }) {
  const [companies, setCompanies] = useState<Company[]>(initialCompanies);

  const value = useMemo<CompaniesContextValue>(
    () => ({
      companies,
      getCompany: (id) => companies.find((c) => c.id === id),
      addCompany: (company) => {
        const id = slugify(company.name);
        setCompanies((prev) => [...prev, { ...company, id }]);
        return id;
      },
      updateCompany: (id, patch) =>
        setCompanies((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c))),
      deleteCompany: (id) => setCompanies((prev) => prev.filter((c) => c.id !== id)),
    }),
    [companies],
  );

  return <CompaniesContext.Provider value={value}>{children}</CompaniesContext.Provider>;
}

export function useCompanies() {
  const ctx = useContext(CompaniesContext);
  if (!ctx) throw new Error("useCompanies must be used within CompaniesProvider");
  return ctx;
}
