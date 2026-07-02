import Link from "next/link";
import { AuthForm } from "@/components/forms/AuthForm";

export default function LoginPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-ink">Вход</h2>
        <p className="mt-2 text-sm text-zinc-600">Демо: demo@beautycrm.app / password123</p>
      </div>
      <AuthForm mode="login" />
      <p className="text-sm text-zinc-600">
        Нет аккаунта?{" "}
        <Link className="font-semibold text-sage" href="/register">
          Зарегистрироваться
        </Link>
      </p>
    </div>
  );
}
