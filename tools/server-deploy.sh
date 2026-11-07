#!/bin/bash
# TIC weboldal – önfrissítés a tárhelyen.
# A cPanel ütemezett feladata (cron) ötpercenként futtatja. Megnézi, van-e új commit
# a nyilvános GitHub-repó main ágán, és ha igen, letölti és bemásolja a weboldal
# fájljait a public_html-be. Jelszó vagy token nem kell hozzá, mert a repó nyilvános.
# Helye a tárhelyen: ~/tic-deploy/server-deploy.sh (a webrooton kívül).
set -euo pipefail

REPO="Feelfolu/tic-web"
BRANCH="main"
WEBROOT="$HOME/public_html"
STATE="$HOME/tic-deploy"
LOCK="$STATE/.lock"
# Ezeket másolja ki a repóból; minden más (contact.php, .htaccess, cgi-bin, .well-known) érintetlen marad.
FILES="index.html calendar.html blog.html"
DIRS="blog assets data stats"

mkdir -p "$STATE"
exec 9>"$LOCK"
flock -n 9 || exit 0

log() { printf '%s %s\n' "$(date '+%Y-%m-%d %H:%M:%S')" "$*" >> "$STATE/deploy.log"; }

# A napló ne nőjön a végtelenségig
if [ -f "$STATE/deploy.log" ] && [ "$(wc -l < "$STATE/deploy.log")" -gt 2000 ]; then
  tail -n 500 "$STATE/deploy.log" > "$STATE/deploy.log.tmp" && mv "$STATE/deploy.log.tmp" "$STATE/deploy.log"
fi

# A legfrissebb commit azonosítója (git, ha van; különben a GitHub nyilvános API-ja)
SHA=""
if command -v git >/dev/null 2>&1; then
  SHA=$(git ls-remote "https://github.com/$REPO.git" "refs/heads/$BRANCH" 2>/dev/null | cut -f1 || true)
fi
if [ -z "$SHA" ]; then
  SHA=$(curl -fsS -m 30 -H 'Accept: application/vnd.github.sha' "https://api.github.com/repos/$REPO/commits/$BRANCH" || true)
fi
if ! printf '%s' "$SHA" | grep -Eq '^[0-9a-f]{40}$'; then
  log "HIBA: nem sikerült lekérdezni a commitot"
  exit 1
fi

LAST=$(cat "$STATE/last-sha" 2>/dev/null || true)
[ "$SHA" = "$LAST" ] && [ "${1:-}" != "--force" ] && exit 0

TMP=$(mktemp -d "$STATE/tmp.XXXXXX")
trap 'rm -rf "$TMP"' EXIT

if ! curl -fsSL -m 120 "https://codeload.github.com/$REPO/tar.gz/$SHA" | tar -xz -C "$TMP" --strip-components=1; then
  log "HIBA: a letöltés nem sikerült ($SHA)"
  exit 1
fi

# Ellenőrzés: a fő fájlok megvannak és nem üresek, a JSON-ok érvényesek (ha van python)
for f in $FILES data/kiirasok.json data/blog.json assets/site.js assets/site.css; do
  if [ ! -s "$TMP/$f" ]; then log "HIBA: hiányzik vagy üres: $f ($SHA)"; exit 1; fi
done
if command -v python3 >/dev/null 2>&1; then
  if ! python3 -c "import json,sys; [json.load(open(p, encoding='utf-8')) for p in sys.argv[1:]]" "$TMP/data/kiirasok.json" "$TMP/data/blog.json"; then
    log "HIBA: hibás JSON ($SHA)"; exit 1
  fi
fi

for f in $FILES; do
  cp -f "$TMP/$f" "$WEBROOT/$f.new" && mv -f "$WEBROOT/$f.new" "$WEBROOT/$f"
done
for d in $DIRS; do
  [ -d "$TMP/$d" ] || continue
  mkdir -p "$WEBROOT/$d"
  cp -Rf "$TMP/$d/." "$WEBROOT/$d/"
done
# A repóból törölt blogcikkek az élő oldalról is lekerülnek
if [ -d "$WEBROOT/blog" ]; then
  for f in "$WEBROOT"/blog/*.html; do
    [ -e "$f" ] || continue
    [ -e "$TMP/blog/$(basename "$f")" ] || rm -f "$f"
  done
fi

printf '{"commit": "%s", "deployed": "%s"}\n' "$SHA" "$(date -u '+%Y-%m-%dT%H:%M:%SZ')" > "$WEBROOT/data/version.json"
printf '%s' "$SHA" > "$STATE/last-sha"
log "OK: frissítve erre: $SHA"
