// =============================================================================
// annotation-api.ts — 共享批注的 Supabase 后端封装
//
// 职责:
//   - 静默创建“匿名身份”(Anonymous Sign-in),免注册但保证“仅本人可删”;
//   - 按 page_path 拉取/新增/删除批注;
//   - Realtime 订阅同页批注变化,让其他访问者实时看到新批注。
//
// 批注数据只存 Supabase;调用方在未配置或云端不可用时只读展示镜像/提示错误,
// 不再回退到本机 localStorage 批注存储。
// =============================================================================

import { createClient, type RealtimeChannel, type SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_ENABLED } from '../config/supabase';

export const annotationBackendReady = SUPABASE_ENABLED;

export interface AnnotationRow {
  id: string;
  page_path: string;
  quote_text: string;
  note: string;
  owner: string;
  created_at: string;
  updated_at?: string | null;
}

export interface CreateAnnotationInput {
  page_path: string;
  quote_text: string;
  note: string;
}

export type AnnotationChangeEvent =
  | { type: 'insert'; row: AnnotationRow }
  | { type: 'delete'; row: { id: string } }
  | { type: 'update'; row: AnnotationRow };

let client: SupabaseClient | null = null;
let identity: string | null = null;
let channel: RealtimeChannel | null = null;

// 管理员使用独立的会话存储键,避免与匿名身份互相覆盖:
// 同一个人既做访客写批注、又登录管理员时,两种身份并行存在,互不挤占。
let adminClient: SupabaseClient | null = null;

function getClient(): SupabaseClient {
  if (!client) {
    client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
      },
    });
  }
  return client;
}

function getAdminClient(): SupabaseClient {
  if (!adminClient) {
    adminClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
        storageKey: 'vision-admin-auth',
      },
    });
  }
  return adminClient;
}

function errorMessage(err: unknown): string {
  return err && typeof err === 'object' && 'message' in err
    ? String((err as { message: unknown }).message)
    : '未知错误';
}

/** 确保存在匿名身份,返回当前身份 uid;失败返回 null */
export async function ensureAnonymousIdentity(): Promise<string | null> {
  if (identity) return identity;
  const sb = getClient();
  const { data: sessionData } = await sb.auth.getSession();
  if (sessionData.session?.user?.id) {
    identity = sessionData.session.user.id;
    return identity;
  }
  const { data, error } = await sb.auth.signInAnonymously();
  if (error) {
    console.error('[批注] 匿名登录失败:', error.message);
    return null;
  }
  identity = data.session?.user?.id ?? data.user?.id ?? null;
  return identity;
}

export function currentUid(): string | null {
  return identity;
}

// =============================================================================
// 管理员状态(全局共享):AdminWidget 组件维护并广播,
// 批注列表(DocLayout)订阅后刷新“本人或管理员可删”的按钮可见性。
// =============================================================================

export interface AdminStatus {
  /** 是否有管理员账号会话登录 */
  active: boolean;
  /** 是否已被站务授权(可删除任意批注) */
  granted: boolean;
  email: string;
}

const EMPTY_ADMIN_STATUS: AdminStatus = { active: false, granted: false, email: '' };

let adminStatus: AdminStatus = { ...EMPTY_ADMIN_STATUS };
const adminWatchers = new Set<(status: AdminStatus) => void>();

export function setAdminStatus(status: AdminStatus): void {
  adminStatus = status;
  adminWatchers.forEach((cb) => cb(status));
}

export function getAdminStatus(): AdminStatus {
  return adminStatus;
}

/** 订阅管理员状态变化;立即回调一次当前值;返回取消订阅函数 */
export function watchAdminStatus(cb: (status: AdminStatus) => void): () => void {
  adminWatchers.add(cb);
  cb(adminStatus);
  return () => { adminWatchers.delete(cb); };
}

// =============================================================================
// 管理员(站务预先创建的固定账号 + 用户名/密码登录,可删除任意批注)
//
// 无注册流程:站务在 Supabase Dashboard(Authentication → Users → Add user)以
//   邮箱 = <用户名>@vision.local、密码 = 自定
// 创建账号,再把该账号的 uid 插入 public.admins 表即完成授权。
// 前端登录时:输入纯用户名(如 zhang3)会自动补全为 zhang3@vision.local,
// 也可直接输入完整邮箱(便于兼容非约定域名的历史账号)。
// =============================================================================

/** 用户名缺省补全的邮箱域名(站务建号时保持一致即可) */
const ADMIN_EMAIL_DOMAIN = 'zju.edu.cn';

export interface AdminSession {
  uid: string;
  email: string;
}

function mapAdminSession(user: { id: string; email?: string } | null | undefined): AdminSession | null {
  if (!user?.id) return null;
  return { uid: user.id, email: user.email ?? '' };
}

/** 恢复本地保存的管理员会话(页面刷新后自动保持登录) */
export async function restoreAdminSession(): Promise<AdminSession | null> {
  if (!SUPABASE_ENABLED) return null;
  try {
    const { data } = await getAdminClient().auth.getSession();
    return mapAdminSession(data.session?.user);
  } catch {
    return null;
  }
}

