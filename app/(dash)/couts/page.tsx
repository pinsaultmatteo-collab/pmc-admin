import { PageHeader, StatCard, ConfigNotice } from "@/components/ui";
import { getAnthropicCost, anthropicConfigured } from "@/lib/anthropic";
import { money } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function CoutsPage() {
  if (!anthropicConfigured()) {
    return (
      <div>
        <PageHeader eyebrow="coûts api" title="Coûts API Anthropic" />
        <ConfigNotice
          what="L'API de coûts Anthropic"
          envVar="ANTHROPIC_ADMIN_KEY"
          href="https://platform.claude.com/docs/en/build-with-claude/usage-cost-api"
        />
        <p className="mt-4 text-sm text-muted">
          Clé Admin à générer dans la console Claude (commence par <code className="font-mono text-accent">sk-ant-admin…</code>),
          accessible aux membres ayant le rôle admin de l'organisation.
        </p>
      </div>
    );
  }

  let cost;
  try {
    cost = await getAnthropicCost();
  } catch (e) {
    return (
      <div>
        <PageHeader eyebrow="coûts api" title="Coûts API Anthropic" />
        <div className="card border-danger/30 bg-danger/5 p-4 text-sm text-danger">
          Erreur API Anthropic : {(e as Error).message}
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader eyebrow="coûts api" title="Coûts API Anthropic" sub="Dépense de rédaction d'articles. Vue globale (non ventilée par client)." />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <StatCard label="Ce mois-ci" value={money(cost.mtd, cost.currency)} accent />
        <StatCard label="Depuis le 1er janvier" value={money(cost.ytd, cost.currency)} />
      </div>

      <p className="mt-6 max-w-2xl text-sm text-muted">
        Ce montant couvre l'ensemble de ta consommation API Anthropic. Pour le ventiler par site client, il faudrait
        une clé ou un workspace dédié par client — sinon c'est un total agrégé, suffisant pour suivre ce que te coûtent
        tes sites à maintenir. Les données peuvent avoir quelques heures de décalage côté Anthropic.
      </p>
    </div>
  );
}
