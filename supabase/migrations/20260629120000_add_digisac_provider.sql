-- DIGISAC como provedor de WhatsApp + flag de opt-in de WhatsApp no contato.
alter type integration_provider add value if not exists 'digisac';
alter table public.contacts add column if not exists whatsapp_opt_in boolean not null default false;
