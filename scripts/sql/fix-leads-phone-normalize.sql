-- Normaliza leads.phone (remove parenteses/espacos/tracos/+55) igual ao
-- contacts.phone/whatsapp ja fazia -- sem isso o robo de SDR nao encontrava
-- o lead pelo telefone recebido no webhook e ficava mudo em silencio.
-- So atualiza quando o resultado tem 10 ou 11 digitos (formato BR valido);
-- numero fora desse padrao NAO e alterado (nao apaga, nao adivinha).

-- 1) PREVIEW -- rode primeiro pra ver quantas linhas vao mudar, sem alterar nada:
with normalizado as (
  select
    id,
    phone as phone_atual,
    case
      when length(regexp_replace(phone, '\D', '', 'g')) >= 12
           and left(regexp_replace(phone, '\D', '', 'g'), 2) = '55'
        then substring(regexp_replace(phone, '\D', '', 'g') from 3)
      else regexp_replace(phone, '\D', '', 'g')
    end as phone_normalizado
  from leads
  where phone is not null and phone <> ''
)
select count(*) as linhas_que_vao_mudar
from normalizado
where length(phone_normalizado) in (10, 11)
  and phone_atual <> phone_normalizado;

-- 2) UPDATE -- depois de conferir o preview acima, rode este bloco:
with normalizado as (
  select
    id,
    case
      when length(regexp_replace(phone, '\D', '', 'g')) >= 12
           and left(regexp_replace(phone, '\D', '', 'g'), 2) = '55'
        then substring(regexp_replace(phone, '\D', '', 'g') from 3)
      else regexp_replace(phone, '\D', '', 'g')
    end as phone_normalizado
  from leads
  where phone is not null and phone <> ''
)
update leads l
set phone = n.phone_normalizado
from normalizado n
where l.id = n.id
  and length(n.phone_normalizado) in (10, 11)
  and l.phone <> n.phone_normalizado;
