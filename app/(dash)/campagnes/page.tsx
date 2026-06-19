import { PageHeader, ConfigNotice, EmptyState } from "@/components/ui";
import { getCampaigns, supabaseConfigured, Campaign } from "@/lib/supabase";
import { upsertCampaign, deleteCampaign } from "@/app/actions";
import { eur, shortDate, relativeDays } from "@/lib/format";
import { Plus } from "lucide-react";

export const dynamic = "force-dynamic";

const STATUS_CLS: Record<string, string> = {
  active: "bg-ok/15 text-ok",
  paused: "bg-warn/15 text-warn",
  ended: "bg-faint/15 text-faint",
};
const STATUS_LABEL: Record<string, string> = { active: "active", paused: "en pause", ended: "terminée" };

export default async function CampagnesPage() {
  if (!supabaseConfigured()) {
    return (
      <div>
        <PageHeader eyebrow="campagnes pub" title="Suivi des campagnes" />
        <ConfigNotice what="Supabase" envVar="SUPABASE_SERVICE_ROLE_KEY" />
      </div>
    );
  }

  const campaigns = await getCampaigns().catch(() => []);
  const active = campaigns.filter((c) => c.status === "active");
  const totalDaily = active.reduce((t, c) => t + (c.daily_budget ?? 0), 0);

  return (
    <div>
      <PageHeader eyebrow="campagnes pub" title="Suivi des campagnes" sub={`Saisie manuelle · ${active.length} active${active.length > 1 ? "s" : ""}, ${eur(totalDaily)}/jour de budget cumulé.`} />

      <details className="card mb-6">
        <summary className="flex cursor-pointer items-center gap-2 px-4 py-3 text-sm font-medium text-ink">
          <Plus size={15} className="text-accent" /> Nouvelle campagne
        </summary>
        <div className="border-t border-border p-4">
          <CampaignFields />
          <div className="mt-3">
            <button form="add-campaign" type="submit" className="btn-primary">Ajouter la campagne</button>
          </div>
        </div>
      </details>

      {campaigns.length === 0 ? (
        <EmptyState title="Aucune campagne enregistrée." hint="Ajoute tes campagnes Meta et Google Ads en cours." />
      ) : (
        <div className="space-y-3">
          {campaigns.map((c) => (
            <form key={c.id} action={upsertCampaign} className="card p-4">
              <input type="hidden" name="id" value={c.id} />
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className={`rounded px-1.5 py-0.5 font-mono text-[10px] uppercase ${c.platform === "meta" ? "bg-accent/15 text-accent" : "bg-accent-2/20 text-accent-2"}`}>
                    {c.platform}
                  </span>
                  <span className={`rounded-full px-2 py-0.5 font-mono text-[11px] ${STATUS_CLS[c.status]}`}>{STATUS_LABEL[c.status]}</span>
                  <span className="font-mono text-[11px] text-faint">maj {relativeDays(c.updated_at)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button type="submit" className="btn-ghost text-xs">Enregistrer</button>
                  <button type="submit" formAction={deleteCampaign.bind(null, c.id)} className="btn-ghost text-xs text-faint hover:!text-danger">Supprimer</button>
                </div>
              </div>
              <CampaignFields c={c} />
            </form>
          ))}
        </div>
      )}
    </div>
  );
}

function CampaignFields({ c }: { c?: Campaign }) {
  const formId = c ? undefined : "add-campaign";
  // pour le formulaire d'ajout, on enveloppe les champs dans un <form> dédié
  const fields = (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      <label className="col-span-2 text-xs text-muted">
        Nom de la campagne
        <input name="name" defaultValue={c?.name ?? ""} className="field mt-1" placeholder="Campagne Meta — Orbite TLS" required />
      </label>
      <label className="text-xs text-muted">
        Client
        <input name="client_label" defaultValue={c?.client_label ?? ""} className="field mt-1" placeholder="Client" />
      </label>
      <label className="text-xs text-muted">
        Plateforme
        <select name="platform" defaultValue={c?.platform ?? "meta"} className="field mt-1">
          <option value="meta">Meta Ads</option>
          <option value="google">Google Ads</option>
        </select>
      </label>
      <label className="text-xs text-muted">
        Date de début
        <input name="start_date" type="date" defaultValue={c?.start_date ?? ""} className="field mt-1" />
      </label>
      <label className="text-xs text-muted">
        Budget / jour (€)
        <input name="daily_budget" type="text" inputMode="decimal" defaultValue={c?.daily_budget ?? ""} className="field mt-1" placeholder="20" />
      </label>
      <label className="text-xs text-muted">
        Statut
        <select name="status" defaultValue={c?.status ?? "active"} className="field mt-1">
          <option value="active">Active</option>
          <option value="paused">En pause</option>
          <option value="ended">Terminée</option>
        </select>
      </label>
      <label className="text-xs text-muted">
        Dépense à date (€)
        <input name="spend_to_date" type="text" inputMode="decimal" defaultValue={c?.spend_to_date ?? ""} className="field mt-1" placeholder="optionnel" />
      </label>
      <label className="text-xs text-muted">
        ROAS
        <input name="roas" type="text" inputMode="decimal" defaultValue={c?.roas ?? ""} className="field mt-1" placeholder="optionnel" />
      </label>
      <label className="text-xs text-muted">
        Leads / résultats
        <input name="leads" type="text" inputMode="numeric" defaultValue={c?.leads ?? ""} className="field mt-1" placeholder="optionnel" />
      </label>
    </div>
  );

  if (formId) {
    return (
      <form id={formId} action={upsertCampaign}>
        {fields}
      </form>
    );
  }
  return fields;
}
