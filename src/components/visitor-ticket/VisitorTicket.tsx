import { useState } from "react";
import type { Visitor } from "../../types";
import "./VisitorTicket.css";

interface Props {
  visitor: Visitor;
  show: boolean;
  isGrandHall?: boolean;
}

export default function VisitorTicket({
  visitor,
  show,
  isGrandHall = false,
}: Props) {
  const [expanded, setExpanded] = useState(false);

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    const hours = String(d.getHours()).padStart(2, "0");
    const minutes = String(d.getMinutes()).padStart(2, "0");
    const month = d.toLocaleString("en-US", { month: "short" });
    const day = d.getDate();
    const year = d.getFullYear();
    return `${hours}:${minutes}, ${month} ${day}, ${year}`;
  };

  const shortId = visitor.id.slice(0, 8).toUpperCase();

  return (
    <div
      className={`visitor-ticket ${show ? "visible" : ""} ${isGrandHall ? "grand-hall" : ""} ${expanded ? "expanded" : ""}`}
      onClick={() => setExpanded(!expanded)}
    >
      <div className="ticket-front">
        <div className="ticket-header">
          <span className="ticket-brand">B.MUSEUM</span>
          <span className="ticket-number">
            #{String(visitor.ticket_no).padStart(4, "0")}
          </span>
        </div>
        <div className="ticket-divider"></div>
        <div className="ticket-valid">Valid for tonight</div>
        <div className="ticket-issued">
          Issued {formatTime(visitor.issued_at)}
        </div>
        <div className="ticket-perforation"></div>
        <div className="ticket-seat">SEAT NO. A-{shortId}</div>
      </div>
      {expanded && (
        <div className="ticket-back">
          <div className="ticket-history-label">Visit History</div>
          <ul className="ticket-rooms">
            {visitor.visited_rooms.map((room, i) => (
              <li key={i}>{room}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
