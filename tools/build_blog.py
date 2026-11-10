#!/usr/bin/env python3
"""TIC blog – statikus generátor.

Bemenet:  content/blog/*.md  (fejléc + Markdown törzs)
Kimenet:  blog.html, blog/<slug>.html, data/blog.json,
          és a "Blog" menüpont láthatóságának beállítása az index.html és a calendar.html fájlban.

Cikkfejléc (a fájl elején, két --- között):
    ---
    title: A cikk címe
    date: 2026-11-10
    lang: hu            # hu | ro | en
    summary: Egy-két mondatos összefoglaló (lista + Facebook-előnézet)
    slug: a-cikk-cime   # nem kötelező; alapból a fájlnév
    image: assets/blog/kep.jpg   # nem kötelező; a cikk képe (lista + cikk teteje)
    image_alt: A kép leírása     # nem kötelező, de ajánlott, ha van kép
    og_image: assets/blog/kep-og.jpg   # nem kötelező; Facebook-előnézet (1200×630), alapból az image
    draft: true         # nem kötelező; ha true, nem jelenik meg
    ---

Használat:  python3 tools/build_blog.py <a weboldal gyökérmappája>
"""
import html, json, os, re, sys, datetime
import markdown

ROOT = os.path.abspath(sys.argv[1] if len(sys.argv) > 1 else ".")
SITE = "https://transylvanianinstitute.ro"
LANGS = ("hu", "ro", "en")
MONTHS = {
    "hu": ["január", "február", "március", "április", "május", "június", "július", "augusztus", "szeptember", "október", "november", "december"],
    "ro": ["ianuarie", "februarie", "martie", "aprilie", "mai", "iunie", "iulie", "august", "septembrie", "octombrie", "noiembrie", "decembrie"],
    "en": ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
}
OG_LOCALE = {"hu": "hu_HU", "ro": "ro_RO", "en": "en_GB"}
LANG_NAME = {
    "hu": {"hu": "magyar", "ro": "román", "en": "angol"},
    "ro": {"hu": "maghiară", "ro": "română", "en": "engleză"},
    "en": {"hu": "Hungarian", "ro": "Romanian", "en": "English"},
}

UI = {
    "hu": dict(
        nav_aria="Fő navigáció", home="kezdőlap", menu="Menü", lang_aria="Nyelvválasztás",
        nav=[("index.html#szolgaltatasok", "Szolgáltatások"), ("index.html#sajat-projektek", "Saját projektek"),
             ("calendar.html", "Pályázati naptár"), ("events.html", "Képzések"), ("blog.html", "Blog"), ("index.html#rolunk", "Rólunk"),
             ("index.html#kapcsolat", "Kapcsolat")],
        list_eyebrow="Blog", list_h1="Írások pályázatokról és kulturális projektekről",
        list_intro="Tapasztalatok, tanácsok és gondolatok a kulturális pályázatok és projektek világából.",
        empty="Ezen a nyelven még nincs cikk.", other="Más nyelven", read="Tovább olvasom",
        back="← Vissza a blogra", share="Megosztás Facebookon",
        cta_h="Pályázatot vagy projektet tervez?", cta_p="Írjon nekünk pár sort a tervezett projektről; az első beszélgetés díjmentes.",
        cta_btn="Kapcsolatfelvétel", contact="kapcsolat", in_lang="nyelvű cikk",
        title="Blog – Transylvanian Institute for Culture",
        desc="Írások kulturális pályázatokról és projektekről."),
    "ro": dict(
        nav_aria="Navigare principală", home="pagina principală", menu="Meniu", lang_aria="Alegerea limbii",
        nav=[("index.html#servicii", "Servicii"), ("index.html#proiecte-proprii", "Proiecte proprii"),
             ("calendar.html", "Calendar"), ("events.html", "Formări"), ("blog.html", "Blog"), ("index.html#despre", "Despre"),
             ("index.html#contact", "Contact")],
        list_eyebrow="Blog", list_h1="Articole despre finanțări și proiecte culturale",
        list_intro="Experiențe, sfaturi și reflecții din lumea finanțărilor și a proiectelor culturale.",
        empty="Încă nu există articole în această limbă.", other="În alte limbi", read="Citiți mai departe",
        back="← Înapoi la blog", share="Distribuiți pe Facebook",
        cta_h="Pregătiți o cerere de finanțare sau un proiect?", cta_p="Scrieți-ne câteva rânduri despre proiect; prima discuție este gratuită.",
        cta_btn="Contactați-ne", contact="contact", in_lang="articol în limba",
        title="Blog – Transylvanian Institute for Culture",
        desc="Articole despre finanțări și proiecte culturale."),
    "en": dict(
        nav_aria="Main navigation", home="home", menu="Menu", lang_aria="Language",
        nav=[("index.html#services", "Services"), ("index.html#own-projects", "Own projects"),
             ("calendar.html", "Funding calendar"), ("events.html", "Training"), ("blog.html", "Blog"), ("index.html#about", "About"),
             ("index.html#contact-en", "Contact")],
        list_eyebrow="Blog", list_h1="Notes on cultural funding and projects",
        list_intro="Experience, advice and reflections from the world of cultural grants and projects.",
        empty="There are no articles in this language yet.", other="In other languages", read="Read more",
        back="← Back to the blog", share="Share on Facebook",
        cta_h="Planning an application or a project?", cta_p="Write us a few lines about your project; the first conversation is free.",
        cta_btn="Get in touch", contact="contact-en", in_lang="article in",
        title="Blog – Transylvanian Institute for Culture",
        desc="Notes on cultural funding and projects."),
}

