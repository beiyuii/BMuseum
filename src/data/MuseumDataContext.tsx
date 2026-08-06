import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import type { Article, Project, ProjectsData, Wing, SocialAccount } from '../types';
import { wings, socials } from './content';

// 种子兜底：接口不可用时回退到构建时 JSON，保证站点永不白屏。
import seedArticles from './articles.json';
import seedProjects from './projects.json';

interface MuseumData {
  /** 仅展出中的文章（供列表） */
  articles: Article[];
  /** 非草稿文章（on_display + storage，供详情页按 slug 查找，含撤展提示） */
  allArticles: Article[];
  projects: Project[];
  projectsSyncedAt: string;
  wings: Wing[];
  socials: SocialAccount[];
  loading: boolean;
  refresh: () => void;
}

const MuseumDataContext = createContext<MuseumData | null>(null);

function nonDraft(list: Article[]): Article[] {
  return list.filter((a) => (a.status ?? 'on_display') !== 'draft');
}
function onDisplay(list: Article[]): Article[] {
  return list.filter((a) => (a.status ?? 'on_display') === 'on_display');
}

export function MuseumDataProvider({ children }: { children: ReactNode }) {
  const [articles, setArticles] = useState<Article[]>([]);
  const [allArticles, setAllArticles] = useState<Article[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectsSyncedAt, setProjectsSyncedAt] = useState<string>('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [aRes, pRes] = await Promise.all([
        fetch('/api/articles'),
        fetch('/api/projects'),
      ]);

      const aData: Article[] = aRes.ok
        ? (await aRes.json()) as Article[]
        : nonDraft(seedArticles as Article[]);
      const pData: ProjectsData = pRes.ok
        ? (await pRes.json()) as ProjectsData
        : (seedProjects as ProjectsData);

      const nd = nonDraft(aData);
      setAllArticles(nd);
      setArticles(onDisplay(nd));
      setProjects(pData.projects ?? []);
      setProjectsSyncedAt(pData.synced_at ?? '');
    } catch {
      // 网络异常：回落种子
      const nd = nonDraft(seedArticles as Article[]);
      setAllArticles(nd);
      setArticles(onDisplay(nd));
      setProjects((seedProjects as ProjectsData).projects ?? []);
      setProjectsSyncedAt((seedProjects as ProjectsData).synced_at ?? '');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const value: MuseumData = {
    articles,
    allArticles,
    projects,
    projectsSyncedAt,
    wings,
    socials,
    loading,
    refresh: load,
  };

  return <MuseumDataContext.Provider value={value}>{children}</MuseumDataContext.Provider>;
}

export function useMuseumData(): MuseumData {
  const ctx = useContext(MuseumDataContext);
  if (!ctx) {
    throw new Error('useMuseumData 必须在 <MuseumDataProvider> 内使用');
  }
  return ctx;
}
