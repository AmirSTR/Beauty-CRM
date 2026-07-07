"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, Home, Scissors, Settings, Users, WalletCards } from "lucide-react";

const items = [
  { href: "/dashboard", label: "Главная", icon: Home },
  { href: "/calendar", label: "Записи", icon: CalendarDays },
  { href: "/clients", label: "Клиенты", icon: Users },
  { href: "/services", label: "Услуги", icon: Scissors },
  { href: "/finance", label: "Деньги", icon: WalletCards },
  { href: "/settings", label: "Настройки", icon: Settings }
];

export function SidebarNav({ compact = false }: { compact?: boolean }) {
  const pathname = usePathname();

  return (
    <nav className={compact ? "flex gap-2 overflow-x-auto pb-1" : "space-y-1"}>
      {items.map((item) => {
        const Icon = item.icon;
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={[
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition",
              compact ? "shrink-0" : "",
              active ? "bg-sage text-white" : "text-zinc-700 hover:bg-zinc-100 hover:text-ink"
            ].join(" ")}
          >
            <Icon className="h-4 w-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}