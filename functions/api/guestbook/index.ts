/**
 * GET  /api/guestbook  — 读取已发布留言（最新 50 条）
 * POST /api/guestbook  — 提交新留言
 *
 * 防滥用策略：
 *   1. Honeypot：表单含 website 隐藏字段，非空即 bot
 *   2. Rate limit：同一 IP 每小时最多 3 条（KV TTL 实现）
 *   3. 内容过滤：屏蔽词列表
 *
 * KV schema:
 *   guestbook:entries   →  JSON  GuestEntry[]（最多 200 条，FIFO 淘汰）
 *   ratelimit:{ipHash}  →  "3"   （TTL 3600s，剩余次数）
 */

interface Env {
  BMUSEUM_KV: KVNamespace;
}

interface KVNamespace {
  get(key: string): Promise<string | null>;
  put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>;
}

interface GuestEntry {
  id: string;
  name: string;
  message: string;
  created: string;
  status: 'pending' | 'published' | 'blocked';
  ip_hash: string;
}

interface SubmitBody {
  name: string;
  message: string;
  website?: string; // honeypot — must be empty
}

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json',
};

const BLOCKED_WORDS = [
  '代开发票', '办证', '赌博', '色情', '免费领',
  '加微信', '加qq', '刷单', '兼职', '低价出售',
  'spam', 'viagra', 'casino', 'buy now', 'click here',
  'http://', 'https://',
];

const NAME_MAX = 30;
const MSG_MAX = 280;
const RATE_LIMIT = 3;       // 每 IP 每小时最多 3 条
const RATE_TTL = 3600;      // 1 小时
const MAX_ENTRIES = 200;    // KV 最多保存 200 条留言

/* ── Helpers ── */

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

async function hashIp(ip: string): Promise<string> {
  const data = new TextEncoder().encode(ip + 'bmuseum_salt_2026');
  const buf = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(buf))
    .slice(0, 8)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function containsBlockedWord(text: string): boolean {
  const lower = text.toLowerCase();
  return BLOCKED_WORDS.some((w) => lower.includes(w));
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: CORS_HEADERS });
}

/* ── Handlers ── */

export async function onRequestOptions(): Promise<Response> {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

/** GET /api/guestbook — 返回已发布留言 */
export async function onRequestGet(context: {
  env: Env;
  request: Request;
}): Promise<Response> {
  try {
    const raw = await context.env.BMUSEUM_KV.get('guestbook:entries');
    const entries: GuestEntry[] = raw ? (JSON.parse(raw) as GuestEntry[]) : [];
    const published = entries
      .filter((e) => e.status === 'published')
      .sort((a, b) => b.created.localeCompare(a.created))
      .slice(0, 50);
    return json({ entries: published, total: published.length });
  } catch {
    return json({ entries: [], total: 0 });
  }
}

/** POST /api/guestbook — 提交新留言 */
export async function onRequestPost(context: {
  env: Env;
  request: Request;
}): Promise<Response> {
  const kv = context.env.BMUSEUM_KV;
  const req = context.request;

  /* ── 解析 body ── */
  let body: SubmitBody;
  try {
    body = (await req.json()) as SubmitBody;
  } catch {
    return json({ ok: false, error: 'invalid_json' }, 400);
  }

  /* ── Honeypot ── */
  if (body.website && body.website.trim() !== '') {
    // 伪装成成功，让 bot 以为提交成功
    return json({ ok: true, id: generateId() });
  }

  /* ── 内容校验 ── */
  const name = (body.name ?? '').trim();
  const message = (body.message ?? '').trim();

  if (!name || name.length > NAME_MAX) {
    return json({ ok: false, error: 'invalid_name' }, 422);
  }
  if (!message || message.length > MSG_MAX) {
    return json({ ok: false, error: 'invalid_message' }, 422);
  }
  if (containsBlockedWord(name) || containsBlockedWord(message)) {
    return json({ ok: false, error: 'blocked_content' }, 422);
  }

  /* ── Rate limit ── */
  const ip = req.headers.get('CF-Connecting-IP')
    ?? req.headers.get('X-Real-IP')
    ?? req.headers.get('X-Forwarded-For')?.split(',')[0]
    ?? 'unknown';
  const ipHash = await hashIp(ip);
  const rlKey = `ratelimit:${ipHash}`;

  const rlRaw = await kv.get(rlKey);
  const remaining = rlRaw === null ? RATE_LIMIT : parseInt(rlRaw, 10);

  if (remaining <= 0) {
    return json({ ok: false, error: 'rate_limited' }, 429);
  }

  /* ── 写入留言 ── */
  const entry: GuestEntry = {
    id: generateId(),
    name,
    message,
    created: new Date().toISOString(),
    status: 'published',   // 低流量站直接发布；生产可改为 'pending'
    ip_hash: ipHash,
  };

  try {
    const raw = await kv.get('guestbook:entries');
    const entries: GuestEntry[] = raw ? (JSON.parse(raw) as GuestEntry[]) : [];

    entries.unshift(entry);

    // FIFO 淘汰，保持最多 MAX_ENTRIES 条
    if (entries.length > MAX_ENTRIES) {
      entries.splice(MAX_ENTRIES);
    }

    await kv.put('guestbook:entries', JSON.stringify(entries));

    // 扣除 rate limit 次数（TTL 1 小时）
    await kv.put(rlKey, String(remaining - 1), { expirationTtl: RATE_TTL });

    return json({ ok: true, id: entry.id });
  } catch (err) {
    return json({ ok: false, error: 'kv_error' }, 500);
  }
}
