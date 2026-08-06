/**
 * 项目管理端点（Bearer Token 鉴权）。
 *   GET    /api/admin/projects        → 列出全部项目档案
 *   POST   /api/admin/projects        → 新建项目
 *   PUT    /api/admin/projects        → 按 body.slug 更新项目
 *   DELETE /api/admin/projects?slug=  → 按 slug 删除项目
 *
 * KV schema:
 *   projects → { synced_at: string, projects: Project[] }
 */

import { CORS_HEADERS, json, isAuthed, slugify, ensureUniqueSlug } from '../_lib/helpers';

async function loadData(kv) {
  const raw = await kv.get('projects');
  return raw ? JSON.parse(raw) : { synced_at: '', projects: [] };
}
async function saveData(kv, data) {
  await kv.put('projects', JSON.stringify(data));
}

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

/** GET — 列出全部项目 */
export async function onRequestGet(context) {
  if (!isAuthed(context.env, context.request)) return json({ error: 'unauthorized' }, 401);
  const data = await loadData(context.env.BMUSEUM_KV);
  return json(data);
}

/** POST — 新建项目 */
export async function onRequestPost(context) {
  if (!isAuthed(context.env, context.request)) return json({ error: 'unauthorized' }, 401);

  let body;
  try {
    body = await context.request.json();
  } catch {
    return json({ error: 'invalid_json' }, 400);
  }
  if (body === null || typeof body !== 'object' || Array.isArray(body)) {
    return json({ error: 'invalid_json' }, 400);
  }

  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const tagline = typeof body.tagline === 'string' ? body.tagline.trim() : '';
  if (!name || !tagline) return json({ error: 'invalid_fields' }, 422);

  const kv = context.env.BMUSEUM_KV;
  const data = await loadData(kv);
  const taken = new Set(data.projects.map((p) => p.slug));
  const slug = ensureUniqueSlug(
    typeof body.slug === 'string' && body.slug.trim()
      ? slugify(body.slug)
      : slugify(name),
    taken,
  );

  const project = {
    slug,
    name,
    name_en: typeof body.name_en === 'string' ? body.name_en : undefined,
    tagline,
    status: typeof body.status === 'string' ? body.status : 'running',
    status_label: typeof body.status_label === 'string' ? body.status_label : '进行中',
    platform: typeof body.platform === 'string' ? body.platform : '',
    tech: Array.isArray(body.tech) ? body.tech : [],
    accent: typeof body.accent === 'string' ? body.accent : '#C15F3C',
    links: Array.isArray(body.links) ? body.links : [],
    article_slug: typeof body.article_slug === 'string' ? body.article_slug : undefined,
    source:
      body.source && body.source.type === 'github'
        ? { type: 'github', repo: body.source.repo ?? '' }
        : { type: 'manual' },
    auto: typeof body.auto === 'object' && body.auto ? body.auto : {},
  };

  data.projects.unshift(project);
  data.synced_at = new Date().toISOString().slice(0, 10);
  await saveData(kv, data);
  return json(project, 201);
}

/** PUT — 按 body.slug 更新（slug 不可改，auto 做浅合并） */
export async function onRequestPut(context) {
  if (!isAuthed(context.env, context.request)) return json({ error: 'unauthorized' }, 401);

  let body;
  try {
    body = await context.request.json();
  } catch {
    return json({ error: 'invalid_json' }, 400);
  }
  if (body === null || typeof body !== 'object' || Array.isArray(body) || !body.slug) {
    return json({ error: 'invalid_fields' }, 422);
  }

  const kv = context.env.BMUSEUM_KV;
  const data = await loadData(kv);
  const idx = data.projects.findIndex((p) => p.slug === body.slug);
  if (idx < 0) return json({ error: 'not_found' }, 404);

  const prev = data.projects[idx];
  const updated = {
    ...prev,
    ...body,
    slug: prev.slug,
    auto: { ...prev.auto, ...(typeof body.auto === 'object' && body.auto ? body.auto : {}) },
  };

  data.projects[idx] = updated;
  data.synced_at = new Date().toISOString().slice(0, 10);
  await saveData(kv, data);
  return json(updated);
}

/** DELETE — 按 ?slug= 删除 */
export async function onRequestDelete(context) {
  if (!isAuthed(context.env, context.request)) return json({ error: 'unauthorized' }, 401);

  const slug = new URL(context.request.url).searchParams.get('slug');
  if (!slug) return json({ error: 'missing_slug' }, 422);

  const kv = context.env.BMUSEUM_KV;
  const data = await loadData(kv);
  const next = data.projects.filter((p) => p.slug !== slug);
  if (next.length === data.projects.length) return json({ error: 'not_found' }, 404);

  data.projects = next;
  data.synced_at = new Date().toISOString().slice(0, 10);
  await saveData(kv, data);
  return json({ ok: true });
}
