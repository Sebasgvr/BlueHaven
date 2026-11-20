-- Proyección pública mínima del ranking; los perfiles e inventarios siguen privados.
begin;
lock table public.perfiles,public.capturas_usuario in share row exclusive mode;
create table bluehaven_privado.ranking_pesca (
 usuario_id uuid primary key references public.perfiles(usuario_id) on delete cascade,
 usuario text not null,
 dinero bigint not null default 0 check(dinero>=0),
 capturas bigint not null default 0 check(capturas>=0)
);
alter table bluehaven_privado.ranking_pesca enable row level security;
revoke all on bluehaven_privado.ranking_pesca from public,anon,authenticated;
create index ranking_dinero_idx on bluehaven_privado.ranking_pesca(dinero desc,capturas desc,usuario_id);
create index ranking_capturas_idx on bluehaven_privado.ranking_pesca(capturas desc,dinero desc,usuario_id);
insert into bluehaven_privado.ranking_pesca(usuario_id,usuario,dinero,capturas)
 select p.usuario_id,p.usuario,p.dinero,coalesce(c.total,0) from public.perfiles p
 left join (select usuario_id,sum(cantidad_capturada)::bigint total from public.capturas_usuario group by usuario_id)c using(usuario_id);
create function bluehaven_privado.actualizar_ranking_perfil() returns trigger
language plpgsql security definer set search_path='' as $$
begin
 insert into bluehaven_privado.ranking_pesca(usuario_id,usuario,dinero) values(new.usuario_id,new.usuario,new.dinero)
 on conflict(usuario_id) do update set usuario=excluded.usuario,dinero=excluded.dinero;
 return new;
end;
$$;
create trigger bluehaven_ranking_perfil after insert or update of dinero,usuario on public.perfiles for each row execute function bluehaven_privado.actualizar_ranking_perfil();
create function bluehaven_privado.actualizar_ranking_captura() returns trigger
language plpgsql security definer set search_path='' as $$
declare uid uuid;
begin
 if TG_OP='DELETE' then uid=old.usuario_id;else uid=new.usuario_id;end if;
 update bluehaven_privado.ranking_pesca set capturas=coalesce((select sum(cantidad_capturada) from public.capturas_usuario where usuario_id=uid),0) where usuario_id=uid;
 if TG_OP='DELETE' then return old;end if;
 return new;
end;
$$;
create trigger bluehaven_ranking_captura after insert or update or delete on public.capturas_usuario for each row execute function bluehaven_privado.actualizar_ranking_captura();
revoke all on function bluehaven_privado.actualizar_ranking_perfil(),bluehaven_privado.actualizar_ranking_captura() from public,anon,authenticated;
create function bluehaven_privado.leer_ranking(p_criterio text default 'dinero') returns jsonb
language plpgsql stable security definer set search_path='' as $$
declare orden text;respuesta jsonb;
begin
 if p_criterio='dinero' then orden='dinero desc,capturas desc,usuario_id';
 elsif p_criterio='capturas' then orden='capturas desc,dinero desc,usuario_id';
 else raise exception 'Clasificación inválida.' using errcode='22023';end if;
 -- orden proviene exclusivamente de las dos constantes anteriores, nunca del cliente.
 execute 'with puestos as (select usuario_id,usuario,dinero,capturas,row_number() over(order by '||orden||') puesto from bluehaven_privado.ranking_pesca), filas as (select puesto,case when bluehaven_privado.texto_ofensivo(usuario) then ''Pescador'' else usuario end nombre,dinero,capturas,coalesce(usuario_id=auth.uid(),false) es_tuyo from puestos) select jsonb_build_object(''jugadores'',coalesce((select jsonb_agg(to_jsonb(t) order by puesto) from (select * from filas order by puesto limit 20)t),''[]''::jsonb),''tu_puesto'',(select to_jsonb(f) from filas f where es_tuyo),''total_jugadores'',(select count(*) from puestos))' into respuesta;
 return respuesta;
end;
$$;
revoke all on function bluehaven_privado.leer_ranking(text) from public;
grant usage on schema bluehaven_privado to anon,authenticated;
grant execute on function bluehaven_privado.leer_ranking(text) to anon,authenticated;
create function public.bh_ranking(p_criterio text default 'dinero') returns jsonb
language sql stable security invoker set search_path='' as $$ select bluehaven_privado.leer_ranking(p_criterio); $$;
revoke all on function public.bh_ranking(text) from public;
grant execute on function public.bh_ranking(text) to anon,authenticated;
commit;
