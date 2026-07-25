import { useState } from "react";
import { GalleryVerticalEnd, LoaderCircle } from "lucide-react";
import { api, type AuthUser } from "../lib/api";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";

type LoginStep = "phone" | "code" | "password";

type LoginPageProps = {
  onAuthenticated: (user: AuthUser) => void;
};

export function LoginPage({ onAuthenticated }: LoginPageProps) {
  const [step, setStep] = useState<LoginStep>("phone");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [isCodeViaApp, setIsCodeViaApp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleStart(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const result = await api.auth.start(phone);
      setIsCodeViaApp(result.isCodeViaApp);
      setStep("code");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send code");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyCode(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const result = await api.auth.verify({ phone, code });

      if (result.requiresPassword) {
        setStep("password");
        return;
      }

      if (result.user) {
        onAuthenticated(result.user);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to verify code");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyPassword(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const result = await api.auth.verify({ phone, password });

      if (result.user) {
        onAuthenticated(result.user);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to verify password",
      );
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(event: React.FormEvent) {
    if (step === "phone") return handleStart(event);
    if (step === "code") return handleVerifyCode(event);
    return handleVerifyPassword(event);
  }

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-background p-6 md:p-10">
      <div className={cn("flex w-full max-w-sm flex-col gap-6")}>
        <form onSubmit={handleSubmit}>
          <FieldGroup>
            <div className="flex flex-col items-center gap-2 text-center">
              <div className="flex size-8 items-center justify-center rounded-md">
                <GalleryVerticalEnd className="size-6" />
              </div>
              <h1 className="text-xl font-bold">Yuno</h1>
              <FieldDescription>
                {step === "phone" &&
                  "Connect your Telegram account to turn your groups into courses."}
                {step === "code" &&
                  (isCodeViaApp
                    ? "Enter the code sent to your Telegram app."
                    : "Enter the SMS code sent to your phone.")}
                {step === "password" &&
                  "Two-factor authentication is enabled on this account."}
              </FieldDescription>
            </div>

            {step === "phone" && (
              <Field>
                <FieldLabel htmlFor="phone">Phone number</FieldLabel>
                <Input
                  id="phone"
                  placeholder="+5511999999999"
                  type="tel"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  required
                />
              </Field>
            )}

            {step === "code" && (
              <Field>
                <FieldLabel htmlFor="code">Verification code</FieldLabel>
                <Input
                  id="code"
                  inputMode="numeric"
                  placeholder="12345"
                  value={code}
                  onChange={(event) => setCode(event.target.value)}
                  required
                />
              </Field>
            )}

            {step === "password" && (
              <Field>
                <FieldLabel htmlFor="password">Password</FieldLabel>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                />
              </Field>
            )}

            <Field>
              <Button className="w-full" disabled={loading} type="submit">
                {step === "phone" &&
                  (loading ? (
                    <LoaderCircle className="size-4 animate-spin" />
                  ) : (
                    "Send verification code"
                  ))}
                {step === "code" &&
                  (loading ? (
                    <LoaderCircle className="size-4 animate-spin" />
                  ) : (
                    "Verify code"
                  ))}
                {step === "password" &&
                  (loading ? (
                    <LoaderCircle className="size-4 animate-spin" />
                  ) : (
                    "Sign in"
                  ))}
              </Button>
            </Field>

            {step === "code" && (
              <Field>
                <Button
                  className="w-full"
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setStep("phone");
                    setCode("");
                    setError(null);
                  }}
                >
                  Use a different phone number
                </Button>
              </Field>
            )}

            {error && <FieldError>{error}</FieldError>}
          </FieldGroup>
        </form>
      </div>
    </div>
  );
}
