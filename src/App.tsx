import type { ReactNode } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { AUTH_KEY } from "./auth";
import { AppShell } from "./AppShell";
import { CompaniesProvider } from "./data/companiesStore";
import { UsersProvider } from "./data/usersStore";
import { PackagesProvider } from "./data/packagesStore";
import { TariffsProvider } from "./data/tariffsStore";
import { RegionsProvider } from "./data/regionsStore";
import { CityCatalogProvider } from "./data/cityCatalogStore";
import { Login } from "./pages/Login";
import { Overview } from "./pages/Overview";
import { Companies } from "./pages/Companies";
import { CompanyDetail } from "./pages/CompanyDetail";
import { Users } from "./pages/Users";
import { Packages } from "./pages/Packages";
import { Tariffs } from "./pages/Tariffs";
import { Cities } from "./pages/Cities";

function Guard({ children }: { children: ReactNode }) {
  if (!localStorage.getItem(AUTH_KEY)) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <CompaniesProvider>
      <UsersProvider>
        <PackagesProvider>
          <TariffsProvider>
            <RegionsProvider>
              <CityCatalogProvider>
                <Routes>
                  <Route path="/login" element={<Login />} />
                  <Route
                    element={
                      <Guard>
                        <AppShell />
                      </Guard>
                    }
                  >
                    <Route path="/" element={<Overview />} />
                    <Route path="/companies" element={<Companies />} />
                    <Route path="/companies/:id" element={<CompanyDetail />} />
                    <Route path="/users" element={<Users />} />
                    <Route path="/packages" element={<Packages />} />
                    <Route path="/tariffs" element={<Tariffs />} />
                    <Route path="/cities" element={<Cities />} />
                  </Route>
                </Routes>
              </CityCatalogProvider>
            </RegionsProvider>
          </TariffsProvider>
        </PackagesProvider>
      </UsersProvider>
    </CompaniesProvider>
  );
}
