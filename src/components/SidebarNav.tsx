"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, Home, MoreHorizontal, Scissors, Settings, Users, WalletCards } from "lucide-react";

const mainItems = [
  { href: "/dashboard", label: "Главная", icon: Home },
  { href: "/calendar", label: "Записи", icon: CalendarDays },
  { href: "/clients", label: "Клиенты", icon: Users },
  { href: "/finance", label: "Деньги", icon: WalletCards }
];

const extraItems = [
  { href: "/services", label: "Услуги", icon: Scissors },
  { href: "/settings", label: "Настройки", icon: Settings }
];

export function SidebarNav({ compact = false }: { compact?: boolean }) {
  const pathname = usePathname();
  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);
  const extraActive = extraItems.some((item) => isActive(item.href));

  const linkClass = (active: boolean) => [
    "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition",
    compact ? "shrink-0" : "",
    active ? "bg-sage text-white" : "text-zinc-700 hover:bg-zinc-100 hover:text-ink"
  ].join(" ");

  return (
    <nav className={compact ? "flex gap-2 overflow-x-auto pb-1" : "space-y-1"}>
      {mainItems.map((item) => {
        const Icon = item.icon;
        return (
          <Link key={item.href} href={item.href} className={linkClass(isActive(item.href))}>
            <Icon className="h-4 w-4" />
            {item.label}
          </Link>
        );
      })}

      <details className={compact ? "relative shrink-0" : "pt-2"} open={!compact && extraActive}>
        <summary className={linkClass(extraActive) + " cursor-pointer list-none"}>
          <MoreHorizontal className="h-4 w-4" />
          Еще
        </summary>
        <div className={compact ? "absolute right-0 z-30 mt-2 w-44 rounded-lg border border-line bg-white p-2 shadow-soft" : "mt-1 space-y-1 pl-3"}>
          {extraItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href} className={linkClass(isActive(item.href))}>
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </details>
    </nav>
  );
}