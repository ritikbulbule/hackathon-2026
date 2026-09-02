/* ============================================================
   ShieldX — result.js
   Renders an analysis response (from api.js) into the shared
   result view, used by URL, message and screenshot scans alike.
   ============================================================ */
const ShieldXResult = (() => {
  const LEVEL_META = {
    safe:        { label: "SAFE",        badgeClass: "risk-badge--safe",       recClass: "level-safe",       ring: "#1E7A46" },
    suspicious:  { label: "SUSPICIOUS",  badgeClass: "risk-badge--suspicious", recClass: "level-suspicious", ring: "#9C6304" },
    high:        { label: "HIGH RISK",   badgeClass: "risk-badge--high",       recClass: "level-high",       ring: "#A3312F" }
  };
  const TYPE_LABEL = {
    url: "Link scan",
    message: "Message / email scan",
    screenshot: "Screenshot scan"
  };
  function render(type, target, result){
    const meta = LEVEL_META[result.riskLevel] || LEVEL_META.safe;
    // header
    const badge = document.getElementById("riskBadge");
    badge.className = "risk-badge " + meta.badgeClass;
    document.getElementById("riskLevelLabel").textContent = meta.label;
    document.getElementById("resultTypeLabel").textContent = TYPE_LABEL[type] || "Scan";
    document.getElementById("resultTarget").textContent = target;
    document.getElementById("resultTime").textContent = "Scanned just now";
    // score ring
    const ring = document.getElementById("riskScoreRing");
    ring.style.setProperty("--pct", result.score);
    ring.style.setProperty("--ring-color", meta.ring);
    document.getElementById("riskScoreValue").textContent = `${result.score}%`;
    // indicators
    const indicatorList = document.getElementById("indicatorList");
    indicatorList.innerHTML = "";
    (result.indicators || []).forEach(ind => {
      const li = document.createElement("li");
      li.className = ind.triggered ? "is-triggered" : "is-clear";
      li.innerHTML = `<span class="indicator-list__icon">${ind.triggered ? "!" : "OK"}</span><span>${escapeHtml(ind.label)}</span>`;
      indicatorList.appendChild(li);
    });
    // why flagged
    document.getElementById("whyFlaggedIntro").textContent = result.isPlaceholder
      ? "This scan type is still in development."
      : `Based on ${result.indicators ? result.indicators.filter(i => i.triggered).length : 0} signal(s) found during analysis.`;
    const reasonList = document.getElementById("reasonList");
    reasonList.innerHTML = "";
    (result.reasons || []).forEach(reason => {
      const li = document.createElement("li");
      li.textContent = reason;
      reasonList.appendChild(li);
    });
    // breakdown
    const breakdownTable = document.getElementById("breakdownTable");
    breakdownTable.innerHTML = "";
    (result.breakdown || []).forEach(row => {
      const div = document.createElement("div");
      div.className = "breakdown-row";
      div.innerHTML = `<span class="breakdown-row__label">${escapeHtml(row.label)}</span><span class="breakdown-row__value">${escapeHtml(String(row.value))}</span>`;
      breakdownTable.appendChild(div);
    });
    // recommendation
    const recBox = document.getElementById("recommendationBox");
    recBox.className = "recommendation " + meta.recClass;
    document.getElementById("recommendationText").textContent = result.recommendation || "";
  }
  function escapeHtml(str){
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }
  return { render };
})();