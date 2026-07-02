"use client";

import { useState, useTransition } from "react";
import { STAGES } from "@/lib/crm";
import { Prospect } from "@/lib/supabase";
import { addProspect, updateProspectStage, deleteProspect } from "@/app/actions";
import { eur } from "@/lib/format";
import { Plus, Trash2, Mail, Phone } from "lucide-react";

const DOT: Record<string, string> = {
  nouveau: "bg-faint",
  contacte: "bg-accent",
  rdv: "bg-accent",
  devis: "bg-warn",
  gagne: "bg-ok",
  perdu: "bg-danger",
};

export default function CrmBoard({ initial }: { initial: Prospect[] }) {
  const [prospects, setProspects] = useState<Prospect[]>(initial);
  const [dragId, setDragId] = useState<string | null>(null);
  const [overStage, setOverStage] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  function move(id: string, stage: string) {
    setProspects((prev) => prev.map((p) => (p.id === id ? { ...p, stage } : p)));
    startTransition(() => updateProspectStage(id, stage));
  }

  function remove(id: string) {
    setProspects((prev) => prev.filter((p) => p.id !== id));
    startTransition(() => deleteProspect(id));
  }

  return (
    <div>
      <details className="card mb-5">
        <summary className="flex cursor-pointer items-center gap-2 px-4 py-3 text-sm font-medium text-ink">
          <Plus size={15} className="text-accent" /> Nouveau prospect
        </summary>
        <form
          action={async (fd) => {
            await addProspect(fd);
          }}
          className="grid grid-cols-1 gap-2 border-t border-border p-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          <input name="name" placeholder="Nom du contact *" className="field" required />
          <input name="company" placeholder="Entreprise" className="field" />
          <input name="value" inputMode="decimal" placeholder="Montant estimé €" className="field" />
          <input name="email" type="email" placeholder="Email" className="field" />
          <input name="phone" placeholder="Téléphone" className="field" />
          <select name="stage" className="field" defaultValue="nouveau">
            {STAGES.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
          <div className="sm:col-span-2 lg:col-span-3">
            <button type="submit" className="btn-primary">
              Ajouter le prospect
            </button>
          </div>
        </form>
      </details>

      <div className="flex gap-3 overflow-x-auto pb-4">
        {STAGES.map((stage) => {
          const items = prospects.filter((p) => p.stage === stage.id);
          const sum = items.reduce((t, p) => t + (p.value ?? 0), 0);
          const isOver = overStage === stage.id;
          return (
            <div
              key={stage.id}
              onDragOver={(e) => {
                e.preventDefault();
                setOverStage(stage.id);
              }}
              onDragLeave={() => setOverStage((s) => (s === stage.id ? null : s))}
              onDrop={(e) => {
                e.preventDefault();
                const id = e.dataTransfer.getData("text/plain") || dragId;
                if (id) move(id, stage.id);
                setOverStage(null);
                setDragId(null);
              }}
              className={`flex w-64 shrink-0 flex-col rounded-xl border p-2 transition-colors ${
                isOver ? "border-accent bg-accent/5" : "border-border bg-surface-2"
              }`}
            >
              <div className="flex items-center justify-between px-2 py-2">
                <div className="flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${DOT[stage.id] ?? "bg-faint"}`} />
                  <span className="text-sm font-medium text-ink">{stage.label}</span>
                  <span className="num text-xs text-faint">{items.length}</span>
                </div>
                {sum > 0 && <span className="num text-xs text-muted">{eur(sum)}</span>}
              </div>

              <div className="flex flex-1 flex-col gap-2 px-1 pb-1">
                {items.map((p) => (
                  <div
                    key={p.id}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData("text/plain", p.id);
                      e.dataTransfer.effectAllowed = "move";
                      setDragId(p.id);
                    }}
                    onDragEnd={() => setDragId(null)}
                    className={`group cursor-grab rounded-lg border border-border bg-white p-3 shadow-[0_1px_2px_rgba(17,17,26,0.04)] active:cursor-grabbing ${
                      dragId === p.id ? "opacity-50" : ""
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium text-ink">{p.name}</p>
                      <button
                        onClick={() => remove(p.id)}
                        className="text-faint opacity-0 transition-opacity hover:text-danger group-hover:opacity-100"
                        aria-label="Supprimer"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                    {p.company && <p className="mt-0.5 text-xs text-muted">{p.company}</p>}
                    {p.value != null && p.value > 0 && (
                      <p className="num mt-1.5 text-sm font-semibold text-accent">{eur(p.value)}</p>
                    )}
                    {(p.email || p.phone) && (
                      <div className="mt-2 flex flex-col gap-1">
                        {p.email && (
                          <a href={`mailto:${p.email}`} className="flex items-center gap-1.5 text-[11px] text-muted hover:text-accent">
                            <Mail size={12} /> {p.email}
                          </a>
                        )}
                        {p.phone && (
                          <a href={`tel:${p.phone}`} className="flex items-center gap-1.5 text-[11px] text-muted hover:text-accent">
                            <Phone size={12} /> {p.phone}
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                ))}
                {items.length === 0 && (
                  <div className="rounded-lg border border-dashed border-border px-3 py-6 text-center text-[11px] text-faint">
                    Glisse un prospect ici
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
