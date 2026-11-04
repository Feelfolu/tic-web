/* TIC – közös oldalszkript: nyelvválasztás, mobilmenü, kapcsolati űrlap.
   Alapértelmezett nyelv: román. A ?lang=hu|ro|en paraméter felülírja a mentett választást,
   így a magyar és a román Facebook-oldal a saját nyelvére linkelhet. */
(function(){
  var LANGS = ["hu","ro","en"];
  var DEFAULT_LANG = "ro";
  function closeAllMenus(){
    document.querySelectorAll(".navright.open").forEach(function(p){ p.classList.remove("open"); });
    document.querySelectorAll(".nav-toggle[aria-expanded='true']").forEach(function(b){ b.setAttribute("aria-expanded","false"); });
  }
  function setLang(code){
    if (LANGS.indexOf(code) === -1) code = DEFAULT_LANG;
    document.querySelectorAll("[data-lang]").forEach(function(block){
      block.hidden = block.getAttribute("data-lang") !== code;
    });
    document.querySelectorAll("[data-set-lang]").forEach(function(btn){
      btn.setAttribute("aria-pressed", btn.getAttribute("data-set-lang") === code ? "true" : "false");
    });
    document.documentElement.lang = code;
    var t = document.querySelector('meta[name="tic-title-' + code + '"]');
    if (t) document.title = t.getAttribute("content");
    try { localStorage.setItem("tic-lang", code); } catch (e) {}
  }
  document.addEventListener("click", function(ev){
    var toggle = ev.target.closest(".nav-toggle");
    if (toggle) {
      var nav = toggle.closest("nav");
      var panel = nav.querySelector(".navright");
      var open = panel.classList.toggle("open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      return;
    }
    var langBtn = ev.target.closest("[data-set-lang]");
    if (langBtn) {
      setLang(langBtn.getAttribute("data-set-lang"));
      closeAllMenus();
      if (location.search.indexOf("lang=") !== -1 && window.history && history.replaceState) {
        history.replaceState(null, "", location.pathname + location.hash);
      }
      window.scrollTo({ top: 0, behavior: "auto" });
      return;
    }
    var navLink = ev.target.closest(".navright a");
    if (navLink) { closeAllMenus(); }
  });
  document.addEventListener("submit", function(ev){
    var form = ev.target.closest(".qform");
    if (!form) return;
    ev.preventDefault();
    var val = function(n){ var el = form.querySelector('[name="' + n + '"]'); return el ? el.value.trim() : ""; };
    var hint = form.querySelector(".qform-hint");
    var status = form.querySelector(".qform-status");
    var btn = form.querySelector('button[type="submit"]');
    var msgEl = form.querySelector('[name="message"]');
    if (!val("message")) { msgEl.focus(); msgEl.reportValidity && msgEl.reportValidity(); return; }
    if (!val("email") && !val("phone")) {
      if (hint) hint.classList.add("warn");
      form.querySelector('[name="email"]').focus();
      return;
    }
    if (hint) hint.classList.remove("warn");
    var show = function(kind, text){ status.hidden = false; status.className = "qform-status " + kind; status.textContent = text; };
    var label = btn.textContent;
    btn.disabled = true; btn.textContent = form.getAttribute("data-sending") || label;
    var data = new FormData(form);
    data.append("lang", form.getAttribute("data-lang-code") || "");
    data.append("subject", form.getAttribute("data-subject") || "");
    fetch(form.getAttribute("action"), { method: "POST", body: data, headers: { "Accept": "application/json" } })
      .then(function(r){ return r.json().catch(function(){ return { ok: false }; }); })
      .then(function(j){
        if (j && j.ok) { form.reset(); show("ok", form.getAttribute("data-ok")); }
        else { show("err", form.getAttribute("data-err")); }
      })
      .catch(function(){ show("err", form.getAttribute("data-err")); })
      .then(function(){ btn.disabled = false; btn.textContent = label; });
  });
  /* Egynyelvű oldalon (pl. blogcikk) nincs nyelvváltó blokk: ott a lap saját nyelve marad. */
  if (document.querySelector("[data-lang]")) {
    var fromUrl = null, saved = null;
    try { fromUrl = new URLSearchParams(location.search).get("lang"); } catch (e) {}
    try { saved = localStorage.getItem("tic-lang"); } catch (e) {}
    setLang(fromUrl || saved || DEFAULT_LANG);
  }
})();
