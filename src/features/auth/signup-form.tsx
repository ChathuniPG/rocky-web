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

import { signupSchema, type SignupFormInput, type SignupFormValues } from "./auth-schemas";
import { mapAuthError, type AuthFormError } from "./map-auth-error";
import { completeSignIn } from "./session-navigation";

/**
 * Account creation (FR-AUTH-01..05). The client rules mirror the API; a taken
 * email or username (409) is shown on that field, other server errors above
 * the form.
 */
export function SignupForm() {
  const t = useTranslations();
  const [formError, setFormError] = useState<AuthFormError | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<SignupFormInput, unknown, SignupFormValues>({
    resolver: zodResolver(signupSchema),
    // Validate a field once the user leaves it, then live while they fix it.
    mode: "onTouched",
    defaultValues: { email: "", password: "", username: "", displayName: "" },
  });

  const signup = useMutation({
    mutationFn: (values: SignupFormValues) => api.post("/auth/signup", { body: values }),
  });

  // Stays busy after success until the navigation replaces this page.
  const isBusy = isSubmitting || signup.isPending || signup.isSuccess;

  const submit = handleSubmit(async (values) => {
    setFormError(null);
    try {
      const user = await signup.mutateAsync(values);
      // Loads the destination as a new page, which shows this toast (#29).
      completeSignIn(t("auth.signup.success", { name: user.displayName }));
    } catch (error) {
      const mapped = mapAuthError(error);
      if (mapped.field) {
        setError(mapped.field, { type: "server", message: mapped.key }, { shouldFocus: true });
      } else {
        setFormError(mapped);
      }
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
        id="signup-display-name"
        label={t("auth.fields.displayName")}
        error={translate(errors.displayName?.message)}
      >
        {(control) => (
          <Input {...control} className="h-10" {...register("displayName")} autoComplete="name" />
        )}
      </FormField>

      <FormField
        id="signup-username"
        label={t("auth.fields.username")}
        hint={t("auth.hints.username")}
        error={translate(errors.username?.message)}
      >
        {(control) => (
          <Input
            {...control}
            className="h-10"
            {...register("username")}
            autoComplete="username"
            autoCapitalize="none"
            spellCheck={false}
          />
        )}
      </FormField>

      <FormField
        id="signup-email"
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
        id="signup-password"
        label={t("auth.fields.password")}
        hint={t("auth.hints.password")}
        error={translate(errors.password?.message)}
      >
        {(control) => (
          <PasswordInput
            {...control}
            className="h-10"
            {...register("password")}
            autoComplete="new-password"
          />
        )}
      </FormField>

      <Button type="submit" size="lg" loading={isBusy} className="mt-2 w-full">
        {t("auth.signup.submit")}
      </Button>
    </form>
  );
}
