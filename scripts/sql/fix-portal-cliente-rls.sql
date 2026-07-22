-- Portal do Cliente: o cliente externo (tabela company_users) hoje NAO
-- passa em nenhuma policy de shipments/support_tickets/pickups/
-- ticket_messages -- so funcionario (organization_members) e reconhecido.
-- Resultado pratico: mesmo com o app corrigido, RLS bloqueia tudo --
-- SELECT devolve 0 linhas (sem erro), INSERT falha com "new row violates
-- row-level security policy". Isso e ADITIVO: so acrescenta acesso pro
-- cliente, nao mexe nas policies que ja existem pra equipe.

-- 1) Remessas -- cliente ve só as remessas da própria empresa
drop policy if exists "shipments_client_select" on shipments;
create policy "shipments_client_select" on shipments for select using (
  exists (
    select 1 from company_users cu
    where cu.user_id = auth.uid()
      and cu.company_id = shipments.company_id
      and cu.active
  )
);

-- 2) Chamados -- cliente ve e cria só os da própria empresa
drop policy if exists "support_tickets_client_select" on support_tickets;
create policy "support_tickets_client_select" on support_tickets for select using (
  exists (
    select 1 from company_users cu
    where cu.user_id = auth.uid()
      and cu.company_id = support_tickets.company_id
      and cu.active
  )
);

drop policy if exists "support_tickets_client_insert" on support_tickets;
create policy "support_tickets_client_insert" on support_tickets for insert with check (
  exists (
    select 1 from company_users cu
    where cu.user_id = auth.uid()
      and cu.company_id = support_tickets.company_id
      and cu.active
  )
);

-- 3) Coletas -- cliente ve e solicita só pra própria empresa
drop policy if exists "pickups_client_select" on pickups;
create policy "pickups_client_select" on pickups for select using (
  exists (
    select 1 from company_users cu
    where cu.user_id = auth.uid()
      and cu.company_id = pickups.company_id
      and cu.active
  )
);

drop policy if exists "pickups_client_insert" on pickups;
create policy "pickups_client_insert" on pickups for insert with check (
  exists (
    select 1 from company_users cu
    where cu.user_id = auth.uid()
      and cu.company_id = pickups.company_id
      and cu.active
  )
);

-- 4) Mensagens do chamado -- cliente ve mensagens só dos próprios chamados
drop policy if exists "ticket_messages_client_select" on ticket_messages;
create policy "ticket_messages_client_select" on ticket_messages for select using (
  exists (
    select 1 from support_tickets t
    join company_users cu on cu.company_id = t.company_id
    where t.id = ticket_messages.ticket_id
      and cu.user_id = auth.uid()
      and cu.active
  )
);
