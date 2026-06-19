import { PageHeader, StatCard, ConfigNotice, EmptyState } from "@/components/ui";
import { getRevenueYTD, getSubscriptions, mrrByOffer, stripeConfigured } from "@/lib/stripe";
import { getManualRevenue, supabaseConfigured } from "@/lib/supabase";
import { addManualRevenue, deleteManualRevenue } from "@/app/actions";
import { eur, shortDate } from "@/lib/format";
import { Plus, Trash2 } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function CaPage() {
  const year = new Date().getFullYear();

  let revenue = { gross: 0, currency: "EUR" };
  let offers: { offer: string; count: number; mrr: number }[] = [];
  if (stripeConfigured()) {
    try {
      revenue = await getRevenueYTD();
      offers = mrrByOffer(await getSubscriptions());
    } catch {
      /* affiché plus bas */
    }
  }

  const manual = supabaseConfigured() ? await getManualRevenue(year).catch(() => []) : [];
  const manualTotal = manual.reduce((t, m) => t + m.amount, 0);
  const caTotal = revenue.gross + manualTotal;

  return (
    <div>
      <PageHeader eyebrow={`année ${year}`} title="Chiffre d'affaires" sub="Encaissé via Stripe + facturation ponctuelle saisie à la main." />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard label={`CA total ${year}`} value={eur(caTotal)} accent />
        <StatCard label="Encaissé Stripe" value={eur(revenue.gross)} hint="charges réussies depuis le 1er janvier" />
        <StatCard label="Factu ponctuelle" value={eur(manualTotal)} hint={`${manual.length} entrée${manual.length > 1 ? "s" : ""}`} />
      </div>

      {!stripeConfigured() && (
        <div className="mt-6">
          <ConfigNotice what="Stripe" envVar="STRIPE_SECRET_KEY" />
        </div>
      )}

      {offers.length > 0 && (
        <section className="mt-8">
          <p className="eyebrow mb-3">// MRR récurrent par offre</p>
          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <tbody>
                {offers.map((o) => (
                  <tr key={o.offer} className="border-b border-border/60 last:border-0">
                    <td className="px-4 py-3 text-ink">{o.offer}</td>
                    <td className="px-4 py-3 text-muted">{o.count} client{o.count > 1 ? "s" : ""}</td>
                    <td className="px-4 py-3 text-right num text-ink">{eur(o.mrr)} <span className="text-faint">/ mois</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <section className="mt-8">
        <p className="eyebrow mb-3">// facturation ponctuelle (hors Stripe)</p>

        {!supabaseConfigured() ? (
          <ConfigNotice what="Supabase" envVar="SUPABASE_SERVICE_ROLE_KEY" />
        ) : (
          <>
            <form action={addManualRevenue} className="card mb-3 grid grid-cols-1 gap-2 p-3 sm:grid-cols-[1.4fr_1fr_0.8fr_0.9fr_auto]">
              <input name="label" placeholder="Prestation (ex : création site Dupont)" className="field" required />
              <input name="client_label" placeholder="Client" className="field" />
              <input name="amount" type="text" inputMode="decimal" placeholder="Montant €" className="field" required />
              <input name="date" type="date" className="field" required defaultValue={new Date().toISOString().slice(0, 10)} />
              <button type="submit" className="btn-primary"><Plus size={15} /> Ajouter</button>
            </form>

            {manual.length === 0 ? (
              <EmptyState title="Aucune facturation ponctuelle pour l'instant." hint="Ajoute ici les prestations facturées hors Stripe (virement, etc.)." />
            ) : (
              <div className="card overflow-hidden">
                <table className="w-full text-sm">
                  <tbody>
                    {manual.map((m) => (
                      <tr key={m.id} className="border-b border-border/60 last:border-0 hover:bg-surface-2/50">
                        <td className="px-4 py-3 text-ink">{m.label}</td>
                        <td className="px-4 py-3 text-muted">{m.client_label ?? "—"}</td>
                        <td className="px-4 py-3 num text-muted">{shortDate(m.date)}</td>
                        <td className="px-4 py-3 text-right num text-ink">{eur(m.amount)}</td>
                        <td className="px-2 py-3 text-right">
                          <form action={deleteManualRevenue.bind(null, m.id)}>
                            <button className="text-faint hover:text-danger transition-colors" aria-label="Supprimer">
                              <Trash2 size={15} />
                            </button>
                          </form>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}
