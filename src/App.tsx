import type { ReactNode } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { isAuthenticated } from "./auth";
import { AppShell } from "./AppShell";
import { CurrentUserProvider } from "./data/currentUserStore";
import { UsersProvider } from "./data/usersStore";
import { CityCatalogProvider } from "./data/cityCatalogStore";
import { ModuleSettingsProvider } from "./data/moduleSettingsStore";
import { Login } from "./pages/Login";
import { ResetPassword } from "./pages/ResetPassword";
import { Overview } from "./pages/Overview";
import { Companies } from "./pages/Companies";
import { CompanyDetail } from "./pages/CompanyDetail";
import { Users } from "./pages/Users";
import { UserDetail } from "./pages/UserDetail";
import { Profile } from "./pages/Profile";
import { Packages } from "./pages/Packages";
import { PackageDetail } from "./pages/PackageDetail";
import { Tariffs } from "./pages/Tariffs";
import { Permissions } from "./pages/Permissions";
import { Roles } from "./pages/Roles";
import { RoleDetail } from "./pages/RoleDetail";
import { Cities } from "./pages/Cities";
import { ActivityLogs } from "./pages/ActivityLogs";
import { ActivityLogDetail } from "./pages/ActivityLogDetail";

function Guard({ children }: { children: ReactNode }) {
  if (!isAuthenticated()) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <CurrentUserProvider>
      <UsersProvider>
        <CityCatalogProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route
              element={
                <Guard>
                  <ModuleSettingsProvider>
                    <AppShell />
                  </ModuleSettingsProvider>
                </Guard>
              }
            >
              <Route path="/" element={<Overview />} />
              <Route path="/companies" element={<Companies />} />
              <Route path="/companies/:id" element={<CompanyDetail />} />
              <Route path="/users" element={<Users />} />
              <Route path="/users/:id" element={<UserDetail />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/packages" element={<Packages />} />
              <Route path="/packages/:id" element={<PackageDetail />} />
              <Route path="/tariffs" element={<Tariffs />} />
              <Route path="/permissions" element={<Permissions />} />
              <Route path="/roles" element={<Roles />} />
              <Route path="/roles/:id" element={<RoleDetail />} />
              <Route path="/cities" element={<Cities />} />
              <Route path="/activity-logs" element={<ActivityLogs />} />
              <Route path="/activity-logs/:id" element={<ActivityLogDetail />} />
            </Route>
          </Routes>
        </CityCatalogProvider>
      </UsersProvider>
    </CurrentUserProvider>
  );
}
