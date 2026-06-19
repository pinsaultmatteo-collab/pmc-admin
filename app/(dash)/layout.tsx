import Sidebar from "@/components/Sidebar";
import { logout } from "@/app/actions";
import { LogOut } from "lucide-react";

export default function DashLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <Sidebar />
      <div className="md:pl-60">
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-base/80 px-5 py-3 backdrop-blur md:px-8">
          <p className="font-mono text-xs text-faint">
            {new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </p>
          <form action={logout}>
            <button className="btn-ghost text-xs" type="submit">
              <LogOut size={14} /> Déconnexion
            </button>
          </form>
        </header>
        <main className="px-5 py-6 md:px-8 md:py-8">{children}</main>
      </div>
    </div>
  );
}
