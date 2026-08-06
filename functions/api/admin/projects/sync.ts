/**
 * POST /api/admin/projects/sync — 后台手动触发「从 GitHub 重新同步」。
 * 对 source.type === 'github' 的项目拉 GitHub API，回写 auto.version / updated / stars。
 * Bearer Token 鉴权。返回 { synced: number }。
 */

import { CORS_HEADERS, json, isAuthed } from '../../_lib/helpers';

interface KVNamespace {
  get(key: string): Promise<string | null>;
  put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>;
}
interface Env {
  BMUSEUM_KV: KVNamespace;
  BMUSEUM_ADMIN_TOKEN: string;
  GITHUB_TOKEN?: string;
}
interface Project {
  slug: string;
  source: { type: 'github'; repo: string } | { type: 'manual' };
  auto: { version?: string; updated?: string; stars?: number };
}
interface ProjectsData {
  synced_at: string;
  projects: Project[];
}

async function gh(path: string, token?: string): Promise<any | null> {
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'User-Agent': 'bmuseum-sync',
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`https://api.github.com${path}`, { headers });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`GitHub API ${path} -> ${res.status}`);
  return res.json();
}

export async function onRequestOptions(): Promise<Response> {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

export async function onRequestPost(context: { env: Env; request: Request }): Promise<Response> {
  if (!isAuthed(context.env, context.request)) return json({ error: 'unauthorized' }, 401);

  const kv = context.env.BMUSEUM_KV;
  const raw = await kv.get('projects');
  if (!raw) return json({ synced: 0 });

  const data = JSON.parse(raw) as ProjectsData;
  let count = 0;

  for (const p of data.projects) {
    if (p.source?.type !== 'github' || !p.source.repo) continue;
    try {
      const info = await gh(`/repos/${p.source.repo}`, context.env.GITHUB_TOKEN);
      if (!info) continue;

      p.auto = p.auto || {};
      p.auto.updated = (info.pushed_at ?? '').slice(0, 10) || p.auto.updated;
      p.auto.stars = info.stargazers_count ?? p.auto.stars;

      const release = await gh(`/repos/${p.source.repo}/releases/latest`, context.env.GITHUB_TOKEN);
      if (release?.tag_name) {
        p.auto.version = release.tag_name;
      } else {
        const tags = await gh(`/repos/${p.source.repo}/tags?per_page=1`, context.env.GITHUB_TOKEN);
        if (Array.isArray(tags) && tags[0]?.name) p.auto.version = tags[0].name;
      }
      count++;
    } catch {
      // 单个项目失败不影响整体
    }
  }

  data.synced_at = new Date().toISOString().slice(0, 10);
  await kv.put('projects', JSON.stringify(data));
  return json({ synced: count });
}
