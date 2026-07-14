import articlesData from './articles.json';
import wingsData from './wings.json';
import projectsData from './projects.json';
import socialData from './social.json';
import type { Article, Wing, Project, ProjectsData, SocialAccount } from '../types';

/** 全部文章，含库房与草稿（仅撤展提示页等场景使用） */
export const allArticles: Article[] = articlesData as Article[];

/** 展出中的文章——所有列表、搜索、计数、上一篇/下一篇只用这一份 */
export const articles: Article[] = allArticles.filter(
  (a) => (a.status ?? 'on_display') === 'on_display'
);

export const wings: Wing[] = wingsData as Wing[];

const pd = projectsData as ProjectsData;

export const projects: Project[] = pd.projects;
export const projectsSyncedAt: string = pd.synced_at;

export const socials: SocialAccount[] = socialData as SocialAccount[];

/** 按 auto.updated 倒序取最近有动静的项目，供首页 Now 条使用 */
export function latestProjectUpdates(limit: number): Project[] {
  return [...projects]
    .filter((p) => p.auto.updated)
    .sort((a, b) => (b.auto.updated ?? '').localeCompare(a.auto.updated ?? ''))
    .slice(0, limit);
}
