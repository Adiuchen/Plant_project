-- Run once in the Supabase SQL Editor.
-- species.id becomes S001, S002.
-- plant_records.id becomes P001, P002.
-- uuid stays the link used by photos and sensors.

drop view if exists public.public_plant_photos;
drop view if exists public.public_plant_pages;

alter table public.species rename column id to uuid;
alter table public.species add column id text;

with numbered as (
  select uuid, row_number() over (order by created_at, uuid) as n
  from public.species
)
update public.species as species
set id = 'S' || lpad(numbered.n::text, 3, '0')
from numbered
where species.uuid = numbered.uuid
  and species.id is null;

alter table public.species alter column id set not null;
create unique index if not exists species_id_key on public.species (id);

alter table public.plant_records rename column id to uuid;
alter table public.plant_records add column id text;

with numbered as (
  select uuid, row_number() over (order by created_at, uuid) as n
  from public.plant_records
)
update public.plant_records as plant
set id = 'P' || lpad(numbered.n::text, 3, '0')
from numbered
where plant.uuid = numbered.uuid
  and plant.id is null;

alter table public.plant_records alter column id set not null;
create unique index if not exists plant_records_id_key on public.plant_records (id);

create or replace function public.record_is_public(record_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.plant_records
    where uuid = record_id
      and status = 'approved'
      and qr_code is not null
  )
$$;

drop policy if exists plant_photos_insert on public.plant_photos;
create policy plant_photos_insert on public.plant_photos
for insert to authenticated
with check (
  uploaded_by = auth.uid()
  and (
    (
      public.my_role() = 'botanist'
      and plant_record_id is not null
      and exists (
        select 1
        from public.plant_records
        where uuid = plant_record_id
          and botanist_id = auth.uid()
      )
    )
    or (
      public.my_role() = 'conservation_officer'
      and species_id is not null
    )
  )
);

create or replace function public.assign_species_id()
returns trigger
language plpgsql
as $$
declare
  next_number int;
begin
  if new.id is null or new.id = '' then
    select coalesce(max(substring(id from 2)::int), 0) + 1
    into next_number
    from public.species
    where id ~ '^S[0-9]+$';
    new.id := 'S' || lpad(next_number::text, 3, '0');
  end if;
  return new;
end;
$$;

drop trigger if exists species_assign_id on public.species;
create trigger species_assign_id
before insert on public.species
for each row execute function public.assign_species_id();

create or replace function public.assign_plant_record_id()
returns trigger
language plpgsql
as $$
declare
  next_number int;
begin
  if new.id is null or new.id = '' then
    select coalesce(max(substring(id from 2)::int), 0) + 1
    into next_number
    from public.plant_records
    where id ~ '^P[0-9]+$';
    new.id := 'P' || lpad(next_number::text, 3, '0');
  end if;
  return new;
end;
$$;

drop trigger if exists plant_records_assign_id on public.plant_records;
create trigger plant_records_assign_id
before insert on public.plant_records
for each row execute function public.assign_plant_record_id();

create view public.public_plant_pages
with (security_invoker = false) as
select
  r.qr_code,
  r.id as record_id,
  s.scientific_name,
  s.common_name,
  s.local_name,
  s.family,
  s.genus,
  s.description,
  s.conservation_status,
  s.distribution,
  s.ecological_info,
  s.cultural_significance,
  r.health_status
from public.plant_records r
join public.species s on s.uuid = r.species_id
where r.status = 'approved'
  and r.qr_code is not null;

create view public.public_plant_photos
with (security_invoker = false) as
select
  p.id,
  p.storage_path,
  p.caption,
  p.species_id,
  p.plant_record_id,
  r.qr_code
from public.plant_photos p
left join public.plant_records r on r.uuid = p.plant_record_id
where p.species_id is not null
   or (r.status = 'approved' and r.qr_code is not null);

grant select on public.public_plant_pages to anon, authenticated;
grant select on public.public_plant_photos to anon, authenticated;
