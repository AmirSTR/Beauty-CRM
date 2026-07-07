"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { loginAction, registerAction } from "@/app/actions";
import { authSchema, registerSchema } from "@/lib/validations";
import { FieldError, FormError, inputClass, labelClass } from "@/components/forms/FormShell";

type AuthFormProps = {
  mode: "login" | "register";
};

type LoginValues = z.infer<typeof authSchema>;
type RegisterValues = z.infer<typeof registerSchema>;

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const schema = mode === "register" ? registerSchema : authSchema;
  const form = useForm<RegisterValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      email: "",
      password: ""
    }
  });

  const onSubmit = form.handleSubmit((values) => {
    setError(null);
    startTransition(async () => {
      const result =
        mode === "register"
          ? await registerAction(values)
          : await loginAction(values as LoginValues);

      if (!result.ok) {
        setError(result.error ?? "Не получилось. Проверьте данные и попробуйте еще раз.");
        return;
      }

      router.push(result.redirectTo ?? "/dashboard");
      router.refresh();
    });
  });

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <FormError message={error} />

      {mode === "register" && (
        <label className="block space-y-1">
          <span className={labelClass}>Имя</span>
          <input className={inputClass} {...form.register("name")} autoComplete="name" />
          <FieldError message={form.formState.errors.name?.message} />
        </label>
      )}

      <label className="block space-y-1">
        <span className={labelClass}>Email</span>
        <input className={inputClass} {...form.register("email")} type="email" autoComplete="email" />
        <FieldError message={form.formState.errors.email?.message} />
      </label>

      <label className="block space-y-1">
        <span className={labelClass}>Пароль</span>
        <input
          className={inputClass}
          {...form.register("password")}
          type="password"
          autoComplete={mode === "login" ? "current-password" : "new-password"}
        />
        <FieldError message={form.formState.errors.password?.message} />
      </label>

      <button className="btn-primary w-full" type="submit" disabled={isPending}>
        {isPending ? "Подождите..." : mode === "login" ? "Войти" : "Создать"}
      </button>
    </form>
  );
}