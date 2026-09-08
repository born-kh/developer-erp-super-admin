import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { setTokens } from "../auth";
import { useCurrentUser } from "../data/currentUserStore";
import { login as loginRequest, forgotPassword, ApiRequestError } from "../lib/api";
import { useTranslation } from "../i18n/LanguageContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Field } from "@/components/Field";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { ThemeToggle } from "@/components/ThemeToggle";
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
  const { t } = useTranslation();
  const [email, setEmail] = useState("admin@erp.tj");
  const [password, setPassword] = useState("admin");
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
      toast.error(t.login.fillFields);
      return;
    }
    setSubmitting(true);
    try {
      const tokens = await loginRequest(trimmedEmail, trimmedPassword);
      setTokens(tokens);
      await refreshCurrentUser();
      nav("/");
    } catch (err) {
      const message = err instanceof ApiRequestError ? err.message : t.login.loginFailed;
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
      toast.error(t.login.forgotEmailRequired);
      return;
    }
    setForgotSubmitting(true);
    try {
      await forgotPassword(trimmedEmail);
      toast.success(t.login.forgotSuccess);
      setForgotOpen(false);
    } catch (err) {
      const message = err instanceof ApiRequestError ? err.message : t.login.forgotFailed;
      toast.error(message);
    } finally {
      setForgotSubmitting(false);
    }
  };

  return (
    <div className="login">
      <div className="absolute right-4 top-4 flex items-center gap-1.5">
        <ThemeToggle iconOnly />
        <LanguageSwitcher />
      </div>
      <div className="login-card">
        <div className="login-mark">
          <div className="login-logo-wrap">
            <img src="/logo.png" alt="Enterprise Resource Planning" className="login-logo" />
          </div>
          <div>
            <strong>Enterprise Resource Planning</strong>
          </div>
        </div>
        <form onSubmit={submit} className="grid gap-4">
          <div className="grid gap-1.5">
            <Label className="text-xs text-muted-foreground">{t.login.email}</Label>
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
              <Label className="text-xs text-muted-foreground">{t.login.password}</Label>
              <button
                type="button"
                className="text-xs font-medium text-primary hover:underline"
                onClick={openForgot}
              >
                {t.login.forgotPassword}
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
                aria-label={showPassword ? t.login.hidePassword : t.login.showPassword}
                aria-pressed={showPassword}
              >
                {showPassword ? <EyeOff className="size-4.5" /> : <Eye className="size-4.5" />}
              </button>
            </div>
          </div>
          <Button type="submit" size="lg" className="mt-1 w-full rounded-md" disabled={submitting}>
            {submitting && <Loader2 className="size-4 animate-spin" />}
            {t.login.submit}
          </Button>
        </form>
      </div>

      <Dialog open={forgotOpen} onOpenChange={setForgotOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.login.forgotTitle}</DialogTitle>
          </DialogHeader>
          <form onSubmit={submitForgot} className="grid gap-3">
            <Field label={t.login.email}>
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
                {t.login.send}
              </Button>
              <Button type="button" variant="outline" onClick={() => setForgotOpen(false)}>
                {t.login.cancel}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
