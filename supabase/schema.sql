-- Sprints BMX — esquema de Supabase
-- Corré esto una vez en el SQL Editor de tu proyecto de Supabase (Database > SQL Editor).

create table if not exists public.corredores (
  id uuid primary key references auth.users (id) on delete cascade,
  nombre text not null,
  categoria text,
  edad integer,
  creado_en timestamptz not null default now()
);

create table if not exists public.sesiones (
  id uuid primary key default gen_random_uuid(),
  corredor_id uuid not null references public.corredores (id) on delete cascade,
  fecha timestamptz not null default now(),
  distancia_metros integer not null,
  calentamiento_realizado boolean not null default false,
  notas text
);

create table if not exists public.intentos (
  id uuid primary key default gen_random_uuid(),
  sesion_id uuid not null references public.sesiones (id) on delete cascade,
  corredor_id uuid not null references public.corredores (id) on delete cascade,
  numero integer not null,
  audio_id text not null,
  tiempo_total_ms double precision not null,
  creado_en timestamptz not null default now()
);

create index if not exists sesiones_corredor_id_idx on public.sesiones (corredor_id);
create index if not exists intentos_sesion_id_idx on public.intentos (sesion_id);
create index if not exists intentos_corredor_id_idx on public.intentos (corredor_id);

alter table public.corredores enable row level security;
alter table public.sesiones enable row level security;
alter table public.intentos enable row level security;

create policy "corredores: dueño ve/edita su propio perfil"
  on public.corredores for all
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "sesiones: dueño ve/edita sus propias sesiones"
  on public.sesiones for all
  using (auth.uid() = corredor_id)
  with check (auth.uid() = corredor_id);

create policy "intentos: dueño ve/edita sus propios intentos"
  on public.intentos for all
  using (auth.uid() = corredor_id)
  with check (auth.uid() = corredor_id);

-- Al registrarse (supabase.auth.signUp con options.data = { nombre, categoria, edad }),
-- este trigger crea automáticamente la fila de perfil en "corredores".
create or replace function public.crear_perfil_corredor()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.corredores (id, nombre, categoria, edad)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'nombre', split_part(new.email, '@', 1)),
    new.raw_user_meta_data ->> 'categoria',
    nullif(new.raw_user_meta_data ->> 'edad', '')::integer
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.crear_perfil_corredor();

-- Metas: UNA meta de ritmo por corredor (segundos cada 10 metros), no por
-- distancia — así sirve sin importar qué distancia entrene ese día. Si ya
-- corriste este archivo antes, solo hace falta correr desde acá para abajo.
create table if not exists public.metas (
  corredor_id uuid primary key references public.corredores (id) on delete cascade,
  ritmo_objetivo_ms_por_10m double precision not null,
  creado_en timestamptz not null default now()
);

alter table public.metas enable row level security;

drop policy if exists "metas: dueño ve/edita sus propias metas" on public.metas;
create policy "metas: dueño ve/edita sus propias metas"
  on public.metas for all
  using (auth.uid() = corredor_id)
  with check (auth.uid() = corredor_id);
