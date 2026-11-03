-- ==========================================================================
-- Registros.sql
-- Ejecutar UNA sola vez en Supabase: SQL Editor -> New query -> pegar -> Run.
-- Es seguro volver a ejecutarlo: si la tabla o la función ya existen, no
-- da ningún error ni mensaje.
-- ==========================================================================

-- Cifrado de contraseñas (bcrypt). En Supabase vive en el esquema "extensions".
create extension if not exists pgcrypto with schema extensions;

-- --------------------------------------------------------------------------
-- Tabla Registros: solo datos personales. DNI es la clave primaria.
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
-- Seguridad: con RLS activado y SIN políticas, nadie puede leer ni escribir
-- la tabla directamente con la clave pública (anon). Solo se puede registrar
-- a través de la función de abajo.
-- --------------------------------------------------------------------------
alter table public."Registros" enable row level security;

-- --------------------------------------------------------------------------
-- Función de alta: valida los datos, cifra la contraseña en el servidor y
-- inserta. Si el DNI ya existe, la base devuelve el error 23505.
-- --------------------------------------------------------------------------
create or replace function public.registrar_usuario(
    p_dni      text,
    p_nombre   text,
    p_apellido text,
    p_password text
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

    insert into public."Registros" (dni, nombre, apellido, contrasena_hash)
    values (p_dni, btrim(p_nombre), btrim(p_apellido), crypt(p_password, gen_salt('bf', 10)));
end;
$$;

revoke all on function public.registrar_usuario(text, text, text, text) from public;
grant execute on function public.registrar_usuario(text, text, text, text) to anon, authenticated;