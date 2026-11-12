// Zenn's Nieuwshaven — leest news.json en toont kindvriendelijke nieuwskaarten.

const KID_NAME = "Zenn";
const PAGE_SIZE = 12;

const CAT_LABEL = { onepiece: "One Piece", tcg: "Kaarten", roblox: "Roblox" };

// Weetjes en veilig-gamen-tips (wisselen elke keer dat je op 🔄 drukt).
const TIPS = [
  ["🏴‍☠️", "Weetje", "Luffy wil de Koning der Piraten worden. Daarvoor moet hij de schat 'One Piece' vinden!"],
  ["✏️", "Weetje", "One Piece is bedacht en getekend door Eiichiro Oda. De manga begon in 1997 in Japan."],
  ["⚔️", "Weetje", "Zoro vecht met drie zwaarden tegelijk. Eén ervan houdt hij in zijn mond!"],
  ["🦌", "Weetje", "Chopper is een rendier dat van de Mens-Mens Vrucht heeft gegeten. Daardoor kan hij praten."],
  ["🍖", "Weetje", "Sanji is de kok van de Strohoedbende. Hij vecht alleen met zijn benen, om zijn handen te sparen voor het koken."],
  ["⛵", "Weetje", "Het eerste schip van de Strohoedbende heette de Going Merry. Later kregen ze de Thousand Sunny."],
  ["🃏", "Kaarten-tip", "Bij de One Piece Card Game kies je één Leader-kaart. Je stapel (deck) heeft 50 kaarten in de kleur van je Leader."],
  ["🧱", "Weetje", "Roblox bestaat al sinds 2006. Alle spellen op Roblox zijn gemaakt door spelers zelf!"],
  ["🛠️", "Weetje", "Met Roblox Studio kun je zelf een spel bouwen. De programmeertaal heet Luau."],
  ["🛡️", "Veilig gamen", "Geef nooit je wachtwoord aan iemand anders, ook niet aan een 'vriend' in een spel."],
  ["🚫", "Veilig gamen", "'Gratis Robux' bestaat niet! Websites of spelers die dat beloven, willen je account stelen."],
  ["🗣️", "Veilig gamen", "Vraagt iemand online waar je woont of op welke school je zit? Zeg niks en vertel het papa of mama."],
  ["⏰", "Veilig gamen", "Even pauze is ook goed: na een uurtje gamen even naar buiten of iets drinken!"],
];

const $ = (id) => document.getElementById(id);
const state = { cat: "all", onlyNl: false, spoilers: false, shown: PAGE_SIZE, items: [] };

// Instellingen onthouden (veilig: werkt ook als opslaan niet mag).
const store = {
  get(k, d) { try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
};

function timeAgo(iso) {
  const mins = Math.round((Date.now() - new Date(iso)) / 60000);
  if (mins < 60) return "net nieuw";
  const h = Math.round(mins / 60);
  if (h < 24) return `${h} uur geleden`;
  const d = Math.round(h / 24);
  if (d === 1) return "gisteren";
  if (d < 7) return `${d} dagen geleden`;
  const w = Math.round(d / 7);
  return w === 1 ? "1 week geleden" : `${w} weken geleden`;
}

function el(tag, cls, text) {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text != null) n.textContent = text;
  return n;
}

function card(it) {
  const c = el("button", `card ${it.cat}`);
  c.type = "button";
  const top = el("div", "card-top");
  top.append(el("span", `pill ${it.cat}`, CAT_LABEL[it.cat]));
  if (Date.now() - new Date(it.date) < 2 * 864e5) top.append(el("span", "pill new", "Nieuw!"));
  if (it.spoiler) top.append(el("span", "pill spoiler", "Spoiler"));
  const flag = el("span", `flag ${it.lang}`, it.lang === "nl" ? "NL" : "EN");
  flag.title = it.lang === "nl" ? "Nederlands" : "Engels";
  top.append(flag);
  const meta = el("div", "meta");
  meta.append(el("span", "", `${it.source || "Nieuws"} · ${timeAgo(it.date)}`), el("span", "go", "Lees ➡️"));
  c.append(top, el("h3", "", it.title), meta);
  c.addEventListener("click", () => openModal(it));
  return c;
}

