-- =============================================================================
-- 批注可编辑:增加 updated_at 时间戳 + 自动更新触发器
--
-- 权限说明:
--   - 编辑动作 = 批注表 UPDATE,受既有策略 annotations_update_own 约束:
--     using (auth.uid() = owner),即“仅批注者本人可编辑”,RLS 在服务端强制;
--   - 本脚本只为“编辑”补充记录编辑时间的字段,不改变任何权限。
-- 幂等:可重复执行。
-- =============================================================================

alter table public.annotations
  add column if not exists updated_at timestamptz not null default now();

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
