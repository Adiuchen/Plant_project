-- Run once in the Supabase SQL Editor.
-- Puts profiles columns in this order:
-- uuid, id, name, email, role, status, created_at, updated_at

create table public.profiles_new (
  uuid uuid primary key references auth.users (id) on delete cascade,
  id text not null unique,
  name text not null,
  email text,
  role text not null check (
    role in ('botanist', 'conservation_officer', 'administrator', 'visitor')
  ),
  status text not null default 'active' check (status in ('active', 'suspended')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.profiles_new (uuid, id, name, email, role, status, created_at, updated_at)
select uuid, id, name, email, role, status, created_at, updated_at
from public.profiles;

alter table public.profiles rename to profiles_old;

do $$
declare
  fk record;
begin
  for fk in
    select con.conname, rel.relname
    from pg_constraint con
    join pg_class rel on rel.oid = con.conrelid
    join pg_class ref on ref.oid = con.confrelid
    join pg_namespace nsp on nsp.oid = rel.relnamespace
    where ref.relname = 'profiles_old'
      and nsp.nspname = 'public'
      and con.contype = 'f'
  loop
    execute format('alter table public.%I drop constraint %I', fk.relname, fk.conname);
  end loop;
end $$;

alter table public.profiles_new rename to profiles;

alter table public.species
  add constraint species_created_by_fkey
  foreign key (created_by) references public.profiles (uuid);

alter table public.plant_records
  add constraint plant_records_botanist_id_fkey
  foreign key (botanist_id) references public.profiles (uuid);

alter table public.plant_records
  add constraint plant_records_reviewed_by_fkey
  foreign key (reviewed_by) references public.profiles (uuid);

alter table public.plant_photos
  add constraint plant_photos_uploaded_by_fkey
  foreign key (uploaded_by) references public.profiles (uuid);

alter table public.alerts
  add constraint alerts_handled_by_fkey
  foreign key (handled_by) references public.profiles (uuid);

alter table public.login_logs
  add constraint login_logs_user_id_fkey
  foreign key (user_id) references public.profiles (uuid) on delete cascade;

drop table public.profiles_old;

alter table public.profiles enable row level security;

drop policy if exists profiles_select on public.profiles;
drop policy if exists profiles_insert on public.profiles;
drop policy if exists profiles_update on public.profiles;

create policy profiles_select on public.profiles
for select to authenticated
using (
  uuid = auth.uid()
  or public.my_role() in ('administrator', 'conservation_officer')
);

create policy profiles_insert on public.profiles
for insert to authenticated
with check (public.my_role() = 'administrator');

create policy profiles_update on public.profiles
for update to authenticated
using (uuid = auth.uid() or public.my_role() = 'administrator')
with check (uuid = auth.uid() or public.my_role() = 'administrator');

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists profiles_protect on public.profiles;
create trigger profiles_protect
before update on public.profiles
for each row execute function public.protect_profile();
