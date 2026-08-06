import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import type { Project, ProjectStatus } from '../types';
import { useMuseumData } from '../data/MuseumDataContext';
import { useReveal } from '../hooks/useReveal';
import './Projects.css';

type Filter = 'all' | ProjectStatus;

const STATUS_ORDER: ProjectStatus[] = ['running', 'beta', 'paused', 'archived'];

const STATUS_LABELS: Record<ProjectStatus, string> = {
  running: '运行中',
  beta: '内测中',
  paused: '已停工',
  archived: '已归档',
};

const INACTIVE_STATUSES: ProjectStatus[] = ['paused', 'archived'];

function articleExists(slug?: string, list: { slug: string }[] = []): boolean {
  return !!slug && list.some((a) => a.slug === slug);
}

function ProjectCard({ project, articles }: { project: Project; articles: { slug: string }[] }) {
  const inactive = INACTIVE_STATUSES.includes(project.status);
  const accent = inactive ? 'var(--ink-faint)' : project.accent;
  const isGithub = project.source.type === 'github';

  return (
    <article
      className={`project-card${inactive ? ' project-card--inactive' : ''}`}
      style={{ '--project-accent': accent } as React.CSSProperties}
    >
      <div className="project-card-head">
        <h2 className="project-card-name">
          <span className="project-card-dot" />
          {project.name}
          {project.name_en && project.name_en !== project.name && (
            <span className="project-card-name-en">{project.name_en}</span>
          )}
        </h2>
        <span className="project-card-status">
          {project.status_label} · {project.platform}
        </span>
      </div>

      <p className="project-card-tagline">{project.tagline}</p>

      {(project.auto.version || project.auto.updated || project.auto.stars != null) && (
        <div className="project-card-meta">
          {project.auto.version && <span>{project.auto.version}</span>}
          {project.auto.updated && <span>更新于 {project.auto.updated}</span>}
          {project.auto.stars != null && <span>★ {project.auto.stars}</span>}
          <span className={`project-card-source${isGithub ? ' is-auto' : ''}`}>
            {isGithub ? '● 自动同步' : '手动维护'}
          </span>
        </div>
      )}

      {project.tech.length > 0 && (
        <div className="project-card-tech">
          {project.tech.map((t) => (
            <span key={t}>{t}</span>
          ))}
        </div>
      )}

      <div className="project-card-links">
        {project.links.map((link) => (
          <a key={link.url} href={link.url} target="_blank" rel="noopener noreferrer">
            {link.label} ↗
          </a>
        ))}
        {articleExists(project.article_slug, articles) && (
          <Link to={`/article/${project.article_slug}`} className="project-card-story">
            背后的思考 →
          </Link>
        )}
      </div>
    </article>
  );
}

export default function Projects() {
  const [filter, setFilter] = useState<Filter>('all');
  const revealRef = useReveal();
  const { articles, projects, projectsSyncedAt, loading } = useMuseumData();

  const counts = useMemo(() => {
    const c = new Map<ProjectStatus, number>();
    projects.forEach((p) => c.set(p.status, (c.get(p.status) ?? 0) + 1));
    return c;
  }, [projects]);

  const shown = filter === 'all' ? projects : projects.filter((p) => p.status === filter);

  if (loading) {
    return (
      <main className="projects-page">
        <div className="container">
          <div className="loading">策展中…</div>
        </div>
      </main>
    );
  }

  return (
    <main className="projects-page">
      <div className="container">
        <p className="eyebrow projects-eyebrow">● Permanent Collection · 常设展</p>
        <h1 className="projects-title">Projects · 项目档案</h1>
        <p className="projects-subtitle">在建的、运行中的、停掉的——以及为什么。</p>

        <div className="projects-sync">
          <span className="projects-sync-pulse" />
          数据更新于 {projectsSyncedAt} · 来源：GitHub API + 手动清单 · 每日自动同步
        </div>

        <div className="projects-chips">
          <button
            className={`projects-chip${filter === 'all' ? ' active' : ''}`}
            onClick={() => setFilter('all')}
          >
            全部 {projects.length}
          </button>
          {STATUS_ORDER.filter((s) => counts.has(s)).map((s) => (
            <button
              key={s}
              className={`projects-chip${filter === s ? ' active' : ''}`}
              onClick={() => setFilter(s)}
            >
              {STATUS_LABELS[s]} {counts.get(s)}
            </button>
          ))}
        </div>

        <div className="projects-list reveal" ref={revealRef as React.Ref<HTMLDivElement>}>
          {shown.map((p) => (
            <ProjectCard key={p.slug} project={p} articles={articles} />
          ))}
        </div>

        <p className="projects-footnote">
          版本号与更新时间由同步脚本从 GitHub 自动回写；定位语、状态与链接由馆长手动维护。
        </p>
      </div>
    </main>
  );
}
