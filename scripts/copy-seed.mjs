#!/usr/bin/env node
/**
 * 构建前把 src/data 下的内容 JSON 复制为 public/seed/*.json。
 * EdgeOne Functions 在 KV 为空时，从同站静态资源 /seed/*.json 播种，
 * 使现有内容（18 篇文章 + 项目）首次访问即存在，之后以后台改动为准。
 */
import { copyFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const pairs = [
  ['src/data/articles.json', 'public/seed/articles.json'],
  ['src/data/projects.json', 'public/seed/projects.json'],
];

for (const [src, dest] of pairs) {
  const srcPath = join(root, src);
  const destPath = join(root, dest);
  if (!existsSync(srcPath)) {
    console.warn(`[seed:skip] 源不存在: ${src}`);
    continue;
  }
  mkdirSync(dirname(destPath), { recursive: true });
  copyFileSync(srcPath, destPath);
  console.log(`[seed] ${src} -> ${dest}`);
}
