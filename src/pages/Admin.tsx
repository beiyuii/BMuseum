import { useState, useEffect, useCallback } from 'react';
import { useMuseumData } from '../data/MuseumDataContext';
import type { Article, Project, WingSlug } from '../types';
import './Admin.css';

const TOKEN_KEY = 'bmuseum_admin_token';

const WINGS: WingSlug[] = ['tech', 'think', 'create'];
const ARTICLE_STATUS: { value: string; label: string }[] = [
  { value: 'on_display', label: '展出中' },
  { value: 'storage', label: '库房' },
  { value: 'draft', label: '草稿' },
];
const PROJECT_STATUS: { value: string; label: string }[] = [
  { value: 'running', label: '运行中' },
  { value: 'beta', label: '内测中' },
  { value: 'paused', label: '已停工' },
  { value: 'archived', label: '已归档' },
];

type Tab = 'articles' | 'projects';

interface ArticleForm {
  slug: string;
  title: string;
  wing: WingSlug;
  no: string;
  subtitle: string;
  summary: string;
  body: string;
  tags: string;
  version: string;
  featured: boolean;
  status: string;
  cover: string;
}
interface ProjectForm {
  slug: string;
  name: string;
  name_en: string;
  tagline: string;
  status: string;
  status_label: string;
  platform: string;
  tech: string;
  accent: string;
  links: string;
  article_slug: string;
  sourceType: 'github' | 'manual';
  repo: string;
  autoVersion: string;
  autoUpdated: string;
  autoStars: string;
}

const emptyArticle: ArticleForm = {
  slug: '', title: '', wing: 'tech', no: '', subtitle: '', summary: '',
  body: '', tags: '', version: 'v1.0', featured: false, status: 'on_display', cover: '',
};
const emptyProject: ProjectForm = {
  slug: '', name: '', name_en: '', tagline: '', status: 'running', status_label: '运行中',
  platform: '', tech: '', accent: '#C15F3C', links: '', article_slug: '', sourceType: 'manual',
  repo: '', autoVersion: '', autoUpdated: '', autoStars: '',
};

