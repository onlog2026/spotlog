-- Recriar CMS RPCs com prefixo cms2_ pra contornar PostgREST schema cache travado nas cms_*
-- Mesma lógica, novos nomes — força o PostgREST a re-detectar funções

create or replace function public.cms2_create_post(p jsonb)
returns uuid language plpgsql security definer set search_path=public as $$
declare v uuid;
begin
  insert into cms_posts (
    organization_id, slug, title, excerpt, content_md, cover_url,
    author_name, author_avatar_url, category, tags, status,
    published_at, seo_title, seo_description, created_by
  ) values (
    (p->>'organization_id')::uuid,
    p->>'slug', p->>'title',
    nullif(p->>'excerpt',''), nullif(p->>'content_md',''),
    nullif(p->>'cover_url',''), nullif(p->>'author_name',''),
    nullif(p->>'author_avatar_url',''),
    coalesce(p->>'category','blog'),
    coalesce((select array_agg(value::text) from jsonb_array_elements_text(p->'tags')), '{}'),
    coalesce(p->>'status','rascunho'),
    case when p->>'status' = 'publicado' then coalesce(nullif(p->>'published_at','')::timestamptz, now()) else nullif(p->>'published_at','')::timestamptz end,
    nullif(p->>'seo_title',''), nullif(p->>'seo_description',''),
    auth.uid()
  ) returning id into v; return v;
end; $$;
grant execute on function public.cms2_create_post(jsonb) to authenticated;

create or replace function public.cms2_update_post(p_id uuid, p_org uuid, p jsonb)
returns void language plpgsql security definer set search_path=public as $$
begin
  update cms_posts set
    slug = coalesce(p->>'slug', slug),
    title = coalesce(p->>'title', title),
    excerpt = coalesce(p->>'excerpt', excerpt),
    content_md = coalesce(p->>'content_md', content_md),
    cover_url = coalesce(p->>'cover_url', cover_url),
    category = coalesce(p->>'category', category),
    tags = coalesce((select array_agg(value::text) from jsonb_array_elements_text(p->'tags')), tags),
    status = coalesce(p->>'status', status),
    published_at = case when p->>'status' = 'publicado' and published_at is null then now() else published_at end,
    seo_title = coalesce(p->>'seo_title', seo_title),
    seo_description = coalesce(p->>'seo_description', seo_description),
    updated_at = now()
  where id = p_id and organization_id = p_org;
end; $$;
grant execute on function public.cms2_update_post(uuid, uuid, jsonb) to authenticated;

create or replace function public.cms2_list_posts(p_org uuid) returns jsonb
language sql security definer set search_path=public as $$
  select coalesce(jsonb_agg(to_jsonb(p.*) order by p.created_at desc), '[]'::jsonb)
  from cms_posts p where p.organization_id = p_org;
$$;
grant execute on function public.cms2_list_posts(uuid) to authenticated;

create or replace function public.cms2_get_post(p_id uuid, p_org uuid) returns jsonb
language sql security definer set search_path=public as $$
  select to_jsonb(p.*) from cms_posts p where p.id = p_id and p.organization_id = p_org;
$$;
grant execute on function public.cms2_get_post(uuid, uuid) to authenticated;

create or replace function public.cms2_create_case(p jsonb) returns uuid
language plpgsql security definer set search_path=public as $$
declare v uuid;
begin
  insert into cms_cases (organization_id, slug, client_name, segment, summary, challenge_md, solution_md, results_md, kpi_json, logo_url, hero_url, status, published_at, created_by)
  values (
    (p->>'organization_id')::uuid, p->>'slug', p->>'client_name', p->>'segment',
    nullif(p->>'summary',''), nullif(p->>'challenge_md',''), nullif(p->>'solution_md',''),
    nullif(p->>'results_md',''), coalesce(p->'kpi_json','{}'::jsonb),
    nullif(p->>'logo_url',''), nullif(p->>'hero_url',''),
    coalesce(p->>'status','rascunho'),
    case when p->>'status' = 'publicado' then now() else null end, auth.uid()
  ) returning id into v; return v;
end; $$;
grant execute on function public.cms2_create_case(jsonb) to authenticated;

create or replace function public.cms2_list_cases(p_org uuid) returns jsonb
language sql security definer set search_path=public as $$
  select coalesce(jsonb_agg(to_jsonb(c.*) order by c.created_at desc), '[]'::jsonb)
  from cms_cases c where c.organization_id = p_org;
$$;
grant execute on function public.cms2_list_cases(uuid) to authenticated;

create or replace function public.cms2_get_case(p_id uuid, p_org uuid) returns jsonb
language sql security definer set search_path=public as $$
  select to_jsonb(c.*) from cms_cases c where c.id = p_id and c.organization_id = p_org;
$$;
grant execute on function public.cms2_get_case(uuid, uuid) to authenticated;

comment on schema public is 'spotlog_v2_reload';
notify pgrst, 'reload schema';
