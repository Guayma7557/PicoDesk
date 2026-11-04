-- ==========================================================================
-- Registros.sql
-- Ejecutar en Supabase: SQL Editor -> New query -> pegar -> Run.
-- Es seguro volver a ejecutarlo (aunque ya hayas ejecutado la versión
-- anterior): si las tablas ya existen no da ningún error ni mensaje, y la
-- función se reemplaza por la nueva.
-- ==========================================================================

-- Cifrado de contraseñas (bcrypt). En Supabase vive en el esquema "extensions".
create extension if not exists pgcrypto with schema extensions;

-- --------------------------------------------------------------------------
-- Tabla Registros: datos personales. DNI es la clave primaria.
-- "Confirmar contraseña" no se guarda. La contraseña se guarda como hash.
-- --------------------------------------------------------------------------
create table if not exists public."Registros" (
    dni            text primary key check (dni ~ '^[0-9]{7,8}$'),
    nombre         text not null check (char_length(btrim(nombre))   between 1 and 60),
    apellido       text not null check (char_length(btrim(apellido)) between 1 and 60),
    contrasena_hash text not null,
    creado_en      timestamptz not null default now()
);

-- --------------------------------------------------------------------------
-- Tabla Info-Escolar: datos escolares. El DNI es a la vez la clave primaria
-- (un registro escolar por persona) y la clave foránea hacia "Registros".
-- Si se borra una persona de "Registros", se borra también su info escolar.
-- --------------------------------------------------------------------------
create table if not exists public."Info-Escolar" (
    dni             text primary key
                    references public."Registros" (dni) on delete cascade,
    establecimiento text not null check (char_length(btrim(establecimiento)) between 1 and 100),
    especialidad    text not null check (char_length(btrim(especialidad))    between 1 and 100),
    curso           text not null check (char_length(btrim(curso))           between 1 and 20),
    division        text not null check (char_length(btrim(division))        between 1 and 20)
);

-- --------------------------------------------------------------------------
-- Seguridad: con RLS activado y SIN políticas, nadie puede leer ni escribir
-- las tablas directamente con la clave pública (anon). Solo se puede
-- registrar a través de la función de abajo.
-- --------------------------------------------------------------------------
alter table public."Registros"    enable row level security;
alter table public."Info-Escolar" enable row level security;

-- --------------------------------------------------------------------------
-- Función de alta: valida todo, cifra la contraseña en el servidor e inserta
-- en las dos tablas dentro de la misma transacción: o se guardan las dos o
-- no se guarda ninguna. Si el DNI ya existe, la base devuelve el error 23505.
-- --------------------------------------------------------------------------

-- Se elimina la versión anterior (4 parámetros) para que no quede una puerta
-- vieja disponible.
drop function if exists public.registrar_usuario(text, text, text, text);

create or replace function public.registrar_usuario(
    p_dni             text,
    p_nombre          text,
    p_apellido        text,
    p_password        text,
    p_establecimiento text,
    p_especialidad    text,
    p_curso           text,
    p_division        text
)
returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
    if p_dni is null or p_dni !~ '^[0-9]{7,8}$' then
        raise exception 'DNI inválido';
    end if;

    if p_nombre is null or char_length(btrim(p_nombre)) not between 1 and 60
       or p_apellido is null or char_length(btrim(p_apellido)) not between 1 and 60 then
        raise exception 'Nombre o apellido inválido';
    end if;

    -- bcrypt solo usa los primeros 72 caracteres, por eso el máximo.
    if p_password is null or char_length(p_password) not between 8 and 72
       or p_password !~ '[A-Z]' or p_password !~ '[0-9]' then
        raise exception 'Contraseña inválida';
    end if;

    if p_establecimiento is null or char_length(btrim(p_establecimiento)) not between 1 and 100
       or p_especialidad is null or char_length(btrim(p_especialidad)) not between 1 and 100
       or p_curso is null        or char_length(btrim(p_curso))        not between 1 and 20
       or p_division is null     or char_length(btrim(p_division))     not between 1 and 20 then
        raise exception 'Datos escolares inválidos';
    end if;

    insert into public."Registros" (dni, nombre, apellido, contrasena_hash)
    values (p_dni, btrim(p_nombre), btrim(p_apellido), crypt(p_password, gen_salt('bf', 10)));

    insert into public."Info-Escolar" (dni, establecimiento, especialidad, curso, division)
    values (p_dni, btrim(p_establecimiento), btrim(p_especialidad), btrim(p_curso), btrim(p_division));
