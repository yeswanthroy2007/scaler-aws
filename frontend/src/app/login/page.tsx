"use client";

import { Suspense, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertCircle } from "lucide-react";
import { useAuth } from "@/features/auth/AuthProvider";
import { ApiError } from "@/services/api/client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Checkbox } from "@/components/ui/Checkbox";
import { FormField } from "@/components/ui/FormField";

interface FormErrors {
  email?: string;
  password?: string;
}

function validate(email: string, password: string): FormErrors {
  const errors: FormErrors = {};
  if (!email.trim()) {
    errors.email = "Enter your email address.";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = "Enter a valid email address.";
  }
  if (!password) {
    errors.password = "Enter your password.";
  }
  return errors;
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const { login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState("admin@example.com");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitError(null);

    const validationErrors = validate(email, password);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    setSubmitting(true);
    try {
      await login({ email, password, remember_me: rememberMe });
      const redirectTo = searchParams.get("from") || "/route53";
      router.push(redirectTo);
    } catch (error) {
      setSubmitError(error instanceof ApiError ? error.message : "Unable to sign in. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-[var(--color-page-bg)] px-4 py-10">
      <div className="mb-6 flex items-center gap-2">
        <span className="grid h-9 w-9 place-items-center rounded bg-[#ff9900] text-sm font-bold text-black">R53</span>
        <span className="text-xl font-semibold text-[var(--color-text)]">Route 53 Console</span>
      </div>

      <div className="w-full max-w-sm rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm">
        <h1 className="text-xl font-semibold text-[var(--color-text)]">Sign in</h1>
        <p className="mt-1 text-sm text-[var(--color-text-secondary)]">to your mock AWS account</p>

        <form onSubmit={handleSubmit} noValidate className="mt-5 flex flex-col gap-4">
          {submitError && (
            <div
              role="alert"
              className="flex items-start gap-2 rounded border border-[var(--color-danger-border)] bg-[var(--color-danger-bg)] px-3 py-2 text-sm text-[var(--color-danger)]"
            >
              <AlertCircle size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
              <span>{submitError}</span>
            </div>
          )}

          <FormField label="Email address" required error={errors.email}>
            {(id, describedBy) => (
              <Input
                id={id}
                type="email"
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                aria-describedby={describedBy}
                aria-invalid={Boolean(errors.email)}
                hasError={Boolean(errors.email)}
              />
            )}
          </FormField>

          <FormField label="Password" required error={errors.password}>
            {(id, describedBy) => (
              <Input
                id={id}
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                aria-describedby={describedBy}
                aria-invalid={Boolean(errors.password)}
                hasError={Boolean(errors.password)}
              />
            )}
          </FormField>

          <label className="flex items-center gap-2 text-sm text-[var(--color-text)]">
            <Checkbox checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} />
            Remember me
          </label>

          <Button type="submit" variant="primary" className="w-full justify-center" loading={submitting}>
            Sign in
          </Button>
        </form>

        <div className="mt-5 rounded border border-[var(--color-info-border)] bg-[var(--color-info-bg)] px-3 py-2 text-xs text-[var(--color-text-secondary)]">
          <p className="font-semibold text-[var(--color-text)]">Demo credentials</p>
          <p className="mt-0.5">Email: admin@example.com</p>
          <p>Password: Password123!</p>
        </div>
      </div>

      <p className="mt-6 text-xs text-[var(--color-text-muted)]">
        This is a mock console for demonstration purposes only. Not affiliated with Amazon Web Services.
      </p>
    </div>
  );
}
