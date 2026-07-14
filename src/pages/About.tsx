import "./About.css";
import { useReveal } from "../hooks/useReveal";
import { projects, socials } from "../data/content";

/* ------------------------------------------------------------------ */
/*  Reveal wrapper – one per section                                   */
/* ------------------------------------------------------------------ */
function R({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useReveal();
  return (
    <div ref={ref} className={`reveal ${className}`}>
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Data                                                               */
/* ------------------------------------------------------------------ */
const principles = [
  {
    num: "01",
    title: "务实至上",
    desc: "所有方案的第一个问题永远是：能不能真正落地？够用胜过最强，实用胜过时髦。",
  },
  {
    num: "02",
    title: "数据驱动",
    desc: "感觉告诉你方向，数据告诉你对不对。做判断要有指标，定目标要能量化。",
  },
  {
    num: "03",
    title: "隐私优先",
    desc: "产品设计里隐私保护是不可谈判的底线。不为功能方便牺牲用户数据。",
  },
  {
    num: "04",
    title: "系统化洞察",
    desc: "好的认知应该被提炼出来，反复使用，而不是想一次扔一次。让洞察可复用。",
  },
  {
    num: "05",
    title: "信任但验证",
    desc: "不盲信任何单一来源，包括 AI。多角度交叉验证建立信心，人类最终审查。",
  },
  {
    num: "06",
    title: "版本控制思维",
    desc: "无论代码还是想法，都该有版本，可以回滚，可以追溯。这个博物馆就是实践。",
  },
];

const loopNodes = [
  { key: "plan", en: "Plan", cn: "规划", note: "分层，拆解，定边界" },
  { key: "review", en: "Review", cn: "审查", note: "验证假设，找盲区" },
  { key: "execute", en: "Execute", cn: "执行", note: "专注，不在途中改" },
  { key: "test", en: "Test", cn: "验证", note: "跑数据，不靠感觉" },
  { key: "iterate", en: "Iterate", cn: "迭代", note: "带数据进下一轮" },
];

/* 项目卡数据统一来自 src/data/projects.json（与 /projects 页同源，同步脚本自动更新） */
const ACCENT_CLASSES: Record<string, string> = {
  "#C15F3C": "red-earth",
  "#5B7A9A": "steel-blue",
  "#7A8C5F": "moss-green",
};

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */
export default function About() {
  return (
    <main className="about">
      {/* ============================================================
          §01 Hero Placard — full-screen
          ============================================================ */}
      <div className="about-hero-section">
        <div className="about-hero">
          <p className="eyebrow">
            <span className="dot" /> Plate · Curator's File
          </p>
          <h1>关于馆长</h1>
          <p className="hero-hello">Hello.</p>
          <p className="plate-rule">
            B.Museum · Vol. 01 · One-author archive ／ est. 2026
          </p>
        </div>
      </div>

      {/* ============================================================
          §02 Identity Card
          ============================================================ */}
      <R className="section about-identity">
        {/* Left: archive card */}
        <div className="about-card">
          <span className="about-card-badge">CURATOR · FILE NO.01</span>
          <table className="about-card-table">
            <tbody>
              <tr>
                <td>名号</td>
                <td>BEIYUII</td>
              </tr>
              <tr>
                <td>世代</td>
                <td>00 后</td>
              </tr>
              <tr>
                <td>身份</td>
                <td>
                  全栈工程师 → <span className="highlight">AI 应用开发者</span>
                </td>
              </tr>
              <tr>
                <td>设备</td>
                <td>MacBook Air M4</td>
              </tr>
              <tr>
                <td>状态</td>
                <td>
                  <span className="highlight">转型期 · 正在构建中</span>
                </td>
              </tr>
              <tr>
                <td>馆龄</td>
                <td>Vol. 01 · 2026</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Right: paragraphs */}
        <div className="about-identity-text">
          <blockquote>
            白天在写代码，夜里在想这些代码到底有没有意义。这个博物馆是那些
            <span className="kaiti">想清楚了的事</span>
            的陈列室——技术、思考、正在做的项目， 按翼分类，不按时间线堆叠。
          </blockquote>
          <blockquote>
            我不相信单一来源，不相信感觉，也不相信"差不多就行"。每一件展品背后都有版本号，因为
            <span className="kaiti">认知本来就是迭代的</span>。
          </blockquote>
          <blockquote>
            — 本馆由馆长独立策展，不对外合作，不接受投稿。
            <cite>—— 馆长</cite>
          </blockquote>
        </div>
      </R>

      {/* ============================================================
          §03 Six Core Principles
          ============================================================ */}
      <R className="section about-principles">
        <p className="eyebrow">
          <span className="dot" /> Core Principles · 策展原则
        </p>
        <div className="about-principles-grid">
          {principles.map((p) => (
            <div className="about-principle" key={p.num}>
              <span className="about-principle-num">{p.num}</span>
              <div className="about-principle-body">
                <h4>{p.title}</h4>
                <p>{p.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </R>

      {/* ============================================================
          §04 Thinking Loop
          ============================================================ */}
      <R className="section about-loop">
        <div className="about-loop-nodes">
          {loopNodes.map((node, i) => (
            <div
              key={node.key}
              style={{ display: "flex", alignItems: "flex-start" }}
            >
              <div className="about-loop-node">
                <div className="about-loop-circle">{node.en}</div>
                <div className="about-loop-label">{node.cn}</div>
                <div className="about-loop-note">{node.note}</div>
              </div>
              {i < loopNodes.length - 1 && (
                <div className="about-loop-connector">
                  <div className="about-loop-connector-line" />
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="about-loop-back">
          <span className="about-loop-back-line" />
          <span className="about-loop-back-text">← 带数据回到 Plan</span>
          <span className="about-loop-back-line" />
        </div>

        <p className="about-loop-footer">
          这个闭环不只用于写代码——用于做任何值得认真对待的事。
        </p>
      </R>

      {/* ============================================================
          §05 Currently Shipping
          ============================================================ */}
      <R className="section about-shipping">
        <p className="eyebrow">
          <span className="dot" /> Currently Shipping · 正在运行
        </p>
        <div className="about-shipping-grid">
          {projects.map((p, i) => (
            <div className="about-ship-card" key={p.slug}>
              <div
                className={`about-ship-card-accent ${ACCENT_CLASSES[p.accent] ?? "red-earth"}`}
              />
              <div className="about-ship-card-inner">
                <div className="about-ship-card-no">
                  SHIP-{String(i + 1).padStart(2, "0")} · {p.platform}
                </div>
                <div className="about-ship-card-name">{p.name}</div>
                <div className="about-ship-card-subtitle">
                  {p.name_en ?? p.platform}
                </div>
                <div className="about-ship-card-status">
                  <span className="status-dot" />
                  {p.auto.version ? `${p.auto.version} · ` : ""}
                  {p.status_label}
                </div>
                <div className="about-ship-card-tags">
                  {p.tech.map((t) => (
                    <span className="about-ship-card-tag" key={t}>
                      {t}
                    </span>
                  ))}
                </div>
                <div className="about-ship-card-desc">{p.tagline}</div>
                <div className="about-ship-card-footer">
                  <a
                    href={p.links[0]?.url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    查看项目 →
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </R>

      {/* ============================================================
          §06 Vision
          ============================================================ */}
      <R className="section section-narrow about-vision">
        <p className="eyebrow">
          <span className="dot" /> Curator's Note · 馆长自述
        </p>
        <h3>为什么有这个博物馆</h3>
        <p>
          我想把<span className="kaiti">技术 + 产品 + 运营</span>
          三条线真正打通。
          市面上的内容要么太技术、要么太商业、要么太鸡汤，很少有人把这三者放在一起认真讨论。
          这个博物馆就是我的尝试——用一个统一的框架，把所有值得记录的
          <span className="kaiti">想法</span>组织起来。
        </p>
        <p>
          我相信好的工具应该<span className="kaiti">懂你</span>
          ，而不是让你去懂它。
          所以这里的每一件展品都带着上下文、带着版本号、带着我当时的判断和后来的修正。
          不是教程，不是指南，而是一个正在生长的知识体。
        </p>
        <p>
          这个博物馆是<span className="kaiti">真实</span>
          的——不是为了展示而展示，
          而是我实际在做的事情的映射。每一个项目、每一条思考，都经得起追问。
        </p>
      </R>

      {/* ============================================================
          §07 Contact
          ============================================================ */}
      <R className="section about-contact">
        <div className="about-contact-top">
          <div className="about-contact-left">
            <h3>联系馆长 · Find the Curator</h3>
            <p>有想法、有问题、或者只是想聊聊，都可以找到我。</p>
          </div>
          <div className="about-contact-links">
            {socials.map((s) => (
              <a
                key={s.key}
                href={s.url ?? "#find-curator"}
                target={s.url && !s.url.startsWith("mailto:") ? "_blank" : undefined}
                rel="noopener noreferrer"
              >
                <span className="contact-link-label">{s.label}</span>
                <span className="contact-link-handle">{s.name}</span>
                <span className="contact-link-arrow">{s.url ? "↗" : "↓"}</span>
              </a>
            ))}
          </div>
        </div>
        <p className="about-contact-footer">
          B.Museum · Vol. 01 · Opened 2026 · Built solo, after the workday.
        </p>
      </R>
    </main>
  );
}
