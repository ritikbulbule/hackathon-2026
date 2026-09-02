/* ============================================================
   ShieldX — app.js
   ------------------------------------------------------------
   This file did not exist yet — it's added because scanner.js
   and history.js call ShieldXApp.navigate(...) and
   ShieldXApp.playLoadingSequence(), and nothing defined
   ShieldXApp. It also boots every other module on page load.
   ============================================================ */

const ShieldXApp = (() => {

  let loadingTimer = null;

  /* ---------------- view switching ---------------- */
  function navigate(viewName){
    document.querySelectorAll(".view").forEach(view => {
      view.classList.toggle("is-active", view.dataset.view === viewName);
    });

    document.querySelectorAll(".main-nav__link").forEach(link => {
      link.classList.toggle("is-active", link.dataset.nav === viewName);
    });

    if (viewName === "history"){
      ShieldXHistory.renderHistoryList();
    }
    if (viewName === "dashboard"){
      ShieldXHistory.renderDashboard();
    }

    window.scrollTo({ top: 0, behavior: "smooth" });
    closeMobileNav();
  }

  /* ---------------- loading step animation ---------------- */
  function playLoadingSequence(){
    const items = document.querySelectorAll("#loadingSteps li");
    items.forEach(li => li.classList.remove("is-current", "is-done"));
    if (loadingTimer) clearTimeout(loadingTimer);

    let i = 0;
    const stepThrough = () => {
      items.forEach((li, idx) => {
        li.classList.toggle("is-current", idx === i);
        li.classList.toggle("is-done", idx < i);
      });
      i++;
      if (i <= items.length){
        loadingTimer = setTimeout(stepThrough, 380);
      }
    };
    stepThrough();
  }

  /* ---------------- nav wiring ---------------- */
  function initNav(){
    document.querySelectorAll("[data-nav]").forEach(el => {
      el.addEventListener("click", e => {
        e.preventDefault();
        navigate(el.dataset.nav);
      });
    });
  }

  function initDemoBanner(){
    const banner = document.getElementById("demoBanner");
    const closeBtn = document.getElementById("demoBannerClose");
    if (!banner || !closeBtn) return;
    closeBtn.addEventListener("click", () => banner.classList.add("is-hidden"));
  }

  function initMobileNav(){
    const toggle = document.getElementById("navToggle");
    const nav = document.getElementById("mainNav");
    if (!toggle || !nav) return;
    toggle.addEventListener("click", () => {
      const isOpen = nav.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
    });
  }

  function closeMobileNav(){
    const nav = document.getElementById("mainNav");
    const toggle = document.getElementById("navToggle");
    if (nav && nav.classList.contains("is-open")){
      nav.classList.remove("is-open");
      if (toggle) toggle.setAttribute("aria-expanded", "false");
    }
  }

  /* ---------------- boot ---------------- */
  function init(){
    initNav();
    initDemoBanner();
    initMobileNav();

    ShieldXScanner.init();
    ShieldXHistory.initHistoryView();
    ShieldXAwareness.init();

    navigate("home");
  }

  document.addEventListener("DOMContentLoaded", init);

  return { navigate, playLoadingSequence };

})();