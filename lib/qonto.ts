// Wrapper API Qonto (Business API v2). Auth par clé API : QONTO_LOGIN:QONTO_SECRET_KEY.
const BASE = "https://thirdparty.qonto.com/v2";

export type DocRow = {
  id: string;
  source: "qonto" | "stripe";
  kind: "invoice" | "quote";
  number: string;
  client: string;
  amount: number;
  currency: string;
  status: string;
  date: string | null;
  url: string | null;
};

export function qontoConfigured(): boolean {
  return Boolean(process.env.QONTO_LOGIN && process.env.QONTO_SECRET_KEY);
}

function authHeader(): string {
  return `${process.env.QONTO_LOGIN}:${process.env.QONTO_SECRET_KEY}`;
}

async function qontoGet(path: string, key: string): Promise<any[]> {
  const out: any[] = [];
  let page = 1;
  // pagination : on suit meta.total_pages, plafond de securite a 10 pages
  for (let i = 0; i < 10; i++) {
    const url = `${BASE}/${path}${path.includes("?") ? "&" : "?"}page=${page}&per_page=100`;
    const res = await fetch(url, {
      headers: { Authorization: authHeader(), "Content-Type": "application/json" },
      cache: "no-store",
    });
    if (res.status === 422) break; // au-dela de la derniere page
    if (!res.ok) throw new Error(`Qonto API ${res.status} : ${await res.text()}`);
    const json = (await res.json()) as any;
    const items = json[key] ?? [];
    out.push(...items);
    const totalPages = json.meta?.total_pages ?? 1;
    if (page >= totalPages) break;
    page += 1;
  }
  return out;
}

function amountOf(obj: any): { amount: number; currency: string } {
  const ta = obj?.total_amount;
  if (ta && ta.value != null) return { amount: parseFloat(ta.value), currency: (ta.currency ?? "EUR").toUpperCase() };
  if (obj?.total_amount_cents != null) return { amount: obj.total_amount_cents / 100, currency: (obj?.currency ?? "EUR").toUpperCase() };
  return { amount: 0, currency: "EUR" };
}

export async function getQontoInvoices(): Promise<DocRow[]> {
  if (!qontoConfigured()) return [];
  const rows = await qontoGet("client_invoices", "client_invoices");
  return rows.map((inv: any): DocRow => {
    const { amount, currency } = amountOf(inv);
    return {
      id: inv.id,
      source: "qonto",
      kind: "invoice",
      number: inv.number ?? inv.id,
      client: inv.client?.name ?? inv.contact_email ?? "—",
      amount,
      currency,
      status: inv.status ?? "—",
      date: inv.issue_date ?? inv.created_at ?? null,
      url: inv.invoice_url ?? null,
    };
  });
}

export async function getQontoQuotes(): Promise<DocRow[]> {
  if (!qontoConfigured()) return [];
  const rows = await qontoGet("quotes", "quotes");
  return rows.map((q: any): DocRow => {
    const { amount, currency } = amountOf(q);
    return {
      id: q.id,
      source: "qonto",
      kind: "quote",
      number: q.number ?? q.quote_number ?? q.id,
      client: q.client?.name ?? q.contact_email ?? "—",
      amount,
      currency,
      status: q.status ?? "—",
      date: q.issue_date ?? q.created_at ?? null,
      url: q.quote_url ?? q.invoice_url ?? q.pdf_url ?? null,
    };
  });
}
