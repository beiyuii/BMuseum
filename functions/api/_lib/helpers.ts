/**
 * EdgeOne Functions 共享工具（以下划线目录隔离，不参与路由）。
 */

export const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Content-Type': 'application/json',
};

export function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: CORS_HEADERS });
}

export interface AdminEnv {
  BMUSEUM_ADMIN_TOKEN: string;
  BMUSEUM_KV?: unknown;
  GITHUB_TOKEN?: string;
}

/** 校验 Bearer Token，失败绝不动 KV。 */
export function isAuthed(env: AdminEnv, request: Request): boolean {
  const auth = request.headers.get('Authorization');
  if (!auth || !auth.startsWith('Bearer ')) return false;
  const provided = auth.slice('Bearer '.length).trim();
  const expected = env.BMUSEUM_ADMIN_TOKEN;
  return !!expected && provided === expected;
}

/** 由标题/名称生成 kebab slug（保留字母数字与中文）。 */
export function slugify(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9一-龥]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'item';
}

/** 防止 slug 重复：已存在则追加 -2 / -3 … */
export function ensureUniqueSlug(slug: string, taken: Set<string>): string {
  if (!taken.has(slug)) return slug;
  let i = 2;
  while (taken.has(`${slug}-${i}`)) i++;
  return `${slug}-${i}`;
}

/**
 * KV 为空时从同站静态种子播种（仅一次）。
 * 种子文件由 scripts/copy-seed.mjs 在构建前生成到 public/seed/。
 * 获取失败不影响运行：KV 保持空，前端会回落到打包 JSON。
 */
export async function ensureSeeded(
  kv: { get: (k: string) => Promise<string | null>; put: (k: string, v: string) => Promise<void> },
  request: Request,
  key: string,
  seedPath: string,
): Promise<void> {
  const existing = await kv.get(key);
  if (existing) return;
  try {
    const seedUrl = new URL(seedPath, request.url).toString();
    const res = await fetch(seedUrl);
    if (!res.ok) return;
    const text = await res.text();
    await kv.put(key, text);
  } catch {
    /* 种子不可用：保持空，前端回落打包 JSON */
  }
}
