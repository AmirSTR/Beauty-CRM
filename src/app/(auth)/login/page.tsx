import Link from "next/link";
import { AuthForm } from "@/components/forms/AuthForm";

export default function LoginPage() {
  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-semibold text-ink">Вход</h1>
      <AuthForm mode="login" />
      <p className="text-sm text-zinc-600">
        Нет аккаунта?{" "}
        <Link className="font-semibold text-sage" href="/register">
          Регистрация
        </Link>
      </p>
    </div>
  );
}