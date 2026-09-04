import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AUTH_KEY } from "../auth";

export function Login() {
  const nav = useNavigate();
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const enter = () => {
    localStorage.setItem(AUTH_KEY, "1");
    nav("/");
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    enter();
  };

  return (
    <div className="login">
      <div className="login-card">
        <div className="login-mark">
          <span>Developer ERP</span>
          <em>Super Admin</em>
        </div>
        <p className="lead">
          Панель управления платформой: компании, тарифы, пользователи и глобальные роли.
          Кабинет компании живёт в отдельном приложении.
        </p>
        <form onSubmit={submit}>
          <label className="field">
            <span className="field-label">Логин</span>
            <input
              type="text"
              autoComplete="username"
              placeholder="admin"
              value={login}
              onChange={(e) => setLogin(e.target.value)}
            />
          </label>
          <label className="field">
            <span className="field-label">Пароль</span>
            <div className="password-input">
              <input
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                className="eye-toggle"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Скрыть пароль" : "Показать пароль"}
                aria-pressed={showPassword}
              >
                {showPassword ? (
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 3l18 18" />
                    <path d="M10.58 10.58a3 3 0 0 0 4.24 4.24" />
                    <path d="M9.88 5.09A10.7 10.7 0 0 1 12 5c6.5 0 10 7 10 7a13.16 13.16 0 0 1-3.17 4.09M6.61 6.61C4.02 8.28 2 12 2 12s3.5 7 10 7a9.7 9.7 0 0 0 3.39-.61" />
                  </svg>
                )}
              </button>
            </div>
          </label>
          <button className="primary" type="submit">
            Войти
          </button>
        </form>
        <p className="hint">Демо-вход без пароля. Позже подключим backend.</p>
      </div>
    </div>
  );
}
