begin;
create schema if not exists bluehaven_privado;
revoke all on schema bluehaven_privado from public,anon,authenticated;
alter table public.perfiles add column equipamiento jsonb not null default '{"cana":"basica","cebo":"sin_cebo","anzuelo":"simple"}'::jsonb;
create table public.productos_pesca (
 id text primary key, categoria text not null check(categoria in ('cana','cebo','anzuelo')),
 nombre text not null, precio integer not null check(precio>=0),unidades integer not null check(unidades>0),
 consumible boolean not null default false,descripcion text not null,efectos jsonb not null default '{}'::jsonb
);
create table public.equipo_usuario (
 usuario_id uuid not null references public.perfiles(usuario_id) on delete cascade,
 producto_id text not null references public.productos_pesca(id),cantidad integer not null check(cantidad>=0),
 primary key(usuario_id,producto_id)
);
create index equipo_producto_idx on public.equipo_usuario(producto_id);
create table public.compras_pesca (
 usuario_id uuid not null references public.perfiles(usuario_id) on delete cascade,token uuid not null,
 producto_id text not null references public.productos_pesca(id),creado_en timestamptz not null default now(),
 primary key(usuario_id,token)
);
create index compras_producto_idx on public.compras_pesca(producto_id);
alter table public.productos_pesca enable row level security;
alter table public.equipo_usuario enable row level security;
alter table public.compras_pesca enable row level security;
create policy catalogo_equipo on public.productos_pesca for select to authenticated using(true);
create policy equipo_propio on public.equipo_usuario for select to authenticated using(usuario_id=(select auth.uid()));
create policy compras_propias on public.compras_pesca for select to authenticated using(usuario_id=(select auth.uid()));
revoke all on public.productos_pesca,public.equipo_usuario,public.compras_pesca from public,anon,authenticated;
grant select on public.productos_pesca,public.equipo_usuario,public.compras_pesca to authenticated;
-- PRODUCTOS_GENERADOS
insert into public.productos_pesca select p.id,p.categoria,p.nombre,p.precio,p.unidades,p.consumible,p.descripcion,p.efectos from jsonb_to_recordset($productos$[{"id":"basica","categoria":"cana","nombre":"Caña básica","precio":0,"unidades":1,"consumible":false,"descripcion":"Tu equipo inicial. Sin bonificaciones.","efectos":{}},{"id":"bambu","categoria":"cana","nombre":"Caña de Bambú","precio":150,"unidades":1,"consumible":false,"descripcion":"Minijuegos un 15% más fáciles.","efectos":{"dificultad":0.85}},{"id":"metal","categoria":"cana","nombre":"Caña de Metal","precio":500,"unidades":1,"consumible":false,"descripcion":"Minijuegos un 25% más fáciles.","efectos":{"dificultad":0.75}},{"id":"sin_cebo","categoria":"cebo","nombre":"Sin cebo","precio":0,"unidades":1,"consumible":false,"descripcion":"Pesca sin gastar consumibles.","efectos":{}},{"id":"lombriz","categoria":"cebo","nombre":"Lombrices","precio":35,"unidades":5,"consumible":true,"descripcion":"5 lanzamientos. La picada llega un 30% antes.","efectos":{"espera":0.7}},{"id":"marisco","categoria":"cebo","nombre":"Mariscos","precio":75,"unidades":5,"consumible":true,"descripcion":"5 lanzamientos. Aumenta el peso de especies raras un 25% por nivel de rareza.","efectos":{"atraccion":0.25}},{"id":"simple","categoria":"anzuelo","nombre":"Anzuelo simple","precio":0,"unidades":1,"consumible":false,"descripcion":"Tu anzuelo inicial.","efectos":{}},{"id":"precision","categoria":"anzuelo","nombre":"Anzuelo de precisión","precio":90,"unidades":1,"consumible":false,"descripcion":"Tenés 0,15 segundos más para enganchar.","efectos":{"enganche":0.15}},{"id":"reforzado","categoria":"anzuelo","nombre":"Anzuelo reforzado","precio":200,"unidades":1,"consumible":false,"descripcion":"Reduce un 10% la dificultad del minijuego.","efectos":{"dificultad":0.9}}]$productos$::jsonb) as p(id text,categoria text,nombre text,precio integer,unidades integer,consumible boolean,descripcion text,efectos jsonb);
insert into public.equipo_usuario(usuario_id,producto_id,cantidad) select usuario_id,'bambu',1 from public.perfiles where tiene_bambu on conflict do nothing;
update public.perfiles set equipamiento=jsonb_set(equipamiento,'{cana}','"bambu"') where tiene_bambu;

create function bluehaven_privado.estado_tienda(uid uuid) returns jsonb language sql stable security definer set search_path='' as $$
 select jsonb_build_object(
 'dinero',p.dinero,'equipo',p.equipamiento,
 'objetos',jsonb_build_object('basica',1,'sin_cebo',1,'simple',1,'bambu',case when p.tiene_bambu then 1 else 0 end) ||
   coalesce((select jsonb_object_agg(e.producto_id,e.cantidad) from public.equipo_usuario e where e.usuario_id=uid),'{}'::jsonb),
 'productos',(select jsonb_agg(to_jsonb(a) order by a.categoria,a.precio,a.id) from public.productos_pesca a))
 from public.perfiles p where p.usuario_id=uid;
$$;
revoke all on function bluehaven_privado.estado_tienda(uuid) from public,anon,authenticated;

create function public.bh_tienda_estado() returns jsonb language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null then raise exception 'Iniciá sesión.' using errcode='28000';end if;
 return bluehaven_privado.estado_tienda(auth.uid());
