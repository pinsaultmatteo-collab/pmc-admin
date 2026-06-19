export type VercelProject = {
  id: string;
  name: string;
  domain: string | null;
  state: string | null; // READY / ERROR / BUILDING / QUEUED ...
  lastDeploy: number | null;
};

export function vercelConfigured(): boolean {
  return Boolean(process.env.VERCEL_API_TOKEN);
}

export async function getVercelProjects(): Promise<VercelProject[]> {
  if (!vercelConfigured()) return [];
  const team = process.env.VERCEL_TEAM_ID;
  const url = new URL("https://api.vercel.com/v9/projects");
  url.searchParams.set("limit", "100");
  if (team) url.searchParams.set("teamId", team);

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${process.env.VERCEL_API_TOKEN}` },
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`Vercel API ${res.status} : ${await res.text()}`);
  }
  const json = (await res.json()) as { projects?: any[] };
  const projects = json.projects ?? [];
  return projects.map((p: any): VercelProject => {
    const latest = Array.isArray(p.latestDeployments) && p.latestDeployments.length ? p.latestDeployments[0] : null;
    const prodAlias: string | null =
      latest?.alias?.find?.((a: string) => !a.endsWith(".vercel.app")) ??
      latest?.alias?.[0] ??
      p.targets?.production?.alias?.[0] ??
      null;
    return {
      id: p.id,
      name: p.name,
      domain: prodAlias,
      state: latest?.readyState ?? latest?.state ?? null,
      lastDeploy: latest?.createdAt ?? latest?.created ?? null,
    };
  });
}
