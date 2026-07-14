/**
 * 测试用 mock 环境。
 * - fake KV 用模块级 Map 实现，便于在测试间隔离。
 * - makeMockEnv(token) 返回注入已知 token 的 env，避免硬编码真实 token。
 */

interface FakeKV {
  get(key: string): Promise<string | null>;
  put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>;
}

// 模块级 Map：所有 makeMockEnv 创建的实例共享同一存储，resetKV 清空它。
const store = new Map<string, string>();

export function makeMockEnv(token: string) {
  const kv: FakeKV = {
    async get(key: string): Promise<string | null> {
      return store.has(key) ? (store.get(key) as string) : null;
    },
    async put(key: string, value: string): Promise<void> {
      store.set(key, value);
    },
  };
  return { BMUSEUM_KV: kv, BMUSEUM_ADMIN_TOKEN: token };
}

export function resetKV(): void {
  store.clear();
}
