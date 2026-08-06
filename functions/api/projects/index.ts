/**
 * GET /api/projects — 公开读取项目档案（供公众站）。
 * KV 为空时从 /seed/projects.json 播种。返回 { synced_at, projects }。
 */

import { CORS_HEADERS, json, ensureSeeded } from '../_lib/helpers';

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

export async function onRequestGet(context) {
  const kv = context.env.BMUSEUM_KV;
  await ensureSeeded(kv, context.request, 'projects', '/seed/projects.json');

  const raw = await kv.get('projects');
  const data = raw ? JSON.parse(raw) : { synced_at: '', projects: [] };

  return json(data);
}
