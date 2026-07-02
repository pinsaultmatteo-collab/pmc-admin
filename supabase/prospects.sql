-- =====================================================================
-- PMC Pilotage — table CRM (prospects)
-- À exécuter dans : Supabase → SQL Editor → New query → Run
-- (Les 3 autres tables existent déjà, celle-ci s'ajoute.)
-- =====================================================================

create table if not exists public.prospects (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  company     text,
  email       text,
  phone       text,
  value       numeric,
  stage       text not null default 'nouveau',  -- nouveau/contacte/rdv/devis/gagne/perdu
  position    integer not null default 0,
  note        text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table public.prospects enable row level security;
