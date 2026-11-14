-- Orden consistente al recuperar una membresía vencida.
begin;
create or replace function bluehaven_privado.gestionar_sala(p_accion text,p_codigo text,p_cliente uuid) returns jsonb
language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid(); miembro bluehaven_privado.sala_jugadores; sala bluehaven_privado.salas; asiento_libre int;
begin
 if uid is null or p_cliente is null then raise exception 'Iniciá sesión para jugar en una sala.' using errcode='42501';end if;
 if p_accion not in ('crear','unir','estado','salir') or p_accion is null then raise exception 'Acción de sala inválida.' using errcode='22023';end if;
 -- Solo las admisiones/salidas se serializan entre salas; los latidos son independientes.
 -- Evita invertir bloqueos al trasladar una membresía vencida a otra sala.
 if p_accion<>'estado' then perform pg_advisory_xact_lock(hashtextextended('bh-sala-admisiones',0));end if;
 -- Una sola sesión por cuenta, incluso ante peticiones simultáneas.
 perform pg_advisory_xact_lock(hashtextextended('bh-sala:'||uid::text,0));
 select * into miembro from bluehaven_privado.sala_jugadores where usuario_id=uid;
 if p_accion='salir' then
  if miembro.cliente=p_cliente then
   perform 1 from bluehaven_privado.salas where id=miembro.sala_id for update;
   delete from bluehaven_privado.sala_jugadores where usuario_id=uid;
   delete from bluehaven_privado.salas s where s.id=miembro.sala_id and not exists(select 1 from bluehaven_privado.sala_jugadores m where m.sala_id=s.id);
  end if;
  return null;
 end if;
 if miembro.usuario_id is not null and (miembro.visto<now()-interval '75 seconds' or not exists(select 1 from bluehaven_privado.salas where id=miembro.sala_id and vence>now())) then
  if p_accion='estado' then raise exception 'La sala se cerró o venció tu conexión. Podés volver a unirte.' using errcode='P0002';end if;
  delete from bluehaven_privado.sala_jugadores where usuario_id=uid;miembro:=null;
 end if;
 if miembro.usuario_id is not null then
  if miembro.cliente<>p_cliente then raise exception 'Tu cuenta ya está en una sala en otra pestaña. Salí allí o esperá 75 segundos.' using errcode='P0001';end if;
  if p_accion='unir' and not exists(select 1 from bluehaven_privado.salas where id=miembro.sala_id and codigo=upper(regexp_replace(p_codigo,'[ -]','','g'))) then raise exception 'Primero salí de tu sala actual.' using errcode='P0001';end if;
  select * into sala from bluehaven_privado.salas where id=miembro.sala_id for update;
 elsif p_accion='estado' then
  raise exception 'La sala se cerró o venció tu conexión. Podés volver a unirte.' using errcode='P0002';
 else
  if p_accion='crear' then
   -- Limpieza acotada de salas vencidas; SKIP LOCKED no bloquea otras admisiones.
   delete from bluehaven_privado.salas where id in(select id from bluehaven_privado.salas where vence<now() order by vence limit 50 for update skip locked);
   insert into bluehaven_privado.salas default values returning * into sala;
  else
   if p_codigo is null or upper(regexp_replace(p_codigo,'[ -]','','g')) !~ '^[0-9A-F]{12}$' then raise exception 'Usá el código de 12 caracteres de la sala.' using errcode='22023';end if;
   select * into sala from bluehaven_privado.salas where codigo=upper(regexp_replace(p_codigo,'[ -]','','g')) and vence>now() for update;
   if sala.id is null then raise exception 'No encontramos esa sala. Revisá el código o pedí uno nuevo.' using errcode='P0002';end if;
  end if;
  delete from bluehaven_privado.sala_jugadores where sala_id=sala.id and visto<now()-interval '75 seconds';
  select n into asiento_libre from generate_series(0,3)n where not exists(select 1 from bluehaven_privado.sala_jugadores m where m.sala_id=sala.id and m.asiento=n) order by n limit 1;
  if asiento_libre is null then raise exception 'La sala está llena (4 jugadores).' using errcode='P0001';end if;
  insert into bluehaven_privado.sala_jugadores(usuario_id,sala_id,cliente,asiento) values(uid,sala.id,p_cliente,asiento_libre) returning * into miembro;
 end if;
 update bluehaven_privado.sala_jugadores set visto=now() where usuario_id=uid;
 return jsonb_build_object('codigo',sala.codigo,'canal','bh-sala:'||sala.id::text,'yo',miembro.id,'vence',sala.vence,'jugadores',coalesce((select jsonb_agg(jsonb_build_object('id',m.id,'nombre',case when bluehaven_privado.texto_ofensivo(p.usuario) then 'Pescador' else p.usuario end,'asiento',m.asiento) order by m.asiento) from bluehaven_privado.sala_jugadores m join public.perfiles p using(usuario_id) where m.sala_id=sala.id and m.visto>now()-interval '75 seconds'),'[]'::jsonb));
end;
$$;
commit;
