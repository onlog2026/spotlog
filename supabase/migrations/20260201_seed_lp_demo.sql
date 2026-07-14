-- =============================================================
-- Seed: LP demo "Garantia de Segurança na Entrega do Medicamento"
-- Aplique no SQL Editor do Supabase (projeto lfvuwrpfdnyqfxjaicba)
-- =============================================================
-- Usa org id fixo (ac8ac0e2-7cf1-48fe-aecc-513bcb482ad4); se nao existir,
-- cai pra primeira org do banco.

do $$
declare
  v_org uuid := coalesce(
    (select id from organizations where id = 'ac8ac0e2-7cf1-48fe-aecc-513bcb482ad4'),
    (select id from organizations order by created_at asc limit 1)
  );
begin
  if v_org is null then
    raise notice 'Nenhuma organizacao encontrada — pulando seed';
    return;
  end if;

  insert into public.landing_pages (
    organization_id, slug, title, description, hero_image_url,
    body_json, cta_label, cta_url, status, published_at, seo_title, seo_description
  ) values (
    v_org,
    'garantia-de-seguranca-na-entrega-do-seu-medicamento',
    'Garantia de Segurança na Entrega do Seu Medicamento',
    'Spotlog: transportadora com AFE Anvisa, farmacêutico responsável e cadeia de frio validada. Seu medicamento entregue com segurança em São Paulo.',
    'https://image.pollinations.ai/prompt/photorealistic%20pharmaceutical%20delivery%20van%20with%20temperature%20control%20Brazil%20professional?width=1200&height=600&nologo=true&model=flux',
    jsonb_build_object(
      'blocks', jsonb_build_array(
        jsonb_build_object('type','hero','config', jsonb_build_object(
          'headline','Seu medicamento entregue com segurança total',
          'subheadline','AFE Anvisa, farmacêutico responsável e cadeia de frio validada',
          'cta','Solicitar cotação'
        )),
        jsonb_build_object('type','features','config', jsonb_build_object(
          'items', jsonb_build_array(
            jsonb_build_object('title','AFE Anvisa','desc','Autorização de Funcionamento para Transporte'),
            jsonb_build_object('title','Farmacêutico responsável','desc','Acompanhamento técnico em todas as etapas'),
            jsonb_build_object('title','Cadeia de frio','desc','Veículos validados com termorregistro')
          )
        )),
        jsonb_build_object('type','cta','config', jsonb_build_object(
          'headline','Pronto pra entregar com segurança?',
          'button_label','Falar com especialista'
        ))
      )
    ),
    'Falar com especialista',
    '/contato?utm_source=lp&utm_medium=organic&utm_campaign=farma-seguranca',
    'publicado',
    now(),
    'Garantia de Segurança na Entrega do Seu Medicamento | Spotlog',
    'Transportadora AFE Anvisa em SP. Farmacêutico responsável, cadeia de frio validada. Solicite cotação.'
  )
  on conflict (organization_id, slug) do nothing;
end $$;
