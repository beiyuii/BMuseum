import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { useEffect, useState, useCallback } from "react";
import Nav from "./components/nav/Nav";
import Footer from "./components/footer/Footer";
import VisitorTicket from "./components/visitor-ticket/VisitorTicket";
import { useVisitorTicket } from "./hooks/useVisitorTicket";

import GrandHall from "./pages/GrandHall";
import About from "./pages/About";
import Wing from "./pages/Wing";
import ArticleDetail from "./pages/ArticleDetail";
import Index from "./pages/Index";
import Projects from "./pages/Projects";
import Guestbook from "./pages/Guestbook";
import Admin from "./pages/Admin";
import { MuseumDataProvider } from "./data/MuseumDataContext";

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function AppContent() {
  const location = useLocation();
  const { visitor, showTicket, visitRoom } = useVisitorTicket();
  const isGrandHall = location.pathname === "/";
  const [navDark, setNavDark] = useState(false);

  // When not on Grand Hall, nav should not be dark
  const effectiveNavDark = isGrandHall ? navDark : false;

  useEffect(() => {
    visitRoom(location.pathname);
  }, [location.pathname, visitRoom]);

  const handleNavDarkChange = useCallback((dark: boolean) => {
    setNavDark(dark);
  }, []);

  return (
    <>
      <ScrollToTop />
      <Nav onDark={effectiveNavDark} />
      <Routes>
        <Route
          path="/"
          element={<GrandHall onNavDarkChange={handleNavDarkChange} />}
        />
        <Route path="/about" element={<About />} />
        <Route path="/wing/:slug" element={<Wing />} />
        <Route path="/article/:slug" element={<ArticleDetail />} />
        <Route path="/index" element={<Index />} />
        <Route path="/projects" element={<Projects />} />
        <Route path="/guestbook" element={<Guestbook />} />
        <Route path="/admin" element={<Admin />} />
      </Routes>
      <Footer className={isGrandHall ? "footer--grand-hall" : undefined} />
      {visitor && (
        <VisitorTicket
          visitor={visitor}
          show={showTicket}
          isGrandHall={isGrandHall}
        />
      )}
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <MuseumDataProvider>
        <AppContent />
      </MuseumDataProvider>
    </BrowserRouter>
  );
}
