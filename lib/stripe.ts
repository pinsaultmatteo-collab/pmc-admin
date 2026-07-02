import Stripe from "stripe";
import { startOfYear } from "./format";
import type { DocRow } from "./qonto";

// ---------------------------------------------------------------------------
// Date de reprise de l'agence : on n'affiche que les abonnements créés à
// partir de cette date (les abonnements antérieurs = ancien propriétaire).
// Pour changer la date, modifie UNIQUEMENT la ligne ci-dessous (format AAAA-MM-JJ).
const AGENCY_TAKEOVER = new Date("2026-07-20T00:00:00Z");
// ---------------------------------------------------------------------------

export type SubRow = {
  id: string;
  client: string;
  email: string | null;
  offer: string;
  amount: number; // par mois, en euros (toutes lignes x quantité)
  currency: string;
  interval: string;
  status: Stripe.Subscription.Status;
  currentPeriodEnd: number; // timestamp (s) = date de renouvellement
};

export type OfferMrr = { offer: string; count: number; mrr: number };

let _stripe: Stripe | null = null;

export function stripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

function stripe(): Stripe {
  if (!stripeConfigured()) throw new Error("Stripe non configuré");
  if (!_stripe) _stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);
  return _stripe;
}

// montant mensuel d'une ligne (hors quantité)
function monthlyUnit(price: Stripe.Price | null): number {
  if (!price || price.unit_amount == null) return 0;
  const base = price.unit_amount / 100;
  const interval = price.recurring?.interval;
  const count = price.recurring?.interval_count ?? 1;
  if (interval === "year") return base / (12 * count);
  if (interval === "week") return (base * 52) / (12 * count);
  if (interval === "day") return (base * 365) / (12 * count);
  return base / count; // month
}

export async function getSubscriptions(): Promise<SubRow[]> {
  if (!stripeConfigured()) return [];

  const cutoff = Math.floor(AGENCY_TAKEOVER.getTime() / 1000);

  // Stripe limite l'expand à 4 niveaux : on va jusqu'à data.items.data.price
  // (le produit reste un ID), puis on récupère les noms de produits à part.
  type Raw = {
    sub: Stripe.Subscription;
    amount: number;
    currency: string;
    interval: string;
    productIds: string[];
  };
  const raw: Raw[] = [];
  const productNames = new Map<string, string>();
  const toFetch = new Set<string>();

  const subs = stripe().subscriptions.list({
    status: "all",
    limit: 100,
    expand: ["data.customer", "data.items.data.price"],
  });

  for await (const sub of subs) {
    // filtre : on ignore les abonnements antérieurs à la reprise
    if (sub.created < cutoff) continue;

    let amount = 0;
    let currency = "eur";
    let interval = "—";
    const productIds: string[] = [];

    for (const item of sub.items.data) {
      const price = item.price ?? null;
      const qty = item.quantity ?? 1;
      amount += monthlyUnit(price) * qty;
      if (price?.currency) currency = price.currency;
      if (price?.recurring?.interval) interval = price.recurring.interval;
      const product = price?.product;
      if (typeof product === "string") {
        productIds.push(product);
        toFetch.add(product);
      } else if (product && !("deleted" in product && product.deleted)) {
        const p = product as Stripe.Product;
        productIds.push(p.id);
        if (p.name) productNames.set(p.id, p.name);
      }
    }

    raw.push({ sub, amount, currency: currency.toUpperCase(), interval, productIds });
  }

  // récupère les noms des produits manquants (quelques-uns au plus)
  await Promise.all(
    [...toFetch].map(async (id) => {
      if (productNames.has(id)) return;
      try {
        const p = await stripe().products.retrieve(id);
        if (!("deleted" in p && p.deleted) && p.name) productNames.set(id, p.name);
      } catch {
        /* on retombera sur un libellé par défaut */
      }
    })
  );

  const rows: SubRow[] = raw.map(({ sub, amount, currency, interval, productIds }) => {
    const names = [...new Set(productIds.map((id) => productNames.get(id)).filter(Boolean))] as string[];
    const offer = names.length ? names.join(" + ") : "Abonnement";

    const customer = sub.customer;
    let client = "Client inconnu";
    let email: string | null = null;
    if (customer && typeof customer !== "string" && !("deleted" in customer && customer.deleted)) {
      const c = customer as Stripe.Customer;
      client = c.name || c.email || c.id;
      email = c.email ?? null;
    }

    return {
      id: sub.id,
      client,
      email,
      offer,
      amount,
      currency,
      interval,
      status: sub.status,
      currentPeriodEnd: sub.current_period_end,
    };
  });

  const rank: Record<string, number> = { active: 0, trialing: 1, past_due: 2, unpaid: 3, paused: 4, canceled: 5, incomplete: 6, incomplete_expired: 7 };
  rows.sort((a, b) => (rank[a.status] ?? 9) - (rank[b.status] ?? 9) || a.currentPeriodEnd - b.currentPeriodEnd);
  return rows;
}

export function mrrByOffer(subs: SubRow[]): OfferMrr[] {
  const live = subs.filter((s) => s.status === "active" || s.status === "trialing");
  const map = new Map<string, OfferMrr>();
  for (const s of live) {
    const cur = map.get(s.offer) ?? { offer: s.offer, count: 0, mrr: 0 };
    cur.count += 1;
    cur.mrr += s.amount;
    map.set(s.offer, cur);
  }
  return [...map.values()].sort((a, b) => b.mrr - a.mrr);
}

// CA encaissé depuis le 1er janvier (charges réussies, net des remboursements)
export async function getRevenueYTD(): Promise<{ gross: number; currency: string }> {
  if (!stripeConfigured()) return { gross: 0, currency: "EUR" };
  const since = Math.floor(startOfYear().getTime() / 1000);
  let gross = 0;
  let currency = "eur";
  const charges = stripe().charges.list({ created: { gte: since }, limit: 100 });
  for await (const ch of charges) {
    if (ch.paid && ch.status === "succeeded") {
      currency = ch.currency || currency;
      gross += (ch.amount - (ch.amount_refunded ?? 0)) / 100;
    }
  }
  return { gross, currency: currency.toUpperCase() };
}

// Factures Stripe (les 100 plus recentes), normalisees au format DocRow
export async function getStripeInvoices(): Promise<DocRow[]> {
  if (!stripeConfigured()) return [];
  const rows: DocRow[] = [];
  const invoices = stripe().invoices.list({ limit: 100, expand: ["data.customer"] });
  for await (const inv of invoices) {
    let client = "—";
    const c = inv.customer;
    if (c && typeof c !== "string" && !("deleted" in c && c.deleted)) {
      const cust = c as Stripe.Customer;
      client = cust.name || cust.email || cust.id;
    } else {
      client = inv.customer_name || inv.customer_email || "—";
    }
    rows.push({
      id: inv.id,
      source: "stripe",
      kind: "invoice",
      number: inv.number ?? inv.id,
      client,
      amount: (inv.total ?? 0) / 100,
      currency: (inv.currency ?? "eur").toUpperCase(),
      status: inv.status ?? "—",
      date: inv.created ? new Date(inv.created * 1000).toISOString() : null,
      url: inv.hosted_invoice_url ?? null,
    });
  }
  return rows;
}
