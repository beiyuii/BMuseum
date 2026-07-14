#!/usr/bin/env node
/**
 * 项目数据定时同步脚本（确定性，无 AI）。
 * 读取 src/data/projects.json，对 source.type === "github" 的项目拉取
 * GitHub API 的版本 / 更新时间 / star 数，回写 auto 字段。
 * 仅在数据实际变化时写文件（避免产生空 commit）。
 * 由 .github/workflows/sync-projects.yml 每日定时调用，也可本地 `npm run sync`。
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const DATA_PATH = join(dirname(fileURLToPath(import.meta.url)), '../src/data/projects.json');

const headers = {
  Accept: 'application/vnd.github+json',
  'User-Agent': 'bmuseum-sync',
  ...(process.env.GITHUB_TOKEN ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` } : {}),
};

async function gh(path) {
  const res = await fetch(`https://api.github.com${path}`, { headers });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`GitHub API ${path} -> ${res.status}`);
  return res.json();
}

async function syncGithubProject(project) {
  const { repo } = project.source;
  const info = await gh(`/repos/${repo}`);
  if (!info) {
    console.warn(`[skip] ${project.slug}: 仓库 ${repo} 不存在或不可见`);
    return false;
  }

  const next = { ...project.auto };
  next.updated = (info.pushed_at ?? '').slice(0, 10) || next.updated;
  next.stars = info.stargazers_count ?? next.stars;

  const release = await gh(`/repos/${repo}/releases/latest`);
  if (release?.tag_name) {
    next.version = release.tag_name;
  } else {
    const tags = await gh(`/repos/${repo}/tags?per_page=1`);
    if (Array.isArray(tags) && tags[0]?.name) next.version = tags[0].name;
  }

  const changed = JSON.stringify(next) !== JSON.stringify(project.auto);
  if (changed) {
    console.log(`[update] ${project.slug}:`, JSON.stringify(next));
    project.auto = next;
  } else {
    console.log(`[fresh]  ${project.slug}: 无变化`);
  }
  return changed;
}

const data = JSON.parse(readFileSync(DATA_PATH, 'utf8'));
let dirty = false;

for (const project of data.projects) {
  if (project.source?.type !== 'github') {
    console.log(`[manual] ${project.slug}: 手动维护，跳过`);
    continue;
  }
  try {
    if (await syncGithubProject(project)) dirty = true;
  } catch (err) {
    // 单个项目失败不中断整体：保留旧数据，下次定时任务再试
    console.warn(`[error] ${project.slug}: ${err.message}（保留旧数据。本地直连 GitHub 失败时可用 NODE_USE_ENV_PROXY=1 走系统代理）`);
  }
}

if (dirty) {
  data.synced_at = new Date().toISOString().slice(0, 10);
  writeFileSync(DATA_PATH, `${JSON.stringify(data, null, 2)}\n`);
  console.log(`已写回 projects.json（synced_at = ${data.synced_at}）`);
} else {
  console.log('全部项目数据均为最新，未写文件。');
}
