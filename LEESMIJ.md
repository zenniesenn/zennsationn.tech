# Zenn's Nieuwshaven

Kindvriendelijke nieuwssite over One Piece, de One Piece Card Game en Roblox.

## Bestanden
- `index.html`, `style.css`, `app.js` — de website (statisch, geen server nodig)
- `news.json` — het nieuws (wordt gemaakt door het script)
- `scripts/fetch-news.mjs` — haalt nieuws op via Google News en filtert ongeschikte berichten
- `.github/workflows/update-news.yml` — ververst het nieuws elke 3 uur en publiceert op GitHub Pages
- `CNAME` — koppelt de site aan zennsationn.tech

## Online zetten (GitHub Pages, gratis)
1. Maak een GitHub-repository en upload deze map (branch `main`).
2. Repository → Settings → Pages → Source: **GitHub Actions**.
3. Settings → Pages → Custom domain: `zennsationn.tech`, vink **Enforce HTTPS** aan.
4. Bij je domeinregistrar (DNS): vier A-records voor `@` naar
   185.199.108.153, 185.199.109.153, 185.199.110.153, 185.199.111.153
   en een CNAME-record `www` → `<jouw-github-naam>.github.io`.

## Andere hosting
Upload alle bestanden naar de webroot en laat `node scripts/fetch-news.mjs` een paar keer per dag draaien (cron).

## Aanpassen
- Naam van je kind: `KID_NAME` bovenaan `app.js` (en in `index.html`).
- Filterwoorden: lijst `BLOCK` in `scripts/fetch-news.mjs`.
- Weetjes/tips: lijst `TIPS` in `app.js`.
