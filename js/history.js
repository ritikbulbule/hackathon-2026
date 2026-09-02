/* ============================================================
   ShieldX — history.js
   Scan history persistence (localStorage) + rendering for both
   the History view and the Dashboard view.
   ============================================================ */

const ShieldXHistory = (() => {

  const STORAGE_KEY = "shieldx_history";
  const MAX_ENTRIES = 200;
  let activeFilter = "all";

  /* ---------------- storage ---------------- */
  function getAll(){
    try{
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : seedSampleData();
    }catch(e){
      console.warn("Could not read history from localStorage", e);
      return [];
    }
  }

  function saveAll(entries){
    try{
      localStorage.setItem(STORAGE_KEY, JSON.stringify(entries.slice(0, MAX_ENTRIES)));
    }catch(e){
      console.warn("Could not save history to localStorage", e);
    }
  }

  function addEntry(entry){
    const entries = getAll();
    entries.unshift({ id: `scan_${Date.now()}`, ...entry });
    saveAll(entries);
  }

  function clearAll(){
    localStorage.removeItem(STORAGE_KEY);
  }

  // First-run sample data so History/Dashboard aren't empty on first look.
  // Clearly mock — replaced the moment a real scan is run or history is cleared.
  function seedSampleData(){
    const now = Date.now();
    const sample = [
      { id: "seed_1", type: "url", target: "http://verify-account-paypal-secure.com", score: 88, riskLevel: "high", timestamp: now - 1000 * 60 * 40 },
      { id: "seed_2", type: "message", target: "Congratulations! You've won a $500 gift card, claim now...", score: 74, riskLevel: "high", timestamp: now - 1000 * 60 * 60 * 5 },
      { id: "seed_3", type: "url", target: "https://github.com/anthropic", score: 4, riskLevel: "safe", timestamp: now - 1000 * 60 * 60 * 22 },
      { id: "seed_4", type: "message", target: "Hi, just checking if we're still on for lunch tomorrow?", score: 3, riskLevel: "safe", timestamp: now - 1000 * 60 * 60 * 30 },
      { id: "seed_5", type: "url", target: "http://login-secure-update.info/account", score: 52, riskLevel: "suspicious", timestamp: now - 1000 * 60 * 60 * 50 }
    ];
    saveAll(sample);
    return sample;
  }

  /* ---------------- history view ---------------- */
  function initHistoryView(){
    document.querySelectorAll(".filter-chip").forEach(chip => {
      chip.addEventListener("click", () => {
        document.querySelectorAll(".filter-chip").forEach(c => c.classList.remove("is-active"));
        chip.classList.add("is-active");
        activeFilter = chip.dataset.filter;
        renderHistoryList();
      });
    });

    document.getElementById("clearHistoryBtn").addEventListener("click", () => {
      if (confirm("Clear all scan history on this device? This can't be undone.")){
        clearAll();
        renderHistoryList();
        renderDashboard();
      }
    });
  }

  function renderHistoryList(){
    const listEl = document.getElementById("historyList");
    const emptyEl = document.getElementById("historyEmpty");
    let entries = getAll();

    if (activeFilter !== "all"){
      entries = entries.filter(e => e.riskLevel === activeFilter);
    }

    listEl.innerHTML = "";

    if (entries.length === 0){
      emptyEl.hidden = false;
      return;
    }
    emptyEl.hidden = true;

    entries.forEach(entry => {
      const row = document.createElement("div");
      row.className = "history-row";
      row.innerHTML = `
        <span class="history-row__level history-row__level--${entry.riskLevel}"></span>
        <div class="history-row__main">
          <div class="history-row__target">${escapeHtml(entry.target)}</div>
          <div class="history-row__sub">${formatTime(entry.timestamp)}</div>
        </div>
        <span class="history-row__type">${typeLabel(entry.type)}</span>
        <span class="history-row__score">${entry.score}%</span>
      `;
      row.addEventListener("click", () => reopenEntry(entry));
      listEl.appendChild(row);
    });
  }

  function reopenEntry(entry){
    // Re-render a stored result view without calling the API again.
    // Historical entries only stored the summary, so we rebuild a
    // lightweight result payload for display purposes.
    const result = {
      riskLevel: entry.riskLevel,
      score: entry.score,
      indicators: [],
      reasons: ["This is a previously saved scan. Run a new scan for a full, up-to-date breakdown."],
      breakdown: [
        { label: "Scan type", value: typeLabel(entry.type) },
        { label: "Scanned", value: formatTime(entry.timestamp) }
      ],
      recommendation: entry.riskLevel === "safe"
        ? "No major phishing indicators were found in this scan."
        : entry.riskLevel === "suspicious"
          ? "This scan showed some warning signs. Avoid sharing personal details until you've verified it directly."
          : "This scan showed strong signs of phishing. Avoid interacting with it."
    };
    ShieldXResult.render(entry.type, entry.target, result);
    ShieldXApp.navigate("result");
  }

  function typeLabel(type){
    return type === "url" ? "Link" : type === "message" ? "Message" : "Screenshot";
  }

  function formatTime(ts){
    const diff = Date.now() - ts;
    const mins = Math.round(diff / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins} min ago`;
    const hrs = Math.round(mins / 60);
    if (hrs < 24) return `${hrs} hr${hrs > 1 ? "s" : ""} ago`;
    const days = Math.round(hrs / 24);
    return `${days} day${days > 1 ? "s" : ""} ago`;
  }

  function escapeHtml(str){
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  /* ---------------- dashboard view ---------------- */
  function renderDashboard(){
    const entries = getAll();
    const total = entries.length;
    const safe = entries.filter(e => e.riskLevel === "safe").length;
    const suspicious = entries.filter(e => e.riskLevel === "suspicious").length;
    const high = entries.filter(e => e.riskLevel === "high").length;

    document.getElementById("statTotal").textContent = total;
    document.getElementById("statSafe").textContent = safe;
    document.getElementById("statSuspicious").textContent = suspicious;
    document.getElementById("statHigh").textContent = high;

    const byType = {
      url: entries.filter(e => e.type === "url").length,
      message: entries.filter(e => e.type === "message").length,
      screenshot: entries.filter(e => e.type === "screenshot").length
    };
    const max = Math.max(1, byType.url, byType.message, byType.screenshot);

    const chart = document.getElementById("typeChart");
    chart.innerHTML = "";
    [["Links", byType.url], ["Messages", byType.message], ["Screenshots", byType.screenshot]].forEach(([label, count]) => {
      const row = document.createElement("div");
      row.className = "bar-chart__row";
      row.innerHTML = `
        <span class="bar-chart__label">${label}</span>
        <div class="bar-chart__track"><div class="bar-chart__fill" style="width:${(count / max) * 100}%"></div></div>
        <span class="bar-chart__count">${count}</span>
      `;
      chart.appendChild(row);
    });
  }

  return { getAll, addEntry, clearAll, initHistoryView, renderHistoryList, renderDashboard };

})();