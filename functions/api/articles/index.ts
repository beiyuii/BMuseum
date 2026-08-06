/**
 * GET /api/articles — 公开读取展出中的文章（供公众站）。
 * KV 为空时从 /seed/articles.json 播种。
 * 返回 status !== 'draft' 的文章（on_display + storage，后者用于撤展提示页），
 * 按 no 倒序。公众站再按 on_display 过滤出真正展出的。
 */

import { CORS_HEADERS, json, ensureSeeded } from '../_lib/helpers';

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

export async function onRequestGet(context) {
  const kv = context.env.BMUSEUM_KV;
  await ensureSeeded(kv, context.request, 'articles', '/seed/articles.json');

  const raw = await kv.get('articles');
  const all = raw ? JSON.parse(raw) : [];
  const visible = all
    .filter((a) => (a.status ?? 'on_display') !== 'draft')
    .sort((a, b) => (b.no ?? 0) - (a.no ?? 0));

  return json(visible);
}
