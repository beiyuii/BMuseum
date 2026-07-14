import { useEffect, useRef, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useScrollProgress } from '../hooks/useScrollProgress';
import { useReveal } from '../hooks/useReveal';
import { articles, wings, socials, latestProjectUpdates } from '../data/content';
import './GrandHall.css';

interface GrandHallProps {
  onNavDarkChange: (dark: boolean) => void;
}

export default function GrandHall({ onNavDarkChange }: GrandHallProps) {
  const thresholdRef = useRef<HTMLDivElement>(null);
  const progress = useScrollProgress(thresholdRef);
  const hallRevealRef = useReveal();
  const lastDarkRef = useRef(false);

  const nowItems = useMemo(() => latestProjectUpdates(2), []);

  const skipToHall = () => {
    document.getElementById('hall')?.scrollIntoView({ behavior: 'smooth' });
  };

  /* ── Easing: ease-in-out quadratic ──────────── */
  const eased =
    progress < 0.5
      ? 2 * progress * progress
      : 1 - (-2 * progress + 2) ** 2 / 2;

  /* ── Threshold interpolated values ──────────── */
  const doorHeight = 38 + (110 - 38) * eased;       // vh
  const imgScale = 1.04 + (1.18 - 1.04) * eased;
  const imgBrightness = 0.95 - (0.95 - 0.4) * eased;
  const imgSaturate = 0.88 - (0.88 - 0.68) * eased;
  const overlayOpacity = 1 - eased;
  const showCue = progress >= 0.3 && progress <= 0.85;

  /* ── Notify parent: nav dark-mode toggle ────── */
  useEffect(() => {
    const isDark = eased > 0.55;
    if (isDark !== lastDarkRef.current) {
      lastDarkRef.current = isDark;
      onNavDarkChange(isDark);
    }
  }, [eased, onNavDarkChange]);

  /* ── Nav entrance animation (body class) ────── */
  useEffect(() => {
    document.body.classList.add('grand-hall-entering');
    const timer = setTimeout(() => {
      document.body.classList.remove('grand-hall-entering');
    }, 2200);
    return () => {
      clearTimeout(timer);
      document.body.classList.remove('grand-hall-entering');
    };
  }, []);

  /* ── Count exhibits per wing ────────────────── */
  const wingCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    articles.forEach((a) => {
      counts[a.wing] = (counts[a.wing] || 0) + 1;
    });
    return counts;
  }, []);

  return (
    <main className="grand-hall">
      {/* ══════════════════════════════════════════
          Segment A – Hero (100vh)
          ══════════════════════════════════════════ */}
      <section className="hero">
        <div className="hero-body">
          {/* 左：原有诗意主视觉，保持完整气势 */}
          <div className="hero-main">
            <p className="eyebrow hero-eyebrow">
              ● Tech · Think · Create / curated solo, opened after the workday
            </p>

            <h1 className="hero-title">
              <span className="hero-line hero-line-1">白天写代码，</span>
              <span className="hero-line hero-line-2">
                夜里<span className="kaiti">收藏</span>
              </span>
              <span className="hero-line hero-line-3">想清楚的事。</span>
            </h1>

            <p className="hero-subtitle">
              By day, I ship. By night, I curate what survived the thinking.
              <br />
              — 三个展厅，一年一馆。
            </p>
          </div>

          {/* 右：馆长铭牌，像挂在展墙上的说明牌 */}
          <aside className="hero-aside">
            <div className="curator-plaque">
              <div className="curator-plaque-avatar">B</div>
              <div className="curator-plaque-body">
                <div className="curator-plaque-name">
                  BEIYUII
                  <span className="curator-plaque-role">Curator · 馆长</span>
                </div>
                <p className="curator-plaque-line">
                  00 后全栈 → AI 应用开发者。正在做 才驿 · 图文故事工厂 · Personal API Skill。
                </p>
                <div className="curator-plaque-actions">
                  <Link to="/projects" className="plaque-btn plaque-btn--solid">
                    看项目 →
                  </Link>
                  <Link to="/wing/think" className="plaque-btn">
                    读思考
                  </Link>
                  <a href="#find-curator" className="plaque-btn">
                    找到我 ↓
                  </a>
                </div>
                <div className="curator-plaque-channels">
                  {socials.map((s) =>
                    s.url ? (
                      <a key={s.key} href={s.url} target="_blank" rel="noopener noreferrer">
                        {s.label}
                      </a>
                    ) : (
                      <a key={s.key} href="#find-curator">
                        {s.label}
                      </a>
                    )
                  )}
                </div>
              </div>
            </div>

            {nowItems.length > 0 && (
              <div className="hero-now">
                <span className="hero-now-label">Now</span>
                <span className="hero-now-text">
                  {nowItems
                    .map((p) => `${p.name} ${p.auto.version ?? ''} · 更新于 ${p.auto.updated}`)
                    .join('　')}
                </span>
                <Link to="/projects" className="hero-now-link">
                  全部近况 →
                </Link>
              </div>
            )}
          </aside>

          <div className="plate-rule hero-plate">
            <span>Vol. 01 · One-author archive / est. 2026</span>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          Segment B – Threshold (220vh scroll)
          ══════════════════════════════════════════ */}
      <section className="threshold" ref={thresholdRef}>
        <div className="threshold-stage">
          <div
            className="threshold-door"
            style={{ height: `${doorHeight}vh` }}
          >
            <div
              className="threshold-image"
              style={{
                transform: `scale(${imgScale})`,
                filter: `brightness(${imgBrightness}) saturate(${imgSaturate})`,
              }}
            />
            <div
              className="threshold-overlay"
              style={{ opacity: overlayOpacity }}
            />
          </div>

          <div className={`threshold-cue ${showCue ? 'visible' : ''}`}>
            继续向下 · Step inside
            <span className="cue-arrow">↓</span>
            <button className="threshold-skip" onClick={skipToHall}>
              跳过 · 直接入馆
            </button>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          Segment C – Hall Preview (Dark)
          ══════════════════════════════════════════ */}
      <section
        id="hall"
        className="hall-preview reveal"
        ref={hallRevealRef as React.Ref<HTMLDivElement>}
      >
        <div className="container">
          <p className="eyebrow hall-eyebrow">
            ● 三个展厅 · Three Wings
          </p>

          <h2 className="hall-title">
            走廊里，没有别人，只有你 —— 和
            <span className="kaiti">被你想清楚的事</span>。
          </h2>

          <div className="wing-grid">
            {wings.map((wing, i) => (
              <Link
                key={wing.slug}
                to={`/wing/${wing.slug}`}
                className="wing-card"
                style={
                  { '--wing-accent': wing.accent } as React.CSSProperties
                }
              >
                <div className="wing-card-accent" />
                <span className="wing-card-number">
                  Wing · 0{i + 1}
                </span>
                <h3 className="wing-card-name">{wing.name}</h3>
                <p className="wing-card-subtitle">{wing.subtitle}</p>
                <p className="wing-card-note">{wing.curator_note}</p>
                <span className="wing-card-cta">
                  {wingCounts[wing.slug] ?? 0} 件展品 → 进入
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Foyer：占据原「hall-preview ↔ footer」留白带，正文落在此段同色深底区内 */}
      <section className="hall-foyer" aria-label="展厅出口导语">
        <div className="container">
          <p className="hall-foyer-eyebrow">
            ● Foyer · 出口小语
          </p>
          <p className="hall-foyer-text">
            动线在这里轻轻收束；再往下一层，是门牌、订阅与留言本——像走廊尽头还亮着的一盏小灯。
          </p>
          <p className="hall-foyer-en">
            Wayfinding, RSS, and the guest book sit just below — a soft landing before you leave.
          </p>
        </div>
      </section>
    </main>
  );
}
