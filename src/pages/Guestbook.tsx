import { useState, useEffect, useRef, useMemo, type FormEvent } from 'react';
import type { GuestEntry } from '../types';
import './Guestbook.css';

/* ─── Constants ─── */
const STORAGE_KEY = 'bmuseum_guestbook';
const PAGE_SIZE = 8;
const NAME_MAX = 30;
const MSG_MAX = 280;
const AUTO_PUBLISH_MS = 30_000; // 30s for demo (24h in production)

/* ─── Seed Data ─── */
const SEED: GuestEntry[] = [
  {
    id: 'seed-1',
    name: '路人甲',
    message: '深夜路过，被首页动画震了一下。收藏了。',
    created: '2026-05-09T22:14:00Z',
    status: 'published',
    ip_hash: '',
  },
  {
    id: 'seed-2',
    name: '同龄人',
    message: '同为 00 后，看到"认知版本控制"这个概念被触动了。',
    created: '2026-05-08T19:30:00Z',
    status: 'published',
    ip_hash: '',
  },
  {
    id: 'seed-3',
    name: '过客',
    message: '一个人做产品的工具链那篇太实用了，已收藏。',
    created: '2026-05-07T21:15:00Z',
    status: 'published',
    ip_hash: '',
  },
  {
    id: 'seed-4',
    name: '工程师',
    message: '从 FastAPI 那篇过来的，迁移实录写得很诚实。',
    created: '2026-05-06T15:20:00Z',
    status: 'published',
    ip_hash: '',
  },
  {
    id: 'seed-5',
    name: '夜猫子',
    message: '凌晨两点看完 Drift 的介绍，想试试。',
    created: '2026-05-05T02:10:00Z',
    status: 'published',
    ip_hash: '',
  },
  {
    id: 'seed-6',
    name: '设计系',
    message: '留言簿这个 kraft paper 房间设计很舒服，有纸感。',
    created: '2026-05-04T16:45:00Z',
    status: 'published',
    ip_hash: '',
  },
  {
    id: 'seed-7',
    name: '路人乙',
    message: '喜欢 Wing 分翼的隐喻，技术 / 思考 / 创作三分法很好。',
    created: '2026-05-03T11:05:00Z',
    status: 'published',
    ip_hash: '',
  },
  {
    id: 'seed-8',
    name: '常客',
    message: '第一次来访时只看了 Grand Hall，第二次才发现还有 Index 殿。',
    created: '2026-05-02T09:20:00Z',
    status: 'published',
    ip_hash: '',
  },
];

/* ─── Sensitive Word Filter ─── */
const BLOCKED_WORDS = [
  '代开发票', '办证', '赌博', '色情', '免费领',
  '加微信', '加qq', '刷单', '兼职日赚', '低价',
  'spam', 'viagra', 'casino', 'buy now', 'click here',
];

function containsBlockedWord(text: string): boolean {
  const lower = text.toLowerCase();
  return BLOCKED_WORDS.some((w) => lower.includes(w));
}

/* ─── Helpers ─── */
function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function formatTimestamp(iso: string): string {
  const d = new Date(iso);
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const mi = String(d.getMinutes()).padStart(2, '0');
  return `${d.getFullYear()}.${mm}.${dd}  ${hh}:${mi}`;
}

/* ─── Storage ─── */
function loadEntries(): GuestEntry[] {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      return JSON.parse(stored) as GuestEntry[];
    } catch {
      /* corrupted — reset */
    }
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED));
  return [...SEED];
}

