-- Adiciona ao enum os provedores que o marketplace de integrações (UI) oferece
-- mas que faltavam no banco (causavam: invalid input value for enum integration_provider).
alter type integration_provider add value if not exists 'slack';
alter type integration_provider add value if not exists 'discord';
alter type integration_provider add value if not exists 'telegram';
alter type integration_provider add value if not exists 'twilio';
alter type integration_provider add value if not exists 'google_calendar';
alter type integration_provider add value if not exists 'openrouter';
