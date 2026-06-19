"use client";

import { useFormState, useFormStatus } from "react-dom";
import { login } from "@/app/actions";

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn-primary w-full" disabled={pending}>
      {pending ? "Connexion…" : "Entrer"}
    </button>
  );
}

export default function LoginForm() {
  const [error, formAction] = useFormState(login, null);
  return (
    <form action={formAction} className="space-y-3">
      <input
        type="password"
        name="password"
        placeholder="Mot de passe"
        autoFocus
        className="field"
        autoComplete="current-password"
      />
      {error && <p className="text-sm text-danger">{error}</p>}
      <Submit />
    </form>
  );
}
