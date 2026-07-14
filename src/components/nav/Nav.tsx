import { Link, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import './Nav.css';

interface NavProps {
  onDark?: boolean;
}

export default function Nav({ onDark = false }: NavProps) {
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 0);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={`nav ${onDark ? 'on-dark' : ''} ${scrolled ? 'scrolled' : ''}`}>
      <div className="nav-inner container">
        <Link to="/" className="nav-brand">B.Museum</Link>
        <div className="nav-links">
          <Link to="/projects" className={location.pathname === '/projects' ? 'active' : ''}>Projects</Link>
          <Link to="/index" className={location.pathname === '/index' ? 'active' : ''}>Index</Link>
          <Link to="/about" className={location.pathname === '/about' ? 'active' : ''}>About</Link>
          <Link to="/guestbook" className={location.pathname === '/guestbook' ? 'active' : ''}>Guest Book</Link>
        </div>
      </div>
    </nav>
  );
}