end;
$$;

revoke all on function public.registrar_usuario(text, text, text, text, text, text, text, text) from public;
grant execute on function public.registrar_usuario(text, text, text, text, text, text, text, text) to anon, authenticated;

-- ==========================================================================
-- INICIO DE SESIÓN
-- ==========================================================================

-- --------------------------------------------------------------------------
-- intentos_login: cuenta los intentos fallidos por DNI para frenar ataques
-- de fuerza bruta. A los 5 fallos seguidos, ese DNI queda bloqueado 15
-- minutos. Con RLS y sin políticas, solo la función de abajo la puede usar.
-- --------------------------------------------------------------------------
create table if not exists public.intentos_login (
    dni             text primary key,
    fallos          integer not null default 0,
    bloqueado_hasta timestamptz
);

alter table public.intentos_login enable row level security;

-- --------------------------------------------------------------------------
-- Función de login: compara la contraseña con el hash guardado. Devuelve un
-- JSON en lugar de lanzar un error, para que el conteo de fallos no se
-- deshaga. Usa el mismo mensaje si el DNI no existe o la contraseña es
-- incorrecta, así no se puede averiguar qué DNI están registrados.
-- Respuestas:
--   {"ok": true,  "nombre": "...", "apellido": "..."}
--   {"ok": false, "motivo": "credenciales"}   (DNI o contraseña incorrectos)
--   {"ok": false, "motivo": "bloqueado"}      (demasiados intentos)
-- --------------------------------------------------------------------------
create or replace function public.iniciar_sesion(
    p_dni      text,
    p_password text
)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
    v_registro     public."Registros"%rowtype;
    v_intento      public.intentos_login%rowtype;
    v_hay_registro boolean;
    v_hay_intento  boolean;
    v_ok           boolean;
begin
    if p_dni is null or p_dni !~ '^[0-9]{7,8}$'
       or p_password is null or char_length(p_password) not between 1 and 72 then
        return jsonb_build_object('ok', false, 'motivo', 'credenciales');
    end if;

    -- ¿Está bloqueado este DNI?
    select * into v_intento from public.intentos_login where dni = p_dni;
    v_hay_intento := found;

    if v_hay_intento and v_intento.bloqueado_hasta is not null then
        if v_intento.bloqueado_hasta > now() then
            return jsonb_build_object('ok', false, 'motivo', 'bloqueado');
        end if;
        -- El bloqueo ya venció: se reinicia el contador.
        update public.intentos_login
           set fallos = 0, bloqueado_hasta = null
         where dni = p_dni;
    end if;

    select * into v_registro from public."Registros" where dni = p_dni;
    v_hay_registro := found;

    if v_hay_registro then
        v_ok := (v_registro.contrasena_hash = crypt(p_password, v_registro.contrasena_hash));
    else
        -- Se hace el mismo cálculo aunque el DNI no exista, para que la
        -- respuesta tarde parecido y no delate qué DNI están registrados.
        perform crypt(p_password, gen_salt('bf', 10));
        v_ok := false;
    end if;

    if v_ok then
        delete from public.intentos_login where dni = p_dni;
        return jsonb_build_object(
            'ok', true,
            'nombre', v_registro.nombre,
            'apellido', v_registro.apellido
        );
    end if;

    -- Contraseña incorrecta: se suma un fallo y, al quinto, se bloquea.
    insert into public.intentos_login as i (dni, fallos)
    values (p_dni, 1)
    on conflict (dni) do update
        set fallos = i.fallos + 1,
            bloqueado_hasta = case
                when i.fallos + 1 >= 5 then now() + interval '15 minutes'
                else null
            end;

    return jsonb_build_object('ok', false, 'motivo', 'credenciales');
end;
$$;

revoke all on function public.iniciar_sesion(text, text) from public;
grant execute on function public.iniciar_sesion(text, text) to anon, authenticated;