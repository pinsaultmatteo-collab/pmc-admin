"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CreditCard,
  TrendingUp,
  Globe,
  CheckSquare,
  Megaphone,
  Cpu,
} from "lucide-react";

const NAV = [
  { href: "/", label: "Vue d'ensemble", icon: LayoutDashboard },
  { href: "/abonnements", label: "Abonnements", icon: CreditCard },
  { href: "/ca", label: "Chiffre d'affaires", icon: TrendingUp },
  { href: "/sites", label: "Sites clients", icon: Globe },
  { href: "/todos", label: "To-do sites", icon: CheckSquare },
  { href: "/campagnes", label: "Campagnes pub", icon: Megaphone },
  { href: "/couts", label: "Coûts API", icon: Cpu },
];

export default function Sidebar() {
  const path = usePathname();
  return (
    <aside className="hidden md:flex md:w-60 md:flex-col md:fixed md:inset-y-0 border-r border-border bg-surface">
      <div className="px-5 py-5 border-b border-border">
        <div className="flex items-center gap-2">
          <span className="grid h-7 w-7 place-items-center rounded-md bg-accent text-[11px] font-bold text-white">
            PMC
          </span>
          <span className="text-sm font-semibold tracking-tight">Pilotage</span>
        </div>
        <p className="eyebrow mt-3">// interne</p>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = href === "/" ? path === "/" : path.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                active ? "bg-accent/15 text-ink" : "text-muted hover:text-ink hover:bg-surface-2"
              }`}
            >
              <Icon size={17} className={active ? "text-accent" : ""} />
              {label}
            </Link>
          );
        })}
      </nav>
      <div className="px-5 py-4 border-t border-border">
        <p className="font-mono text-[11px] text-faint">agence-pmc-marketing.com</p>
      </div>
    </aside>
  );
}
