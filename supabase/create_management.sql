-- Run this once in Supabase SQL Editor.
-- It finds the Authentication user by email and gives them login ID "management".
-- You do not paste a UUID.

alter table public.profiles add column if not exists login_id text;

create unique index if not exists profiles_login_id_key on public.profiles (login_id);

do $$
declare
  uid uuid;
begin
  select id into uid
  from auth.users
  where email = 'management@plantrecords.com';

  if uid is null then
    raise exception 'Add the user in Authentication first: management@plantrecords.com';
  end if;

  insert into public.profiles (id, full_name, login_id, email, role)
  values (uid, 'Management', 'management', 'management@plantrecords.com', 'administrator')
  on conflict (id) do update
    set login_id = 'management',
        role = 'administrator',
        full_name = 'Management';
end $$;
