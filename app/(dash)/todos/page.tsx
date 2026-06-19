import { PageHeader, ConfigNotice, EmptyState } from "@/components/ui";
import { getTodos, supabaseConfigured } from "@/lib/supabase";
import { addTodo, toggleTodo, deleteTodo } from "@/app/actions";
import { Plus, Trash2, Check } from "lucide-react";

export const dynamic = "force-dynamic";

const PRIORITY: Record<string, string> = {
  high: "text-danger",
  normal: "text-muted",
  low: "text-faint",
};

export default async function TodosPage() {
  if (!supabaseConfigured()) {
    return (
      <div>
        <PageHeader eyebrow="to-do sites" title="To-do par site" />
        <ConfigNotice what="Supabase" envVar="SUPABASE_SERVICE_ROLE_KEY" />
      </div>
    );
  }

  const todos = await getTodos().catch(() => []);
  const open = todos.filter((t) => !t.done);
  const done = todos.filter((t) => t.done);

  return (
    <div>
      <PageHeader eyebrow="to-do sites" title="To-do par site" sub={`${open.length} tâche${open.length > 1 ? "s" : ""} en cours.`} />

      <form action={addTodo} className="card mb-5 grid grid-cols-1 gap-2 p-3 sm:grid-cols-[1.5fr_1fr_0.8fr_auto]">
        <input name="label" placeholder="Tâche (ex : mettre à jour les mentions légales)" className="field" required />
        <input name="site_label" placeholder="Site / client" className="field" />
        <select name="priority" className="field" defaultValue="normal">
          <option value="high">Priorité haute</option>
          <option value="normal">Normale</option>
          <option value="low">Basse</option>
        </select>
        <button type="submit" className="btn-primary"><Plus size={15} /> Ajouter</button>
      </form>

      {todos.length === 0 ? (
        <EmptyState title="Aucune tâche pour l'instant." hint="Ajoute ce que tu as à faire sur tes sites clients." />
      ) : (
        <div className="space-y-2">
          {open.map((t) => (
            <Row key={t.id} t={t} />
          ))}

          {done.length > 0 && (
            <>
              <p className="eyebrow pt-4">// terminées ({done.length})</p>
              {done.map((t) => (
                <Row key={t.id} t={t} />
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}

function Row({ t }: { t: { id: string; label: string; site_label: string | null; done: boolean; priority: string } }) {
  return (
    <div className={`card flex items-center gap-3 px-4 py-3 ${t.done ? "opacity-55" : ""}`}>
      <form action={toggleTodo.bind(null, t.id, !t.done)}>
        <button
          aria-label={t.done ? "Rouvrir" : "Marquer fait"}
          className={`grid h-5 w-5 place-items-center rounded border transition-colors ${
            t.done ? "border-ok bg-ok/20 text-ok" : "border-border hover:border-accent"
          }`}
        >
          {t.done && <Check size={13} />}
        </button>
      </form>
      <div className="min-w-0 flex-1">
        <p className={`text-sm ${t.done ? "line-through text-muted" : "text-ink"}`}>{t.label}</p>
        <div className="mt-0.5 flex items-center gap-2">
          {t.site_label && <span className="font-mono text-[11px] text-accent">{t.site_label}</span>}
          {!t.done && t.priority !== "normal" && (
            <span className={`font-mono text-[11px] ${PRIORITY[t.priority]}`}>{t.priority === "high" ? "haute" : "basse"}</span>
          )}
        </div>
      </div>
      <form action={deleteTodo.bind(null, t.id)}>
        <button className="text-faint hover:text-danger transition-colors" aria-label="Supprimer">
          <Trash2 size={15} />
        </button>
      </form>
    </div>
  );
}
