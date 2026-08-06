import { describe, it, expect, beforeEach } from 'vitest';
import {
  onRequestGet,
  onRequestPost,
  onRequestPut,
  onRequestDelete,
  onRequestOptions,
} from '../../../../functions/api/admin/articles/index.js';
import { makeMockEnv, resetKV } from '../../../../tests/helpers/mockEnv';

const ADMIN_TOKEN = 'test-admin-token-123';
const ARTICLE_KEY = 'articles';

function makeRequest(
  method: string,
  body?: string | object,
  auth?: string,
  url = 'http://localhost/api/admin/articles',
): Request {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (auth) headers['Authorization'] = auth;
  const payload = typeof body === 'string' ? body : body ? JSON.stringify(body) : undefined;
  return new Request(url, { method, headers, body: payload });
}
const auth = () => `Bearer ${ADMIN_TOKEN}`;

describe('admin/articles — 鉴权层', () => {
  beforeEach(() => resetKV());

  it('① 无 Authorization → 401，且不写 KV', async () => {
    const env = makeMockEnv(ADMIN_TOKEN);
    const res = await onRequestPost({ request: makeRequest('POST', { title: 'T', wing: 'tech' }), env } as any);
    expect(res.status).toBe(401);
    expect(await env.BMUSEUM_KV.get(ARTICLE_KEY)).toBeNull();
  });

  it('② Bearer 错误 → 401', async () => {
    const env = makeMockEnv(ADMIN_TOKEN);
    const res = await onRequestPost({ request: makeRequest('POST', { title: 'T', wing: 'tech' }, 'Bearer wrong'), env } as any);
    expect(res.status).toBe(401);
  });

  it('③ GET/PUT/DELETE 无 token → 401', async () => {
    const env = makeMockEnv(ADMIN_TOKEN);
    expect((await onRequestGet({ request: makeRequest('GET'), env } as any)).status).toBe(401);
    expect((await onRequestPut({ request: makeRequest('PUT', { slug: 'x' }), env } as any)).status).toBe(401);
    expect((await onRequestDelete({ request: makeRequest('DELETE', undefined, undefined, 'http://localhost/api/admin/articles?slug=x'), env } as any)).status).toBe(401);
  });

  it('④ OPTIONS → 204 + CORS', async () => {
    const res = await onRequestOptions();
    expect(res.status).toBe(204);
    expect(res.headers.get('access-control-allow-origin')).not.toBeNull();
  });
});

describe('admin/articles — 创建 POST', () => {
  beforeEach(() => resetKV());

  it('① 合法 → 201，默认 status=on_display（后台为显式操作）', async () => {
    const env = makeMockEnv(ADMIN_TOKEN);
    const res = await onRequestPost({
      request: makeRequest('POST', { title: '新文', wing: 'tech', slug: 'new-doc' }, auth()),
      env,
    } as any);
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.slug).toBe('new-doc');
    expect(data.status).toBe('on_display');
    expect(data.created).toMatch(/^\d{4}-\d{2}-\d{2}/);
  });

  it('② 缺 title/wing → 422', async () => {
    const env = makeMockEnv(ADMIN_TOKEN);
    expect((await onRequestPost({ request: makeRequest('POST', { wing: 'tech' }, auth()), env } as any)).status).toBe(422);
    expect((await onRequestPost({ request: makeRequest('POST', { title: 'x' }, auth()), env } as any)).status).toBe(422);
  });

  it('③ 非法 JSON → 400', async () => {
    const env = makeMockEnv(ADMIN_TOKEN);
    const res = await onRequestPost({ request: makeRequest('POST', 'not json {', auth()), env } as any);
    expect(res.status).toBe(400);
  });

  it('④ slug 省略 → 由 title 生成 kebab', async () => {
    const env = makeMockEnv(ADMIN_TOKEN);
    const res = await onRequestPost({ request: makeRequest('POST', { title: 'Hello World 2026', wing: 'think' }, auth()), env } as any);
    const data = await res.json();
    expect(data.slug).toBe('hello-world-2026');
  });

  it('⑤ 重复 title 生成唯一 slug', async () => {
    const env = makeMockEnv(ADMIN_TOKEN);
    await onRequestPost({ request: makeRequest('POST', { title: '重复', wing: 'tech', slug: 'dup' }, auth()), env } as any);
    const res = await onRequestPost({ request: makeRequest('POST', { title: '重复', wing: 'tech', slug: 'dup' }, auth()), env } as any);
    const data = await res.json();
    expect(data.slug).toBe('dup-2');
  });
});

describe('admin/articles — 更新 PUT / 删除 DELETE', () => {
  beforeEach(() => resetKV());

  async function seedOne() {
    const env = makeMockEnv(ADMIN_TOKEN);
    await onRequestPost({ request: makeRequest('POST', { title: '原稿', wing: 'tech', slug: 'orig' }, auth()), env } as any);
    return env;
  }

  it('① PUT 更新字段，slug/created 不变', async () => {
    const env = await seedOne();
    const res = await onRequestPut({
      request: makeRequest('PUT', { slug: 'orig', title: '改后', status: 'storage' }, auth()),
      env,
    } as any);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.title).toBe('改后');
    expect(data.status).toBe('storage');
    expect(data.slug).toBe('orig');
    expect(data.created).toMatch(/^\d{4}-\d{2}-\d{2}/);
  });

  it('② PUT 不存在的 slug → 404', async () => {
    const env = makeMockEnv(ADMIN_TOKEN);
    const res = await onRequestPut({ request: makeRequest('PUT', { slug: 'nope', title: 'x' }, auth()), env } as any);
    expect(res.status).toBe(404);
  });

  it('③ PUT 缺 slug → 422', async () => {
    const env = makeMockEnv(ADMIN_TOKEN);
    const res = await onRequestPut({ request: makeRequest('PUT', { title: 'x' }, auth()), env } as any);
    expect(res.status).toBe(422);
  });

  it('④ DELETE 按 slug 删除', async () => {
    const env = await seedOne();
    const del = await onRequestDelete({ request: makeRequest('DELETE', undefined, auth(), 'http://localhost/api/admin/articles?slug=orig'), env } as any);
    expect(del.status).toBe(200);
    const list = await onRequestGet({ request: makeRequest('GET', undefined, auth()), env } as any);
    const arr = await list.json();
    expect(arr.length).toBe(0);
  });

  it('⑤ DELETE 不存在 → 404', async () => {
    const env = makeMockEnv(ADMIN_TOKEN);
    const res = await onRequestDelete({ request: makeRequest('DELETE', undefined, auth(), 'http://localhost/api/admin/articles?slug=ghost'), env } as any);
    expect(res.status).toBe(404);
  });

  it('⑥ DELETE 缺 slug → 422', async () => {
    const env = makeMockEnv(ADMIN_TOKEN);
    const res = await onRequestDelete({ request: makeRequest('DELETE', undefined, auth()), env } as any);
    expect(res.status).toBe(422);
  });
});

describe('admin/articles — GET 列表', () => {
  beforeEach(() => resetKV());
  it('返回全部（含非 on_display）', async () => {
    const env = makeMockEnv(ADMIN_TOKEN);
    await onRequestPost({ request: makeRequest('POST', { title: 'A', wing: 'tech', slug: 'a', status: 'on_display' }, auth()), env } as any);
    await onRequestPost({ request: makeRequest('POST', { title: 'B', wing: 'think', slug: 'b', status: 'draft' }, auth()), env } as any);
    const res = await onRequestGet({ request: makeRequest('GET', undefined, auth()), env } as any);
    const arr = await res.json();
    expect(arr.length).toBe(2);
  });
});
