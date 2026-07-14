-- Permite leitura pública (anon) de UMA shipment via code, sem expor toda a tabela
-- Estratégia: function security definer que retorna 1 shipment + seus tracking_events se o code casar exato
-- Mascara nome do destinatário e expõe SÓ city/UF do endereço, nunca o endereço completo, nem CPF, nem telefone.

create or replace function public.get_public_shipment_tracking(p_code text)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_shipment record;
  v_events json;
  v_org record;
begin
  -- busca shipment EXATO pelo code (case-insensitive, sem wildcard)
  select id, organization_id, code, recipient_name, destination_address,
         status, sla_deadline, delivered_at, created_at
    into v_shipment
    from shipments
   where upper(code) = upper(p_code)
   limit 1;

  if v_shipment.id is null then
    return null;
  end if;

  -- dados públicos da org (nome + logo)
  select name, logo_url
    into v_org
    from organizations
   where id = v_shipment.organization_id;

  -- events em ordem cronológica (campos seguros, sem location detalhada)
  select coalesce(
    json_agg(
      json_build_object(
        'event_type', event_type,
        'description', description,
        'occurred_at', occurred_at
      ) order by occurred_at
    ),
    '[]'::json
  )
    into v_events
    from tracking_events
   where shipment_id = v_shipment.id;

  return json_build_object(
    'code', v_shipment.code,
    'status', v_shipment.status,
    'recipient_name_masked', regexp_replace(coalesce(v_shipment.recipient_name,''),
                              '(\S{2})\S+', '\1***', 'g'),
    'destination_city', coalesce(v_shipment.destination_address->>'city',
                                 v_shipment.destination_address->>'cidade'),
    'destination_uf', coalesce(v_shipment.destination_address->>'state',
                                v_shipment.destination_address->>'uf'),
    'sla_deadline', v_shipment.sla_deadline,
    'delivered_at', v_shipment.delivered_at,
    'created_at', v_shipment.created_at,
    'org_name', v_org.name,
    'org_logo_url', v_org.logo_url,
    'events', v_events
  );
end;
$$;

grant execute on function public.get_public_shipment_tracking(text) to anon, authenticated;
