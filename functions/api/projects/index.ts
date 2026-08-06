/**
 * GET /api/projects — 公开读取项目档案（供公众站）。
 * KV 为空时从 /seed/projects.json 播种。返回 { synced_at, projects }。
 */

import { CORS_HEADERS, json, ensureSeeded } from '../_lib/helpers';

interface KVNamespace {
  get(key: string): Promise<string | null>;
  put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>;
}
interface Env {
  BMUSEUM_KV: KVNamespace;
}

export async function onRequestOptions(): Promise<Response> {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

export async function onRequestGet(context: {
  env: Env;
  request: Request;
}): Promise<Response> {
  const kv = context.env.BMUSEUM_KV;
  await ensureSeeded(kv, context.request, 'projects', '/seed/projects.json');

  const raw = await kv.get('projects');
  const data = raw
    ? JSON.parse(raw)
    : { synced_at: '', projects: [] };

  return json(data);
}
