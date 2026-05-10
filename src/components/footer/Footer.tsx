import { Link } from "react-router-dom";
import "./Footer.css";

interface FooterProps {
  /** 与 Grand Hall 深色展厅底衔接时使用，收紧上边距以免出现大块空带 */
  className?: string;
}

export default function Footer({ className = "" }: FooterProps) {
  return (
    <footer className={`footer ${className}`.trim()}>
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
          <div className="footer-label">联系</div>
          <a
            href="https://github.com/beiyuii"
            target="_blank"
            rel="noopener noreferrer"
          >
            GitHub · @beiyuii
          </a>
          <a href="mailto:huangziting495@gmail.com">huangziting495@gmail.com</a>
          <Link to="/guestbook">Guest Book</Link>
        </div>
      </div>
      <div className="footer-bottom container">
        <hr className="footer-hr" />
        <p>
          © 2026 B.Museum · Built solo ／ Vol. 01 · Est. 2026 · Walk through the
          mind.
        </p>
      </div>
    </footer>
  );
}
