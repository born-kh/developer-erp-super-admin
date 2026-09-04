import type { ReactNode } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { AUTH_KEY } from "./auth";
import { AppShell } from "./AppShell";
import { Login } from "./pages/Login";
import { Overview } from "./pages/Overview";
import { Companies } from "./pages/Companies";
import { Users } from "./pages/Users";
import { Roles } from "./pages/Roles";
import { Packages } from "./pages/Packages";

function Guard({ children }: { children: ReactNode }) {
  if (!localStorage.getItem(AUTH_KEY)) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
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
        <Route path="/users" element={<Users />} />
        <Route path="/roles" element={<Roles />} />
        <Route path="/packages" element={<Packages />} />
      </Route>
    </Routes>
  );
}
