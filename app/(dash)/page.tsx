import { StatCard, PageHeader } from "@/components/ui";
import { eur, money } from "@/lib/format";
import { getSubscriptions, mrrByOffer, getRevenueYTD, stripeConfigured } from "@/lib/stripe";
import { getManualRevenue, getTodos, getCampaigns, supabaseConfigured } from "@/lib/supabase";
import { getAnthropicCost, anthropicConfigured } from "@/lib/anthropic";
import Link from "next/link";

export const dynamic = "force-dynamic";

async function safe<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn();
  } catch {
    return fallback;
  }
}

export default async function Overview() {
  const year = new Date().getFullYear();

  const [subs, revenue, manual, todos, campaigns, cost] = await Promise.all([
    safe(getSubscriptions, []),
    safe(getRevenueYTD, { gross: 0, currency: "EUR" }),
    safe(() => getManualRevenue(year), []),
    safe(getTodos, []),
    safe(getCampaigns, []),
    safe(getAnthropicCost, { mtd: 0, ytd: 0, currency: "USD" }),
  ]);

  const mrr = mrrByOffer(subs).reduce((t, o) => t + o.mrr, 0);
  const activeSubs = subs.filter((s) => s.status === "active" || s.status === "trialing").length;
  const manualTotal = manual.reduce((t, m) => t + m.amount, 0);
  const caTotal = revenue.gross + manualTotal;
  const openTodos = todos.filter((t) => !t.done).length;
  const activeCampaigns = campaigns.filter((c) => c.status === "active").length;

  const missing: string[] = [];
  if (!stripeConfigured()) missing.push("Stripe");
  if (!supabaseConfigured()) missing.push("Supabase");
  if (!anthropicConfigured()) missing.push("Coûts API");

  return (
    <div>
      <PageHeader eyebrow="pilotage" title={`Vue d'ensemble · ${year}`} sub="État de tes abonnements, revenus et coûts en un coup d'œil." />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <StatCard label="MRR récurrent" value={eur(mrr)} hint={`${activeSubs} abonnement${activeSubs > 1 ? "s" : ""} actif${activeSubs > 1 ? "s" : ""}`} accent />
        <StatCard label={`CA ${year}`} value={eur(caTotal)} hint={`dont ${eur(manualTotal)} ponctuel`} />
        <StatCard label="Encaissé Stripe" value={eur(revenue.gross)} hint="depuis le 1er janvier" />
        <StatCard label="Coût API ce mois" value={cost.mtd ? money(cost.mtd, cost.currency) : "—"} hint={cost.ytd ? `${money(cost.ytd, cost.currency)} sur l'année` : "à configurer"} />
        <StatCard label="To-do ouvertes" value={String(openTodos)} hint={`${todos.length} au total`} />
        <StatCard label="Campagnes actives" value={String(activeCampaigns)} hint={`${campaigns.length} au total`} />
      </div>

      <div className="mt-6 grid gap-3 md:grid-cols-2">
        <Link href="/abonnements" className="card p-4 hover:border-faint transition-colors">
          <p className="eyebrow">// abonnements</p>
          <p className="mt-2 text-sm text-muted">Détail client par client, statut et prochaine échéance.</p>
        </Link>
        <Link href="/todos" className="card p-4 hover:border-faint transition-colors">
          <p className="eyebrow">// to-do</p>
          <p className="mt-2 text-sm text-muted">{openTodos} tâche{openTodos > 1 ? "s" : ""} en attente sur tes sites.</p>
        </Link>
      </div>

      {missing.length > 0 && (
        <p className="mt-6 font-mono text-[11px] text-faint">
          Modules en attente de configuration : {missing.join(", ")}.
        </p>
      )}
    </div>
  );
}
