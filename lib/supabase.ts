import { createClient, SupabaseClient } from "@supabase/supabase-js";

export type Todo = {
  id: string;
  site_label: string | null;
  label: string;
  done: boolean;
  priority: "low" | "normal" | "high";
  created_at: string;
};

export type Campaign = {
  id: string;
  client_label: string | null;
  platform: "meta" | "google";
  name: string;
  start_date: string | null;
  daily_budget: number | null;
  status: "active" | "paused" | "ended";
  spend_to_date: number | null;
  roas: number | null;
  leads: number | null;
  updated_at: string;
  created_at: string;
};

export type Prospect = {
  id: string;
  name: string;
  company: string | null;
  email: string | null;
  phone: string | null;
  value: number | null;
  stage: string;
  position: number;
  note: string | null;
  created_at: string;
  updated_at: string;
};

export type ManualRevenue = {
  id: string;
  label: string;
  client_label: string | null;
  amount: number;
  date: string;
  created_at: string;
};

let _client: SupabaseClient | null = null;

export function supabaseConfigured(): boolean {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

export function supabase(): SupabaseClient {
  if (!supabaseConfigured()) throw new Error("Supabase non configuré");
  if (!_client) {
    _client = createClient(
      process.env.SUPABASE_URL as string,
      process.env.SUPABASE_SERVICE_ROLE_KEY as string,
      { auth: { persistSession: false } }
    );
  }
  return _client;
}

export async function getTodos(): Promise<Todo[]> {
  if (!supabaseConfigured()) return [];
  const { data, error } = await supabase()
    .from("todos")
    .select("*")
    .order("done", { ascending: true })
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as Todo[];
}

export async function getCampaigns(): Promise<Campaign[]> {
  if (!supabaseConfigured()) return [];
  const { data, error } = await supabase()
    .from("campaigns")
    .select("*")
    .order("status", { ascending: true })
    .order("start_date", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as Campaign[];
}

export async function getProspects(): Promise<Prospect[]> {
  if (!supabaseConfigured()) return [];
  const { data, error } = await supabase()
    .from("prospects")
    .select("*")
    .order("position", { ascending: true })
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as Prospect[];
}

export async function getManualRevenue(year: number): Promise<ManualRevenue[]> {
  if (!supabaseConfigured()) return [];
  const from = `${year}-01-01`;
  const to = `${year}-12-31`;
  const { data, error } = await supabase()
    .from("manual_revenue")
    .select("*")
    .gte("date", from)
    .lte("date", to)
    .order("date", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as ManualRevenue[];
}
