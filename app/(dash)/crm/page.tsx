import { PageHeader, ConfigNotice } from "@/components/ui";
import { getProspects, supabaseConfigured } from "@/lib/supabase";
import CrmBoard from "@/components/CrmBoard";

export const dynamic = "force-dynamic";

export default async function CrmPage() {
  if (!supabaseConfigured()) {
    return (
      <div>
        <PageHeader eyebrow="crm" title="Pipeline commercial" />
        <ConfigNotice what="Supabase" envVar="SUPABASE_SERVICE_ROLE_KEY" />
      </div>
    );
  }

  const prospects = await getProspects().catch(() => []);
  const totalPipeline = prospects
    .filter((p) => p.stage !== "perdu" && p.stage !== "gagne")
    .reduce((t, p) => t + (p.value ?? 0), 0);

  return (
    <div>
      <PageHeader
        eyebrow="crm"
        title="Pipeline commercial"
        sub={`${prospects.length} prospect${prospects.length > 1 ? "s" : ""} · ${totalPipeline > 0 ? `${new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(totalPipeline)} en cours` : "glisse tes prospects de colonne en colonne"}`}
      />
      <CrmBoard initial={prospects} />
    </div>
  );
}
