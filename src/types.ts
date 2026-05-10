export type WingSlug = 'tech' | 'think' | 'create';

export interface Article {
  slug: string;
  wing: WingSlug;
  no: number;
  title: string;
  subtitle?: string;
  summary: string;
  body: string;
  created: string;
  updated: string;
  version: string;
  featured: boolean;
  tags: string[];
  cover?: string;
  reading_time_min: number;
}

export interface Wing {
  slug: WingSlug;
  name: string;
  subtitle: string;
  curator_note: string;
  accent: string;
  featured_slug: string;
}

export interface GuestEntry {
  id: string;
  name: string;
  message: string;
  created: string;
  status: 'pending' | 'published' | 'blocked';
  ip_hash: string;
}

export interface Visitor {
  id: string;
  ticket_no: number;
  issued_at: string;
  visited_rooms: string[];
  is_returning: boolean;
}