export default function Admin() {
  const { refresh } = useMuseumData();
  const [token, setToken] = useState<string>(() => sessionStorage.getItem(TOKEN_KEY) ?? '');
  const [tab, setTab] = useState<Tab>('articles');

  const [articles, setArticles] = useState<Article[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [articleForm, setArticleForm] = useState<ArticleForm | null>(null);
  const [projectForm, setProjectForm] = useState<ProjectForm | null>(null);
  const [formError, setFormError] = useState('');
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState('');

  const authHeaders = useCallback(
    (method = 'GET') => ({
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    }),
    [token],
  );

  const loadArticles = useCallback(async () => {
    const res = await fetch('/api/admin/articles', authHeaders('GET'));
    if (!res.ok) throw new Error(res.status === 401 ? '鉴权失败' : '加载文章失败');
    return (await res.json()) as Article[];
  }, [authHeaders]);

  const loadProjects = useCallback(async () => {
    const res = await fetch('/api/admin/projects', authHeaders('GET'));
    if (!res.ok) throw new Error(res.status === 401 ? '鉴权失败' : '加载项目失败');
    const data = (await res.json()) as { projects: Project[] };
    return data.projects;
  }, [authHeaders]);

  const reload = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError('');
    try {
      const [a, p] = await Promise.all([loadArticles(), loadProjects()]);
      setArticles(a);
      setProjects(p);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [token, loadArticles, loadProjects]);

  useEffect(() => {
    if (token) reload();
  }, [token, reload]);

  const login = (t: string) => {
    sessionStorage.setItem(TOKEN_KEY, t);
    setToken(t);
  };
  const logout = () => {
    sessionStorage.removeItem(TOKEN_KEY);
    setToken('');
    setArticles([]);
    setProjects([]);
  };

  /* ── 文章保存 ── */
  const saveArticle = async (form: ArticleForm) => {
    setFormError('');
    const payload: Record<string, unknown> = {
      title: form.title,
      wing: form.wing,
      subtitle: form.subtitle,
      summary: form.summary,
      body: form.body,
      tags: form.tags.split(',').map((s) => s.trim()).filter(Boolean),
      version: form.version,
      featured: form.featured,
      status: form.status,
      cover: form.cover || undefined,
    };
    if (form.slug) payload.slug = form.slug;
    if (form.no) payload.no = Number(form.no);

    const isEdit = !!form.slug && articles.some((a) => a.slug === form.slug);
    const url = '/api/admin/articles';
    const method = isEdit ? 'PUT' : 'POST';
    const res = await fetch(url, authHeaders(method) as RequestInit & { headers: Record<string, string> });
    if (!res.ok) {
      setFormError(`保存失败 (${res.status})`);
      return;
    }
    setArticleForm(null);
    await reload();
    refresh();
  };

  const deleteArticle = async (slug: string) => {
    if (!confirm(`确认删除文章《${slug}》？此操作不可撤销。`)) return;
    const res = await fetch(`/api/admin/articles?slug=${encodeURIComponent(slug)}`, authHeaders('DELETE'));
    if (!res.ok) { setError('删除失败'); return; }
    await reload();
    refresh();
  };

  /* ── 项目保存 ── */
  const saveProject = async (form: ProjectForm) => {
    setFormError('');
    const links = form.links
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean)
      .map((l) => {
        const [label, url] = l.split('|');
        return { label: (label ?? '').trim(), url: (url ?? '').trim() };
      });
    const payload: Record<string, unknown> = {
      name: form.name,
      name_en: form.name_en || undefined,
      tagline: form.tagline,
      status: form.status,
      status_label: form.status_label,
      platform: form.platform,
      tech: form.tech.split(',').map((s) => s.trim()).filter(Boolean),
      accent: form.accent,
      links,
      article_slug: form.article_slug || undefined,
      source: form.sourceType === 'github' ? { type: 'github', repo: form.repo } : { type: 'manual' },
      auto: {
        ...(form.autoVersion ? { version: form.autoVersion } : {}),
        ...(form.autoUpdated ? { updated: form.autoUpdated } : {}),
        ...(form.autoStars !== '' ? { stars: Number(form.autoStars) } : {}),
      },
    };
    if (form.slug) payload.slug = form.slug;

    const isEdit = !!form.slug && projects.some((p) => p.slug === form.slug);
    const res = await fetch('/api/admin/projects', authHeaders(isEdit ? 'PUT' : 'POST') as RequestInit & { headers: Record<string, string> });
    if (!res.ok) {
      setFormError(`保存失败 (${res.status})`);
      return;
    }
    setProjectForm(null);
    await reload();
    refresh();
  };

  const deleteProject = async (slug: string) => {
    if (!confirm(`确认删除项目《${slug}》？此操作不可撤销。`)) return;
    const res = await fetch(`/api/admin/projects?slug=${encodeURIComponent(slug)}`, authHeaders('DELETE'));
    if (!res.ok) { setError('删除失败'); return; }
    await reload();
    refresh();
  };

  const syncProjects = async () => {
    setSyncing(true);
    setSyncMsg('');
    try {
      const res = await fetch('/api/admin/sync', authHeaders('POST') as RequestInit & { headers: Record<string, string> });
      const data = await res.json();
      setSyncMsg(res.ok ? `已同步 ${data.synced ?? 0} 个项目` : '同步失败');
      if (res.ok) { await reload(); refresh(); }
    } catch {
      setSyncMsg('同步失败');
    } finally {
      setSyncing(false);
    }
  };

  const openEditArticle = (a: Article) => {
    setArticleForm({
      slug: a.slug,
      title: a.title,
      wing: a.wing,
      no: String(a.no ?? ''),
      subtitle: a.subtitle ?? '',
      summary: a.summary,
      body: a.body,
      tags: (a.tags ?? []).join(', '),
      version: a.version ?? 'v1.0',
      featured: a.featured ?? false,
      status: a.status ?? 'on_display',
      cover: a.cover ?? '',
    });
  };
  const openEditProject = (p: Project) => {
    setProjectForm({
      slug: p.slug,
      name: p.name,
      name_en: p.name_en ?? '',
      tagline: p.tagline,
      status: p.status,
      status_label: p.status_label,
      platform: p.platform,
      tech: (p.tech ?? []).join(', '),
      accent: p.accent ?? '#C15F3C',
      links: (p.links ?? []).map((l) => `${l.label}|${l.url}`).join('\n'),
      article_slug: p.article_slug ?? '',
      sourceType: p.source?.type === 'github' ? 'github' : 'manual',
      repo: p.source?.type === 'github' ? p.source.repo : '',
      autoVersion: p.auto?.version ?? '',
      autoUpdated: p.auto?.updated ?? '',
      autoStars: p.auto?.stars != null ? String(p.auto.stars) : '',
    });
  };

  /* ── 登录态 ── */
  if (!token) {
    return (
      <main className="admin">
        <div className="admin-login">
          <h1>馆长后台</h1>
          <p>输入管理 Token 进入。</p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const t = (e.currentTarget.elements.namedItem('token') as HTMLInputElement).value.trim();
              if (t) login(t);
            }}
          >
            <input name="token" type="password" placeholder="BMUSEUM_ADMIN_TOKEN" autoFocus />
            <button type="submit">进入</button>
          </form>
        </div>
      </main>
    );
  }

  return (
    <main className="admin">
      <header className="admin-head">
        <h1>馆长后台</h1>
        <div className="admin-head-right">
          <button className="admin-tab" onClick={() => { setTab('articles'); setArticleForm(null); }}>文章</button>
          <button className="admin-tab" onClick={() => { setTab('projects'); setProjectForm(null); }}>项目</button>
          <button className="admin-logout" onClick={logout}>退出</button>
        </div>
      </header>

      {error && <div className="admin-error">{error}</div>}
      {loading && <div className="admin-loading">加载中…</div>}

      {tab === 'articles' && (
        <section className="admin-section">
          <div className="admin-section-bar">
            <span>{articles.length} 篇文章</span>
            <button className="admin-new" onClick={() => setArticleForm({ ...emptyArticle })}>＋ 新建文章</button>
          </div>

          {articleForm && (
            <ArticleFormView
              form={articleForm}
              onChange={setArticleForm}
              onSave={() => saveArticle(articleForm)}
              onCancel={() => setArticleForm(null)}
              error={formError}
            />
          )}

          <ul className="admin-list">
            {articles.map((a) => (
              <li key={a.slug} className="admin-row">
                <div className="admin-row-main">
                  <span className={`badge badge--${a.wing}`}>{a.wing}</span>
                  <span className={`badge badge--status-${a.status ?? 'on_display'}`}>{ARTICLE_STATUS.find((s) => s.value === (a.status ?? 'on_display'))?.label}</span>
                  <span className="admin-row-title">{a.title}</span>
                  <span className="admin-row-meta">/{a.slug} · {a.updated?.slice(0, 10)}</span>
                </div>
                <div className="admin-row-actions">
                  <button onClick={() => openEditArticle(a)}>编辑</button>
                  <button className="danger" onClick={() => deleteArticle(a.slug)}>删除</button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {tab === 'projects' && (
        <section className="admin-section">
          <div className="admin-section-bar">
            <span>{projects.length} 个项目</span>
            <div className="admin-section-bar-actions">
              <button className="admin-sync" onClick={syncProjects} disabled={syncing}>
                {syncing ? '同步中…' : '↻ 从 GitHub 重新同步'}
              </button>
              <button className="admin-new" onClick={() => setProjectForm({ ...emptyProject })}>＋ 新建项目</button>
            </div>
          </div>
          {syncMsg && <div className="admin-sync-msg">{syncMsg}</div>}

          {projectForm && (
            <ProjectFormView
              form={projectForm}
              onChange={setProjectForm}
              onSave={() => saveProject(projectForm)}
              onCancel={() => setProjectForm(null)}
              error={formError}
            />
          )}

          <ul className="admin-list">
            {projects.map((p) => (
              <li key={p.slug} className="admin-row">
                <div className="admin-row-main">
                  <span className="admin-row-title">{p.name}</span>
                  <span className={`badge badge--status-${p.status}`}>{PROJECT_STATUS.find((s) => s.value === p.status)?.label}</span>
                  <span className="admin-row-meta">/{p.slug} · {p.source?.type === 'github' ? `github:${p.source.repo}` : 'manual'}</span>
                </div>
                <div className="admin-row-actions">
                  <button onClick={() => openEditProject(p)}>编辑</button>
                  <button className="danger" onClick={() => deleteProject(p.slug)}>删除</button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}

/* ── 文章表单 ── */
function ArticleFormView({
  form, onChange, onSave, onCancel, error,
}: {
  form: ArticleForm;
  onChange: (f: ArticleForm) => void;
  onSave: () => void;
  onCancel: () => void;
  error: string;
}) {
  const set = (k: keyof ArticleForm, v: unknown) => onChange({ ...form, [k]: v });
  return (
    <div className="admin-form">
      <h3>{form.slug ? '编辑文章' : '新建文章'}</h3>
      {error && <div className="admin-error">{error}</div>}
      <div className="admin-form-grid">
        <label>标题*<input value={form.title} onChange={(e) => set('title', e.target.value)} /></label>
        <label>展厅*<select value={form.wing} onChange={(e) => set('wing', e.target.value)}>
          {WINGS.map((w) => <option key={w} value={w}>{w}</option>)}
        </select></label>
        <label>编号 no<input value={form.no} onChange={(e) => set('no', e.target.value)} placeholder="留空自动" /></label>
        <label>Slug<input value={form.slug} onChange={(e) => set('slug', e.target.value)} placeholder="留空由标题生成" /></label>
        <label>副标题<input value={form.subtitle} onChange={(e) => set('subtitle', e.target.value)} /></label>
        <label>版本<input value={form.version} onChange={(e) => set('version', e.target.value)} /></label>
        <label>状态<select value={form.status} onChange={(e) => set('status', e.target.value)}>
          {ARTICLE_STATUS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select></label>
        <label>封面图 URL<input value={form.cover} onChange={(e) => set('cover', e.target.value)} /></label>
      </div>
      <label>摘要<textarea value={form.summary} onChange={(e) => set('summary', e.target.value)} rows={2} /></label>
      <label>正文（支持 Markdown）<textarea value={form.body} onChange={(e) => set('body', e.target.value)} rows={10} /></label>
      <div className="admin-form-row">
        <label>标签（逗号分隔）<input value={form.tags} onChange={(e) => set('tags', e.target.value)} /></label>
        <label className="admin-check"><input type="checkbox" checked={form.featured} onChange={(e) => set('featured', e.target.checked)} /> 精选</label>
      </div>
      <div className="admin-form-actions">
        <button className="primary" onClick={onSave}>保存</button>
        <button onClick={onCancel}>取消</button>
      </div>
    </div>
  );
}

/* ── 项目表单 ── */
function ProjectFormView({
  form, onChange, onSave, onCancel, error,
}: {
  form: ProjectForm;
  onChange: (f: ProjectForm) => void;
  onSave: () => void;
  onCancel: () => void;
  error: string;
}) {
  const set = (k: keyof ProjectForm, v: unknown) => onChange({ ...form, [k]: v });
  return (
    <div className="admin-form">
      <h3>{form.slug ? '编辑项目' : '新建项目'}</h3>
      {error && <div className="admin-error">{error}</div>}
      <div className="admin-form-grid">
        <label>名称*<input value={form.name} onChange={(e) => set('name', e.target.value)} /></label>
        <label>英文名<input value={form.name_en} onChange={(e) => set('name_en', e.target.value)} /></label>
        <label>状态*<select value={form.status} onChange={(e) => set('status', e.target.value)}>
          {PROJECT_STATUS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select></label>
        <label>状态标签<input value={form.status_label} onChange={(e) => set('status_label', e.target.value)} /></label>
        <label>平台<input value={form.platform} onChange={(e) => set('platform', e.target.value)} /></label>
        <label>主色<input value={form.accent} onChange={(e) => set('accent', e.target.value)} /></label>
        <label>来源类型<select value={form.sourceType} onChange={(e) => set('sourceType', e.target.value as 'github' | 'manual')}>
          <option value="manual">手动</option>
          <option value="github">GitHub</option>
        </select></label>
        <label>GitHub 仓库<input value={form.repo} disabled={form.sourceType !== 'github'} onChange={(e) => set('repo', e.target.value)} placeholder="owner/repo" /></label>
        <label>关联文章 slug<input value={form.article_slug} onChange={(e) => set('article_slug', e.target.value)} /></label>
        <label>版本(auto.version)<input value={form.autoVersion} onChange={(e) => set('autoVersion', e.target.value)} /></label>
        <label>更新日期(auto.updated)<input value={form.autoUpdated} onChange={(e) => set('autoUpdated', e.target.value)} placeholder="YYYY-MM-DD" /></label>
        <label>Stars(auto.stars)<input value={form.autoStars} onChange={(e) => set('autoStars', e.target.value)} /></label>
      </div>
      <label>定位语*<input value={form.tagline} onChange={(e) => set('tagline', e.target.value)} /></label>
      <label>技术栈（逗号分隔）<input value={form.tech} onChange={(e) => set('tech', e.target.value)} /></label>
      <label>链接（每行 `标签|URL`）<textarea value={form.links} onChange={(e) => set('links', e.target.value)} rows={3} /></label>
      <div className="admin-form-actions">
        <button className="primary" onClick={onSave}>保存</button>
        <button onClick={onCancel}>取消</button>
      </div>
    </div>
  );
}
