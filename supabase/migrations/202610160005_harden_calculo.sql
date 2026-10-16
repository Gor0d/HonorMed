-- Resolve Supabase security advisor: pin function resolution to trusted schema.
alter function public.calcular_repasse(text,numeric,numeric,numeric,numeric,numeric)
  set search_path = pg_catalog;
