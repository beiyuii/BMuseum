import { useParams, useNavigate, Link } from 'react-router-dom';
import { useRef, useState, useEffect, useCallback } from 'react';
import { wings as wingsList } from '../data/content';
import { useMuseumData } from '../data/MuseumDataContext';
import './ArticleDetail.css';

/* ── simple markdown → HTML ───────────────────────────────── */

function mdToHtml(md: string): string {
  const lines = md.split('\n');
  const blocks: string[] = [];
  let inList = false;
  let listType: 'ul' | 'ol' = 'ul';
  let listItems: string[] = [];

  const flushList = () => {
    if (listItems.length) {
      blocks.push(`<${listType}>${listItems.join('')}</${listType}>`);
      listItems = [];
      inList = false;
    }
  };

  const inline = (s: string) =>
    s
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/`([^`]+)`/g, '<code>$1</code>');

  for (const raw of lines) {
    const line = raw.trimEnd();

    // heading
    if (/^## /.test(line)) {
      flushList();
      blocks.push(`<h2>${inline(line.replace(/^## /, ''))}</h2>`);
      continue;
    }

    // blockquote
    if (/^> /.test(line)) {
      flushList();
      blocks.push(`<blockquote>${inline(line.replace(/^> /, ''))}</blockquote>`);
      continue;
    }

    // unordered list
    if (/^- /.test(line)) {
      if (inList && listType !== 'ul') flushList();
      if (!inList) {
        inList = true;
        listType = 'ul';
      }
      listItems.push(`<li>${inline(line.replace(/^- /, ''))}</li>`);
      continue;
    }

    // ordered list
    if (/^\d+\. /.test(line)) {
      if (inList && listType !== 'ol') flushList();
      if (!inList) {
        inList = true;
        listType = 'ol';
      }
      listItems.push(`<li>${inline(line.replace(/^\d+\. /, ''))}</li>`);
      continue;
    }

    // blank line
    if (line.trim() === '') {
      flushList();
      continue;
    }

    // regular paragraph
    flushList();
    blocks.push(`<p>${inline(line)}</p>`);
  }

  flushList();
  return blocks.join('\n');
}

/* ── component ────────────────────────────────────────────── */

export default function ArticleDetail() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const bodyRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);
  const { articles, allArticles, loading } = useMuseumData();

  // 直链允许命中库房文章（下方渲染撤展提示），列表与上一/下一篇只走展出中的文章
  const article = allArticles.find((a) => a.slug === slug);
  const wing = article ? wingsList.find((w) => w.slug === article.wing) : undefined;
  const inStorage = !!article && (article.status ?? 'on_display') !== 'on_display';

  // prev / next within same wing
  const wingArticles = article
    ? articles.filter((a) => a.wing === article.wing).sort((a, b) => a.no - b.no)
    : [];
  const idx = wingArticles.findIndex((a) => a.slug === slug);
  const prev = idx > 0 ? wingArticles[idx - 1] : undefined;
  const next = idx < wingArticles.length - 1 ? wingArticles[idx + 1] : undefined;

  /* ── reading progress ─────────────────────────────── */
  const handleScroll = useCallback(() => {
    if (!bodyRef.current) return;
    const rect = bodyRef.current.getBoundingClientRect();
    const windowH = window.innerHeight;
    const total = rect.height - windowH;
    if (total <= 0) {
      setProgress(1);
      return;
    }
    const scrolled = -rect.top;
    setProgress(Math.max(0, Math.min(1, scrolled / total)));
  }, []);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  if (loading) {
    return (
      <div className="article-detail not-found">
        <h2>策展中…</h2>
        <p>正在从馆藏调取展品。</p>
        <Link to="/index" className="back-link">← 返回目录</Link>
      </div>
    );
  }

  if (!article || !wing) {
    return (
      <div className="article-detail not-found">
        <h2>展品未找到</h2>
        <p>编号 "{slug}" 在馆藏目录中不存在。</p>
        <Link to="/index" className="back-link">← 返回目录</Link>
      </div>
    );
  }

  if (inStorage) {
    return (
      <div className="article-detail not-found">
        <h2>此展品已撤展</h2>
        <p>《{article.title}》已移入库房，等待馆长重新策展后再次展出。</p>
        <Link to="/index" className="back-link">← 返回目录</Link>
      </div>
    );
  }

  const wingAccent = wing.accent;
  const noStr = `${wing.name.charAt(0).toUpperCase()}${wing.name.slice(1)} · Vol.${String(article.no).padStart(2, '0')} · No.${String(article.no).padStart(3, '0')}`;

  return (
    <div className="article-detail" ref={bodyRef}>
      {/* ── reading progress bar ─────────────────────── */}
      <div className="reading-progress-track" style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 200 }}>
        <div
          className="reading-progress-bar"
          style={{ width: `${progress * 100}%` }}
        />
      </div>

      <div className="article-container">
        {/* ── catalog tag (馆藏铭牌) ─────────────────── */}
        <div className="catalog-tag" style={{ '--wing-accent': wingAccent } as React.CSSProperties}>
          <div className="catalog-grid">
            <div className="catalog-label">馆藏号</div>
            <div className="catalog-value" style={{ color: wingAccent }}>{noStr}</div>
            <div className="catalog-label">标签</div>
            <div className="catalog-value">{article.tags.join(' · ')}</div>

            <div className="catalog-label">日期</div>
            <div className="catalog-value">
              {article.created} 首发 · {article.updated} 更新
            </div>
            <div className="catalog-label">阅读</div>
            <div className="catalog-value">约 {article.reading_time_min} 分钟</div>

            <div className="catalog-label">版本</div>
            <div className="catalog-value">{article.version}</div>
            <div className="catalog-label">展厅</div>
            <div className="catalog-value">
              <Link to={`/wing/${wing.slug}`} className="wing-link">{wing.name} · {wing.subtitle.split('·')[0].trim()}</Link>
            </div>
          </div>
        </div>

        {/* ── title area ─────────────────────────────── */}
        <header className="article-header">
          <h1>{article.title}</h1>
          {article.subtitle && <p className="article-subtitle">{article.subtitle}</p>}
        </header>

        {/* ── body ───────────────────────────────────── */}
        <article
          className="article-body"
          dangerouslySetInnerHTML={{ __html: mdToHtml(article.body) }}
        />

        {/* ── bottom prev/next navigation ───────────── */}
        <nav className="article-nav">
          {prev ? (
            <button
              className="nav-card nav-prev"
              onClick={() => navigate(`/article/${prev.slug}`)}
            >
              <span className="nav-direction">← 上一展品</span>
              <span className="nav-title">{prev.title}</span>
            </button>
          ) : (
            <div className="nav-card nav-empty" />
          )}

          {next ? (
            <button
              className="nav-card nav-next"
              onClick={() => navigate(`/article/${next.slug}`)}
            >
              <span className="nav-direction">下一展品 →</span>
              <span className="nav-title">{next.title}</span>
            </button>
          ) : (
            <div className="nav-card nav-empty" />
          )}
        </nav>
      </div>
    </div>
  );
}