function render() {
  const list = state.items.filter(
    (it) =>
      (state.cat === "all" || it.cat === state.cat) &&
      (!state.onlyNl || it.lang === "nl") &&
      (state.spoilers || !it.spoiler)
  );
  const grid = $("grid");
  grid.replaceChildren();
  if (!list.length) {
    const e = el("div", "empty");
    e.append(el("span", "big", "🏝️"), el("p", "", state.onlyNl
      ? "Geen Nederlands nieuws hier. Zet 'Alleen Nederlands' uit voor meer!"
      : "Nog geen nieuws hier. Kom later terug!"));
    grid.append(e);
  }
  list.slice(0, state.shown).forEach((it) => grid.append(card(it)));
  $("more").hidden = list.length <= state.shown;
  const hidden = state.items.filter((it) => it.spoiler && (state.cat === "all" || it.cat === state.cat)).length;
  $("status").textContent = !state.spoilers && hidden
    ? `${list.length} berichten · ${hidden} spoiler${hidden > 1 ? "s" : ""} verstopt 🙈`
    : `${list.length} berichten`;
}

// ---------- "Je gaat naar een andere website" ----------
let lastFocus = null;
function openModal(it) {
  lastFocus = document.activeElement;
  $("modal-source").textContent = it.source || "een andere website";
  $("modal-yes").href = it.link;
  $("modal").hidden = false;
  $("modal-no").focus();
}
function closeModal() {
  $("modal").hidden = true;
  lastFocus && lastFocus.focus();
}
$("modal-no").addEventListener("click", closeModal);
$("modal-yes").addEventListener("click", () => setTimeout(closeModal, 100));
$("modal").addEventListener("click", (e) => { if (e.target.id === "modal") closeModal(); });
document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !$("modal").hidden) closeModal(); });

// ---------- Tabs & schakelaars ----------
document.querySelectorAll(".tab").forEach((t) =>
  t.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach((x) => x.classList.toggle("active", x === t));
    state.cat = t.dataset.cat;
    state.shown = PAGE_SIZE;
    store.set("cat", state.cat);
    render();
  })
);
$("only-nl").addEventListener("change", (e) => { state.onlyNl = e.target.checked; store.set("onlyNl", state.onlyNl); render(); });
$("show-spoilers").addEventListener("change", (e) => { state.spoilers = e.target.checked; render(); });
$("more").addEventListener("click", () => { state.shown += PAGE_SIZE; render(); });

// ---------- Weetjes ----------
let tipIdx = Math.floor(Math.random() * TIPS.length);
function showTip() {
  const [emo, label, text] = TIPS[tipIdx % TIPS.length];
  $("tip-emo").textContent = emo;
  $("tip-label").textContent = label;
  $("tip-text").textContent = text;
}
$("tip-next").addEventListener("click", () => { tipIdx++; showTip(); });

// ---------- Start ----------
$("kid-name").textContent = KID_NAME;
state.cat = store.get("cat", "all");
state.onlyNl = store.get("onlyNl", false);
$("only-nl").checked = state.onlyNl;
document.querySelectorAll(".tab").forEach((x) => x.classList.toggle("active", x.dataset.cat === state.cat));
showTip();

fetch(`news.json?t=${Date.now()}`)
  .then((r) => { if (!r.ok) throw new Error(r.status); return r.json(); })
  .then((data) => {
    state.items = data.items || [];
    $("updated").textContent = `Laatst bijgewerkt: ${new Date(data.updated).toLocaleString("nl-NL", { dateStyle: "long", timeStyle: "short" })}`;
    render();
  })
  .catch(() => {
    $("status").textContent = "Oeps! Het nieuws kon niet geladen worden. Probeer het straks nog eens. ⚓";
  });
