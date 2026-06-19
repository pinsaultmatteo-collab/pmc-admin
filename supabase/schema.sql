-- =====================================================================
-- PMC Pilotage — schéma Supabase
-- À exécuter une fois dans : Supabase → SQL Editor → New query → Run
-- =====================================================================

create extension if not exists "pgcrypto";

-- To-do par site
create table if not exists public.todos (
  id          uuid primary key default gen_random_uuid(),
  site_label  text,
  label       text not null,
  done        boolean not null default false,
  priority    text not null default 'normal',  -- low / normal / high
  created_at  timestamptz not null default now()
);

-- Campagnes pub (saisie manuelle Meta / Google)
create table if not exists public.campaigns (
  id            uuid primary key default gen_random_uuid(),
  client_label  text,
  platform      text not null default 'meta',   -- meta / google
  name          text not null,
  start_date    date,
  daily_budget  numeric,
  status        text not null default 'active',  -- active / paused / ended
  spend_to_date numeric,
  roas          numeric,
  leads         integer,
  updated_at    timestamptz not null default now(),
  created_at    timestamptz not null default now()
);

-- Facturation ponctuelle hors Stripe (alimente le CA)
create table if not exists public.manual_revenue (
  id            uuid primary key default gen_random_uuid(),
  label         text not null,
  client_label  text,
  amount        numeric not null,
  date          date not null,
  created_at    timestamptz not null default now()
);

-- RLS : le dashboard accède via la clé service_role (côté serveur,
-- derrière le mot de passe admin), donc on garde l'accès serveur uniquement.
alter table public.todos          enable row level security;
alter table public.campaigns      enable row level security;
alter table public.manual_revenue enable row level security;
-- Aucune policy publique : seule la service_role (qui bypasse la RLS) peut lire/écrire.
