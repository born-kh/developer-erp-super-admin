import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { resetPassword, ApiRequestError } from "../lib/api";
import { useTranslation } from "../i18n/LanguageContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ResetPassword() {
  const nav = useNavigate();
  const { t } = useTranslation();
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
      toast.error(t.resetPassword.errors.missingToken);
      return;
    }
    if (password !== verifyPassword) {
      toast.error(t.resetPassword.errors.mismatch);
      return;
    }
    if (!password.trim()) {
      toast.error(t.resetPassword.errors.empty);
      return;
    }
    setSubmitting(true);
    try {
      await resetPassword(token, password, verifyPassword);
      toast.success(t.resetPassword.success);
      nav("/login");
    } catch (err) {
      const message = err instanceof ApiRequestError ? err.message : t.resetPassword.errors.failed;
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="login">
      <div className="login-card">
        <div className="login-mark">
          <div className="login-logo-wrap">
            <img src="/logo.png" alt="Enterprise Resource Planning" className="login-logo" />
          </div>
          <div>
            <strong>Enterprise Resource Planning</strong>
            <span>Super Admin</span>
          </div>
        </div>
        <p className="lead">{t.resetPassword.lead}</p>
        {!token && (
          <p className="text-sm text-destructive">
            {t.resetPassword.invalidLink}
          </p>
        )}
        <form onSubmit={submit} className="grid gap-4">
          <div className="grid gap-1.5">
            <Label className="text-xs text-muted-foreground">{t.resetPassword.newPassword}</Label>
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
                aria-label={showPassword ? t.login.hidePassword : t.login.showPassword}
                aria-pressed={showPassword}
              >
                {showPassword ? <EyeOff className="size-4.5" /> : <Eye className="size-4.5" />}
              </button>
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label className="text-xs text-muted-foreground">{t.resetPassword.repeatPassword}</Label>
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
            {t.resetPassword.submit}
          </Button>
        </form>
      </div>
    </div>
  );
}
