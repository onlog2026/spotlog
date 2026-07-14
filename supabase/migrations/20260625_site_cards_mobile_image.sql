-- Imagem separada para mobile (quando o card precisa de versão vertical/menor).
alter table public.site_cards add column if not exists image_url_mobile text;
