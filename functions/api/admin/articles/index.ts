/**
 * 文章管理端点（Bearer Token 鉴权）。
 *   GET    /api/admin/articles        → 列出全部文章（含 draft/storage，供后台）
 *   POST   /api/admin/articles        → 新建文章
 *   PUT    /api/admin/articles        → 按 body.slug 更新文章
 *   DELETE /api/admin/articles?slug=  → 按 slug 删除文章
 *
 * KV schema:
 *   articles → Article[]（含全部状态；公众站按 on_display 过滤）
 * 与旧版隔离键 articles:user 不再使用。
 */

import { CORS_HEADERS, json, isAuthed, slugify, ensureUniqueSlug } from '../../_lib/helpers';

interface KVNamespace {
  get(key: string): Promise<string | null>;
  put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>;
}
interface Env {
  BMUSEUM_KV: KVNamespace;
  BMUSEUM_ADMIN_TOKEN: string;
}
interface Article {
  slug: string;
  wing: string;
  no: number;
  title: string;
  subtitle?: string;
  summary: string;
  body: string;
  created: string;
  updated: string;
  version: string;
  featured: boolean;
  tags: string[];
  cover?: string;
  reading_time_min: number;
  status?: string;
}

const MAX_ARTICLES = 1000;
const DEFAULT_VERSION = 'v1.0';

async function loadAll(kv: KVNamespace): Promise<Article[]> {
  const raw = await kv.get('articles');
  return raw ? (JSON.parse(raw) as Article[]) : [];
}
async function saveAll(kv: KVNamespace, arr: Article[]): Promise<void> {
  await kv.put('articles', JSON.stringify(arr));
}

export async function onRequestOptions(): Promise<Response> {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

/** GET — 后台列出全部文章 */
export async function onRequestGet(context: { env: Env; request: Request }): Promise<Response> {
  if (!isAuthed(context.env, context.request)) return json({ error: 'unauthorized' }, 401);
  const all = await loadAll(context.env.BMUSEUM_KV);
  return json(all);
}

/** POST — 新建文章 */
export async function onRequestPost(context: { env: Env; request: Request }): Promise<Response> {
  if (!isAuthed(context.env, context.request)) return json({ error: 'unauthorized' }, 401);

  let body: Record<string, unknown> | null;
  try {
    body = (await context.request.json()) as Record<string, unknown>;
  } catch {
    return json({ error: 'invalid_json' }, 400);
  }
  if (body === null || typeof body !== 'object' || Array.isArray(body)) {
    return json({ error: 'invalid_json' }, 400);
  }

  const title = typeof body.title === 'string' ? body.title.trim() : '';
  const wing = typeof body.wing === 'string' ? body.wing.trim() : '';
  if (!title || !wing) return json({ error: 'invalid_fields' }, 422);

  const kv = context.env.BMUSEUM_KV;
  const all = await loadAll(kv);
  const taken = new Set(all.map((a) => a.slug));
  const slug = ensureUniqueSlug(
    typeof body.slug === 'string' && body.slug.trim()
      ? slugify(body.slug)
      : slugify(title),
    taken,
  );
  const maxNo = all.reduce((m, a) => Math.max(m, a.no || 0), 0);
  const no = typeof body.no === 'number' && body.no > 0 ? body.no : maxNo + 1;
  const now = new Date().toISOString();

  const article: Article = {
    slug,
    wing,
    no,
    title,
    subtitle: typeof body.subtitle === 'string' ? body.subtitle : '',
    summary: typeof body.summary === 'string' ? body.summary : '',
    body: typeof body.body === 'string' ? body.body : '',
    created: now,
    updated: now,
    version: typeof body.version === 'string' ? body.version : DEFAULT_VERSION,
    featured: body.featured === true,
    tags: Array.isArray(body.tags) ? (body.tags as string[]) : [],
    cover: typeof body.cover === 'string' ? body.cover : undefined,
    reading_time_min: typeof body.reading_time_min === 'number' ? body.reading_time_min : 0,
    status: typeof body.status === 'string' ? body.status : 'on_display',
  };

  all.unshift(article);
  if (all.length > MAX_ARTICLES) all.length = MAX_ARTICLES;
  await saveAll(kv, all);
  return json(article, 201);
}

/** PUT — 按 body.slug 更新文章（slug 与 created 不可改） */
export async function onRequestPut(context: { env: Env; request: Request }): Promise<Response> {
  if (!isAuthed(context.env, context.request)) return json({ error: 'unauthorized' }, 401);

  let body: Record<string, unknown> | null;
  try {
    body = (await context.request.json()) as Record<string, unknown>;
  } catch {
    return json({ error: 'invalid_json' }, 400);
  }
  if (body === null || typeof body !== 'object' || Array.isArray(body) || !body.slug) {
    return json({ error: 'invalid_fields' }, 422);
  }

  const kv = context.env.BMUSEUM_KV;
  const all = await loadAll(kv);
  const idx = all.findIndex((a) => a.slug === body!.slug);
  if (idx < 0) return json({ error: 'not_found' }, 404);

  const prev = all[idx];
  const updated: Article = {
    ...prev,
    ...(body as object),
    slug: prev.slug,
    created: prev.created,
    updated: new Date().toISOString(),
  } as Article;

  all[idx] = updated;
  await saveAll(kv, all);
  return json(updated);
}

/** DELETE — 按 ?slug= 删除 */
export async function onRequestDelete(context: { env: Env; request: Request }): Promise<Response> {
  if (!isAuthed(context.env, context.request)) return json({ error: 'unauthorized' }, 401);

  const slug = new URL(context.request.url).searchParams.get('slug');
  if (!slug) return json({ error: 'missing_slug' }, 422);

  const kv = context.env.BMUSEUM_KV;
  const all = await loadAll(kv);
  const next = all.filter((a) => a.slug !== slug);
  if (next.length === all.length) return json({ error: 'not_found' }, 404);

  await saveAll(kv, next);
  return json({ ok: true });
}
