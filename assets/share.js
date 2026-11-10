/* TIC – megosztás gombok (kiírások, események).
   Mobilon a telefon saját megosztás-menüjét is felajánlja (Messenger, WhatsApp, Viber stb.),
   mellette közvetlen Facebook-, Messenger- (mobilon), WhatsApp-gomb és link másolása. */
(function () {
  "use strict";
  var L = {
    hu: { label: "Megosztás", native: "Megosztás…", copy: "Link másolása", copied: "Kimásolva!" },
    ro: { label: "Distribuie", native: "Distribuie…", copy: "Copiază linkul", copied: "Copiat!" },
    en: { label: "Share", native: "Share…", copy: "Copy link", copied: "Copied!" }
  };
  var MOBILE = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent || "");

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  /* o: { url, title, lang } – HTML-t ad vissza */
  function bar(o) {
    var t = L[o.lang] || L.en;
    var u = encodeURIComponent(o.url);
    var msg = encodeURIComponent(o.title + "\n" + o.url);
    var h = '<div class="share" role="group" aria-label="' + esc(t.label) + '" data-share-url="' + esc(o.url) +
      '" data-share-title="' + esc(o.title) + '" data-share-lang="' + esc(o.lang) + '">';
    if (navigator.share) h += '<button type="button" class="share-btn share-native" data-share="native">' + esc(t.native) + "</button>";
    h += '<a class="share-btn" href="https://www.facebook.com/sharer/sharer.php?u=' + u + '" target="_blank" rel="noopener">Facebook</a>';
    if (MOBILE) h += '<a class="share-btn" href="fb-messenger://share/?link=' + u + '">Messenger</a>';
    h += '<a class="share-btn" href="https://wa.me/?text=' + msg + '" target="_blank" rel="noopener">WhatsApp</a>';
    h += '<button type="button" class="share-btn" data-share="copy">' + esc(t.copy) + "</button>";
    return h + "</div>";
  }

  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(text);
    return new Promise(function (resolve, reject) {
      var ta = document.createElement("textarea");
      ta.value = text; ta.setAttribute("readonly", ""); ta.style.position = "fixed"; ta.style.opacity = "0";
      document.body.appendChild(ta); ta.select();
      try { document.execCommand("copy") ? resolve() : reject(); } catch (e) { reject(e); }
      document.body.removeChild(ta);
    });
  }

  document.addEventListener("click", function (ev) {
    var b = ev.target.closest(".share [data-share]");
    if (!b) return;
    var box = b.closest(".share");
    var url = box.getAttribute("data-share-url"), title = box.getAttribute("data-share-title");
    var t = L[box.getAttribute("data-share-lang")] || L.en;
    if (b.getAttribute("data-share") === "native") {
      navigator.share({ title: title, text: title, url: url }).catch(function () {});
    } else {
      copyText(url).then(function () {
        var old = b.textContent; b.textContent = t.copied; b.classList.add("done");
        setTimeout(function () { b.textContent = old; b.classList.remove("done"); }, 1800);
      }).catch(function () { window.prompt(t.copy, url); });
    }
  });

  /* Ha a cím #horgonnyal érkezik (megosztott link), odagörget és kiemeli az elemet */
  function focusHash() {
    var id = decodeURIComponent((location.hash || "").slice(1));
    if (!id) return;
    var el = null;
    document.querySelectorAll('[data-anchor="' + id.replace(/["\\]/g, "") + '"]').forEach(function (x) {
      if (!el && !x.closest("[hidden]")) el = x;
    });
    if (!el) return;
    el.classList.add("is-target");
    el.scrollIntoView({ block: "center" });
  }

  window.TICShare = { bar: bar, focusHash: focusHash, SITE: "https://transylvanianinstitute.ro" };
})();
