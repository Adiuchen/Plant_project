-- Run this once in the Supabase SQL Editor.
-- profiles becomes: uuid, id, name, email, role, status, created_at, updated_at
-- uuid links to Authentication. id is the login ID, such as B001 or O001.

drop policy if exists profiles_select on public.profiles;
drop policy if exists profiles_insert on public.profiles;
drop policy if exists profiles_update on public.profiles;

alter table public.profiles rename column id to uuid;
alter table public.profiles rename column full_name to name;

alter table public.profiles add column if not exists id text;

update public.profiles
set id = email
where id is null
  and email ~* '^[BO][0-9]+$';

update public.profiles
set email = null
where email ~* '^[BO][0-9]+$';

update public.profiles
set id = 'M001'
where role = 'administrator'
  and id is null;

alter table public.profiles alter column id set not null;
create unique index if not exists profiles_login_id_key on public.profiles (id);

create or replace function public.my_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role
  from public.profiles
  where uuid = auth.uid()
    and status = 'active'
$$;

create or replace function public.protect_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    return new;
  end if;

  if public.my_role() = 'administrator' then
    return new;
  end if;

  if new.role is distinct from old.role
     or new.status is distinct from old.status
     or new.email is distinct from old.email
     or new.id is distinct from old.id then
    raise exception '只有管理员可以修改角色、账号状态、email 或登录 ID';
  end if;

  return new;
end;
$$;

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
