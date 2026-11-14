-- Solo stack efímero local; los cambios se revierten.
begin;
do $$
declare a uuid; b uuid; r jsonb; codigo text; canal text;
begin
 select usuario_id into a from public.perfiles order by usuario_id limit 1;
 select usuario_id into b from public.perfiles where usuario_id<>a order by usuario_id limit 1;
 perform set_config('request.jwt.claim.sub',a::text,true);
 r:=public.bh_sala('crear','',gen_random_uuid());codigo:=r->>'codigo';canal:=r->>'canal';
 if not bluehaven_privado.puede_entrar_sala(canal) then raise exception 'El miembro debe poder entrar';end if;
 perform set_config('request.jwt.claim.sub',b::text,true);
 if bluehaven_privado.puede_entrar_sala(canal) then raise exception 'No debe autorizar a otro usuario';end if;
 update bluehaven_privado.sala_jugadores set visto=now()-interval '76 seconds' where usuario_id=a;
 perform set_config('request.jwt.claim.sub',a::text,true);
 if bluehaven_privado.puede_entrar_sala(canal) then raise exception 'Un lease vencido no autoriza';end if;
 perform set_config('request.jwt.claim.sub',b::text,true);
 r:=public.bh_sala('unir',codigo,gen_random_uuid());
 if jsonb_array_length(r->'jugadores')<>1 then raise exception 'La plaza inactiva debe liberarse';end if;
 update bluehaven_privado.salas set vence=now()-interval '1 second' where 'bh-sala:'||id::text=canal;
 if bluehaven_privado.puede_entrar_sala(canal) then raise exception 'La sala vencida no autoriza';end if;
 if has_table_privilege('authenticated','bluehaven_privado.salas','SELECT') or has_table_privilege('anon','bluehaven_privado.sala_jugadores','INSERT') or has_function_privilege('anon','public.bh_sala(text,text,uuid)','EXECUTE') then raise exception 'Permisos excesivos';end if;
 raise notice 'Salas: lease, caducidad, autorización por miembro y permisos mínimos OK';
end $$;
rollback;
