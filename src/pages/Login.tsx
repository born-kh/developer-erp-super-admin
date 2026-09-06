import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { setTokens } from "../auth";
import { useCurrentUser } from "../data/currentUserStore";
import { login as loginRequest, forgotPassword, ApiRequestError } from "../lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Field } from "@/components/Field";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function Login() {
  const nav = useNavigate();
  const { refresh: refreshCurrentUser } = useCurrentUser();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotSubmitting, setForgotSubmitting] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();
    if (!trimmedEmail || !trimmedPassword) {
      toast.error("Заполните email и пароль");
      return;
    }
    setSubmitting(true);
    try {
      const tokens = await loginRequest(trimmedEmail, trimmedPassword);
      setTokens(tokens);
      await refreshCurrentUser();
      nav("/");
    } catch (err) {
      const message = err instanceof ApiRequestError ? err.message : "Не удалось войти";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const openForgot = () => {
    setForgotEmail(email);
    setForgotOpen(true);
  };

  const submitForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (forgotSubmitting) return;
    const trimmedEmail = forgotEmail.trim();
    if (!trimmedEmail) {
      toast.error("Введите email");
      return;
    }
    setForgotSubmitting(true);
    try {
      await forgotPassword(trimmedEmail);
      toast.success("Если email существует, на него отправлена ссылка для сброса пароля");
      setForgotOpen(false);
    } catch (err) {
      const message = err instanceof ApiRequestError ? err.message : "Не удалось отправить запрос";
      toast.error(message);
    } finally {
      setForgotSubmitting(false);
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
        <p className="lead">Войдите, чтобы управлять компаниями, тарифами и пользователями.</p>
        <form onSubmit={submit} className="grid gap-4">
          <div className="grid gap-1.5">
            <Label className="text-xs text-muted-foreground">Email</Label>
            <Input
              type="email"
              autoComplete="username"
              placeholder="example@mail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="grid gap-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-xs text-muted-foreground">Пароль</Label>
              <button
                type="button"
                className="text-xs font-medium text-primary hover:underline"
                onClick={openForgot}
              >
                Забыли пароль?
              </button>
            </div>
            <div className="password-input">
              <Input
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
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
          <Button type="submit" size="lg" className="mt-1 w-full rounded-md" disabled={submitting}>
            {submitting && <Loader2 className="size-4 animate-spin" />}
            Войти
          </Button>
        </form>
      </div>

      <Dialog open={forgotOpen} onOpenChange={setForgotOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Восстановление пароля</DialogTitle>
          </DialogHeader>
          <form onSubmit={submitForgot} className="grid gap-3">
            <Field label="Email">
              <Input
                type="email"
                autoComplete="username"
                placeholder="example@mail.com"
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                autoFocus
                required
              />
            </Field>
            <DialogFooter>
              <Button type="submit" disabled={forgotSubmitting}>
                {forgotSubmitting && <Loader2 className="size-4 animate-spin" />}
                Отправить
              </Button>
              <Button type="button" variant="outline" onClick={() => setForgotOpen(false)}>
                Отмена
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
