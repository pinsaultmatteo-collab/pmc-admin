import { PageHeader, ConfigNotice, EmptyState } from "@/components/ui";
import { getQontoInvoices, getQontoQuotes, qontoConfigured, DocRow } from "@/lib/qonto";
import { getStripeInvoices, stripeConfigured } from "@/lib/stripe";
import { money, shortDate } from "@/lib/format";

export const dynamic = "force-dynamic";

async function safe<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn();
  } catch {
    return fallback;
  }
}

const STATUS_CLS: Record<string, string> = {
  paid: "bg-ok/15 text-ok",
  unpaid: "bg-warn/15 text-warn",
  open: "bg-warn/15 text-warn",
  pending: "bg-warn/15 text-warn",
  draft: "bg-faint/15 text-faint",
  void: "bg-faint/15 text-faint",
  canceled: "bg-faint/15 text-faint",
  approved: "bg-ok/15 text-ok",
  accepted: "bg-ok/15 text-ok",
  declined: "bg-danger/15 text-danger",
};

function StatusBadge({ status }: { status: string }) {
  const cls = STATUS_CLS[status?.toLowerCase()] ?? "bg-faint/15 text-faint";
  return <span className={`inline-flex rounded-full px-2 py-0.5 font-mono text-[11px] ${cls}`}>{status}</span>;
}

function SourceBadge({ source }: { source: "qonto" | "stripe" }) {
  return (
    <span
      className={`inline-flex rounded px-1.5 py-0.5 font-mono text-[10px] uppercase ${
        source === "qonto" ? "bg-accent/15 text-accent" : "bg-accent-2/20 text-accent-2"
      }`}
    >
      {source}
    </span>
  );
}

function DocTable({ rows, showSource }: { rows: DocRow[]; showSource?: boolean }) {
  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left font-mono text-[11px] uppercase tracking-wider text-muted">
              <th className="px-4 py-3 font-normal">Numéro</th>
              <th className="px-4 py-3 font-normal">Client</th>
              {showSource && <th className="px-4 py-3 font-normal">Source</th>}
              <th className="px-4 py-3 font-normal">Date</th>
              <th className="px-4 py-3 font-normal">Statut</th>
              <th className="px-4 py-3 font-normal text-right">Montant</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((d) => (
              <tr key={`${d.source}-${d.id}`} className="border-b border-border/60 last:border-0 hover:bg-surface-2/50">
                <td className="px-4 py-3">
                  {d.url ? (
                    <a href={d.url} target="_blank" rel="noreferrer" className="font-mono text-[13px] text-accent hover:underline">
                      {d.number}
                    </a>
                  ) : (
                    <span className="font-mono text-[13px] text-ink">{d.number}</span>
                  )}
                </td>
                <td className="px-4 py-3 text-muted">{d.client}</td>
                {showSource && (
                  <td className="px-4 py-3">
                    <SourceBadge source={d.source} />
                  </td>
                )}
                <td className="px-4 py-3 num text-muted">{shortDate(d.date)}</td>
                <td className="px-4 py-3">
                  <StatusBadge status={d.status} />
                </td>
                <td className="px-4 py-3 text-right num text-ink">{money(d.amount, d.currency)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default async function FacturationPage() {
  const [quotes, qontoInvoices, stripeInvoices] = await Promise.all([
    safe(getQontoQuotes, []),
    safe(getQontoInvoices, []),
    safe(getStripeInvoices, []),
  ]);

  const invoices = [...qontoInvoices, ...stripeInvoices].sort((a, b) => {
    const da = a.date ? new Date(a.date).getTime() : 0;
    const db = b.date ? new Date(b.date).getTime() : 0;
    return db - da;
  });

  return (
    <div>
      <PageHeader eyebrow="devis & factures" title="Devis & Factures" sub="Devis depuis Qonto · factures Qonto + Stripe réunies." />

      {!qontoConfigured() && (
        <div className="mb-6">
          <ConfigNotice
            what="Qonto"
            envVar="QONTO_LOGIN / QONTO_SECRET_KEY"
            href="https://docs.qonto.com/api-reference/business-api/authentication"
          />
        </div>
      )}

      <section className="mb-8">
        <p className="eyebrow mb-3">// devis (Qonto)</p>
        {!qontoConfigured() ? (
          <EmptyState title="Qonto non connecté." hint="Ajoute tes identifiants Qonto pour voir tes devis." />
        ) : quotes.length === 0 ? (
          <EmptyState title="Aucun devis trouvé sur Qonto." />
        ) : (
          <DocTable rows={quotes} />
        )}
      </section>

      <section>
        <p className="eyebrow mb-3">// factures (Qonto + Stripe)</p>
        {invoices.length === 0 ? (
          <EmptyState title="Aucune facture trouvée." hint="Les factures Qonto et Stripe apparaîtront ici." />
        ) : (
          <DocTable rows={invoices} showSource />
        )}
      </section>
    </div>
  );
}
