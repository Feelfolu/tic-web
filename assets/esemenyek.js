/* TIC – képzések, webináriumok, tájékoztató napok listája (events.html).
   Adatok: data/esemenyek.json. Egy esemény az utolsó napja végéig látszik, utána magától eltűnik. */
(function () {
  "use strict";
  var TZ = "Europe/Bucharest";
  var T = {
    hu: { locale: "hu-HU", online: "Online", reg: "Regisztráció és részletek", related: "Kapcsolódó kiírás a naptárban",
          none: "Most nincs meghirdetett képzés vagy webinárium. Az újakat a Facebook-csoportunkban is jelezzük.",
          err: "Az eseményeket most nem sikerült betölteni.", today: "ma", tomorrow: "holnap", in: function (n) { return n + " nap múlva"; },
          tz: "romániai idő", all: "Mind" },
    ro: { locale: "ro-RO", online: "Online", reg: "Înscriere și detalii", related: "Apelul asociat în calendar",
          none: "Momentan nu sunt anunțate formări sau webinarii. Le anunțăm și în grupul nostru de Facebook.",
          err: "Evenimentele nu au putut fi încărcate acum.", today: "azi", tomorrow: "mâine",
          in: function (n) { return "peste " + n + (n >= 20 && (n % 100 === 0 || n % 100 >= 20) ? " de zile" : n === 1 ? " zi" : " zile"); },
          tz: "ora României", all: "Toate" },
    en: { locale: "en-GB", online: "Online", reg: "Registration and details", related: "Related call in the calendar",
          none: "No training or webinars are announced right now.", err: "The events could not be loaded right now.",
          today: "today", tomorrow: "tomorrow", in: function (n) { return "in " + n + " days"; }, tz: "Romanian time", all: "All" }
  };

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function pick(o, l) { return o ? (o[l] || "") : ""; }
  function dayKey(d) {
    var p = new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(d), o = {};
    p.forEach(function (x) { o[x.type] = x.value; });
    return o.year + "-" + o.month + "-" + o.day;
  }
  function toDate(s, dateOnly) { return new Date(dateOnly || s.length === 10 ? s.slice(0, 10) + "T12:00:00+02:00" : s); }

  function visible(ev, now) {
    var last = toDate(ev.end || ev.start, ev.dateOnly);
    return dayKey(now) <= dayKey(last);
  }

  function when(ev, t) {
    var s = toDate(ev.start, ev.dateOnly);
    var dOpts = { timeZone: TZ, weekday: "long", year: "numeric", month: "long", day: "numeric" };
    var txt = new Intl.DateTimeFormat(t.locale, dOpts).format(s);
    if (ev.end && dayKey(toDate(ev.end, ev.dateOnly)) !== dayKey(s)) {
      txt += " – " + new Intl.DateTimeFormat(t.locale, { timeZone: TZ, month: "long", day: "numeric" }).format(toDate(ev.end, ev.dateOnly));
    } else if (!ev.dateOnly && ev.start.length > 10) {
      txt += ", " + new Intl.DateTimeFormat(t.locale, { timeZone: TZ, hour: "2-digit", minute: "2-digit" }).format(s) + " (" + t.tz + ")";
    }
    var n = Math.round((Date.parse(dayKey(s)) - Date.parse(dayKey(new Date()))) / 864e5);
    var rel = n <= 0 ? t.today : n === 1 ? t.tomorrow : t.in(n);
    return { txt: txt, rel: rel, soon: n <= 3 };
  }

  function card(ev, lang, data) {
    var t = T[lang], w = when(ev, t);
    var type = data.types[ev.type] ? data.types[ev.type][lang] : "";
    var place = ev.online ? t.online : pick(ev.place, lang);
    var share = window.TICShare ? window.TICShare.bar({
      url: window.TICShare.SITE + "/events.html?lang=" + lang + "#e-" + ev.id,
      title: pick(ev.title, lang) + " – " + w.txt, lang: lang }) : "";
    return '<article class="call event" data-anchor="e-' + esc(ev.id) + '">' +
      '<span class="pill ' + (w.soon ? "pill-soon" : "pill-open") + '">' + esc(type) + "</span>" +
      "<h3>" + esc(pick(ev.title, lang)) + "</h3>" +
      '<p class="meta">' + esc(pick(ev.organizer, lang)) + (place ? " · " + esc(place) : "") + "</p>" +
      '<p class="when"><strong>' + esc(w.txt) + '</strong> <span class="rel">· ' + esc(w.rel) + "</span></p>" +
      (pick(ev.desc, lang) ? '<p class="who-txt">' + esc(pick(ev.desc, lang)) + "</p>" : "") +
      '<p class="src">' +
        (ev.url ? '<a class="btn btn-main btn-sm" href="' + esc(ev.url) + '" target="_blank" rel="noopener">' + esc(t.reg) + "</a>" : "") +
        (ev.related ? ' <a class="event-related" href="calendar.html?lang=' + lang + "#k-" + esc(ev.related) + '">' + esc(t.related) + " →</a>" : "") +
      "</p>" + share + "</article>";
  }

  function render(root) {
    var lang = root.getAttribute("data-events-lang"), t = T[lang];
    fetch("data/esemenyek.json", { cache: "no-cache" }).then(function (r) {
      if (!r.ok) throw new Error(r.status); return r.json();
    }).then(function (data) {
      var now = new Date();
      var list = data.events.filter(function (ev) {
        return (ev.langs || []).indexOf(lang) !== -1 && pick(ev.title, lang) && visible(ev, now);
      }).sort(function (a, b) { return toDate(a.start, a.dateOnly) - toDate(b.start, b.dateOnly); });
      root.innerHTML = list.length
        ? '<div class="calls">' + list.map(function (ev) { return card(ev, lang, data); }).join("") + "</div>"
        : '<p class="calls-empty">' + esc(t.none) + "</p>";
      if (window.TICShare) window.TICShare.focusHash();
    }).catch(function () { root.innerHTML = '<p class="calls-empty">' + esc(t.err) + "</p>"; });
  }

  function init() { document.querySelectorAll("[data-events-lang]").forEach(render); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