function normalizeAdminUsername(username: string): string {
  const name = username.trim();
  return name.includes('@') ? name : `${name}@${ADMIN_EMAIL_DOMAIN}`;
}

/** 管理员 用户名+密码 登录(账号由站务预先创建,无注册入口) */
export async function adminLogin(username: string, password: string): Promise<AdminSession> {
  const email = normalizeAdminUsername(username);
  const { data, error } = await getAdminClient().auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw new Error(adminAuthError(error.message));
  return mapAdminSession(data.user) ?? { uid: data.session?.user?.id ?? '', email };
}

/** 管理员退出 */
export async function adminLogout(): Promise<void> {
  await getAdminClient().auth.signOut();
}

/** 当前登录的账号是否已被授权为管理员 */
export async function isAuthorizedAdmin(session: AdminSession): Promise<boolean> {
  if (!SUPABASE_ENABLED) return false;
  const { data, error } = await getAdminClient()
    .from('admins')
    .select('uid')
    .eq('uid', session.uid)
    .maybeSingle();
  if (error) return false;
  return !!data;
}

function adminAuthError(message: string): string {
  if (/invalid login credentials/i.test(message)) return '用户名或密码不正确';
  if (/email not confirmed/i.test(message)) return '该账号未验证,请联系站务确认';
  if (/user not found/i.test(message)) return '账号不存在,请确认用户名或联系站务';
  return `登录失败:${message}`;
}

/** 拉取某页面全部批注(按时间升序,保证与列表渲染顺序一致) */
export async function fetchAnnotations(pagePath: string): Promise<AnnotationRow[]> {
  const sb = getClient();
  const { data, error } = await sb
    .from('annotations')
    .select('*')
    .eq('page_path', pagePath)
    .order('created_at', { ascending: true });
  if (error) throw new Error(`拉取批注失败: ${errorMessage(error)}`);
  return (data ?? []) as AnnotationRow[];
}

/** 新增一条批注,返回服务端生成的完整记录 */
export async function createAnnotation(input: CreateAnnotationInput): Promise<AnnotationRow> {
  const sb = getClient();
  const { data, error } = await sb
    .from('annotations')
    .insert({ ...input, owner: identity })
    .select('*')
    .single();
  if (error) throw new Error(`保存批注失败: ${errorMessage(error)}`);
  return data as AnnotationRow;
}

/** 更新本人批注的内容(note);RLS 保证仅 owner 可更新,他人会被服务端拒绝 */
export async function updateAnnotation(id: string, note: string): Promise<AnnotationRow> {
  const sb = getClient();
  const { data, error } = await sb
    .from('annotations')
    .update({ note })
    .eq('id', id)
    .select('*')
    .single();
  if (error) throw new Error(`更新批注失败: ${errorMessage(error)}`);
  return data as AnnotationRow;
}

/**
 * 删除一条批注。
 *
 * asAdmin=true 时使用独立的管理员会话(getAdminClient);普通删除使用访客会话。
 * 这里必须显式 .select('id') 校验删除结果:RLS 过滤掉所有行时 PostgREST
 * 仍会返回成功,只有返回行为空才能区分“已删除”和“无权删除”。
 */
export async function removeAnnotation(id: string, asAdmin = false): Promise<void> {
  const sb = asAdmin ? getAdminClient() : getClient();
  const { data, error } = await sb
    .from('annotations')
    .delete()
    .eq('id', id)
    .select('id');
  if (error) throw new Error(`删除批注失败: ${errorMessage(error)}`);

  if (!data || data.length === 0) {
    // 0 行可能表示无权删除,也可能表示记录已经不存在(幂等删除)。
    const { data: stillExists, error: checkError } = await sb
      .from('annotations')
      .select('id')
      .eq('id', id)
      .maybeSingle();
    if (checkError) throw new Error(`删除批注失败: ${errorMessage(checkError)}`);
    if (stillExists) throw new Error('删除失败:当前身份没有删除该批注的权限');
  }
}

/** 订阅某页面的批注变化;返回取消订阅函数 */
export function subscribePage(pagePath: string, onChange: (evt: AnnotationChangeEvent) => void): () => void {
  const sb = getClient();
  if (channel) unsubscribePage();
  channel = sb
    .channel(`annotations:${pagePath}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'annotations',
        filter: `page_path=eq.${pagePath}`,
      },
      (payload) => {
        if (!payload || !payload.eventType) return;
        if (payload.eventType === 'INSERT') {
          onChange({ type: 'insert', row: payload.new as AnnotationRow });
        } else if (payload.eventType === 'DELETE') {
          onChange({ type: 'delete', row: { id: (payload.old as { id: string }).id } });
        } else if (payload.eventType === 'UPDATE') {
          onChange({ type: 'update', row: payload.new as AnnotationRow });
        }
      }
    )
    .subscribe();
  return unsubscribePage;
}

export function unsubscribePage(): void {
  if (channel) {
    sbRemove(channel);
    channel = null;
  }
}

function sbRemove(ch: RealtimeChannel): void {
  ch.unsubscribe();
}
