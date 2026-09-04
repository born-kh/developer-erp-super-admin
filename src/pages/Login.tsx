import { useNavigate } from "react-router-dom";
import { AUTH_KEY } from "../auth";

export function Login() {
  const nav = useNavigate();
  const enter = () => {
    localStorage.setItem(AUTH_KEY, "1");
    nav("/");
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
        <button className="primary" type="button" onClick={enter}>
          Войти как Super Admin
        </button>
        <p className="hint">Демо-вход без пароля. Позже подключим backend.</p>
      </div>
    </div>
  );
}
