import { LogOut } from "lucide-react";
import { logoutAction } from "@/app/actions";
import { SidebarNav } from "@/components/SidebarNav";
import { requireUser } from "@/lib/auth";

export default async function AppLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();

  return (
    <div className="min-h-screen bg-paper">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-line bg-white px-4 py-5 lg:block">
        <div className="mb-8">
          <p className="text-lg font-semibold text-ink">Моя CRM</p>
          <p className="text-xs text-zinc-500">Клиенты, записи, деньги</p>
        </div>
        <SidebarNav />
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 border-b border-line bg-paper/95 backdrop-blur">
          <div className="flex min-h-16 items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
            <div>
              <p className="text-base font-semibold lg:hidden">Моя CRM</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-sm font-semibold text-ink">{user.name}</p>
                <p className="text-xs text-zinc-500">{user.email}</p>
              </div>
              <form action={logoutAction}>
                <button className="btn-secondary inline-flex gap-2" title="Выйти" type="submit">
                  <LogOut className="h-4 w-4" />
                  <span className="hidden sm:inline">Выйти</span>
                </button>
              </form>
            </div>
          </div>
          <div className="border-t border-line px-4 py-2 sm:px-6 lg:hidden">
            <SidebarNav compact />
          </div>
        </header>

        <main className="px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}