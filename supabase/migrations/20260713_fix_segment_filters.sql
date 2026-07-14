-- Corrige mkt_compute_segment: os filtros "created_after" e "utm_source" eram
-- preenchidos no formulário de Segmentos mas ignorados pela função (só usava
-- source/status/score_min). Agora os 5 filtros são aplicados de verdade.
create or replace function public.mkt_compute_segment(p_segment_id uuid, p_org uuid)
returns jsonb language plpgsql security definer set search_path=public as $$
declare
  v_filters jsonb;
  v_sources text[];
  v_status text[];
  v_score_min int;
  v_created_after timestamptz;
  v_utm_source text;
  v_count int;
  v_sample jsonb;
begin
  select filters_json into v_filters from lead_segments where id = p_segment_id and organization_id = p_org;
  if v_filters is null then return null; end if;
  v_sources := case when v_filters->'source' is not null then (select array_agg(value) from jsonb_array_elements_text(v_filters->'source')) else null end;
  v_status := case when v_filters->'status' is not null then (select array_agg(value) from jsonb_array_elements_text(v_filters->'status')) else null end;
  v_score_min := nullif(v_filters->>'score_min','')::int;
  v_created_after := nullif(v_filters->>'created_after','')::timestamptz;
  v_utm_source := nullif(v_filters->>'utm_source','');

  select count(*) into v_count from leads l
  where l.organization_id = p_org
    and (v_sources is null or l.source = any(v_sources))
    and (v_status is null or l.status::text = any(v_status))
    and (v_score_min is null or coalesce(l.score,0) >= v_score_min)
    and (v_created_after is null or l.created_at >= v_created_after)
    and (v_utm_source is null or l.utm_source = v_utm_source);

  select coalesce(jsonb_agg(jsonb_build_object('id',l.id,'full_name',l.full_name,'email',l.email,'score',l.score) order by l.created_at desc), '[]'::jsonb)
    into v_sample from (
      select * from leads l
      where l.organization_id = p_org
        and (v_sources is null or l.source = any(v_sources))
        and (v_status is null or l.status::text = any(v_status))
        and (v_score_min is null or coalesce(l.score,0) >= v_score_min)
        and (v_created_after is null or l.created_at >= v_created_after)
        and (v_utm_source is null or l.utm_source = v_utm_source)
      order by l.created_at desc limit 50
    ) l;

  update lead_segments set member_count = v_count, last_computed_at = now() where id = p_segment_id;
  return jsonb_build_object('count', v_count, 'sample', v_sample);
end; $$;
grant execute on function public.mkt_compute_segment(uuid, uuid) to authenticated;
