// =============================================================================
// Supabase 配置(仅存放公开的 Project URL 与 anon public key)
//
// 安全性说明:
//   - anon key 是“公开只读信封”,GitHub Pages 前端必然暴露,不存在泄露问题;
//   - 真正的数据安全由数据库 RLS 行级策略保证(supabase/migrations/001_init.sql):
//     任何访客可读/可新增,只有批注者本人可删除自己的记录;
//   - 这里未配置值时网站自动回退为“纯本机 localStorage 模式”,行为与旧版一致。
//
// 【首次接入】替换下方两个占位符:
//   1. Supabase 面板 → Project Settings → API → Project URL
//   2. 同页 → anon public key
// =============================================================================

export const SUPABASE_URL = 'https://cujgosztrukgnkcstgey.supabase.co';
export const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN1amdvc3p0cnVrZ25rY3N0Z2V5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg3NjE3NjgsImV4cCI6MjEwNDMzNzc2OH0.8QCcDKigyLCp1A7CQ0LgJox3FtxWcud9zsQ2sdQGQ7I';

export const SUPABASE_ENABLED =
  !SUPABASE_URL.includes('YOUR_PROJECT_REF') &&
  !SUPABASE_ANON_KEY.includes('YOUR_SUPABASE');
