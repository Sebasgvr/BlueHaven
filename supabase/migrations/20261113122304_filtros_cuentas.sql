-- Filtros para nuevas cuentas y cambios de email/nombre. Conserva cuentas y progreso existentes.
begin;
create function bluehaven_privado.normalizar_texto(texto text) returns text language sql immutable set search_path='' as $$
 select translate(lower(regexp_replace(normalize(coalesce(texto,''),NFKD),U&'[\0300-\036f\200B-\200D\FEFF]','','g')),'013457@$!','oieastasi');
$$;
create function bluehaven_privado.texto_ofensivo(texto text) returns boolean language plpgsql immutable set search_path='' as $$
declare token text; prohibidas text[]:=array['puto','puta','putos','putas','mierda','mierdas','carajo','carajos','cabron','cabrona','cabrones','boludo','boluda','boludos','boludas','pelotudo','pelotuda','pelotudos','pelotudas','pendejo','pendeja','pendejos','pendejas','gilipollas','maricon','maricones','hdp','hijodeputa','hijadeputa','conchadetumadre','forro','forra','forros','forras','imbecil','imbeciles','idiota','idiotas','estupido','estupida','estupidos','estupidas','fuck','fucker','fucking','shit','bitch','asshole'];
begin
 for token in select regexp_split_to_table(coalesce(texto,''),'[^[:alnum:]@$!]+') loop
  if bluehaven_privado.normalizar_texto(token)=any(prohibidas) or bluehaven_privado.normalizar_texto(regexp_replace(token,'^[0-9]+|[0-9]+$','','g'))=any(prohibidas) then return true;end if;
 end loop;
 return regexp_replace(bluehaven_privado.normalizar_texto(texto),'[^a-z]','','g')=any(prohibidas);
end;
$$;
create function bluehaven_privado.validar_email(texto text) returns void language plpgsql immutable set search_path='' as $f$
declare email text:=lower(trim(coalesce(texto,''))); dominio text:=split_part(email,'@',2); nombre text:=split_part(email,'@',1);
begin
 if length(email)>254 or length(nombre)>64 or email!~$re$^[a-z0-9!#$%&'*+\-/=?^_`{|}~]+(?:\.[a-z0-9!#$%&'*+\-/=?^_`{|}~]+)*@[a-z0-9.-]+$$re$ then raise exception 'Ingresá un email válido.' using errcode='23514';end if;
 if not (dominio=any(array['gmail.com','googlemail.com','hotmail.com','hotmail.es','hotmail.com.ar','outlook.com','outlook.es','outlook.com.ar','live.com','live.com.ar','live.com.mx','msn.com','yahoo.com','yahoo.es','yahoo.com.ar','yahoo.com.mx','ymail.com','rocketmail.com','icloud.com','me.com','mac.com','proton.me','protonmail.com','pm.me','aol.com','gmx.com','gmx.net','mail.com','zoho.com'])) then raise exception 'Proveedor de correo no permitido.' using errcode='23514';end if;
 if bluehaven_privado.texto_ofensivo(nombre) then raise exception 'El correo contiene palabras no permitidas.' using errcode='23514';end if;
end;
$f$;
create function bluehaven_privado.validar_nombre(texto text) returns void language plpgsql immutable set search_path='' as $$
begin
 if texto is null or length(trim(texto)) not between 1 and 50 then raise exception 'El nombre debe tener entre 1 y 50 caracteres.' using errcode='23514';end if;
 if bluehaven_privado.texto_ofensivo(texto) then raise exception 'Elegí un nombre sin palabras ofensivas.' using errcode='23514';end if;
end;
$$;
create function bluehaven_privado.validar_cuenta_auth() returns trigger language plpgsql set search_path='' as $$
begin
 if TG_OP='INSERT' then
  perform bluehaven_privado.validar_email(new.email);
  perform bluehaven_privado.validar_nombre(coalesce(nullif(trim(new.raw_user_meta_data->>'usuario'),''),'Pescador'));
 else
  if coalesce(new.email_change,'')<>'' and new.email_change is distinct from old.email_change then perform bluehaven_privado.validar_email(new.email_change);end if;
  if new.email is distinct from old.email then perform bluehaven_privado.validar_email(new.email);end if;
  if new.raw_user_meta_data->>'usuario' is distinct from old.raw_user_meta_data->>'usuario' then perform bluehaven_privado.validar_nombre(coalesce(nullif(trim(new.raw_user_meta_data->>'usuario'),''),'Pescador'));end if;
 end if;
 return new;
end;
$$;
create trigger bluehaven_validar_cuenta before insert or update of email,email_change,raw_user_meta_data on auth.users for each row execute function bluehaven_privado.validar_cuenta_auth();
create function bluehaven_privado.validar_nombre_perfil() returns trigger language plpgsql set search_path='' as $$
begin
 if TG_OP='INSERT' then perform bluehaven_privado.validar_nombre(new.usuario);
 elsif new.usuario is distinct from old.usuario then perform bluehaven_privado.validar_nombre(new.usuario);end if;
 return new;
end;
$$;
create trigger bluehaven_validar_nombre before insert or update of usuario on public.perfiles for each row execute function bluehaven_privado.validar_nombre_perfil();
revoke all on function bluehaven_privado.normalizar_texto(text),bluehaven_privado.texto_ofensivo(text),bluehaven_privado.validar_email(text),bluehaven_privado.validar_nombre(text),bluehaven_privado.validar_cuenta_auth(),bluehaven_privado.validar_nombre_perfil() from public,anon,authenticated;
grant usage on schema bluehaven_privado to supabase_auth_admin;
grant execute on function bluehaven_privado.normalizar_texto(text),bluehaven_privado.texto_ofensivo(text),bluehaven_privado.validar_email(text),bluehaven_privado.validar_nombre(text),bluehaven_privado.validar_cuenta_auth() to supabase_auth_admin;
commit;
