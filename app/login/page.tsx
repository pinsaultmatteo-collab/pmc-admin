import LoginForm from "@/components/LoginForm";

export const metadata = { title: "PMC · Connexion" };

export default function LoginPage() {
  return (
    <div className="grid min-h-screen place-items-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-md bg-accent text-xs font-bold text-white">
            PMC
          </span>
          <div>
            <p className="text-sm font-semibold tracking-tight">Pilotage interne</p>
            <p className="eyebrow">// accès restreint</p>
          </div>
        </div>
        <div className="card p-6">
          <LoginForm />
        </div>
        <p className="mt-4 text-center font-mono text-[11px] text-faint">PMC Marketing · admin</p>
      </div>
    </div>
  );
}
