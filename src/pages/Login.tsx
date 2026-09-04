import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { AUTH_KEY } from "../auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
        <form onSubmit={submit} className="grid gap-4">
          <div className="grid gap-1.5">
            <Label className="text-xs text-white/60">Логин</Label>
            <Input
              type="text"
              autoComplete="username"
              placeholder="admin"
              value={login}
              onChange={(e) => setLogin(e.target.value)}
            />
          </div>
          <div className="grid gap-1.5">
            <Label className="text-xs text-white/60">Пароль</Label>
            <div className="password-input">
              <Input
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
                {showPassword ? <EyeOff className="size-4.5" /> : <Eye className="size-4.5" />}
              </button>
            </div>
          </div>
          <Button type="submit" size="lg" className="mt-1 w-full">
            Войти
          </Button>
        </form>
        <p className="hint">Демо-вход без пароля. Позже подключим backend.</p>
      </div>
    </div>
  );
}
