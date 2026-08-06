/**
 * POST /api/visitor/issue
 *
 * 发放访客票根。
 * - 用 KV 原子递增 counter:visitors，返回全局唯一票号
 * - 若 KV 不可用，降级到随机票号（兼容本地开发）
 *
 * KV schema:
 *   counter:visitors  →  "1234"  （当前最大票号）
 */

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json',
};

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

export async function onRequestPost(context) {
  try {
    const kv = context.env.BMUSEUM_KV;

    // 读取当前计数器
    const raw = await kv.get('counter:visitors');
    const current = raw ? parseInt(raw, 10) : 0;
    const next = current + 1;

    // 写回（非严格原子，低流量场景足够）
    await kv.put('counter:visitors', String(next));

    return new Response(
      JSON.stringify({ ticket_no: next, ok: true }),
      { status: 200, headers: CORS_HEADERS },
    );
  } catch (err) {
    // KV 不可用时降级到随机票号
    const fallback = Math.floor(Math.random() * 9000) + 1000;
    return new Response(
      JSON.stringify({ ticket_no: fallback, ok: true, fallback: true }),
      { status: 200, headers: CORS_HEADERS },
    );
  }
}
