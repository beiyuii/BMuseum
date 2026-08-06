import { describe, it, expect, beforeEach } from 'vitest';
import {
  onRequestGet,
  onRequestPost,
  onRequestPut,
  onRequestDelete,
  onRequestOptions,
} from '../../../../functions/api/admin/projects/index.js';
import { makeMockEnv, resetKV } from '../../../../tests/helpers/mockEnv';

const ADMIN_TOKEN = 'test-admin-token-123';
const PROJECT_KEY = 'projects';

function makeRequest(
  method: string,
  body?: string | object,
  auth?: string,
  url = 'http://localhost/api/admin/projects',
): Request {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (auth) headers['Authorization'] = auth;
  const payload = typeof body === 'string' ? body : body ? JSON.stringify(body) : undefined;
  return new Request(url, { method, headers, body: payload });
}
const auth = () => `Bearer ${ADMIN_TOKEN}`;

describe('admin/projects — 鉴权层', () => {
  beforeEach(() => resetKV());
  it('无 token → 401；OPTIONS → 204', async () => {
    const env = makeMockEnv(ADMIN_TOKEN);
    expect((await onRequestGet({ request: makeRequest('GET'), env } as any)).status).toBe(401);
    expect((await onRequestOptions()).status).toBe(204);
  });
});

describe('admin/projects — 创建 / 更新 / 删除', () => {
  beforeEach(() => resetKV());

  it('① POST 创建 → 201，写入 projects 键', async () => {
    const env = makeMockEnv(ADMIN_TOKEN);
    const res = await onRequestPost({
      request: makeRequest('POST', { name: '才驿', tagline: '人才政策顾问', slug: 'rencai', source: { type: 'github', repo: 'beiyuii/rencai' } }, auth()),
      env,
    } as any);
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.slug).toBe('rencai');
    const stored = JSON.parse((await env.BMUSEUM_KV.get(PROJECT_KEY)) as string);
    expect(stored.projects.length).toBe(1);
  });

  it('② 缺 name/tagline → 422', async () => {
    const env = makeMockEnv(ADMIN_TOKEN);
    expect((await onRequestPost({ request: makeRequest('POST', { name: 'x' }, auth()), env } as any)).status).toBe(422);
    expect((await onRequestPost({ request: makeRequest('POST', { tagline: 'x' }, auth()), env } as any)).status).toBe(422);
  });

  it('③ PUT 更新，slug 不变，auto 浅合并', async () => {
    const env = makeMockEnv(ADMIN_TOKEN);
    await onRequestPost({ request: makeRequest('POST', { name: '才驿', tagline: 'x', slug: 'rencai' }, auth()), env } as any);
    const res = await onRequestPut({
      request: makeRequest('PUT', { slug: 'rencai', tagline: '新定位', auto: { stars: 12 } }, auth()),
      env,
    } as any);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.tagline).toBe('新定位');
    expect(data.slug).toBe('rencai');
    expect(data.auto.stars).toBe(12);
  });

  it('④ PUT 不存在 → 404', async () => {
    const env = makeMockEnv(ADMIN_TOKEN);
    const res = await onRequestPut({ request: makeRequest('PUT', { slug: 'ghost', tagline: 'x' }, auth()), env } as any);
    expect(res.status).toBe(404);
  });

  it('⑤ DELETE 按 slug 删除', async () => {
    const env = makeMockEnv(ADMIN_TOKEN);
    await onRequestPost({ request: makeRequest('POST', { name: '才驿', tagline: 'x', slug: 'rencai' }, auth()), env } as any);
    const del = await onRequestDelete({ request: makeRequest('DELETE', undefined, auth(), 'http://localhost/api/admin/projects?slug=rencai'), env } as any);
    expect(del.status).toBe(200);
    const stored = JSON.parse((await env.BMUSEUM_KV.get(PROJECT_KEY)) as string);
    expect(stored.projects.length).toBe(0);
  });

  it('⑥ DELETE 缺 slug → 422', async () => {
    const env = makeMockEnv(ADMIN_TOKEN);
    const res = await onRequestDelete({ request: makeRequest('DELETE', undefined, auth()), env } as any);
    expect(res.status).toBe(422);
  });

  it('⑦ GET 返回 { synced_at, projects }', async () => {
    const env = makeMockEnv(ADMIN_TOKEN);
    await onRequestPost({ request: makeRequest('POST', { name: '才驿', tagline: 'x', slug: 'rencai' }, auth()), env } as any);
    const res = await onRequestGet({ request: makeRequest('GET', undefined, auth()), env } as any);
    const data = await res.json();
    expect(Array.isArray(data.projects)).toBe(true);
    expect(data.projects.length).toBe(1);
  });
});
