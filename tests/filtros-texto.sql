begin;
do $$
declare texto text;
begin
 foreach texto in array array['sos un p.u.t.o','boludo!!!','mierdaaaa','sos un p4j3r0','hola h i j o de p u t a','pútá','boludo123','put@','p' || chr(8203) || 'uto'] loop
  if not bluehaven_privado.texto_ofensivo(texto) then raise exception 'El servidor dejó pasar: %',texto;end if;
 end loop;
 foreach texto in array array['Maricarmen','Computadora','Concepción','Amparo','Pescador 2026','Carmelo','¿Dónde vive el Atún?','Hola al lago'] loop
  if bluehaven_privado.texto_ofensivo(texto) then raise exception 'Falso positivo: %',texto;end if;
 end loop;
 if has_function_privilege('anon','bluehaven_privado.validar_pregunta_chatbot()','EXECUTE') or has_function_privilege('authenticated','bluehaven_privado.validar_pregunta_chatbot()','EXECUTE') then raise exception 'El trigger no debe exponerse por API';end if;
 raise notice 'Filtro de texto: ofensas disimuladas, nombres legítimos y permisos OK';
end;
$$;
rollback;
