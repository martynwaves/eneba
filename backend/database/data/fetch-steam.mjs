// One-off helper that builds database/data/games.json from Steam's public store API.
// Usage: node database/data/fetch-steam.mjs
// The resulting JSON is committed, so seeding never depends on Steam being reachable.
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const APP_IDS = [
  1245620, 1091500, 292030, 271590, 1174180, 1086940, 1593500, 2050650, 1817070, 1716740,
  990080, 2358720, 2399830, 413150, 105600, 367520, 1145360, 1145350, 892970, 252490,
  346110, 359550, 381210, 739630, 1966720, 553850, 2246340, 582010, 1446780, 814380,
  374320, 570940, 1888160, 2215430, 1151640, 2420110, 1659040, 1551360, 2440510, 976730,
  1293830, 1196590, 883710, 952060, 418370, 2195250, 2669320, 1238810, 1517290, 1237970,
  1328670, 1222680, 1846380, 1238840, 2322010, 1888930, 2531310, 1774580, 1172380, 489830,
  377160, 22380, 289070, 1295660, 281990, 394360, 1158310, 255710, 949230, 294100,
  427520, 526870, 1426210, 2001120, 1361210, 2183900, 1142710, 779340, 1364780, 1778820,
  1971870, 2124490, 2208920, 812140, 582160, 2369390, 552520, 3159330, 1272080, 218620,
  1687950, 2161700, 1113560, 524220, 1462040, 2909400, 2515020, 1326470, 242760, 1623730,
  1203620, 2344520, 2694490, 1144200, 1029690, 1817190, 2651280, 1850570, 1627720, 284160,
  244210, 805550, 268910, 504230, 391540, 646570, 2379780, 1794680, 588650, 1092790,
  753640, 1150690, 620, 400, 220, 546560, 550, 4000, 108600, 251570,
  648800, 264710, 848450, 2252570, 2488620, 1677280, 813780, 1466860, 933110, 1244460,
  703080, 493340, 1366540, 1062090, 1222140, 1259420, 2054970, 1903340, 1771300, 379430,
  1874880, 107410, 1222730, 2138330, 2778580,
  // Navigation / hero promos and upcoming releases
  4348910, 4530370, 4115450, 3764200, 1962700, 2868840, 1030300, 3751260, 2638890, 3768760, 2769570, 3230960, 3321460,
  // Genre coverage: point & click, music, educational
  632470, 569860, 1817230, 620980, 220200,
  // Recent hits and unreleased games
  388860, 2439280, 1846700, 3216600, 4767480, 3788800, 2109770, 1340720, 2719590, 1285190, 2807960, 2947440, 3008130, 2627260, 3357650, 2075800, 3787240, 3010850, 3079210, 1875580,
];

// `node fetch-steam.mjs --add 123,456` fetches only those ids and merges them into games.json.
const addIndex = process.argv.indexOf('--add');
const onlyIds = addIndex > -1 ? process.argv[addIndex + 1].split(',').map(Number) : null;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const decode = (s) =>
  s
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ');

const htmlToText = (html) =>
  decode(
    (html || '')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/(li|p|ul|h\d)>/gi, '\n')
      .replace(/<[^>]+>/g, '')
      .replace(/\n{2,}/g, '\n')
      .replace(/[ \t]+/g, ' ')
      .trim(),
  );

async function headOk(url) {
  try {
    const res = await fetch(url, { method: 'HEAD' });
    return res.ok;
  } catch {
    return false;
  }
}

async function fetchApp(id) {
  const url = `https://store.steampowered.com/api/appdetails?appids=${id}&cc=de&l=english`;
  for (let attempt = 0; attempt < 4; attempt++) {
    const res = await fetch(url);
    if (res.status === 429) {
      console.warn(`429 for ${id}, backing off`);
      await sleep(30000);
      continue;
    }
    if (!res.ok) return null;
    const json = await res.json();
    return json?.[id]?.success ? json[id].data : null;
  }
  return null;
}

const out = [];
for (const id of onlyIds ?? APP_IDS) {
  const d = await fetchApp(id);
  await sleep(1300);
  if (!d) {
    console.warn(`skip ${id}: no data`);
    continue;
  }
  if (d.is_free) {
    console.warn(`skip ${id} (${d.name}): free to play`);
    continue;
  }
  const portrait = `https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/${id}/library_600x900.jpg`;
  const hasPortrait = await headOk(portrait);
  out.push({
    steam_app_id: id,
    name: decode(d.name),
    type: d.type === 'dlc' ? 'dlc' : 'game',
    short_description: htmlToText(d.short_description),
    developers: d.developers ?? [],
    publishers: d.publishers ?? [],
    release_date: d.release_date?.date ?? null,
    coming_soon: Boolean(d.release_date?.coming_soon),
    genres: (d.genres ?? []).map((g) => g.description),
    platforms: d.platforms ?? {},
    metacritic: d.metacritic?.score ?? null,
    price_cents: d.price_overview?.initial ?? null,
    header_image: d.header_image?.split('?')[0] ?? null,
    cover_image: hasPortrait ? portrait : null,
    screenshots: (d.screenshots ?? []).slice(0, 8).map((s) => ({
      thumb: s.path_thumbnail?.split('?')[0],
      full: s.path_full?.split('?')[0],
    })),
  });
  console.log(`ok ${id} ${d.name}${hasPortrait ? '' : ' (no portrait)'}`);
}

const target = join(dirname(fileURLToPath(import.meta.url)), 'games.json');
let games = out;
if (onlyIds) {
  const existing = JSON.parse(readFileSync(target, 'utf8')).filter((g) => !onlyIds.includes(g.steam_app_id));
  games = [...existing, ...out];
}

// Newer games keep their portrait capsule under a hashed path; the store-browse API knows it.
const missing = games.filter((g) => !g.cover_image);
for (let i = 0; i < missing.length; i += 40) {
  const batch = missing.slice(i, i + 40);
  const input = { ids: batch.map((g) => ({ appid: g.steam_app_id })), context: { language: 'english', country_code: 'DE' }, data_request: { include_assets: true } };
  const res = await fetch(`https://api.steampowered.com/IStoreBrowseService/GetItems/v1/?input_json=${encodeURIComponent(JSON.stringify(input))}`);
  const items = (await res.json())?.response?.store_items ?? [];
  for (const item of items) {
    const file = item.assets?.library_capsule_2x ?? item.assets?.library_capsule;
    const game = batch.find((g) => g.steam_app_id === item.appid);
    if (file && game) {
      game.cover_image = `https://shared.akamai.steamstatic.com/store_item_assets/${item.assets.asset_url_format.replace('${FILENAME}', file).split('?')[0]}`;
    }
  }
}
console.log(`filled ${missing.filter((g) => g.cover_image).length}/${missing.length} missing covers`);

writeFileSync(target, JSON.stringify(games, null, 2));
console.log(`wrote ${games.length} games to ${target}`);
