export type Stage = { id: string; label: string };

export const STAGES: Stage[] = [
  { id: "nouveau", label: "Nouveau" },
  { id: "contacte", label: "Contacté" },
  { id: "rdv", label: "RDV / Échange" },
  { id: "devis", label: "Devis envoyé" },
  { id: "gagne", label: "Gagné" },
  { id: "perdu", label: "Perdu" },
];

export const STAGE_IDS = STAGES.map((s) => s.id);

export function stageLabel(id: string): string {
  return STAGES.find((s) => s.id === id)?.label ?? id;
}