e = lambda s: html.escape(str(s), quote=True)


def fmt_date(d, lang):
    m = MONTHS[lang][d.month - 1]
    if lang == "hu":
        return f"{d.year}. {m} {d.day}."
    return f"{d.day} {m} {d.year}"


def parse_post(path):
    raw = open(path, encoding="utf-8").read().lstrip("﻿")
    m = re.match(r"---\s*\n(.*?)\n---\s*\n(.*)", raw, re.S)
    if not m:
        raise SystemExit(f"Hiányzó fejléc: {path}")
    meta = {}
    for line in m.group(1).splitlines():
        if ":" in line and not line.strip().startswith("#"):
            k, v = line.split(":", 1)
            meta[k.strip()] = re.sub(r"\s+#.*$", "", v.strip()).strip().strip('"')
    for k in ("title", "date", "lang", "summary"):
        if not meta.get(k):
            raise SystemExit(f"{os.path.basename(path)}: hiányzik a '{k}' mező")
    if meta["lang"] not in LANGS:
        raise SystemExit(f"{os.path.basename(path)}: ismeretlen nyelv: {meta['lang']}")
    meta["date"] = datetime.date.fromisoformat(meta["date"])
    meta["slug"] = meta.get("slug") or os.path.splitext(os.path.basename(path))[0]
    if not re.fullmatch(r"[a-z0-9]+(?:-[a-z0-9]+)*", meta["slug"]):
        raise SystemExit(f"Érvénytelen slug (csak kisbetű, szám, kötőjel): {meta['slug']}")
    meta["draft"] = meta.get("draft", "").lower() in ("true", "igen", "yes", "1")
    meta["html"] = markdown.markdown(m.group(2), extensions=["extra", "sane_lists"], output_format="html")
    return meta


def head(title, desc, url, lang, og_type="website", image=None, extra=""):
    icon = ("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='6' "
            "fill='%231E3A78'/%3E%3Ctext x='16' y='22' font-family='Georgia,serif' font-size='16' fill='%23F2CD86' text-anchor='middle'%3ET%3C/text%3E%3C/svg%3E")
    img = image or f"{SITE}/assets/og-default.png"
    return f"""<!doctype html>
<html lang="{lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="theme-color" content="#F6F1E8">
<title>{e(title)}</title>
<meta name="description" content="{e(desc)}">
<link rel="canonical" href="{e(url)}">
<meta property="og:title" content="{e(title)}">
<meta property="og:description" content="{e(desc)}">
<meta property="og:type" content="{og_type}">
<meta property="og:url" content="{e(url)}">
<meta property="og:image" content="{e(img)}">
<meta property="og:locale" content="{OG_LOCALE[lang]}">
{extra}<link rel="icon" href="{icon}">
<style>html{{-webkit-text-size-adjust:100%}}body{{margin:0}}img{{max-width:100%}}[hidden]{{display:none!important}}</style>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600&family=Source+Serif+4:opsz,wght@8..60,500;8..60,600&display=swap">
<link rel="stylesheet" href="/assets/site.css">
</head>
"""


def nav_href(h, q):
    """Cikkoldalon a menülinkek a cikk nyelvére mutatnak (?lang=…), a horgony a végén marad."""
    if not q:
        return "/" + h
    page, _, anchor = h.partition("#")
    return f"/{page}?lang={q}" + (f"#{anchor}" if anchor else "")


