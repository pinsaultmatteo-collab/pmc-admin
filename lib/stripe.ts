import Stripe from "stripe";
import { startOfYear } from "./format";

export type SubRow = {
  id: string;
  client: string;
  email: string | null;
  offer: string;
  amount: number; // par mois, en euros
  currency: string;
  interval: string;
  status: Stripe.Subscription.Status;
  currentPeriodEnd: number; // timestamp (s)
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

function monthlyAmount(price: Stripe.Price | null): number {
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

  // Stripe limite l'expand a 4 niveaux : on va jusqu'a data.items.data.price
  // (le produit reste un ID), puis on recupere les noms de produits a part.
  type Raw = { sub: Stripe.Subscription; price: Stripe.Price | null; productId: string | null };
  const raw: Raw[] = [];
  const productNames = new Map<string, string>();
  const toFetch = new Set<string>();

  const subs = stripe().subscriptions.list({
    status: "all",
    limit: 100,
    expand: ["data.customer", "data.items.data.price"],
  });

  for await (const sub of subs) {
    const item = sub.items.data[0];
    const price = item?.price ?? null;
    const product = price?.product;
    let productId: string | null = null;
    if (typeof product === "string") {
      productId = product;
      toFetch.add(product);
    } else if (product && !("deleted" in product && product.deleted)) {
      const p = product as Stripe.Product;
      productId = p.id;
      if (p.name) productNames.set(p.id, p.name);
    }
    raw.push({ sub, price, productId });
  }

  // recupere les noms des produits manquants (quelques-uns au plus)
  await Promise.all(
    [...toFetch].map(async (id) => {
      if (productNames.has(id)) return;
      try {
        const p = await stripe().products.retrieve(id);
        if (!("deleted" in p && p.deleted) && p.name) productNames.set(id, p.name);
      } catch {
        /* ignore : on retombera sur un libelle par defaut */
      }
    })
  );

  const rows: SubRow[] = raw.map(({ sub, price, productId }) => {
    const offer = (productId && productNames.get(productId)) || price?.nickname || "Abonnement";
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
      amount: monthlyAmount(price),
      currency: (price?.currency ?? "eur").toUpperCase(),
      interval: price?.recurring?.interval ?? "—",
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

// CA encaisse depuis le 1er janvier (charges reussies, net des remboursements)
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
