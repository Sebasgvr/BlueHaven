begin;
-- La misma lista y normalización que filtros-cuentas.js; sin coincidencias dentro de palabras.
create or replace function bluehaven_privado.texto_ofensivo(texto text) returns boolean
language plpgsql immutable set search_path='' as $$
declare
 prohibidas text[]:=array['puto','puta','putos','putas','mierda','mierdas','carajo','carajos','cabron','cabrona','cabrones','boludo','boluda','boludos','boludas','pelotudo','pelotuda','pelotudos','pelotudas','pendejo','pendeja','pendejos','pendejas','gilipollas','maricon','maricones','hdp','hijodeputa','hijadeputa','conchadetumadre','forro','forra','forros','forras','imbecil','imbeciles','idiota','idiotas','estupido','estupida','estupidos','estupidas','fuck','fucker','fucking','shit','bitch','asshole','pija','verga','sorete','soretes','pajero','pajera','pajeros','pajeras','conchudo','conchuda','chupapija'];
 tokens text[]:=array[]::text[];
 token text; completo text; limpio text; candidato text;
 i integer; j integer; longitud_maxima integer;
begin
 select array_agg(regexp_replace(p,'(.)\1+','\1','g')),max(length(regexp_replace(p,'(.)\1+','\1','g')))
 into prohibidas,longitud_maxima from unnest(prohibidas) p;
 for token in select regexp_split_to_table(coalesce(texto,''),'[^[:alnum:]@$!]+') loop
  completo:=regexp_replace(bluehaven_privado.normalizar_texto(token),'(.)\1+','\1','g');
  limpio:=regexp_replace(bluehaven_privado.normalizar_texto(regexp_replace(token,'^[0-9@$!]+|[0-9@$!]+$','','g')),'(.)\1+','\1','g');
  if completo=any(prohibidas) or limpio=any(prohibidas) then return true;end if;
  if limpio<>'' then tokens:=array_append(tokens,limpio);end if;
 end loop;
 if cardinality(tokens)=0 then return false;end if;
 for i in 1..cardinality(tokens) loop
  candidato:='';
  for j in i..cardinality(tokens) loop
   candidato:=regexp_replace(candidato||tokens[j],'(.)\1+','\1','g');
   exit when length(candidato)>longitud_maxima;
   if candidato=any(prohibidas) then return true;end if;
  end loop;
 end loop;
 return false;
end;
$$;
-- Los nombres utilizan texto_ofensivo. La guía también se valida al guardar.
create function bluehaven_privado.validar_pregunta_chatbot() returns trigger
language plpgsql security invoker set search_path='' as $$
begin
 if bluehaven_privado.texto_ofensivo(new.pregunta) or bluehaven_privado.texto_ofensivo(new.respuesta) then
  raise exception 'Escribí tu pregunta sin insultos ni palabras ofensivas.' using errcode='23514';
 end if;
 return new;
end;
$$;
revoke all on function bluehaven_privado.validar_pregunta_chatbot() from public,anon,authenticated;
create trigger validar_texto_chatbot before insert or update of pregunta,respuesta on public.preguntas_chatbot
for each row execute function bluehaven_privado.validar_pregunta_chatbot();
commit;
