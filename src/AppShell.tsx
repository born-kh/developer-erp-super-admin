import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { AUTH_KEY } from "./auth";

const links = [
  { to: "/", label: "Обзор" },
  { to: "/companies", label: "Компании" },
  { to: "/users", label: "Пользователи" },
  { to: "/roles", label: "Роли и права" },
  { to: "/packages", label: "Пакеты / тарифы" },
];

export function AppShell() {
  const nav = useNavigate();
  const loc = useLocation();
  const [more, setMore] = useState(false);

  useEffect(() => {
    setMore(false);
  }, [loc.pathname]);

  const logout = () => {
    localStorage.removeItem(AUTH_KEY);
    nav("/login");
  };

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">
          <strong>Developer ERP</strong>
          <i>Super Admin</i>
        </div>
        <nav className="nav">
          <div className="section">Платформа</div>
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.to === "/"}>
              {l.label}
            </NavLink>
          ))}
        </nav>
        <div className="side-foot">
          Управление тенантами
          <button className="linkish" type="button" onClick={logout}>
            Выйти
          </button>
        </div>
      </aside>
      <div className="main">
        <Outlet />
      </div>
      <nav className="bottom-nav">
        <NavLink to="/" end>
          Обзор
        </NavLink>
        <NavLink to="/companies">Компании</NavLink>
        <NavLink to="/packages">Тарифы</NavLink>
        <button type="button" className={more ? "active" : ""} onClick={() => setMore(true)}>
          Ещё
        </button>
      </nav>
      {more && (
        <div className="more-back" onClick={() => setMore(false)}>
          <div className="more-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="more-handle" />
            <b className="more-title">Все разделы</b>
            <nav className="more-nav">
              {links.map((l) => (
                <NavLink key={l.to} to={l.to} end={l.to === "/"}>
                  {l.label}
                </NavLink>
              ))}
            </nav>
            <button type="button" className="more-out" onClick={logout}>
              Выйти
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function PageHead({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="topbar">
      <div>
        <h1>{title}</h1>
        <p className="sub">Super Admin · управление платформой{sub ? ` · ${sub}` : ""}</p>
      </div>
    </div>
  );
}
