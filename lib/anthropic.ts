import { startOfYear } from "./format";

export function anthropicConfigured(): boolean {
  return Boolean(process.env.ANTHROPIC_ADMIN_KEY);
}

function iso(d: Date): string {
  return d.toISOString().split(".")[0] + "Z";
}

async function fetchWindow(start: Date, end: Date): Promise<{ total: number; currency: string }> {
  const key = process.env.ANTHROPIC_ADMIN_KEY as string;
  let total = 0;
  let currency = "USD";
  let page: string | undefined;

  do {
    const url = new URL("https://api.anthropic.com/v1/organizations/cost_report");
    url.searchParams.set("starting_at", iso(start));
    url.searchParams.set("ending_at", iso(end));
    url.searchParams.set("bucket_width", "1d");
    url.searchParams.set("limit", "31");
    if (page) url.searchParams.set("page", page);

    const res = await fetch(url.toString(), {
      headers: { "x-api-key": key, "anthropic-version": "2023-06-01" },
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`Anthropic API ${res.status} : ${await res.text()}`);
    const json = (await res.json()) as any;

    for (const bucket of json.data ?? []) {
      for (const r of bucket.results ?? []) {
        const raw = r.amount ?? r.cost ?? 0;
        const val = typeof raw === "string" ? parseFloat(raw) : Number(raw);
        if (!isNaN(val)) total += val;
        if (r.currency) currency = r.currency;
      }
    }
    page = json.has_more ? json.next_page : undefined;
  } while (page);

  // amounts renvoyes en unites mineures (cents)
  return { total: total / 100, currency };
}

async function sumRange(start: Date, end: Date): Promise<{ total: number; currency: string }> {
  let cursor = new Date(start);
  let total = 0;
  let currency = "USD";
  while (cursor < end) {
    const next = new Date(Math.min(cursor.getTime() + 30 * 86400000, end.getTime()));
    const w = await fetchWindow(cursor, next);
    total += w.total;
    currency = w.currency;
    cursor = next;
  }
  return { total, currency };
}

export type AnthropicCost = { mtd: number; ytd: number; currency: string };

export async function getAnthropicCost(): Promise<AnthropicCost> {
  if (!anthropicConfigured()) return { mtd: 0, ytd: 0, currency: "USD" };
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const ytd = await sumRange(startOfYear(), now);
  const mtd = await sumRange(monthStart, now);
  return { mtd: mtd.total, ytd: ytd.total, currency: ytd.currency || mtd.currency };
}
