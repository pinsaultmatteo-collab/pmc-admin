import { PageHeader, ConfigNotice, EmptyState, DeployPill } from "@/components/ui";
import { getVercelProjects, vercelConfigured } from "@/lib/vercel";
import { relativeDays } from "@/lib/format";
import { ExternalLink } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function SitesPage() {
  if (!vercelConfigured()) {
    return (
      <div>
        <PageHeader eyebrow="sites clients" title="Sites clients" />
        <ConfigNotice what="Vercel" envVar="VERCEL_API_TOKEN" />
      </div>
    );
  }

  let projects;
  try {
    projects = await getVercelProjects();
  } catch (e) {
    return (
      <div>
        <PageHeader eyebrow="sites clients" title="Sites clients" />
        <div className="card border-danger/30 bg-danger/5 p-4 text-sm text-danger">
          Erreur Vercel : {(e as Error).message}
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader eyebrow="sites clients" title="Sites clients" sub={`${projects.length} projet${projects.length > 1 ? "s" : ""} Vercel · statut du dernier déploiement.`} />

      {projects.length === 0 ? (
        <EmptyState title="Aucun projet Vercel trouvé." hint="Vérifie le token, et VERCEL_TEAM_ID si tes projets sont sous une équipe." />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((p) => (
            <div key={p.id} className="card p-4">
              <div className="flex items-start justify-between gap-2">
                <p className="font-medium text-ink">{p.name}</p>
                <DeployPill state={p.state} />
              </div>
              {p.domain ? (
                <a
                  href={`https://${p.domain}`}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 inline-flex items-center gap-1 font-mono text-[12px] text-accent hover:underline"
                >
                  {p.domain} <ExternalLink size={12} />
                </a>
              ) : (
                <p className="mt-2 font-mono text-[12px] text-faint">domaine non défini</p>
              )}
              <p className="mt-3 text-xs text-muted">Dernier déploiement : {relativeDays(p.lastDeploy)}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
