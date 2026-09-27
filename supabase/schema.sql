-- Smart Ground-Truthing and Digital Biodiversity System
-- 在 Supabase → SQL Editor 里整段执行一次。
--
-- 这 8 张表分别做什么：
--   profiles         登录用户、角色、账号是否停用
--   species          植物品种知识（学名、俗名、保育状态等）
--   plant_records    植物学家在现场登记的一棵植物
--   plant_photos     照片路径（文件本身放在 Storage）
--   sensors          放在珍稀植物旁边的传感器
--   sensor_readings  温度、湿度、移动、位置的历史数据
--   alerts           干燥、高温、异常移动、可能被盗、传感器离线
--   login_logs       管理员查看的登录记录
--
-- 密码不放在这些表里。Supabase Authentication 负责登录和密码。
-- 游客不登录。他们只读下面两个 view，里面没有精确 GPS。

-- ---------------------------------------------------------------------------
-- 1. profiles  谁可以登录
-- role:   botanist | conservation_officer | administrator | visitor
-- status: active | suspended
-- ---------------------------------------------------------------------------
create table public.profiles (
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

comment on table public.profiles is
  '系统用户。角色：植物学家、保育官员、管理员、游客。停用账号把 status 改成 suspended。';

-- ---------------------------------------------------------------------------
-- 2. species  植物品种（知识库）
-- 这里只有大概分布地区，没有某一棵植物的精确 GPS。
-- ---------------------------------------------------------------------------
create table public.species (
  uuid uuid primary key default gen_random_uuid(),
  id text not null unique,
  scientific_name text not null,
  common_name text,
  local_name text,
  family text,
  genus text,
  description text,
  conservation_status text,
  distribution text,
  ecological_info text,
  cultural_significance text,
  created_by uuid references public.profiles (uuid),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.species is
  '植物品种知识。保育官员维护。游客可以搜索名称和阅读公开资料。';
comment on column public.species.distribution is
  '大概分布地区，例如 Niah National Park。不要填写精确坐标。';
comment on column public.species.conservation_status is
  '保育状态，例如 Least Concern、Vulnerable、Endangered、Critically Endangered。';

-- ---------------------------------------------------------------------------
-- 3. plant_records  现场记录（一棵植物）
-- status: draft | submitted | approved | rejected | needs_revision
-- sync_status: pending | synced
-- ---------------------------------------------------------------------------
create table public.plant_records (
  uuid uuid primary key default gen_random_uuid(),
  id text not null unique,
  local_id text unique,
  species_id uuid references public.species (uuid),
  botanist_id uuid not null references public.profiles (uuid),
  height_m numeric(8, 2),
  trunk_diameter_cm numeric(8, 2),
  leaf_traits text,
  flower_fruit_traits text,
  health_status text,
  other_traits text,
  location_name text,
  latitude double precision,
  longitude double precision,
  qr_code text unique,
  status text not null default 'draft' check (
    status in ('draft', 'submitted', 'approved', 'rejected', 'needs_revision')
  ),
  sync_status text not null default 'synced' check (sync_status in ('pending', 'synced')),
  review_note text,
  reviewed_by uuid references public.profiles (uuid),
  reviewed_at timestamptz,
  recorded_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint plant_records_gps_pair check (
    (latitude is null and longitude is null)
    or (
      latitude between -90 and 90
      and longitude between -180 and 180
    )
  )
);

comment on table public.plant_records is
  '植物学家的现场记录。提交后由保育官员审核。精确 GPS 只给有权限的人看。';
comment on column public.plant_records.local_id is
  '手机离线时自己生成的编号。同步时用它避免同一条记录被存两次。';
comment on column public.plant_records.qr_code is
  '审核通过后才填写。游客扫这个码打开公开页面。';

-- ---------------------------------------------------------------------------
-- 4. plant_photos  照片
-- 一张照片只属于现场记录，或只属于品种参考图。
-- storage_path 是 Supabase Storage 里的文件路径，不是照片本身。
-- ---------------------------------------------------------------------------
create table public.plant_photos (
  id uuid primary key default gen_random_uuid(),
  plant_record_id uuid references public.plant_records (uuid) on delete cascade,
  species_id uuid references public.species (uuid) on delete cascade,
  storage_path text not null,
  caption text,
  uploaded_by uuid references public.profiles (uuid),
  created_at timestamptz not null default now(),
  constraint plant_photos_one_owner check (
    (plant_record_id is not null and species_id is null)
    or (plant_record_id is null and species_id is not null)
  )
);

comment on table public.plant_photos is
  '植物照片的路径。现场照片挂在 plant_records，参考照片挂在 species。';

-- ---------------------------------------------------------------------------
-- 5. sensors  传感器
-- ---------------------------------------------------------------------------
create table public.sensors (
  id uuid primary key default gen_random_uuid(),
  plant_record_id uuid references public.plant_records (uuid),
  name text not null,
  latitude double precision,
  longitude double precision,
  status text not null default 'online' check (status in ('online', 'offline')),
  last_seen_at timestamptz,
  created_at timestamptz not null default now(),
  constraint sensors_gps_pair check (
    (latitude is null and longitude is null)
    or (
      latitude between -90 and 90
      and longitude between -180 and 180
    )
  )
);

comment on table public.sensors is
  '珍稀植物旁边的传感器。status = offline 表示它没有继续上传数据。';

-- ---------------------------------------------------------------------------
-- 6. sensor_readings  历史环境数据
-- ---------------------------------------------------------------------------
create table public.sensor_readings (
  id uuid primary key default gen_random_uuid(),
  sensor_id uuid not null references public.sensors (id) on delete cascade,
  temperature numeric(5, 2),
  humidity numeric(5, 2),
  movement_detected boolean not null default false,
  latitude double precision,
  longitude double precision,
  recorded_at timestamptz not null default now()
);

comment on table public.sensor_readings is
  '传感器每次上传的温度、湿度、是否侦测到移动，以及当时的位置。';

-- ---------------------------------------------------------------------------
-- 7. alerts  警报
-- alert_type:
--   dry_condition | high_temperature | possible_disturbance
--   | possible_theft | sensor_offline
-- status: open | acknowledged | resolved
-- ---------------------------------------------------------------------------
create table public.alerts (
  id uuid primary key default gen_random_uuid(),
  sensor_id uuid not null references public.sensors (id) on delete cascade,
  alert_type text not null check (
    alert_type in (
      'dry_condition',
      'high_temperature',
      'possible_disturbance',
      'possible_theft',
      'sensor_offline'
    )
  ),
  message text not null,
  status text not null default 'open' check (
    status in ('open', 'acknowledged', 'resolved')
  ),
  handled_by uuid references public.profiles (uuid),
  handled_at timestamptz,
  created_at timestamptz not null default now()
);

comment on table public.alerts is
  '异常警报。管理员处理；保育官员可以查看。';

-- ---------------------------------------------------------------------------
-- 8. login_logs  登录记录
-- ---------------------------------------------------------------------------
create table public.login_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (uuid) on delete cascade,
  success boolean not null default true,
  created_at timestamptz not null default now()
);

comment on table public.login_logs is
  '成功登录的记录，供管理员查看。';

create index species_scientific_name_idx on public.species (scientific_name);
create index species_common_name_idx on public.species (common_name);
create index plant_records_status_idx on public.plant_records (status);
create index plant_records_species_idx on public.plant_records (species_id);
create index sensor_readings_sensor_time_idx
  on public.sensor_readings (sensor_id, recorded_at desc);

-- ---------------------------------------------------------------------------
-- 自动更新 updated_at
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create trigger species_set_updated_at
before update on public.species
for each row execute function public.set_updated_at();

create trigger plant_records_set_updated_at
before update on public.plant_records
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- 权限用到的小函数
-- my_role() 只认 status = active 的用户。停用账号会变成没有角色。
-- ---------------------------------------------------------------------------
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

-- 不是管理员时，不能改自己的角色、停用状态或 email。
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

create trigger profiles_protect
before update on public.profiles
for each row execute function public.protect_profile();

-- 植物学家可以提交记录，不能自己批准。
-- 保育官员可以审核，不能审核自己提交的记录。
create or replace function public.protect_plant_record()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  actor text := public.my_role();
  new_qr text;
begin
  if auth.uid() is null then
    return new;
  end if;

  if tg_op = 'INSERT' then
    if actor <> 'botanist' or new.botanist_id <> auth.uid() then
      raise exception '只有植物学家可以新增自己的现场记录';
    end if;
    if new.status not in ('draft', 'submitted') then
      raise exception '新记录只能先存成草稿或提交审核';
    end if;
    new.qr_code := null;
    new.reviewed_by := null;
    new.reviewed_at := null;
    return new;
  end if;

  if actor = 'botanist' then
    if old.botanist_id <> auth.uid() then
      raise exception '你只能修改自己的记录';
    end if;

    if new.botanist_id is distinct from old.botanist_id
       or new.reviewed_by is distinct from old.reviewed_by
       or new.reviewed_at is distinct from old.reviewed_at then
      raise exception '不能修改记录所属人或审核信息';
    end if;

    if old.status in ('draft', 'needs_revision') then
      if new.status not in ('draft', 'submitted') then
        raise exception '你只能保存草稿或提交审核，不能自己批准';
      end if;
      new.qr_code := null;
      return new;
    end if;

    if old.status = 'approved' and old.qr_code is null and new.qr_code is not null then
      new_qr := new.qr_code;
      new := old;
      new.qr_code := new_qr;
      return new;
    end if;

    raise exception '这份记录目前不能修改';
  end if;

  if actor = 'conservation_officer' then
    if old.botanist_id = auth.uid() then
      raise exception '不能审核自己提交的记录';
    end if;
    if new.status in ('approved', 'rejected', 'needs_revision')
       and new.status is distinct from old.status then
      new.reviewed_by := auth.uid();
      new.reviewed_at := now();
    end if;
    return new;
  end if;

  raise exception '你没有权限修改植物记录';
end;
$$;

create trigger plant_records_protect
before insert or update on public.plant_records
for each row execute function public.protect_plant_record();

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

create trigger plant_records_assign_id
before insert on public.plant_records
for each row execute function public.assign_plant_record_id();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- App 用户会受到这些规则限制。
-- Supabase 后台的 SQL Editor / Table Editor 使用管理身份，仍可整理数据。
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.species enable row level security;
alter table public.plant_records enable row level security;
alter table public.plant_photos enable row level security;
alter table public.sensors enable row level security;
alter table public.sensor_readings enable row level security;
alter table public.alerts enable row level security;
alter table public.login_logs enable row level security;

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

create policy species_select on public.species
for select to anon, authenticated
using (true);

create policy species_insert on public.species
for insert to authenticated
with check (public.my_role() = 'conservation_officer');

create policy species_update on public.species
for update to authenticated
using (public.my_role() = 'conservation_officer')
with check (public.my_role() = 'conservation_officer');

create policy species_delete on public.species
for delete to authenticated
using (public.my_role() = 'conservation_officer');

create policy plant_records_select on public.plant_records
for select to authenticated
using (
  public.my_role() in ('conservation_officer', 'administrator')
  or (public.my_role() = 'botanist' and botanist_id = auth.uid())
);

create policy plant_records_insert on public.plant_records
for insert to authenticated
with check (
  public.my_role() = 'botanist'
  and botanist_id = auth.uid()
);

create policy plant_records_update on public.plant_records
for update to authenticated
using (
  public.my_role() = 'conservation_officer'
  or (public.my_role() = 'botanist' and botanist_id = auth.uid())
)
with check (
  public.my_role() = 'conservation_officer'
  or (public.my_role() = 'botanist' and botanist_id = auth.uid())
);

create policy plant_records_delete on public.plant_records
for delete to authenticated
using (public.my_role() = 'conservation_officer');

create policy plant_photos_select on public.plant_photos
for select to authenticated
using (
  public.my_role() in ('conservation_officer', 'administrator')
  or uploaded_by = auth.uid()
  or species_id is not null
  or public.record_is_public(plant_record_id)
);

create policy plant_photos_public_select on public.plant_photos
for select to anon
using (
  species_id is not null
  or public.record_is_public(plant_record_id)
);

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

create policy plant_photos_delete on public.plant_photos
for delete to authenticated
using (
  public.my_role() = 'conservation_officer'
  or uploaded_by = auth.uid()
);

create policy sensors_select on public.sensors
for select to authenticated
using (public.my_role() in ('administrator', 'conservation_officer'));

create policy sensors_write on public.sensors
for all to authenticated
using (public.my_role() = 'administrator')
with check (public.my_role() = 'administrator');

create policy sensor_readings_select on public.sensor_readings
for select to authenticated
using (public.my_role() in ('administrator', 'conservation_officer'));

create policy sensor_readings_insert on public.sensor_readings
for insert to authenticated
with check (public.my_role() = 'administrator');

create policy alerts_select on public.alerts
for select to authenticated
using (public.my_role() in ('administrator', 'conservation_officer'));

create policy alerts_insert on public.alerts
for insert to authenticated
with check (public.my_role() = 'administrator');

create policy alerts_update on public.alerts
for update to authenticated
using (public.my_role() = 'administrator')
with check (public.my_role() = 'administrator');

create policy login_logs_select on public.login_logs
for select to authenticated
using (public.my_role() = 'administrator');

create policy login_logs_insert on public.login_logs
for insert to authenticated
with check (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- 游客扫 QR 用的公开页面
-- security_invoker = false：用视图拥有者的权限读取原表，
-- 但 SELECT 里故意没有 latitude / longitude。
-- ---------------------------------------------------------------------------
create view public.public_plant_pages
with (security_invoker = false) as
select
  r.qr_code,
  r.id as record_id,
  r.uuid as record_uuid,
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

comment on view public.public_plant_pages is
  '游客扫 QR 后看到的资料。没有精确 GPS。';

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

comment on view public.public_plant_photos is
  '可以公开的照片：品种参考图，以及已审核通过的现场照片。';

grant select on public.public_plant_pages to anon, authenticated;
grant select on public.public_plant_photos to anon, authenticated;

revoke all on table public.profiles from anon;
revoke all on table public.plant_records from anon;
revoke all on table public.sensors from anon;
revoke all on table public.sensor_readings from anon;
revoke all on table public.alerts from anon;
revoke all on table public.login_logs from anon;

-- Dashboard 若要实时刷新传感器和警报，把这两张表加入 Realtime。
alter publication supabase_realtime add table public.sensor_readings;
alter publication supabase_realtime add table public.alerts;

-- 第一位管理员要先在 Authentication → Users 里建立账号，
-- 再把那个用户的 UUID 贴到下面，用 SQL Editor 执行。
--
-- insert into public.profiles (id, full_name, email, role)
-- values (
--   '在这里贴上 auth.users 的 uuid',
--   '你的名字',
--   'you@email.com',
--   'administrator'
-- );
