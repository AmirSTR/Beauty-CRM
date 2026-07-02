import Link from "next/link";
import { AuthForm } from "@/components/forms/AuthForm";

export default function RegisterPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-ink">Регистрация</h2>
        <p className="mt-2 text-sm text-zinc-600">Создайте аккаунт мастера и настройте профиль.</p>
      </div>
      <AuthForm mode="register" />
      <p className="text-sm text-zinc-600">
        Уже есть аккаунт?{" "}
        <Link className="font-semibold text-sage" href="/login">
          Войти
        </Link>
      </p>
    </div>
  );
}
