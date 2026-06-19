import { PageHeader, StatCard, StatusPill, ConfigNotice, EmptyState } from "@/components/ui";
import { getSubscriptions, mrrByOffer, stripeConfigured } from "@/lib/stripe";
import { eur, shortDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AbonnementsPage() {
  if (!stripeConfigured()) {
    return (
      <div>
        <PageHeader eyebrow="abonnements" title="Abonnements clients" />
        <ConfigNotice what="Stripe" envVar="STRIPE_SECRET_KEY" />
      </div>
    );
  }

  let subs;
  try {
    subs = await getSubscriptions();
  } catch (e) {
    return (
      <div>
        <PageHeader eyebrow="abonnements" title="Abonnements clients" />
        <div className="card border-danger/30 bg-danger/5 p-4 text-sm text-danger">
          Erreur Stripe : {(e as Error).message}
        </div>
      </div>
    );
  }

  const offers = mrrByOffer(subs);
  const totalMrr = offers.reduce((t, o) => t + o.mrr, 0);

  return (
    <div>
      <PageHeader eyebrow="abonnements" title="Abonnements clients" sub="Données live depuis Stripe." />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="MRR total" value={eur(totalMrr)} accent />
        {offers.slice(0, 3).map((o) => (
          <StatCard key={o.offer} label={o.offer} value={eur(o.mrr)} hint={`${o.count} client${o.count > 1 ? "s" : ""}`} />
        ))}
      </div>

      <div className="card mt-6 overflow-hidden">
        {subs.length === 0 ? (
          <EmptyState title="Aucun abonnement trouvé." hint="Les abonnements créés dans Stripe apparaîtront ici." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left font-mono text-[11px] uppercase tracking-wider text-muted">
                  <th className="px-4 py-3 font-normal">Client</th>
                  <th className="px-4 py-3 font-normal">Offre</th>
                  <th className="px-4 py-3 font-normal text-right">Montant / mois</th>
                  <th className="px-4 py-3 font-normal">Statut</th>
                  <th className="px-4 py-3 font-normal">Prochaine échéance</th>
                </tr>
              </thead>
              <tbody>
                {subs.map((s) => (
                  <tr key={s.id} className="border-b border-border/60 last:border-0 hover:bg-surface-2/50">
                    <td className="px-4 py-3">
                      <p className="text-ink">{s.client}</p>
                      {s.email && <p className="font-mono text-[11px] text-faint">{s.email}</p>}
                    </td>
                    <td className="px-4 py-3 text-muted">{s.offer}</td>
                    <td className="px-4 py-3 text-right num text-ink">{eur(s.amount)}</td>
                    <td className="px-4 py-3"><StatusPill status={s.status} /></td>
                    <td className="px-4 py-3 num text-muted">{shortDate(s.currentPeriodEnd * 1000)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
