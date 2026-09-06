import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { resetPassword, ApiRequestError } from "../lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ResetPassword() {
  const nav = useNavigate();
  const [params] = useSearchParams();
  const token = params.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [verifyPassword, setVerifyPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    if (!token) {
      toast.error("Ссылка недействительна: отсутствует токен");
      return;
    }
    if (password !== verifyPassword) {
      toast.error("Пароли не совпадают");
      return;
    }
    if (!password.trim()) {
      toast.error("Введите новый пароль");
      return;
    }
    setSubmitting(true);
    try {
      await resetPassword(token, password, verifyPassword);
      toast.success("Пароль изменён, войдите с новым паролем");
      nav("/login");
    } catch (err) {
      const message = err instanceof ApiRequestError ? err.message : "Не удалось изменить пароль";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="login">
      <div className="login-card">
        <div className="login-mark">
          <div className="login-mark-badge">SA</div>
          <div>
            <strong>Developer ERP</strong>
            <span>Super Admin</span>
          </div>
        </div>
        <p className="lead">Придумайте новый пароль для входа.</p>
        {!token && (
          <p className="text-sm text-destructive">
            Ссылка недействительна или устарела. Запросите восстановление пароля заново.
          </p>
        )}
        <form onSubmit={submit} className="grid gap-4">
          <div className="grid gap-1.5">
            <Label className="text-xs text-muted-foreground">Новый пароль</Label>
            <div className="password-input">
              <Input
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
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
          <div className="grid gap-1.5">
            <Label className="text-xs text-muted-foreground">Повторите пароль</Label>
            <Input
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              placeholder="••••••••"
              value={verifyPassword}
              onChange={(e) => setVerifyPassword(e.target.value)}
              required
            />
          </div>
          <Button type="submit" size="lg" className="mt-1 w-full rounded-md" disabled={submitting}>
            {submitting && <Loader2 className="size-4 animate-spin" />}
            Сохранить пароль
          </Button>
        </form>
      </div>
    </div>
  );
}
