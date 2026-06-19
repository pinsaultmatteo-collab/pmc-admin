import Link from "next/link";
import { AlertTriangle } from "lucide-react";

export function PageHeader({ eyebrow, title, sub }: { eyebrow: string; title: string; sub?: string }) {
  return (
    <div className="mb-6">
      <p className="eyebrow">// {eyebrow}</p>
      <h1 className="mt-1 text-2xl font-semibold tracking-tight">{title}</h1>
      {sub && <p className="mt-1 text-sm text-muted">{sub}</p>}
    </div>
  );
}

export function StatCard({
  label,
  value,
  hint,
  accent,
}: {
  label: string;
  value: string;
  hint?: string;
  accent?: boolean;
}) {
  return (
    <div className="card p-4">
      <p className="font-mono text-[11px] uppercase tracking-wider text-muted">{label}</p>
      <p className={`mt-2 num text-2xl font-semibold ${accent ? "text-accent" : "text-ink"}`}>{value}</p>
      {hint && <p className="mt-1 text-xs text-faint">{hint}</p>}
    </div>
  );
}

export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="card grid place-items-center px-6 py-12 text-center">
      <p className="text-sm text-muted">{title}</p>
      {hint && <p className="mt-1 text-xs text-faint">{hint}</p>}
    </div>
  );
}

export function ConfigNotice({ what, envVar, href }: { what: string; envVar: string; href?: string }) {
  return (
    <div className="card flex items-start gap-3 border-warn/30 bg-warn/5 px-4 py-4">
      <AlertTriangle size={18} className="mt-0.5 shrink-0 text-warn" />
      <div className="text-sm">
        <p className="text-ink">{what} n'est pas encore configuré.</p>
        <p className="mt-1 text-muted">
          Ajoute la variable <code className="font-mono text-accent">{envVar}</code> dans les variables
          d'environnement Vercel, puis redéploie.
        </p>
        {href && (
          <Link href={href} className="mt-1 inline-block text-accent hover:underline">
            Voir la doc →
          </Link>
        )}
      </div>
    </div>
  );
}

const SUB_STATUS: Record<string, { label: string; cls: string }> = {
  active: { label: "active", cls: "bg-ok/15 text-ok" },
  trialing: { label: "essai", cls: "bg-accent/15 text-accent" },
  past_due: { label: "impayé", cls: "bg-warn/15 text-warn" },
  unpaid: { label: "impayé", cls: "bg-danger/15 text-danger" },
  canceled: { label: "résilié", cls: "bg-faint/15 text-faint" },
  paused: { label: "en pause", cls: "bg-warn/15 text-warn" },
  incomplete: { label: "incomplet", cls: "bg-faint/15 text-faint" },
  incomplete_expired: { label: "expiré", cls: "bg-faint/15 text-faint" },
};

export function StatusPill({ status }: { status: string }) {
  const s = SUB_STATUS[status] ?? { label: status, cls: "bg-faint/15 text-faint" };
  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 font-mono text-[11px] ${s.cls}`}>{s.label}</span>
  );
}

const DEPLOY_STATE: Record<string, string> = {
  READY: "bg-ok/15 text-ok",
  ERROR: "bg-danger/15 text-danger",
  BUILDING: "bg-accent/15 text-accent",
  QUEUED: "bg-warn/15 text-warn",
  CANCELED: "bg-faint/15 text-faint",
};

export function DeployPill({ state }: { state: string | null }) {
  if (!state) return <span className="font-mono text-[11px] text-faint">—</span>;
  const cls = DEPLOY_STATE[state] ?? "bg-faint/15 text-faint";
  return <span className={`inline-flex rounded-full px-2 py-0.5 font-mono text-[11px] ${cls}`}>{state.toLowerCase()}</span>;
}
