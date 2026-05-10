import { useState, useEffect, useCallback, useRef } from "react";
import type { Visitor } from "../types";

const STORAGE_KEY = "bmuseum_visitor";

function generateId(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function createTicket(): Visitor {
  const ticketNo = Math.floor(Math.random() * 9000) + 1000;
  return {
    id: generateId(),
    ticket_no: ticketNo,
    issued_at: new Date().toISOString(),
    visited_rooms: ["/"],
    is_returning: false,
  };
}

export function useVisitorTicket() {
  const [visitor, setVisitor] = useState<Visitor | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [showTicket, setShowTicket] = useState(false);
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as Visitor;
        parsed.is_returning = true;
        setVisitor(parsed);
        setIsNew(false);
      } catch {
        const ticket = createTicket();
        localStorage.setItem(STORAGE_KEY, JSON.stringify(ticket));
        setVisitor(ticket);
        setIsNew(true);
        setTimeout(() => setShowTicket(true), 2500);
      }
    } else {
      const ticket = createTicket();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(ticket));
      setVisitor(ticket);
      setIsNew(true);
      setTimeout(() => setShowTicket(true), 2500);
    }
  }, []);

  const visitRoom = useCallback((route: string) => {
    setVisitor((prev) => {
      if (!prev) return prev;
      if (prev.visited_rooms.includes(route)) return prev;
      const updated = {
        ...prev,
        visited_rooms: [...prev.visited_rooms, route],
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  return { visitor, isNew, showTicket, setShowTicket, visitRoom };
}
