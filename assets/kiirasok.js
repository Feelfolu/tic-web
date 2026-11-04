/* TIC – pályázati kiírások megjelenítése (főoldali top 3 és a naptároldal).
   Az adatok a data/kiirasok.json fájlban vannak. A lejárt kiírások maguktól
   tűnnek el: a nyitottak a határidő után 24 órával, a várhatók az "until"
   dátum után egy nappal. */
(function () {
  "use strict";

  var DATA_URL = "data/kiirasok.json";
  var DAY = 864e5;
  var TZ = "Europe/Bucharest";

  /* román számnév: 20-tól "de" kell (pl. 22 de zile), kivéve ha a szám 01–19-re végződik */
  function roDe(n) { var r = n % 100; return (n < 20 || (r >= 1 && r <= 19)) ? "" : " de"; }

  var T = {
    hu: {
      locale: "hu-HU",
      open: "Nyitva", soon: "Hamarosan lejár", closed: "Lejárt", expected: "Várható",
      deadline: "Beadási határidő", next: "Következő határidő", tz: "romániai idő szerint",
      today: "ma jár le", tomorrow: "holnap jár le", left: function (n) { return "még " + n + " nap"; },
      source: "Hivatalos kiírás", none: "Most nincs a szűrésnek megfelelő kiírás.",
      loadErr: "A kiírásokat most nem sikerült betölteni.",
      updated: "Frissítve", count: function (n) { return n + " kiírás"; },
      groupOpen: "Most nyitva", groupExpected: "Várható kiírások",
      all: "Mind", onlyOpen: "Csak nyitott", onlyExpected: "Csak várható",
      search: "Keresés név, kiíró vagy téma szerint…", searchLabel: "Keresés", tagsLabel: "Témák",
      statusLabel: "Állapot", clear: "Szűrők törlése"
    },
    ro: {
      locale: "ro-RO",
      open: "Deschis", soon: "Termen apropiat", closed: "Închis", expected: "Estimat",
      deadline: "Termen de depunere", next: "Următorul termen", tz: "ora României",
      today: "expiră azi", tomorrow: "expiră mâine",
      left: function (n) { return n === 1 ? "încă o zi" : "încă " + n + roDe(n) + " zile"; },
      source: "Apelul oficial", none: "Momentan nu există apeluri pentru filtrele alese.",
      loadErr: "Apelurile nu au putut fi încărcate acum.",
      updated: "Actualizat", count: function (n) { return n === 1 ? "un apel" : n + roDe(n) + " apeluri"; },
      groupOpen: "Deschise acum", groupExpected: "Apeluri estimate",
      all: "Toate", onlyOpen: "Doar deschise", onlyExpected: "Doar estimate",
      search: "Căutați după nume, finanțator sau temă…", searchLabel: "Căutare", tagsLabel: "Teme",
      statusLabel: "Stare", clear: "Ștergeți filtrele"
    },
    en: {
      locale: "en-GB",
      open: "Open", soon: "Closing soon", closed: "Closed", expected: "Expected",
      deadline: "Deadline", next: "Next deadline", tz: "Romanian time",
      today: "closes today", tomorrow: "closes tomorrow", left: function (n) { return n + " days left"; },
      source: "Official call", none: "No calls match these filters right now.",
      loadErr: "The calls could not be loaded right now.",
      updated: "Updated", count: function (n) { return n === 1 ? "1 call" : n + " calls"; },
      groupOpen: "Open now", groupExpected: "Expected calls",
      all: "All", onlyOpen: "Open only", onlyExpected: "Expected only",
      search: "Search by name, funder or topic…", searchLabel: "Search", tagsLabel: "Topics",
      statusLabel: "Status", clear: "Clear filters"
    }
  };

  var dataPromise = null;
  function load() {
    if (!dataPromise) {
      dataPromise = fetch(DATA_URL, { cache: "no-cache" }).then(function (r) {
        if (!r.ok) throw new Error("HTTP " + r.status);
        return r.json();
      });
    }
    return dataPromise;
  }

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function pick(obj, lang) { return obj ? (obj[lang] || "") : ""; }

  /* Bukaresti naptári nap (YYYY-MM-DD) egy időpontra */
  function dayKey(d) {
    var p = new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(d);
    var o = {}; p.forEach(function (x) { o[x.type] = x.value; });
    return o.year + "-" + o.month + "-" + o.day;
  }
  function daysBetween(now, d) {
    return Math.round((Date.parse(dayKey(d)) - Date.parse(dayKey(now))) / DAY);
  }

  /* Egy kiírás aktuális állapota, vagy null, ha már nem kell megjeleníteni */
  function state(call, now) {
    if (call.status === "open") {
      var ds = (call.deadlines || []).map(function (s) { return new Date(s); });
      for (var i = 0; i < ds.length; i++) {
        if (now.getTime() < ds[i].getTime() + DAY) {
          return { kind: now < ds[i] ? "open" : "closed", deadline: ds[i], sort: ds[i].getTime(), multi: ds.length > 1 };
        }
      }
      return null;
    }
    if (call.status === "expected") {
      var until = new Date(call.until + "T23:59:59+02:00");
      if (now.getTime() >= until.getTime() + DAY) return null;
      return { kind: "expected", sort: until.getTime() };
    }
    return null;
  }

  function visibleCalls(data, lang, now) {
    return data.calls.filter(function (c) {
      return (c.langs || []).indexOf(lang) !== -1 && pick(c.title, lang);
    }).map(function (c) {
      var st = state(c, now);
      return st ? { call: c, st: st } : null;
    }).filter(Boolean).sort(function (a, b) {
      var ka = a.st.kind === "expected" ? 1 : 0, kb = b.st.kind === "expected" ? 1 : 0;
      return ka - kb || a.st.sort - b.st.sort;
    });
  }

  function fmtDeadline(call, st, t) {
    var opts = { timeZone: TZ, year: "numeric", month: "long", day: "numeric" };
    if (!call.dateOnly) { opts.hour = "2-digit"; opts.minute = "2-digit"; }
    var s = new Intl.DateTimeFormat(t.locale, opts).format(st.deadline);
    if (!call.dateOnly) s += " (" + t.tz + ")";
    return s;
  }

  function card(item, lang, data) {
    var c = item.call, st = item.st, t = T[lang];
    var pill, when = "";
    if (st.kind === "expected") {
      pill = '<span class="pill pill-soon">' + esc(t.expected) + "</span>";
      when = '<p class="when">' + esc(pick(c.when, lang)) + "</p>";
    } else {
      var n = daysBetween(new Date(), st.deadline);
      var rel = st.kind === "closed" ? "" : (n <= 0 ? t.today : n === 1 ? t.tomorrow : t.left(n));
      pill = st.kind === "closed" ? '<span class="pill pill-closed">' + esc(t.closed) + "</span>"
        : n <= 7 ? '<span class="pill pill-soon">' + esc(t.soon) + "</span>"
        : '<span class="pill pill-open">' + esc(t.open) + "</span>";
      when = '<p class="when">' + esc(st.multi ? t.next : t.deadline) + ": <strong>" + esc(fmtDeadline(c, st, t)) + "</strong>" +
        (rel ? ' <span class="rel">· ' + esc(rel) + "</span>" : "") + "</p>";
    }
    var tags = (c.tags || []).map(function (k) {
      var lab = data.tags[k] ? data.tags[k][lang] : k;
      return '<span class="tag">' + esc(lab) + "</span>";
    }).join("");
    var host = "";
    if (c.url) { try { host = new URL(c.url).hostname.replace(/^www\./, ""); } catch (e) { host = c.url; } }
    return '<article class="call">' + pill +
      "<h3>" + esc(pick(c.title, lang)) + "</h3>" +
      '<p class="meta">' + esc(pick(c.funder, lang)) + "</p>" +
      (pick(c.who, lang) ? '<p class="who-txt">' + esc(pick(c.who, lang)) + "</p>" : "") +
      when +
      (tags ? '<p class="tags">' + tags + "</p>" : "") +
      (c.url ? '<p class="src"><a href="' + esc(c.url) + '" target="_blank" rel="noopener">' + esc(t.source) + ": " + esc(host) + "</a></p>" : "") +
      "</article>";
  }

  /* Főoldal: a legközelebbi határidejű nyitott kiírások, szükség esetén várhatóval kiegészítve */
  function renderTop(el) {
    var lang = el.getAttribute("data-calls-lang");
    var n = parseInt(el.getAttribute("data-calls-top"), 10) || 3;
    load().then(function (data) {
      var items = visibleCalls(data, lang, new Date()).filter(function (x) { return x.st.kind !== "closed"; });
      var html = items.slice(0, n).map(function (x) { return card(x, lang, data); }).join("");
      el.innerHTML = html || '<p class="calls-empty">' + esc(T[lang].none) + "</p>";
    }).catch(function () {
      el.innerHTML = '<p class="calls-empty">' + esc(T[lang].loadErr) + "</p>";
    });
  }

  /* Naptároldal: keresés, állapot- és témaszűrő */
  function renderCalendar(root) {
    var lang = root.getAttribute("data-calendar-lang"), t = T[lang];
    load().then(function (data) {
      var items = visibleCalls(data, lang, new Date());
      var used = {};
      items.forEach(function (x) { (x.call.tags || []).forEach(function (k) { used[k] = (used[k] || 0) + 1; }); });
      var tagKeys = Object.keys(data.tags).filter(function (k) { return used[k]; });
      var uid = "cal-" + lang;
      root.innerHTML =
        '<div class="cal-controls">' +
          '<label class="cal-search"><span class="sr-only">' + esc(t.searchLabel) + '</span><input type="search" id="' + uid + '-q" placeholder="' + esc(t.search) + '" autocomplete="off"></label>' +
          '<div class="cal-status" role="group" aria-label="' + esc(t.statusLabel) + '">' +
            '<button type="button" data-status="all" aria-pressed="true">' + esc(t.all) + "</button>" +
            '<button type="button" data-status="open" aria-pressed="false">' + esc(t.onlyOpen) + "</button>" +
            '<button type="button" data-status="expected" aria-pressed="false">' + esc(t.onlyExpected) + "</button>" +
          "</div>" +
          '<div class="cal-tags" role="group" aria-label="' + esc(t.tagsLabel) + '">' +
            tagKeys.map(function (k) { return '<button type="button" class="chip" data-tag="' + esc(k) + '" aria-pressed="false">' + esc(data.tags[k][lang]) + "</button>"; }).join("") +
          "</div>" +
          '<p class="cal-meta"><span class="cal-count" aria-live="polite"></span> · ' + esc(t.updated) + ": " +
            esc(new Intl.DateTimeFormat(t.locale, { year: "numeric", month: "long", day: "numeric" }).format(new Date(data.updated + "T12:00:00+02:00"))) +
            ' <button type="button" class="cal-clear" hidden>' + esc(t.clear) + "</button></p>" +
        "</div>" +
        '<div class="cal-list"></div>';

      var q = root.querySelector("input[type=search]");
      var list = root.querySelector(".cal-list");
      var countEl = root.querySelector(".cal-count");
      var clearBtn = root.querySelector(".cal-clear");
      var status = "all", tags = {};

      function norm(s) { return String(s).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, ""); }
      function hay(x) {
        var c = x.call;
        return norm([pick(c.title, lang), pick(c.funder, lang), pick(c.who, lang), pick(c.when, lang)]
          .concat((c.tags || []).map(function (k) { return data.tags[k] ? data.tags[k][lang] : k; })).join(" "));
      }
      function draw() {
        var words = norm(q.value).split(/\s+/).filter(Boolean);
        var active = Object.keys(tags).filter(function (k) { return tags[k]; });
        var shown = items.filter(function (x) {
          if (status === "open" && x.st.kind === "expected") return false;
          if (status === "expected" && x.st.kind !== "expected") return false;
          if (active.length && !active.some(function (k) { return (x.call.tags || []).indexOf(k) !== -1; })) return false;
          var h = hay(x);
          return words.every(function (w) { return h.indexOf(w) !== -1; });
        });
        var open = shown.filter(function (x) { return x.st.kind !== "expected"; });
        var exp = shown.filter(function (x) { return x.st.kind === "expected"; });
        var html = "";
        if (open.length) html += '<h2 class="cal-group">' + esc(t.groupOpen) + '</h2><div class="calls">' + open.map(function (x) { return card(x, lang, data); }).join("") + "</div>";
        if (exp.length) html += '<h2 class="cal-group">' + esc(t.groupExpected) + '</h2><div class="calls">' + exp.map(function (x) { return card(x, lang, data); }).join("") + "</div>";
        list.innerHTML = html || '<p class="calls-empty">' + esc(t.none) + "</p>";
        countEl.textContent = t.count(shown.length);
        clearBtn.hidden = !(words.length || active.length || status !== "all");
      }
      q.addEventListener("input", draw);
      root.addEventListener("click", function (ev) {
        var b = ev.target.closest("button");
        if (!b || !root.contains(b)) return;
        if (b.hasAttribute("data-status")) {
          status = b.getAttribute("data-status");
          root.querySelectorAll("[data-status]").forEach(function (x) { x.setAttribute("aria-pressed", x === b ? "true" : "false"); });
        } else if (b.hasAttribute("data-tag")) {
          var k = b.getAttribute("data-tag");
          tags[k] = !tags[k];
          b.setAttribute("aria-pressed", tags[k] ? "true" : "false");
        } else if (b.classList.contains("cal-clear")) {
          q.value = ""; status = "all"; tags = {};
          root.querySelectorAll("[data-status]").forEach(function (x) { x.setAttribute("aria-pressed", x.getAttribute("data-status") === "all" ? "true" : "false"); });
          root.querySelectorAll("[data-tag]").forEach(function (x) { x.setAttribute("aria-pressed", "false"); });
        } else { return; }
        draw();
      });
      draw();
    }).catch(function () {
      root.innerHTML = '<p class="calls-empty">' + esc(t.loadErr) + "</p>";
    });
  }

  function init() {
    document.querySelectorAll("[data-calls-top]").forEach(renderTop);
    document.querySelectorAll("[data-calendar-lang]").forEach(renderCalendar);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
