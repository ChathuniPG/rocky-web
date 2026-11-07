"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { useForm } from "react-hook-form";

import { FormErrorAlert } from "@/components/form-error-alert";
import { FormField } from "@/components/form-field";
import { PasswordInput } from "@/components/password-input";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTranslations } from "@/i18n/i18n-provider";
import type { TranslationKey } from "@/i18n/translate";
import { api } from "@/lib/api/client";

import { loginSchema, type LoginFormInput, type LoginFormValues } from "./auth-schemas";
import { mapAuthError, type AuthFormError } from "./map-auth-error";
import { completeSignIn } from "./session-navigation";

/**
 * Email and password login (FR-AUTH-03..05). Validates on the client first,
 * shows server errors above the form, and blocks double submission.
 */
export function LoginForm() {
  const t = useTranslations();
  const [formError, setFormError] = useState<AuthFormError | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormInput, unknown, LoginFormValues>({
    resolver: zodResolver(loginSchema),
    // Validate a field once the user leaves it, then live while they fix it.
    mode: "onTouched",
    defaultValues: { email: "", password: "" },
  });

  const login = useMutation({
    mutationFn: (values: LoginFormValues) => api.post("/auth/login", { body: values }),
  });

  // Stays busy after success until the navigation replaces this page.
  const isBusy = isSubmitting || login.isPending || login.isSuccess;

  const submit = handleSubmit(async (values) => {
    setFormError(null);
    try {
      const user = await login.mutateAsync(values);
      // Loads the destination as a new page, which shows this toast (#29).
      completeSignIn(t("auth.login.success", { name: user.displayName }));
    } catch (error) {
      // Wrong email and wrong password look the same on purpose (design.md 3.4),
      // so login errors are shown for the whole form rather than one field.
      setFormError(mapAuthError(error));
    }
  });

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    if (isBusy) {
      event.preventDefault();
      return;
    }
    void submit(event);
  }

  // Messages are translation keys set by the schema or the error mapping.
  const translate = (key: string | undefined) => (key ? t(key as TranslationKey) : undefined);

  return (
    <form noValidate onSubmit={onSubmit} className="flex flex-col gap-4">
      {formError ? <FormErrorAlert message={t(formError.key)} details={formError.details} /> : null}

      <FormField
        id="login-email"
        label={t("auth.fields.email")}
        error={translate(errors.email?.message)}
      >
        {(control) => (
          <Input
            {...control}
            className="h-10"
            {...register("email")}
            type="email"
            autoComplete="email"
            inputMode="email"
            autoCapitalize="none"
            spellCheck={false}
          />
        )}
      </FormField>

      <FormField
        id="login-password"
        label={t("auth.fields.password")}
        error={translate(errors.password?.message)}
      >
        {(control) => (
          <PasswordInput
            {...control}
            className="h-10"
            {...register("password")}
            autoComplete="current-password"
          />
        )}
      </FormField>

      <Button type="submit" size="lg" loading={isBusy} className="mt-2 w-full">
        {t("auth.login.submit")}
      </Button>
    </form>
  );
}
