"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { COOKIE_NAME, createSessionToken } from "@/lib/auth";
import { supabase, supabaseConfigured } from "@/lib/supabase";

// ---- Auth ----
export async function login(_prev: string | null, formData: FormData): Promise<string | null> {
  const password = String(formData.get("password") ?? "");
  if (!process.env.ADMIN_PASSWORD) return "ADMIN_PASSWORD n'est pas configuré côté serveur.";
  if (password !== process.env.ADMIN_PASSWORD) return "Mot de passe incorrect.";
  const token = await createSessionToken();
  cookies().set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  redirect("/");
}

export async function logout() {
  cookies().delete(COOKIE_NAME);
  redirect("/login");
}

function db() {
  if (!supabaseConfigured()) throw new Error("Supabase non configuré");
  return supabase();
}

// ---- To-do ----
export async function addTodo(formData: FormData) {
  const label = String(formData.get("label") ?? "").trim();
  if (!label) return;
  const site_label = String(formData.get("site_label") ?? "").trim() || null;
  const priority = String(formData.get("priority") ?? "normal");
  await db().from("todos").insert({ label, site_label, priority });
  revalidatePath("/todos");
  revalidatePath("/");
}

export async function toggleTodo(id: string, done: boolean) {
  await db().from("todos").update({ done }).eq("id", id);
  revalidatePath("/todos");
  revalidatePath("/");
}

export async function deleteTodo(id: string) {
  await db().from("todos").delete().eq("id", id);
  revalidatePath("/todos");
  revalidatePath("/");
}

// ---- Campagnes ----
export async function upsertCampaign(formData: FormData) {
  const id = String(formData.get("id") ?? "").trim();
  const payload = {
    name: String(formData.get("name") ?? "").trim(),
    client_label: String(formData.get("client_label") ?? "").trim() || null,
    platform: String(formData.get("platform") ?? "meta"),
    start_date: String(formData.get("start_date") ?? "") || null,
    daily_budget: numOrNull(formData.get("daily_budget")),
    status: String(formData.get("status") ?? "active"),
    spend_to_date: numOrNull(formData.get("spend_to_date")),
    roas: numOrNull(formData.get("roas")),
    leads: intOrNull(formData.get("leads")),
    updated_at: new Date().toISOString(),
  };
  if (!payload.name) return;
  if (id) await db().from("campaigns").update(payload).eq("id", id);
  else await db().from("campaigns").insert(payload);
  revalidatePath("/campagnes");
  revalidatePath("/");
}

export async function deleteCampaign(id: string) {
  await db().from("campaigns").delete().eq("id", id);
  revalidatePath("/campagnes");
  revalidatePath("/");
}

// ---- CRM / Prospects ----
export async function addProspect(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;
  await db().from("prospects").insert({
    name,
    company: String(formData.get("company") ?? "").trim() || null,
    email: String(formData.get("email") ?? "").trim() || null,
    phone: String(formData.get("phone") ?? "").trim() || null,
    value: numOrNull(formData.get("value")),
    stage: String(formData.get("stage") ?? "nouveau"),
  });
  revalidatePath("/crm");
  revalidatePath("/");
}

export async function updateProspectStage(id: string, stage: string) {
  await db().from("prospects").update({ stage, updated_at: new Date().toISOString() }).eq("id", id);
  revalidatePath("/crm");
  revalidatePath("/");
}

export async function updateProspect(formData: FormData) {
  const id = String(formData.get("id") ?? "").trim();
  if (!id) return;
  await db()
    .from("prospects")
    .update({
      name: String(formData.get("name") ?? "").trim(),
      company: String(formData.get("company") ?? "").trim() || null,
      email: String(formData.get("email") ?? "").trim() || null,
      phone: String(formData.get("phone") ?? "").trim() || null,
      value: numOrNull(formData.get("value")),
      note: String(formData.get("note") ?? "").trim() || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
  revalidatePath("/crm");
}

export async function deleteProspect(id: string) {
  await db().from("prospects").delete().eq("id", id);
  revalidatePath("/crm");
  revalidatePath("/");
}

// ---- Factu ponctuelle ----
export async function addManualRevenue(formData: FormData) {
  const label = String(formData.get("label") ?? "").trim();
  const amount = numOrNull(formData.get("amount"));
  const date = String(formData.get("date") ?? "");
  if (!label || amount == null || !date) return;
  await db().from("manual_revenue").insert({
    label,
    amount,
    date,
    client_label: String(formData.get("client_label") ?? "").trim() || null,
  });
  revalidatePath("/ca");
  revalidatePath("/");
}

export async function deleteManualRevenue(id: string) {
  await db().from("manual_revenue").delete().eq("id", id);
  revalidatePath("/ca");
  revalidatePath("/");
}

function numOrNull(v: FormDataEntryValue | null): number | null {
  const s = String(v ?? "").replace(",", ".").trim();
  if (!s) return null;
  const n = parseFloat(s);
  return isNaN(n) ? null : n;
}
function intOrNull(v: FormDataEntryValue | null): number | null {
  const n = numOrNull(v);
  return n == null ? null : Math.round(n);
}
