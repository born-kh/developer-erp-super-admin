import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { forgotPassword, resetPassword, ApiRequestError } from "../lib/api";
import { useTranslation } from "../i18n/LanguageContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function errorMessage(err: unknown, fallback: string) {
  return err instanceof ApiRequestError ? err.message : fallback;
}

export function ResetPassword() {
  const nav = useNavigate();
  const { t } = useTranslation();

  const [step, setStep] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [password, setPassword] = useState("");
  const [verifyPassword, setVerifyPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const sendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (sendingCode) return;
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      toast.error(t.resetPassword.errors.missingEmail);
      return;
    }
    setSendingCode(true);
    try {
      await forgotPassword(trimmedEmail);
      toast.success(t.resetPassword.codeSent);
      setStep("code");
    } catch (err) {
      toast.error(errorMessage(err, t.resetPassword.errors.failedSendCode));
    } finally {
      setSendingCode(false);
    }
  };

  const resendCode = async () => {
    if (sendingCode) return;
    setSendingCode(true);
    try {
      await forgotPassword(email.trim());
      toast.success(t.resetPassword.codeSent);
    } catch (err) {
      toast.error(errorMessage(err, t.resetPassword.errors.failedSendCode));
    } finally {
      setSendingCode(false);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
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
      await resetPassword(email.trim(), verificationCode.trim(), password, verifyPassword);
      toast.success(t.resetPassword.success);
      nav("/login");
    } catch (err) {
      toast.error(errorMessage(err, t.resetPassword.errors.failed));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="login">
      <button
        type="button"
        className="absolute left-4 top-4 flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        onClick={() => nav("/login")}
      >
        <ArrowLeft className="size-4" />
        {t.common.back}
      </button>
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

        {step === "email" ? (
          <>
            <p className="lead">{t.resetPassword.leadEmail}</p>
            <form onSubmit={sendCode} className="grid gap-4">
              <div className="grid gap-1.5">
                <Label className="text-xs text-muted-foreground">{t.login.email}</Label>
                <Input
                  type="email"
                  autoComplete="username"
                  placeholder="example@mail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoFocus
                  required
                />
              </div>
              <Button type="submit" size="lg" className="mt-1 w-full rounded-md" disabled={sendingCode}>
                {sendingCode && <Loader2 className="size-4 animate-spin" />}
                {t.resetPassword.sendCode}
              </Button>
            </form>
          </>
        ) : (
          <>
            <p className="lead">{t.resetPassword.leadCode}</p>
            <form onSubmit={submit} className="grid gap-4">
              <div className="grid gap-1.5">
                <Label className="text-xs text-muted-foreground">{t.resetPassword.verificationCode}</Label>
                <Input
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  autoFocus
                  required
                />
              </div>
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
              <div className="flex items-center justify-between text-sm">
                <button type="button" className="text-primary hover:underline" onClick={() => setStep("email")}>
                  {t.resetPassword.changeEmail}
                </button>
                <button
                  type="button"
                  className="text-primary hover:underline"
                  onClick={resendCode}
                  disabled={sendingCode}
                >
                  {t.resetPassword.resendCode}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
