import Link from "next/link";
import { AuthForm } from "@/components/forms/AuthForm";

export default function RegisterPage() {
  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-semibold text-ink">Регистрация</h1>
      <AuthForm mode="register" />
      <p className="text-sm text-zinc-600">
        Есть аккаунт?{" "}
        <Link className="font-semibold text-sage" href="/login">
          Войти
        </Link>
      </p>
    </div>
  );
}