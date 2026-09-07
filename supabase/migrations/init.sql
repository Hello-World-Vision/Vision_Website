-- =============================================================================
-- ZJU RoboMaster Vision · 共享批注系统 — 一键完整安装脚本
--
-- 用法:
--   1. 开启匿名登录:Authentication → Providers → 打开 Anonymous sign-ins
--      (若保持邮件确认开启,请确认管理员账号邮箱)
--   2. 在 SQL Editor 中整体运行本文件一次(可重复运行,幂等)
--
-- 行为约定:
--   - 任何访客(匿名)可读取、可新增批注;
--   - 只有批注者本人(owner = 匿名身份 auth.uid())可更新/删除自己的批注
--     (更新含“编辑批注内容”;管理员仅可删除,不可代改);
--   - 管理员(站务在面板预先创建的账号,uid 在 admins 表中)可删除任意批注;
--   - owner 为可空外键 + on delete set null:即使匿名用户被平台清理,
--     其批注也保留为社区存档,不会级联丢失。
-- =============================================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- 0) 兼容旧结构:若此前执行过含 nickname 列的旧版建表脚本,先移除该列
-- ─────────────────────────────────────────────────────────────────────────────
alter table public.annotations
  drop column if exists nickname;

-- ─────────────────────────────────────────────────────────────────────────────
-- 1) 批注表
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.annotations (
  id          uuid primary key default gen_random_uuid(),
  page_path   text        not null,
  quote_text  text        not null,
  note        text        not null,
  owner       uuid        references auth.users (id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  check (note <> '')
);

-- 编辑内容时自动刷新 updated_at(仅“更新”时机触发)
create or replace function public.set_annotations_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists annotations_set_updated_at on public.annotations;
create trigger annotations_set_updated_at
  before update on public.annotations
  for each row
  execute function public.set_annotations_updated_at();

create index if not exists annotations_page_path_idx
  on public.annotations (page_path, created_at);

alter table public.annotations enable row level security;

-- 所有访客均可读取(共享批注的核心需求)
drop policy if exists annotations_select_all on public.annotations;
create policy annotations_select_all
  on public.annotations for select
  using (true);

-- 允许新增,但 owner 必须指向当前请求的身份(匿名用户写入时自动赋值)
drop policy if exists annotations_insert_own on public.annotations;
create policy annotations_insert_own
  on public.annotations for insert
  with check (auth.uid() = owner);

-- 仅本人可更新自己的批注(编辑批注内容走此策略)
drop policy if exists annotations_update_own on public.annotations;
create policy annotations_update_own
  on public.annotations for update
  using (auth.uid() = owner);

-- 删除:批注者本人,或管理员(admins 表成员)
drop policy if exists annotations_delete_own on public.annotations;
drop policy if exists annotations_delete_owner_or_admin on public.annotations;
create policy annotations_delete_owner_or_admin
  on public.annotations for delete
  using (
    auth.uid() = owner
    or exists (select 1 from public.admins a where a.uid = auth.uid())
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- 2) 管理员表(无注册入口;账号由站务在面板预先创建)
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.admins (
  uid         uuid primary key references auth.users (id) on delete cascade,
  note        text,
  created_at  timestamptz not null default now()
);

alter table public.admins enable row level security;

-- 任何人可读管理员名单(仅含 uid,无敏感信息;
-- 删除权限由上方策略在服务端强制,不依赖前端)
drop policy if exists admins_select_all on public.admins;
create policy admins_select_all
  on public.admins for select
  using (true);

-- ─────────────────────────────────────────────────────────────────────────────
-- 3) 启用步骤(仅首次,SQL 已含建表/授权之外的人工操作)
-- ─────────────────────────────────────────────────────────────────────────────
-- a. 开启匿名登录:Auth → Providers → Anonymous sign-ins(若开启邮件确认请确认账号邮箱)
-- b. 创建管理员账号:Authentication → Users → Add user
--      邮箱 = <用户名>@vision.local   (例如用户名 zhang3 → zhang3@vision.local)
-- c. 授权(把账号加入管理员):
--      select id, email from auth.users;
--      insert into public.admins (uid, note) values ('<上一步拿到的 uuid>', '站务 姓名');
--    回收权限:delete from public.admins where uid = '<uuid>';
-- =============================================================================
