import { describe, it, expect, beforeEach, vi } from 'vitest';
import { onRequestPost, onRequestOptions } from '../../../../functions/api/admin/sync';
import { makeMockEnv, resetKV } from '../../../../tests/helpers/mockEnv';

const ADMIN_TOKEN = 'test-admin-token-123';

function makeRequest(auth?: string): Request {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (auth) headers['Authorization'] = auth;
  return new Request('http://localhost/api/admin/sync', { method: 'POST', headers });
}
const auth = () => `Bearer ${ADMIN_TOKEN}`;

function mockGithub(repo: string, stars: number, version: string) {
  return (input: any) => {
    const url = String(input instanceof Request ? input.url : input);
    if (url.endsWith('/releases/latest')) {
      return Promise.resolve(new Response(JSON.stringify({ tag_name: version }), { status: 200 }));
    }
    if (url.includes('/tags')) {
      return Promise.resolve(new Response(JSON.stringify([{ name: version }]), { status: 200 }));
    }
    if (url.includes(`/repos/${repo}`)) {
      return Promise.resolve(new Response(JSON.stringify({ pushed_at: '2026-05-09T10:00:00Z', stargazers_count: stars }), { status: 200 }));
    }
    return Promise.resolve(new Response('{}', { status: 404 }));
  };
}

describe('admin/sync — 鉴权与同步', () => {
  beforeEach(() => resetKV());

  it('① 无 token → 401；OPTIONS → 204', async () => {
    const env = makeMockEnv(ADMIN_TOKEN);
    expect((await onRequestPost({ request: makeRequest(), env } as any)).status).toBe(401);
    expect((await onRequestOptions()).status).toBe(204);
  });

  it('② 对 github 项目回写 stars/version/updated', async () => {
    vi.stubGlobal('fetch', mockGithub('beiyuii/rencai', 9, 'v3.0'));
    try {
      const env = makeMockEnv(ADMIN_TOKEN);
      // 预置 projects 数据（含一个 github 源项目）
      await env.BMUSEUM_KV.put(
        'projects',
        JSON.stringify({
          synced_at: '',
          projects: [
            {
              slug: 'rencai',
              name: '才驿',
              tagline: 'x',
              status: 'running',
              status_label: '运行中',
              platform: '',
              tech: [],
              accent: '#C15F3C',
              links: [],
              source: { type: 'github', repo: 'beiyuii/rencai' },
              auto: {},
            },
          ],
        }),
      );

      const res = await onRequestPost({ request: makeRequest(auth()), env } as any);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.synced).toBe(1);

      const stored = JSON.parse((await env.BMUSEUM_KV.get('projects')) as string);
      expect(stored.projects[0].auto.stars).toBe(9);
      expect(stored.projects[0].auto.version).toBe('v3.0');
      expect(stored.projects[0].auto.updated).toBe('2026-05-09');
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it('③ 手动项目不被同步（不影响计数）', async () => {
    vi.stubGlobal('fetch', mockGithub('beiyuii/rencai', 9, 'v3.0'));
    try {
      const env = makeMockEnv(ADMIN_TOKEN);
      await env.BMUSEUM_KV.put(
        'projects',
        JSON.stringify({
          synced_at: '',
          projects: [
            { slug: 'manual-p', name: '手动', tagline: 'x', status: 'running', status_label: '', platform: '', tech: [], accent: '#C15F3C', links: [], source: { type: 'manual' }, auto: {} },
          ],
        }),
      );
      const res = await onRequestPost({ request: makeRequest(auth()), env } as any);
      const data = await res.json();
      expect(data.synced).toBe(0);
    } finally {
      vi.unstubAllGlobals();
    }
  });
});
