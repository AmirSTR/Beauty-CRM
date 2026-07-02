import Link from "next/link";
import { redirectAuthenticatedUser } from "@/lib/auth";

export default async function AuthLayout({
  children
}: {
  children: React.ReactNode;
}) {
  await redirectAuthenticatedUser();

  return (
    <main className="min-h-screen bg-paper">
      <div className="mx-auto grid min-h-screen max-w-6xl items-center gap-8 px-4 py-10 lg:grid-cols-[1.05fr_0.95fr]">
        <section className="space-y-6">
          <Link href="/" className="inline-flex items-center text-sm font-semibold text-sage">
            Beauty CRM
          </Link>
          <div className="space-y-4">
            <h1 className="max-w-xl text-4xl font-semibold leading-tight text-ink sm:text-5xl">
              Рабочая CRM для личного бьюти-мастера
            </h1>
            <p className="max-w-lg text-base leading-7 text-zinc-600">
              Клиенты, услуги, записи, оплаты и блок “Кому написать сегодня” в одном спокойном рабочем интерфейсе.
            </p>
          </div>
          <div className="grid max-w-xl gap-3 sm:grid-cols-3">
            <div className="rounded-lg border border-line bg-white p-4">
              <p className="text-2xl font-semibold text-clay">25+</p>
              <p className="text-sm text-zinc-600">дней до follow-up</p>
            </div>
            <div className="rounded-lg border border-line bg-white p-4">
              <p className="text-2xl font-semibold text-sage">0</p>
              <p className="text-sm text-zinc-600">двойных записей</p>
            </div>
            <div className="rounded-lg border border-line bg-white p-4">
              <p className="text-2xl font-semibold text-honey">1</p>
              <p className="text-sm text-zinc-600">мастер в MVP</p>
            </div>
          </div>
        </section>
        <section className="panel p-6">{children}</section>
      </div>
    </main>
  );
}