def header(lang, current, lang_switch, hero, q=None):
    u = UI[lang]
    links = "\n".join(
        f'          <a href="{nav_href(h, q)}"{" aria-current=\"page\"" if h == current else ""}>{e(t)}</a>' for h, t in u["nav"])
    return f"""<header class="top">
  <div class="wrap">
    <nav aria-label="{e(u['nav_aria'])}">
      <a class="brand" href="/index.html" aria-label="Transylvanian Institute for Culture – {e(u['home'])}"><img class="brand-mark" src="/assets/tic-logo.png" alt="Transylvanian Institute for Culture" width="598" height="303"></a>
      <button type="button" class="nav-toggle" aria-expanded="false"><span></span><span></span><span></span><span class="sr-only">{e(u['menu'])}</span></button>
      <div class="navright">
        <div class="links">
{links}
        </div>
        <div class="langs" role="group" aria-label="{e(u['lang_aria'])}">
{lang_switch}
        </div>
      </div>
    </nav>
{hero}
  </div>
</header>
"""


FOOTER = """<footer>
  <div class="wrap footer-row">
    <img class="footer-mark" src="/assets/tic-logo-white.png" alt="Transylvanian Institute for Culture" width="598" height="303">
    <a href="mailto:office@transylvanianinstitute.ro">office@transylvanianinstitute.ro</a>
  </div>
</footer>
"""


def abs_url(path):
    return path if path.startswith("http") else f"{SITE}/{path.lstrip('/')}"


def post_card(p, lang_ui, show_lang=False):
    u = UI[lang_ui]
    badge = f' <span class="tag">{e(LANG_NAME[lang_ui][p["lang"]])}</span>' if show_lang else ""
    thumb = ""
    if p.get("image"):
        thumb = (f'          <a class="post-thumb" href="/blog/{p["slug"]}.html" tabindex="-1" aria-hidden="true">'
                 f'<img src="/{e(p["image"].lstrip("/"))}" alt="" loading="lazy"></a>\n')
    return f"""        <article class="post-card{' has-thumb' if thumb else ''}" lang="{p['lang']}">
{thumb}          <p class="post-date"><time datetime="{p['date'].isoformat()}">{e(fmt_date(p['date'], p['lang']))}</time>{badge}</p>
          <h2><a href="/blog/{p['slug']}.html">{e(p['title'])}</a></h2>
          <p>{e(p['summary'])}</p>
          <p class="post-more"><a href="/blog/{p['slug']}.html">{e(u['read'])} →</a></p>
        </article>"""


def build_list(posts):
    blocks = []
    for lang in LANGS:
        u = UI[lang]
        own = [p for p in posts if p["lang"] == lang]
        switch = "\n".join(
            f'          <button type="button" data-set-lang="{c}" aria-pressed="{"true" if c == lang else "false"}">{c.upper()}</button>' for c in LANGS)
        hero = f"""    <div class="hero hero-sm">
      <div class="eyebrow">{e(u['list_eyebrow'])}</div>
      <h1>{e(u['list_h1'])}</h1>
      <p>{e(u['list_intro'])}</p>
    </div>"""
        body = "\n".join(post_card(p, lang) for p in own) if own else f'        <p class="calls-empty">{e(u["empty"])}</p>'
        other_html = ""  # csak a saját nyelvű cikkek jelennek meg
        blocks.append(f"""<!-- ======================= {lang.upper()} ======================= -->
<div data-lang="{lang}"{"" if lang == "ro" else " hidden"}>
{header(lang, "blog.html", switch, hero)}
<main>
  <section>
    <div class="wrap">
      <div class="posts">
{body}
      </div>{other_html}
    </div>
  </section>
</main>
{FOOTER}</div>
""")
    titles = "".join(f'<meta name="tic-title-{l}" content="{e(UI[l]["title"])}">\n' for l in LANGS)
    page = (head(UI["ro"]["title"], UI["ro"]["desc"], f"{SITE}/blog.html", "ro", extra=titles)
            + "<body>\n" + "".join(blocks)
            + '<script src="/assets/site.js" defer></script>\n</body>\n</html>\n')
    open(os.path.join(ROOT, "blog.html"), "w", encoding="utf-8").write(page)


