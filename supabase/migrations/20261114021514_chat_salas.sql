begin;
alter table bluehaven_privado.sala_jugadores add column ultimo_mensaje timestamptz not null default '-infinity';
create table bluehaven_privado.sala_mensajes(
 id uuid primary key,
 sala_id uuid not null references bluehaven_privado.salas(id) on delete cascade,
 usuario_id uuid not null references public.perfiles(usuario_id) on delete cascade,
 nombre text not null,
 texto text not null check(char_length(texto) between 1 and 280),
 fecha timestamptz not null default clock_timestamp()
);
create index sala_mensajes_recientes on bluehaven_privado.sala_mensajes(sala_id,fecha desc,id);
alter table bluehaven_privado.sala_mensajes enable row level security;
revoke all on bluehaven_privado.sala_mensajes from public,anon,authenticated;
create policy chat_solo_funciones on bluehaven_privado.sala_mensajes as restrictive for all to anon,authenticated using(false) with check(false);
create function bluehaven_privado.chat_sala(p_cliente uuid,p_texto text,p_token uuid) returns jsonb
language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid(); m bluehaven_privado.sala_jugadores; texto text; anterior bluehaven_privado.sala_mensajes;
begin
 if uid is null or p_cliente is null then raise exception 'Iniciá sesión para usar el chat.' using errcode='42501';end if;
 perform pg_advisory_xact_lock(hashtextextended('bh-sala:'||uid::text,0));
 select * into m from bluehaven_privado.sala_jugadores where usuario_id=uid and cliente=p_cliente and visto>now()-interval '75 seconds';
 if m.usuario_id is null then raise exception 'Necesitás estar conectado a una sala para usar el chat.' using errcode='42501';end if;
 perform 1 from bluehaven_privado.salas where id=m.sala_id and vence>now() for update;
 if not found then raise exception 'La sala venció. Volvé a unirte.' using errcode='42501';end if;
 if p_texto is not null then
  if p_token is null or char_length(p_texto)>280 then raise exception 'El mensaje admite hasta 280 caracteres.' using errcode='22023';end if;
  texto:=trim(regexp_replace(p_texto,'[[:cntrl:]]',' ','g'));
  if char_length(texto)<1 then raise exception 'Escribí un mensaje.' using errcode='22023';end if;
  if bluehaven_privado.texto_ofensivo(texto) then raise exception 'El mensaje contiene palabras no permitidas.' using errcode='23514';end if;
  select * into anterior from bluehaven_privado.sala_mensajes where id=p_token;
  if anterior.id is not null then
   if anterior.usuario_id<>uid or anterior.sala_id<>m.sala_id or anterior.texto<>texto then raise exception 'El identificador del mensaje ya fue utilizado.' using errcode='22023';end if;
  else
   if m.ultimo_mensaje>clock_timestamp()-interval '1 second' then raise exception 'Esperá un segundo antes de enviar otro mensaje.' using errcode='P0001';end if;
   insert into bluehaven_privado.sala_mensajes(id,sala_id,usuario_id,nombre,texto)
   select p_token,m.sala_id,uid,case when bluehaven_privado.texto_ofensivo(p.usuario) then 'Pescador' else p.usuario end,texto from public.perfiles p where usuario_id=uid;
   update bluehaven_privado.sala_jugadores set ultimo_mensaje=clock_timestamp() where usuario_id=uid;
   delete from bluehaven_privado.sala_mensajes where sala_id=m.sala_id and id not in(select id from bluehaven_privado.sala_mensajes where sala_id=m.sala_id order by fecha desc,id limit 50);
   -- Solo una señal sin texto: el receptor consulta la RPC autenticada para verificar autor y sala.
   if to_regprocedure('realtime.send(jsonb,text,text,boolean)') is not null then
    execute 'select realtime.send($1,$2,$3,$4)' using '{}'::jsonb,'chat_aviso','bh-sala:'||m.sala_id::text,true;
   end if;
  end if;
 end if;
 return coalesce((select jsonb_agg(jsonb_build_object('id',msg.id,'nombre',msg.nombre,'texto',msg.texto,'fecha',msg.fecha,'es_tuyo',msg.usuario_id=uid) order by msg.fecha,msg.id) from bluehaven_privado.sala_mensajes msg where msg.sala_id=m.sala_id),'[]'::jsonb);
end;
$$;
revoke all on function bluehaven_privado.chat_sala(uuid,text,uuid) from public,anon;
grant execute on function bluehaven_privado.chat_sala(uuid,text,uuid) to authenticated;
create function public.bh_sala_chat(p_cliente uuid,p_texto text default null,p_token uuid default null) returns jsonb
language sql security invoker set search_path='' as $$ select bluehaven_privado.chat_sala(p_cliente,p_texto,p_token); $$;
revoke all on function public.bh_sala_chat(uuid,text,uuid) from public,anon;
grant execute on function public.bh_sala_chat(uuid,text,uuid) to authenticated;
commit;
