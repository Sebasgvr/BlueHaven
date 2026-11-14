-- Stack local efímero: verificar retención y señal de Broadcast, luego revertir todo.
begin;
create schema realtime;
create table realtime.avisos_prueba(payload jsonb,event text,topic text,private boolean);
create function realtime.send(payload jsonb,event text,topic text,private boolean) returns void language sql as $$insert into realtime.avisos_prueba values(payload,event,topic,private);$$;
do $$
declare uid uuid; cliente uuid:=gen_random_uuid(); sala jsonb; r jsonb; n int;
begin
 select usuario_id into uid from public.perfiles order by usuario_id limit 1;
 perform set_config('request.jwt.claim.sub',uid::text,true);
 sala:=public.bh_sala('crear','',cliente);
 for n in 1..60 loop
  update bluehaven_privado.sala_jugadores set ultimo_mensaje='-infinity' where usuario_id=uid;
  r:=public.bh_sala_chat(cliente,'Mensaje del lago '||n,gen_random_uuid());
 end loop;
 if jsonb_array_length(r)<>50 then raise exception 'Deben conservarse solo 50 mensajes';end if;
 if (select count(*) from realtime.avisos_prueba)<>60 or exists(select 1 from realtime.avisos_prueba where payload<>'{}'::jsonb or event<>'chat_aviso' or topic<>sala->>'canal' or not private) then raise exception 'Señal Realtime inválida';end if;
 if has_table_privilege('authenticated','bluehaven_privado.sala_mensajes','SELECT') or has_function_privilege('anon','public.bh_sala_chat(uuid,text,uuid)','EXECUTE') then raise exception 'Acceso excesivo al chat';end if;
 raise notice 'Chat: retención de 50, señal privada sin contenido y permisos mínimos OK';
end $$;
rollback;
