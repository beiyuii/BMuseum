import { useState } from "react";
import { Link } from "react-router-dom";
import { socials } from "../../data/content";
import type { SocialAccount } from "../../types";
import "./Footer.css";

interface FooterProps {
  /** 与 Grand Hall 深色展厅底衔接时使用，收紧上边距以免出现大块空带 */
  className?: string;
}

/** 二维码卡：图片缺失时降级为文字卡，不出现裂图 */
function QrCard({ account }: { account: SocialAccount }) {
  const [failed, setFailed] = useState(false);
  const showImage = !!account.qr && !failed;

  return (
    <div className="footer-qr-card">
      {showImage ? (
        <img
          src={account.qr}
          alt={`${account.label}二维码：${account.name}`}
          loading="lazy"
          onError={() => setFailed(true)}
        />
      ) : (
        <div className="footer-qr-fallback">
          <span className="footer-qr-fallback-label">{account.label}</span>
          <span className="footer-qr-fallback-id">{account.id ?? account.name}</span>
        </div>
      )}
      <div className="footer-qr-caption">
        {account.label} · {account.name}
      </div>
      {account.id && (
        <div className="footer-qr-id">
          {account.id_label} {account.id}
        </div>
      )}
    </div>
  );
}

export default function Footer({ className = "" }: FooterProps) {
  const qrAccounts = socials.filter((s) => s.qr);
  // 有直链的都进链接列（B站既有二维码也有直链，两处都出现）
  const linkAccounts = socials.filter((s) => s.url);

  return (
    <footer className={`footer ${className}`.trim()}>
      {/* ── Find the curator · 馆长在别处 ── */}
      <div id="find-curator" className="footer-find container">
        <div className="footer-label">● Find the curator · 馆长在别处</div>
        <div className="footer-find-grid">
          <div className="footer-qr-row">
            {qrAccounts.map((s) => (
              <QrCard key={s.key} account={s} />
            ))}
          </div>
          <div className="footer-find-links">
            {linkAccounts.map((s) => (
              <a
                key={s.key}
                href={s.url}
                target={s.url!.startsWith("mailto:") ? undefined : "_blank"}
                rel="noopener noreferrer"
              >
                <span className="footer-find-platform">{s.label}</span>
                <span className="footer-find-name">
                  {s.name}
                  {s.id ? ` · ${s.id_label} ${s.id}` : ""} ↗
                </span>
              </a>
            ))}
          </div>
        </div>
        <hr className="footer-hr footer-find-hr" />
      </div>

      <div className="footer-inner container">
        <div className="footer-col">
          <div className="footer-brand">B.Museum</div>
          <div className="footer-tagline">Walk through the mind.</div>
        </div>
        <div className="footer-col">
          <div className="footer-label">展厅导览</div>
          <Link to="/wing/tech">Tech 翼</Link>
          <Link to="/wing/think">Think 翼</Link>
          <Link to="/wing/create">Create 翼</Link>
          <Link to="/about">About</Link>
        </div>
        <div className="footer-col">
          <div className="footer-label">馆内设施</div>
          <Link to="/projects">Projects · 项目档案</Link>
          <Link to="/index">Index · 馆藏目录</Link>
          <Link to="/guestbook">Guest Book · 留言簿</Link>
        </div>
      </div>
      <div className="footer-bottom container">
        <hr className="footer-hr" />
        <p>
          © 2026 B.Museum · Curated by BEIYUII ／ Vol. 01 · Est. 2026 · Walk
          through the mind.
        </p>
      </div>
    </footer>
  );
}
