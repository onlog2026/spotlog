-- O enriquecimento por CNPJ (SDR) faz upsert em companies usando
-- onConflict "organization_id,cnpj", mas essa combinacao nunca teve uma
-- constraint unica no banco -- todo upsert falha (erro descartado pelo
-- codigo) e a empresa nunca e salva de verdade (lead fica "sem nome").

-- 1) PREVIEW -- rode primeiro. Se retornar 0 linhas, pule direto pro passo 3.
select organization_id, cnpj, count(*) as duplicatas
from companies
where cnpj is not null and cnpj <> ''
group by organization_id, cnpj
having count(*) > 1;

-- 2) SÓ SE O PASSO 1 RETORNOU LINHAS: decida manualmente o que fazer com
-- cada duplicata (qual registro manter) antes de seguir -- NÃO delete
-- direto, empresas podem ter contatos/negócios reais vinculados. Me chame
-- de volta com o resultado do passo 1 que eu te ajudo a decidir.

-- 3) Trava de verdade -- só roda se o passo 1 voltou vazio:
alter table companies
  add constraint companies_org_cnpj_unique unique (organization_id, cnpj);
