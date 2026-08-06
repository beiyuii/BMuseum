import wingsData from './wings.json';
import socialData from './social.json';
import type { Wing, SocialAccount, Project } from '../types';

/**
 * 静态配置层（不参与运行时 CRUD）：
 * - wings（三翼定义）、socials（社交账号）本期仍由构建时 JSON 维护。
 *
 * 动态内容（文章 / 项目）改由运行时从 EdgeOne KV 读取，
 * 通过 src/data/MuseumDataContext 的 useMuseumData() 消费。
 */

export const wings: Wing[] = wingsData as Wing[];
export const socials: SocialAccount[] = socialData as SocialAccount[];

/** 按 auto.updated 倒序取最近有动静的项目，供首页 Now 条使用 */
export function latestProjectUpdates(projects: Project[], limit: number): Project[] {
  return [...projects]
    .filter((p) => p.auto?.updated)
    .sort((a, b) => (b.auto.updated ?? '').localeCompare(a.auto.updated ?? ''))
    .slice(0, limit);
}
