-- Denegación explícita como defensa ante futuros grants accidentales.
-- Solo las funciones internas del propietario leen o escriben esta proyección.
begin;
create policy ranking_solo_funciones_internas on bluehaven_privado.ranking_pesca
 for all to anon,authenticated using(false) with check(false);
commit;