end;
$$;
create function public.bh_comprar_producto(p_producto_id text,p_token uuid) returns jsonb language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid();perfil public.perfiles;producto public.productos_pesca;anterior text;
begin
 if uid is null then raise exception 'Iniciá sesión.' using errcode='28000';end if;
 if p_token is null then raise exception 'Compra inválida.' using errcode='22023';end if;
 select * into perfil from public.perfiles where usuario_id=uid for update;
 if not found then raise exception 'Perfil inexistente.';end if;
 select producto_id into anterior from public.compras_pesca where usuario_id=uid and token=p_token;
 if found then
   if anterior<>p_producto_id then raise exception 'Identificador de compra ya utilizado.';end if;
   return bluehaven_privado.estado_tienda(uid);
 end if;
 select * into producto from public.productos_pesca where id=p_producto_id;
 if not found or producto.precio=0 then raise exception 'Artículo no disponible para comprar.' using errcode='22023';end if;
 if not producto.consumible and (exists(select 1 from public.equipo_usuario where usuario_id=uid and producto_id=p_producto_id and cantidad>0) or (p_producto_id='bambu' and perfil.tiene_bambu)) then
   raise exception 'Ya tenés este artículo.' using errcode='22023';
 end if;
 if perfil.dinero<producto.precio then raise exception 'No tenés suficiente dinero.' using errcode='22023';end if;
 update public.perfiles set dinero=dinero-producto.precio,tiene_bambu=tiene_bambu or p_producto_id='bambu' where usuario_id=uid;
 insert into public.equipo_usuario(usuario_id,producto_id,cantidad) values(uid,p_producto_id,producto.unidades)
 on conflict(usuario_id,producto_id) do update set cantidad=public.equipo_usuario.cantidad+excluded.cantidad;
 insert into public.compras_pesca(usuario_id,token,producto_id) values(uid,p_token,p_producto_id);
 return bluehaven_privado.estado_tienda(uid);
end;
$$;
create function public.bh_equipar_producto(p_producto_id text) returns jsonb language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid();perfil public.perfiles;producto public.productos_pesca;
begin
 if uid is null then raise exception 'Iniciá sesión.' using errcode='28000';end if;
 select * into perfil from public.perfiles where usuario_id=uid for update;
 if not found then raise exception 'Perfil inexistente.';end if;
 select * into producto from public.productos_pesca where id=p_producto_id;
 if not found then raise exception 'Artículo inexistente.' using errcode='22023';end if;
 if producto.precio>0 and not exists(select 1 from public.equipo_usuario where usuario_id=uid and producto_id=p_producto_id and cantidad>0) and not(p_producto_id='bambu' and perfil.tiene_bambu) then
   raise exception 'Primero comprá este artículo.' using errcode='22023';
 end if;
 update public.perfiles set equipamiento=jsonb_set(equipamiento,array[producto.categoria],to_jsonb(p_producto_id)) where usuario_id=uid;
 return bluehaven_privado.estado_tienda(uid);
end;
$$;
create function public.bh_preparar_pesca() returns jsonb language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid();perfil public.perfiles;producto public.productos_pesca;efecto jsonb;
 dificultad numeric:=1;espera numeric:=1;enganche numeric:=0;atraccion numeric:=0;cebo text;cantidad_actual integer;
begin
 if uid is null then raise exception 'Iniciá sesión.' using errcode='28000';end if;
 select * into perfil from public.perfiles where usuario_id=uid for update;
 if not found then raise exception 'Perfil inexistente.';end if;
 cebo:=perfil.equipamiento->>'cebo';
 if cebo<>'sin_cebo' then
   select cantidad into cantidad_actual from public.equipo_usuario where usuario_id=uid and producto_id=cebo;
   if coalesce(cantidad_actual,0)<1 then cebo:='sin_cebo';perfil.equipamiento:=jsonb_set(perfil.equipamiento,'{cebo}','"sin_cebo"');end if;
 end if;
 for producto in select * from public.productos_pesca where id in(perfil.equipamiento->>'cana',cebo,perfil.equipamiento->>'anzuelo') loop
   efecto:=producto.efectos;
   dificultad:=dificultad*coalesce((efecto->>'dificultad')::numeric,1);
   espera:=espera*coalesce((efecto->>'espera')::numeric,1);
   enganche:=enganche+coalesce((efecto->>'enganche')::numeric,0);
   atraccion:=atraccion+coalesce((efecto->>'atraccion')::numeric,0);
 end loop;
 if cebo<>'sin_cebo' then
   update public.equipo_usuario set cantidad=cantidad-1 where usuario_id=uid and producto_id=cebo returning cantidad into cantidad_actual;
   if cantidad_actual=0 then perfil.equipamiento:=jsonb_set(perfil.equipamiento,'{cebo}','"sin_cebo"');end if;
 end if;
 update public.perfiles set equipamiento=perfil.equipamiento where usuario_id=uid;
 return jsonb_build_object('estado',bluehaven_privado.estado_tienda(uid),'efectos',jsonb_build_object('dificultad',dificultad,'espera',espera,'enganche',enganche,'atraccion',atraccion));
end;
$$;
revoke all on function public.bh_tienda_estado(),public.bh_comprar_producto(text,uuid),public.bh_equipar_producto(text),public.bh_preparar_pesca() from public,anon;
grant execute on function public.bh_tienda_estado(),public.bh_comprar_producto(text,uuid),public.bh_equipar_producto(text),public.bh_preparar_pesca() to authenticated;
commit;
