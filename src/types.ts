export type WingSlug = 'tech' | 'think' | 'create';

/** on_display = 正常展出；storage = 撤展入库房（列表不可见，直链提示）；draft = 未上架 */
export type ArticleStatus = 'on_display' | 'storage' | 'draft';

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
  status?: ArticleStatus;
}

export type ProjectStatus = 'running' | 'beta' | 'paused' | 'archived';

export interface ProjectLink {
  label: string;
  url: string;
}

/** auto 字段由 scripts/sync-projects.mjs 定时回写，手动字段人工维护 */
export interface Project {
  slug: string;
  name: string;
  name_en?: string;
  tagline: string;
  status: ProjectStatus;
  status_label: string;
  platform: string;
  tech: string[];
  accent: string;
  links: ProjectLink[];
  article_slug?: string;
  source: { type: 'github'; repo: string } | { type: 'manual' };
  auto: { version?: string; updated?: string; stars?: number };
}

export interface ProjectsData {
  synced_at: string;
  projects: Project[];
}

export interface SocialAccount {
  key: string;
  label: string;
  name: string;
  id_label?: string;
  id?: string;
  url?: string;
  qr?: string;
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
