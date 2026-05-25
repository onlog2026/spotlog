-- ============================================================
-- 001 — Extensões e funções utilitárias
-- ============================================================

create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";
create extension if not exists "pg_trgm";

-- Função para atualizar updated_at automaticamente
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Função para gerar slugs únicos
create or replace function public.slugify(input text)
returns text as $$
declare
  s text;
begin
  s := lower(unaccent(coalesce(input, '')));
  s := regexp_replace(s, '[^a-z0-9]+', '-', 'g');
  s := regexp_replace(s, '(^-+|-+$)', '', 'g');
  return s;
end;
$$ language plpgsql immutable;

-- Tipo enum reutilizável
do $$ begin
  create type public.user_role as enum ('owner', 'admin', 'manager', 'sdr', 'viewer');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.lead_status as enum (
    'new', 'enriching', 'enriched', 'contacted', 'replied',
    'qualified', 'disqualified', 'converted'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.deal_status as enum (
    'open', 'won', 'lost'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.activity_type as enum (
    'note', 'call', 'email', 'whatsapp', 'meeting', 'task', 'system'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.message_channel as enum ('email', 'whatsapp', 'sms', 'linkedin');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.message_direction as enum ('outbound', 'inbound');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.message_status as enum (
    'queued', 'sent', 'delivered', 'opened', 'clicked',
    'replied', 'bounced', 'failed', 'unsubscribed'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.sequence_status as enum ('draft', 'active', 'paused', 'archived');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.proposal_status as enum (
    'draft', 'sent', 'viewed', 'accepted', 'rejected', 'expired'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.campaign_status as enum (
    'draft', 'running', 'paused', 'completed', 'failed'
  );
exception when duplicate_object then null; end $$;
