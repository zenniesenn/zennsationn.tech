// Haalt One Piece-, One Piece TCG- en Roblox-nieuws op en schrijft news.json.
// Draai met:  node scripts/fetch-news.mjs   (Node 18+, geen extra pakketten nodig)
//
// Kindvriendelijk: berichten met ongeschikte woorden worden weggefilterd,
// en berichten die over spoilers/leaks gaan krijgen een "spoiler"-vlag.

import { writeFile } from "node:fs/promises";

const gnews = (q, lang) =>
  lang === "nl"
    ? `https://news.google.com/rss/search?q=${encodeURIComponent(q)}+when:30d&hl=nl&gl=NL&ceid=NL:nl`
    : `https://news.google.com/rss/search?q=${encodeURIComponent(q)}+when:30d&hl=en-US&gl=US&ceid=US:en`;

const FEEDS = [
  { cat: "onepiece", lang: "nl", url: gnews('"One Piece"', "nl") },
  { cat: "onepiece", lang: "en", url: gnews('"One Piece" anime OR manga OR Luffy', "en") },
  { cat: "tcg", lang: "en", url: gnews('"One Piece Card Game" OR "One Piece TCG"', "en") },
  { cat: "tcg", lang: "en", url: gnews('"One Piece" booster OR "leader card" OR "starter deck" OR "card game"', "en") },
  { cat: "tcg", lang: "nl", url: gnews('"One Piece" kaarten OR kaartspel OR TCG', "nl") },
  { cat: "roblox", lang: "nl", url: gnews("Roblox", "nl") },
  { cat: "roblox", lang: "en", url: gnews("Roblox game OR update OR event", "en") },
];

// Woorden die een bericht ongeschikt maken voor een kind van ~10 jaar.
// (Bijvoorbeeld rechtszaken, misbruik, geweld, gokken, 18+.)
const BLOCK = [
  "lawsuit", "sued", "suing", "court", "rechtszaak", "rechter", "aanklacht", "verbod", "ban ",
  "predator", "groom", "abuse", "misbruik", "exploit", "sex", "seks", "porn", "nsfw", "nude", "naakt",
  "r18", "18+", "hentai", "erotic", "kill", "murder", "moord", "dood", "death", "dies", "died", "suicide",
  "zelfmoord", "shooting", "schiet", "gun", "wapen", "terror", "drugs", "alcohol", "casino", "gambling",
  "gokken", "scam", "oplichting", "hack", "arrest", "arrested", "politie", "police", "lawsuits",
  "investigation", "onderzoek naar", "kinderveiligheid", "child safety", "lawsuit", "blood", "bloed",
  "to love-ru", "ecchi", "fanservice", "fan service", "bikini", "swimsuit", "badpak", "horror", "scary", "gta", "%", "onveilig", "unsafe", "veiligheid", "safety", "call of duty", "mortal kombat", "eng ", "griezel", "stocks", "aandeel", "aandelen", "earnings", "kwartaalcijfers", "shares", "investor",
];
const SPOILER = ["spoiler", "leak", "chapter", "hoofdstuk", "raw scans"];
const MUST = { onepiece: ["one piece", "luffy"], tcg: ["one piece"], roblox: ["roblox"] };
const TCG_HINT = ["card game", "tcg", "kaart", "booster", "op-1", "op1", "starter deck", "trading card"];

const decode = (s) =>
  s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(+n))
    .trim();
const tag = (xml, name) => {
  const m = xml.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`));
  return m ? decode(m[1]) : "";
};

async function readFeed({ cat, lang, url }) {
  const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0 (news-reader)" } });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  const xml = await res.text();
  return xml.split("<item>").slice(1).map((chunk) => {
    const source = tag(chunk, "source");
    let title = tag(chunk, "title");
    if (source && title.endsWith(` - ${source}`)) title = title.slice(0, -(source.length + 3));
    return { cat, lang, title, link: tag(chunk, "link"), source, date: new Date(tag(chunk, "pubDate")).toISOString() };
  });
}

const all = [];
for (const feed of FEEDS) {
  try {
    const items = await readFeed(feed);
    console.log(`${feed.cat}/${feed.lang}: ${items.length}`);
    all.push(...items);
  } catch (e) {
    console.warn("Feed mislukt:", e.message);
  }
}

const seen = new Set();
const out = [];
for (const it of all.sort((a, b) => (b.date > a.date ? 1 : -1))) {
  const low = ` ${it.title.toLowerCase()} `;
  if (!it.title || !it.link) continue;
  if (BLOCK.some((w) => low.includes(w))) continue;
  // TCG-berichten die in de gewone One Piece-feed zitten, verhuizen naar TCG.
  if (it.cat === "onepiece" && TCG_HINT.some((w) => low.includes(w))) it.cat = "tcg";
  if (!MUST[it.cat].some((w) => low.includes(w))) continue;
  const key = low.replace(/\b(for|the|de|het|een|a|in|voor)\b/g, "").replace(/[^a-z0-9]/g, "").slice(0, 50);
  if (seen.has(key)) continue;
  seen.add(key);
  it.spoiler = SPOILER.some((w) => low.includes(w));
  out.push(it);
}

const perCat = { onepiece: 0, tcg: 0, roblox: 0 };
const final = out.filter((it) => ++perCat[it.cat] <= 40);

await writeFile(
  new URL("../news.json", import.meta.url),
  JSON.stringify({ updated: new Date().toISOString(), items: final }, null, 1)
);
console.log("Klaar:", Object.entries(perCat).map(([k, v]) => `${k}=${Math.min(v, 40)}`).join(" "));
