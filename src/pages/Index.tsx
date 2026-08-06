import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { wings } from '../data/content';
import { useMuseumData } from '../data/MuseumDataContext';
import type { Article, Wing, WingSlug } from '../types';
import './Index.css';

type ViewMode = 'time' | 'wing' | 'tag';

const wingMap: Record<WingSlug, Wing> = Object.fromEntries(
  wings.map(w => [w.slug, w])
) as Record<WingSlug, Wing>;

const viewLabels: Record<ViewMode, string> = {
  time: '按时间',
  wing: '按展厅',
  tag: '按标签',
};

function formatDate(iso: string): string {
  const d = new Date(iso);
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}.${m}.${day}`;
}

function matchesQuery(article: Article, query: string): boolean {
  if (!query) return true;
  const q = query.toLowerCase();
  return (
    article.title.toLowerCase().includes(q) ||
    article.summary.toLowerCase().includes(q) ||
    article.tags.some(t => t.toLowerCase().includes(q))
  );
}

interface RowProps {
  article: Article;
  onClick: () => void;
}

function ArticleRow({ article, onClick }: RowProps) {
  const wing = wingMap[article.wing];
  return (
    <div className="index-row" onClick={onClick} role="link" tabIndex={0} onKeyDown={e => { if (e.key === 'Enter') onClick(); }}>
      <span className="index-row-date">{formatDate(article.created)}</span>
      <span className={`index-row-wing index-row-wing--${article.wing}`}>
        {wing?.name ?? article.wing}
      </span>
      <span className="index-row-title">{article.title}</span>
      <span className="index-row-time">{article.reading_time_min} min</span>
      <span className="index-row-version">{article.version}</span>
    </div>
  );
}

export default function Index() {
  const navigate = useNavigate();
  const { articles, loading } = useMuseumData();
  const [mode, setMode] = useState<ViewMode>('time');
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => articles.filter(a => matchesQuery(a, query)), [articles, query]);

  if (loading) {
    return (
      <main className="index-page">
        <div className="container">
          <div className="loading">策展中…</div>
        </div>
      </main>
    );
  }

  /* ── Grouped views ── */

  const timeView = useMemo(() => {
    return [...filtered].sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime());
  }, [filtered]);

  const wingView = useMemo(() => {
    const groups: Record<string, Article[]> = {};
    for (const a of filtered) {
      (groups[a.wing] ??= []).push(a);
    }
    // Keep wing order consistent with wings.json
    return wings
      .map(w => ({
        wing: w,
        articles: (groups[w.slug] ?? []).sort(
          (a, b) => new Date(b.created).getTime() - new Date(a.created).getTime()
        ),
      }))
      .filter(g => g.articles.length > 0);
  }, [filtered]);

  const tagView = useMemo(() => {
    const groups: Record<string, Article[]> = {};
    for (const a of filtered) {
      for (const t of a.tags) {
        (groups[t] ??= []).push(a);
      }
    }
    return Object.entries(groups)
      .sort((a, b) => b[1].length - a[1].length) // most articles first
      .map(([tag, arts]) => ({
        tag,
        articles: arts.sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime()),
      }));
  }, [filtered]);

  const goTo = (slug: string) => navigate(`/article/${slug}`);

  /* ── Render helpers ── */

  function renderList(arts: Article[]) {
    return (
      <div className="index-list">
        {arts.map(a => (
          <ArticleRow key={a.slug} article={a} onClick={() => goTo(a.slug)} />
        ))}
      </div>
    );
  }

  function renderContent() {
    if (filtered.length === 0) {
      return (
        <div className="index-empty">
          <div className="index-empty-icon">∅</div>
          <div className="index-empty-text">没有找到匹配的展品</div>
        </div>
      );
    }

    if (mode === 'time') {
      return renderList(timeView);
    }

    if (mode === 'wing') {
      return wingView.map(group => (
        <div key={group.wing.slug}>
          <div className="index-section-header">
            <span className="index-section-accent" style={{ background: group.wing.accent }} />
            <span className="index-section-name">{group.wing.name}</span>
            <span className="index-section-count">{group.articles.length} entries</span>
          </div>
          {renderList(group.articles)}
        </div>
      ));
    }

    // tag mode
    return tagView.map(group => (
      <div key={group.tag}>
        <div className="index-section-header">
          <span className="index-section-accent" style={{ background: 'var(--ink-faint)' }} />
          <span className="index-section-name">{group.tag}</span>
          <span className="index-section-count">{group.articles.length} entries</span>
        </div>
        {renderList(group.articles)}
      </div>
    ));
  }

  return (
    <main className="index-page">
      <div className="container">
        {/* 铭牌 */}
        <div className="index-plaque">
          <span className="index-plaque-vol">Vol. 01</span>
          <span className="index-plaque-title">Catalog · {articles.length} entries</span>
        </div>

        {/* Controls */}
        <div className="index-controls">
          <div className="index-chips">
            {(Object.keys(viewLabels) as ViewMode[]).map(m => (
              <button
                key={m}
                className={`index-chip${mode === m ? ' active' : ''}`}
                onClick={() => setMode(m)}
              >
                {viewLabels[m]}
              </button>
            ))}
          </div>
          <div className="index-search">
            <span className="index-search-icon">⌕</span>
            <input
              type="text"
              placeholder="搜索标题、摘要、标签…"
              value={query}
              onChange={e => setQuery(e.target.value)}
            />
            {query && (
              <button className="index-search-clear" onClick={() => setQuery('')} aria-label="清除搜索">
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Result count when searching */}
        {query && (
          <div className="index-result-count">
            找到 {filtered.length} 项
          </div>
        )}

        {/* List */}
        {renderContent()}
      </div>
    </main>
  );
}