function saveEntries(entries: GuestEntry[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

/* ─── Auto-publish pending entries ─── */
function autoPublish(entries: GuestEntry[]): GuestEntry[] {
  const now = Date.now();
  let changed = false;
  const updated = entries.map((e) => {
    if (e.status === 'pending' && now - new Date(e.created).getTime() > AUTO_PUBLISH_MS) {
      changed = true;
      return { ...e, status: 'published' as const };
    }
    return e;
  });
  if (changed) saveEntries(updated);
  return updated;
}

/* ─── Component ─── */
export default function Guestbook() {
  const [entries, setEntries] = useState<GuestEntry[]>(() => autoPublish(loadEntries()));
  const [page, setPage] = useState(1);
  const [flipDir, setFlipDir] = useState<'next' | 'prev' | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [formError, setFormError] = useState('');
  const [honeypot, setHoneypot] = useState('');

  // Form refs
  const nameRef = useRef<HTMLInputElement>(null);
  const msgRef = useRef<HTMLTextAreaElement>(null);
  const answerRef = useRef<HTMLInputElement>(null);

  // Auto-publish ticker
  useEffect(() => {
    const id = setInterval(() => {
      setEntries((prev) => autoPublish(prev));
    }, 5000);
    return () => clearInterval(id);
  }, []);

  // Published entries, newest first
  const published = useMemo(
    () =>
      entries
        .filter((e) => e.status === 'published')
        .sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime()),
    [entries],
  );

  const totalPages = Math.max(1, Math.ceil(published.length / PAGE_SIZE));
  const pageEntries = published.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  /* ── Page flip handler ── */
  function goToPage(target: number) {
    if (target === page || target < 1 || target > totalPages) return;
    setFlipDir(target > page ? 'next' : 'prev');
    setTimeout(() => {
      setPage(target);
      setFlipDir(null);
    }, 400); // halfway through the 800ms animation
  }

  /* ── Submit ── */
  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError('');

    const name = nameRef.current?.value.trim() ?? '';
    const message = msgRef.current?.value.trim() ?? '';
    const answer = answerRef.current?.value.trim().toLowerCase() ?? '';

    // Honeypot check
    if (honeypot) {
      setFormError('提交失败，请刷新重试。');
      return;
    }
    if (!name) {
      setFormError('请填写姓名。');
      return;
    }
    if (name.length > NAME_MAX) {
      setFormError(`姓名不超过 ${NAME_MAX} 字。`);
      return;
    }
    if (!message) {
      setFormError('请填写留言。');
      return;
    }
    if (message.length > MSG_MAX) {
      setFormError(`留言不超过 ${MSG_MAX} 字。`);
      return;
    }
    if (containsBlockedWord(name) || containsBlockedWord(message)) {
      setFormError('内容包含敏感词，请修改后重试。');
      return;
    }
    if (answer !== 'museum') {
      setFormError('反 spam 题答错啦，再想想？');
      return;
    }

    const entry: GuestEntry = {
      id: generateId(),
      name,
      message,
      created: new Date().toISOString(),
      status: 'pending',
      ip_hash: '',
    };

    const updated = [entry, ...entries];
    setEntries(updated);
    saveEntries(updated);
    setSubmitted(true);

    // Reset form
    if (nameRef.current) nameRef.current.value = '';
    if (msgRef.current) msgRef.current.value = '';
    if (answerRef.current) answerRef.current.value = '';
  }

  /* ── Render ── */
  return (
    <main className="gb" role="main">
      {/* Paper texture overlay */}
      <div className="gb__texture" aria-hidden="true" />

      <div className="gb__container">
        {/* Title */}
        <header className="gb__header">
          <span className="eyebrow">Guest Book</span>
          <h1 className="gb__title">留言簿</h1>
          <p className="gb__subtitle">每一位访客都可以在此留下痕迹</p>
        </header>

        {/* Open book */}
        <div className="gb__book">
          {/* Spine */}
          <div className="gb__spine" aria-hidden="true" />

          {/* ── Left Page: History ── */}
          <section className="gb__page gb__page--left" aria-label="留言历史">
            <h2 className="gb__page-label">过往来信</h2>

            <div className={`gb__entries ${flipDir ? `gb__entries--flip-${flipDir}` : ''}`}>
              {pageEntries.length === 0 && (
                <p className="gb__empty">还没有留言，做第一个吧。</p>
              )}
              {pageEntries.map((entry) => (
                <article key={entry.id} className="gb__entry">
                  <span className="gb__entry-name">{entry.name}</span>
                  <p className="gb__entry-msg">{entry.message}</p>
                  <time className="gb__entry-time" dateTime={entry.created}>
                    {formatTimestamp(entry.created)}
                  </time>
                </article>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <nav className="gb__pagination" aria-label="留言分页">
                <button
                  className="gb__page-btn"
                  onClick={() => goToPage(page - 1)}
                  disabled={page <= 1}
                  aria-label="上一页"
                >
                  ← 上一页
                </button>
                <span className="gb__page-indicator">
                  {page} / {totalPages}
                </span>
                <button
                  className="gb__page-btn"
                  onClick={() => goToPage(page + 1)}
                  disabled={page >= totalPages}
                  aria-label="下一页"
                >
                  下一页 →
                </button>
              </nav>
            )}
          </section>

          {/* ── Right Page: Write ── */}
          <section className="gb__page gb__page--right" aria-label="写下留言">
            <h2 className="gb__page-label">留下你的话</h2>

            {submitted ? (
              <div className="gb__thanks" role="status">
                <p className="gb__thanks-icon">✓</p>
                <p className="gb__thanks-text">
                  已收到，馆长审核 24h 内展出
                </p>
                <button
                  className="gb__write-another"
                  onClick={() => setSubmitted(false)}
                >
                  再写一条
                </button>
              </div>
            ) : (
              <form className="gb__form" onSubmit={handleSubmit} noValidate>
                {/* Honeypot (hidden) */}
                <div className="gb__honey" aria-hidden="true">
                  <label htmlFor="gb-url">Website</label>
                  <input
                    id="gb-url"
                    type="text"
                    tabIndex={-1}
                    autoComplete="off"
                    value={honeypot}
                    onChange={(e) => setHoneypot(e.target.value)}
                  />
                </div>

                <label className="gb__field">
                  <span className="gb__field-label">姓名</span>
                  <input
                    ref={nameRef}
                    type="text"
                    maxLength={NAME_MAX}
                    placeholder="你的名字"
                    className="gb__input"
                    autoComplete="name"
                  />
                  <span className="gb__field-hint">最多 {NAME_MAX} 字</span>
                </label>

                <label className="gb__field">
                  <span className="gb__field-label">留言</span>
                  <textarea
                    ref={msgRef}
                    maxLength={MSG_MAX}
                    rows={4}
                    placeholder="留下你今晚看到的"
                    className="gb__textarea"
                  />
                  <span className="gb__field-hint">最多 {MSG_MAX} 字</span>
                </label>

                <label className="gb__field">
                  <span className="gb__field-label">反 spam 简单题</span>
                  <span className="gb__field-question">
                    博物馆英文是？
                  </span>
                  <input
                    ref={answerRef}
                    type="text"
                    className="gb__input"
                    autoComplete="off"
                    placeholder="your answer"
                  />
                </label>

                {formError && (
                  <p className="gb__error" role="alert">
                    {formError}
                  </p>
                )}

                <button type="submit" className="gb__submit">
                  <span>提交留言</span>
                  <span className="gb__submit-line" aria-hidden="true" />
                </button>
              </form>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
