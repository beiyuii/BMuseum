import { useParams, useNavigate } from 'react-router-dom';
import { useMemo } from 'react';
import type { Article } from '../types';
import { useReveal } from '../hooks/useReveal';
import { articles as allVisible, wings as wingsList } from '../data/content';
import './Wing.css';

const WING_NUMBERS: Record<string, string> = {
  tech: '01',
  think: '02',
  create: '03',
};

const WING_ACCENT_CLASSES: Record<string, string> = {
  tech: 'wing--tech',
  think: 'wing--think',
  create: 'wing--create',
};

export default function Wing() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  const wing = useMemo(
    () => wingsList.find((w) => w.slug === slug),
    [slug]
  );

  const articles = useMemo(
    () =>
      allVisible
        .filter((a) => a.wing === slug)
        .sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime()),
    [slug]
  );

  const featured = useMemo(
    () => articles.find((a) => a.slug === wing?.featured_slug) ?? articles.find((a) => a.featured) ?? null,
    [articles, wing]
  );

  const recentNonFeatured = useMemo(
    () => articles.filter((a) => a.slug !== featured?.slug).slice(0, 3),
    [articles, featured]
  );

  const yearGroups = useMemo(() => {
    const groups: Record<number, Article[]> = {};
    articles.forEach((a) => {
      const year = new Date(a.created).getFullYear();
      if (!groups[year]) groups[year] = [];
      groups[year].push(a);
    });
    return Object.entries(groups)
      .sort(([a], [b]) => Number(b) - Number(a))
      .map(([year, items]) => ({ year: Number(year), items }));
  }, [articles]);

  const revealA = useReveal();
  const revealB = useReveal();
  const revealC = useReveal();
  const revealD = useReveal();

  if (!wing || !slug) {
    return (
      <div className="wing wing--empty">
        <p>展厅未找到 / Wing not found.</p>
      </div>
    );
  }

  const wingNum = WING_NUMBERS[slug] ?? '??';
  const accentClass = WING_ACCENT_CLASSES[slug] ?? '';

  // Parse subtitle: "工程参考室 · Engineering Reference Room"
  const subtitleParts = wing.subtitle.split(' · ');
  const chineseName = subtitleParts[0] ?? '';
  const englishSubtitle = subtitleParts[1] ?? '';

  // Parse wing name: "Tech 翼" → ["Tech", "翼"]
  const nameParts = wing.name.split(' ');
  const nameMain = nameParts[0] ?? '';
  const nameKanji = nameParts[1] ?? '';

  const accentColor = wing.accent;

  function formatDate(dateStr: string): string {
    return dateStr; // already YYYY-MM-DD
  }

  function formatVol(article: Article): string {
    return `${wing?.slug?.toUpperCase()} · Vol.${wingNum} · No.${String(article.no).padStart(3, '0')}`;
  }

  return (
    <main className={`wing ${accentClass}`} style={{ '--wing-accent': accentColor } as React.CSSProperties}>
      {/* ─── Segment A: Wing Intro Copper Plate ─── */}
      <section className="wing-intro reveal" ref={revealA}>
        <div className="wing-intro__grid">
          <div className="wing-intro__left">
            <p className="wing-intro__eyebrow">
              <span className="wing-intro__dot" /> Wing · {wingNum} · {chineseName}
            </p>
            <h1 className="wing-intro__name">
              {nameMain} / <span className="wing-intro__kanji">{nameKanji}</span>
            </h1>
            <p className="wing-intro__english">{englishSubtitle}</p>
            <div className="wing-intro__note">
              <span className="wing-intro__note-label">Curator's Note</span>
              <p className="wing-intro__note-body">{wing.curator_note}</p>
            </div>
          </div>
          <div className="wing-intro__right">
            <div className="wing-stats">
              <dl className="wing-stats__list">
                <div className="wing-stats__row">
                  <dt>展品总数</dt>
                  <dd>{articles.length} 件</dd>
                </div>
                <div className="wing-stats__row">
                  <dt>精选展品</dt>
                  <dd>{featured ? '1 件' : '0 件'}</dd>
                </div>
                <div className="wing-stats__row">
                  <dt>最近更新</dt>
                  <dd>{articles[0] ? formatDate(articles[0].updated) : '—'}</dd>
                </div>
                <div className="wing-stats__row">
                  <dt>主题标签</dt>
                  <dd className="wing-stats__tags">
                    {[...new Set(articles.flatMap((a) => a.tags))].slice(0, 4).join(' · ')}
                  </dd>
                </div>
                <div className="wing-stats__row">
                  <dt>翼色</dt>
                  <dd>
                    <span className="wing-stats__swatch" />{' '}
                    {wing.slug === 'tech' ? '钢蓝灰' : wing.slug === 'think' ? '红土' : '苔绿'}{' '}
                    {accentColor}
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Segment B: Featured Exhibit ─── */}
      {featured && (
        <section className="wing-featured reveal" ref={revealB}>
          <div
            className="wing-featured__card"
            onClick={() => navigate(`/article/${featured.slug}`)}
            role="link"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && navigate(`/article/${featured.slug}`)}
          >
            <div className="wing-featured__left">
              <span className="wing-featured__vol">{formatVol(featured)}</span>
              <span className="wing-featured__number">{String(featured.no).padStart(3, '0')}</span>
              <span className="wing-featured__badge">精选展品</span>
            </div>
            <div className="wing-featured__right">
              <p className="wing-featured__meta">
                {chineseName} · {formatDate(featured.created)} · {featured.version}
              </p>
              <h2 className="wing-featured__title">{featured.title}</h2>
              <p className="wing-featured__summary">{featured.summary}</p>
              <div className="wing-featured__footer">
                <span className="wing-featured__enter">进入展品 →</span>
                <span className="wing-featured__time">{featured.reading_time_min} min read</span>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ─── Segment C: Recent Additions ─── */}
      {recentNonFeatured.length > 0 && (
        <section className="wing-recent reveal" ref={revealC}>
          <div className="wing-recent__grid">
            {recentNonFeatured.map((article) => (
              <div
                className="wing-recent__card"
                key={article.slug}
                onClick={() => navigate(`/article/${article.slug}`)}
                role="link"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && navigate(`/article/${article.slug}`)}
              >
                <p className="wing-recent__meta">
                  {chineseName} · {formatDate(article.created)}
                </p>
                <h3 className="wing-recent__title">{article.title}</h3>
                <p className="wing-recent__summary">{article.summary}</p>
                <div className="wing-recent__footer">
                  <span className="wing-recent__time">{article.reading_time_min} min</span>
                  <span className="wing-recent__version">{article.version}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ─── Segment D: All Exhibits ─── */}
      <section className="wing-all reveal" ref={revealD}>
        {yearGroups.map(({ year, items }) => (
          <div className="wing-all__year-group" key={year}>
            <h3 className="wing-all__year-label">{year}</h3>
            <div className="wing-all__rows">
              {items.map((article) => (
                <div
                  className="wing-all__row"
                  key={article.slug}
                  onClick={() => navigate(`/article/${article.slug}`)}
                  role="link"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && navigate(`/article/${article.slug}`)}
                >
                  <span className="wing-all__date">{formatDate(article.created)}</span>
                  <span className="wing-all__title">{article.title}</span>
                  <span className="wing-all__time">{article.reading_time_min} min</span>
                  <span className="wing-all__version">{article.version}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </section>
    </main>
  );
}
