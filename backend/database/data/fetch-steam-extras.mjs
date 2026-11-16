// One-off helper that adds product-page details to database/data/steam-extras.json:
// supported languages, the main trailer, per-OS system requirements and the "About this game"
// text (as plain headings and paragraphs). Usage: node database/data/fetch-steam-extras.mjs
// The JSON is committed, so seeding never depends on Steam being reachable.
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const games = JSON.parse(readFileSync(join(here, 'games.json'), 'utf8')).slice(0, Number(process.env.LIMIT) || undefined);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const decode = (s) =>
  s
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/&reg;/g, '®')
    .replace(/&trade;/g, '™');

const stripTags = (html) => decode(html.replace(/<[^>]+>/g, '')).replace(/[ \t]+/g, ' ').trim();

function languages(html) {
  if (!html) return { all: [], audio: [] };
  const list = html.split(/<br\s*\/?>/i)[0];
  const all = [];
  const audio = [];
  for (const raw of list.split(',')) {
    const full = raw.includes('*');
    const name = stripTags(raw).replace(/\*/g, '').trim();
    if (!name || name.startsWith('[b]')) continue;
    all.push(name);
    if (full) audio.push(name);
  }
  return { all: [...new Set(all)].sort((a, b) => a.localeCompare(b)), audio };
}

function requirementText(html) {
  if (!html || typeof html !== 'string') return null;
  const text = decode(
    html
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/li>/gi, '\n')
      .replace(/<[^>]+>/g, '')
      .replace(/[ \t]+/g, ' '),
  )
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .filter((l) => !/^(minimum|recommended):?$/i.test(l));
  return text.length ? text.join('\n') : null;
}

function requirements(d) {
  const out = {};
  for (const [os, key] of [['windows', 'pc_requirements'], ['mac', 'mac_requirements'], ['linux', 'linux_requirements']]) {
    const r = d[key];
    if (!r || Array.isArray(r)) continue;
    const minimum = requirementText(r.minimum);
    const recommended = requirementText(r.recommended);
    if (minimum || recommended) out[os] = { minimum, recommended };
  }
  return out;
}

/** "About this game" HTML → [{ type: 'heading' | 'paragraph', text }]; media and links are dropped. */
function about(html) {
  if (!html) return [];
  const marked = html
    .replace(/<video[\s\S]*?<\/video>/gi, '\n')
    .replace(/<img[^>]*>/gi, '\n')
    .replace(/<h\d[^>]*>([\s\S]*?)<\/h\d>/gi, (_, t) => `\n@@H@@${t}\n`)
    // A bold line on its own reads as a sub-heading.
    .replace(/(^|<br\s*\/?>|\n)\s*<(strong|b)>([^<]{3,90})<\/\2>\s*(?=<br|\n|$)/gi, (_, pre, _t, t) => `${pre}\n@@H@@${t}\n`)
    .replace(/<li[^>]*>/gi, '\n• ')
    .replace(/<br\s*\/?>|<\/p>|<\/ul>|<\/li>/gi, '\n');

  const blocks = [];
  for (const line of marked.split('\n')) {
    const heading = line.startsWith('@@H@@');
    const text = stripTags(heading ? line.slice(5) : line).replace(/^•\s*(?=\S)/, heading ? '' : '• ');
    if (!text || text === '•') continue;
    blocks.push({ type: heading ? 'heading' : 'paragraph', text });
  }
  return blocks.slice(0, 60);
}

function trailer(d) {
  const movies = d.movies ?? [];
  const movie = movies.find((m) => m.highlight) ?? movies[0];
  if (!movie) return null;
  return {
    name: movie.name,
    thumb: movie.thumbnail?.split('?')[0].replace('movie.293x165', 'movie_600x337') ?? null,
    hls: movie.hls_h264 ?? null,
  };
}

const out = {};
for (const [i, game] of games.entries()) {
  const id = game.steam_app_id;
  let data = null;
  for (let attempt = 0; attempt < 3 && !data; attempt++) {
    try {
      const res = await fetch(`https://store.steampowered.com/api/appdetails?appids=${id}&l=english&cc=de&filters=basic,movies`);
      if (res.status === 429) {
        await sleep(30000);
        continue;
      }
      data = (await res.json())?.[id]?.data ?? null;
      if (!data) break;
    } catch {
      await sleep(5000);
    }
  }
  if (!data) {
    console.log(`skip ${id} ${game.name}`);
    continue;
  }
  const langs = languages(data.supported_languages);
  out[id] = { languages: langs.all, full_audio: langs.audio, trailer: trailer(data), requirements: requirements(data), about: about(data.about_the_game) };
  console.log(`${i + 1}/${games.length} ok ${id} ${game.name}`);
  await sleep(1600);
}

const target = join(here, 'steam-extras.json');
writeFileSync(target, JSON.stringify(out, null, 1));
console.log(`wrote ${Object.keys(out).length} entries to ${target}`);
