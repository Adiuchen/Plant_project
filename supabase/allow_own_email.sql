-- Run once in the Supabase SQL Editor.
-- A user may save their own email. Role, status, and login ID stay with the administrator.

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

  if new.uuid is distinct from old.uuid
     or new.role is distinct from old.role
     or new.status is distinct from old.status
     or new.id is distinct from old.id then
    raise exception '只有管理员可以修改角色、账号状态或登录 ID';
  end if;

  if new.email is distinct from old.email and old.uuid is distinct from auth.uid() then
    raise exception '只能修改自己的 email';
  end if;

  return new;
end;
$$;
