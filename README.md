# PMC Pilotage

Dashboard interne PMC Marketing — abonnements, chiffre d'affaires, sites clients, to-do, campagnes pub et coûts API.
Next.js 14 (App Router) + TypeScript + Tailwind. Déploiement Vercel sur `admin.agence-pmc-marketing.com`.

## Modules

| Module          | Source            | Clé nécessaire             |
|-----------------|-------------------|----------------------------|
| Abonnements     | Stripe (live)     | `STRIPE_SECRET_KEY`        |
| Chiffre d'affaires | Stripe + manuel | `STRIPE_SECRET_KEY` + Supabase |
| Sites clients   | Vercel API        | `VERCEL_API_TOKEN`         |
| To-do           | Supabase          | `SUPABASE_*`               |
| Campagnes pub   | Supabase (manuel) | `SUPABASE_*`               |
| Coûts API       | Anthropic Admin   | `ANTHROPIC_ADMIN_KEY`      |

Chaque module se débloque dès que sa clé est présente. Sans clé, il affiche un état « à configurer » — donc tu peux déployer tout de suite avec juste Stripe.

## Installation locale

```bash
npm install
cp .env.local.example .env.local   # puis remplis les valeurs
npm run dev                        # http://localhost:3000
```

`ADMIN_PASSWORD` = ton mot de passe d'accès. `SESSION_SECRET` = une longue chaîne aléatoire
(génère-la avec `openssl rand -base64 32`).

## Base de données

Exécute `supabase/schema.sql` dans Supabase → SQL Editor. Récupère `SUPABASE_URL` et la
`service_role` key dans Project Settings → API.

## Déploiement Vercel

1. Pousse ce dossier dans un **nouveau repo** GitHub.
2. Sur Vercel : **New Project** → importe le repo.
3. Renseigne les variables d'environnement (au minimum `ADMIN_PASSWORD`, `SESSION_SECRET`, `STRIPE_SECRET_KEY`).
4. Deploy.
5. Project → Settings → **Domains** → ajoute `admin.agence-pmc-marketing.com`, puis crée
   l'enregistrement CNAME indiqué chez ton registrar.

L'accès est protégé par mot de passe (middleware). Toutes les clés restent côté serveur,
jamais exposées au navigateur.