def build_post(p):
    lang = p["lang"]
    u = UI[lang]
    url = f"{SITE}/blog/{p['slug']}.html"
    switch = "\n".join(
        (f'          <span class="lang-current" aria-current="true">{c.upper()}</span>' if c == lang else
         f'          <a href="/blog.html?lang={c}" lang="{c}">{c.upper()}</a>') for c in LANGS)
    hero = f"""    <div class="hero hero-sm post-hero">
      <div class="eyebrow"><a href="/blog.html?lang={lang}">Blog</a> · <time datetime="{p['date'].isoformat()}">{e(fmt_date(p['date'], lang))}</time></div>
      <h1>{e(p['title'])}</h1>
      <p>{e(p['summary'])}</p>
    </div>"""
    image = None
    if p.get("og_image") or p.get("image"):
        image = abs_url(p.get("og_image") or p["image"])
    figure = ""
    if p.get("image"):
        figure = (f'      <figure class="post-figure"><img src="/{e(p["image"].lstrip("/"))}" '
                  f'alt="{e(p.get("image_alt", ""))}"></figure>\n')
    extra = f'<meta property="article:published_time" content="{p["date"].isoformat()}">\n'
    share = "https://www.facebook.com/sharer/sharer.php?u=" + url
    page = (head(f"{p['title']} – Transylvanian Institute for Culture", p["summary"], url, lang, "article", image, extra)
            + "<body>\n" + header(lang, "blog.html", switch, hero, q=lang) + f"""
<main>
  <section>
    <div class="wrap">
{figure}      <article class="prose">
{p['html']}
      </article>
      <div class="post-actions">
        <a class="btn btn-ghost" href="/blog.html?lang={lang}">{e(u['back'])}</a>
        <a class="btn btn-ghost" href="{e(share)}" target="_blank" rel="noopener">{e(u['share'])}</a>
      </div>
      <div class="group post-cta">
        <h3>{e(u['cta_h'])}</h3>
        <p>{e(u['cta_p'])}</p>
        <a class="btn btn-main" href="/index.html?lang={lang}#{u['contact']}">{e(u['cta_btn'])}</a>
      </div>
    </div>
  </section>
</main>
{FOOTER}<script src="/assets/site.js" defer></script>
</body>
</html>
""")
    os.makedirs(os.path.join(ROOT, "blog"), exist_ok=True)
    open(os.path.join(ROOT, "blog", p["slug"] + ".html"), "w", encoding="utf-8").write(page)


def toggle_nav(has_posts):
    """A data-blog-nav menüpontok elrejtése, amíg nincs megjelent cikk."""
    for name in ("index.html", "calendar.html", "events.html"):
        path = os.path.join(ROOT, name)
        s = open(path, encoding="utf-8").read()
        n = len(re.findall(r'<a href="blog\.html" data-blog-nav[^>]*>', s))
        if n != 3:
            raise SystemExit(f"{name}: 3 Blog-menüpont kellene, talált: {n}")
        s = re.sub(r'<a href="blog\.html" data-blog-nav( hidden)?>',
                   '<a href="blog.html" data-blog-nav>' if has_posts else '<a href="blog.html" data-blog-nav hidden>', s)
        open(path, "w", encoding="utf-8").write(s)


def main():
    src = os.path.join(ROOT, "content", "blog")
    files = sorted(f for f in os.listdir(src) if f.endswith(".md")) if os.path.isdir(src) else []
    posts = [parse_post(os.path.join(src, f)) for f in files]
    slugs = [p["slug"] for p in posts]
    if len(slugs) != len(set(slugs)):
        raise SystemExit("Két cikknek azonos a slugja")
    live = sorted((p for p in posts if not p["draft"]), key=lambda p: p["date"], reverse=True)
    # régi, már nem létező cikkoldalak törlése a kimenetből
    outdir = os.path.join(ROOT, "blog")
    if os.path.isdir(outdir):
        for f in os.listdir(outdir):
            if f.endswith(".html") and f[:-5] not in {p["slug"] for p in live}:
                os.remove(os.path.join(outdir, f))
    for p in live:
        build_post(p)
    build_list(live)
    toggle_nav(bool(live))
    os.makedirs(os.path.join(ROOT, "data"), exist_ok=True)
    json.dump([{"slug": p["slug"], "title": p["title"], "date": p["date"].isoformat(), "lang": p["lang"],
                "summary": p["summary"], "url": f"/blog/{p['slug']}.html"} for p in live],
              open(os.path.join(ROOT, "data", "blog.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=2)
    print(f"{len(live)} megjelent cikk, {len(posts) - len(live)} piszkozat")


if __name__ == "__main__":
    main()
