/* ============================================================
   ShieldX — scanner.js
   Handles the Home/Scanner view: tab switching, input
   validation, and kicking off analysis via ShieldXAPI.
   ============================================================ */

const ShieldXScanner = (() => {

  let selectedFile = null;

  function init(){
    initTabs();
    initUrlScan();
    initMessageScan();
    initScreenshotScan();
  }

  function showError(msg){
    const el = document.getElementById("scannerError");
    el.textContent = msg;
    el.hidden = false;
  }
  function clearError(){
    const el = document.getElementById("scannerError");
    el.hidden = true;
    el.textContent = "";
  }

  /* ---------------- tabs ---------------- */
  function initTabs(){
    const tabs = document.querySelectorAll(".scanner-tabs__btn");
    tabs.forEach(tab => {
      tab.addEventListener("click", () => {
        tabs.forEach(t => { t.classList.remove("is-active"); t.setAttribute("aria-selected", "false"); });
        tab.classList.add("is-active");
        tab.setAttribute("aria-selected", "true");

        document.querySelectorAll(".scanner-panel").forEach(panel => {
          const match = panel.dataset.panel === tab.dataset.tab;
          panel.hidden = !match;
          panel.classList.toggle("is-active", match);
        });
        clearError();
      });
    });
  }

  /* ---------------- URL scan ---------------- */
  function isLikelyUrl(value){
    if (!value.trim()) return false;
    try{
      const candidate = value.match(/^https?:\/\//i) ? value : `http://${value}`;
      const u = new URL(candidate);
      return u.hostname.includes(".");
    }catch(e){
      return false;
    }
  }

  function initUrlScan(){
    const input = document.getElementById("urlInput");
    const btn = document.getElementById("scanUrlBtn");

    const run = () => {
      const raw = input.value.trim();
      clearError();
      if (!raw){
        showError("Enter a link to scan.");
        return;
      }
      if (!isLikelyUrl(raw)){
        showError("That doesn't look like a valid web address. Include the domain, e.g. example.com or https://example.com");
        return;
      }
      const normalized = raw.match(/^https?:\/\//i) ? raw : `http://${raw}`;
      runScan("url", normalized, () => ShieldXAPI.analyzeUrl(normalized));
    };

    btn.addEventListener("click", run);
    input.addEventListener("keydown", e => { if (e.key === "Enter") run(); });
  }

  /* ---------------- Message scan ---------------- */
  function initMessageScan(){
    const textarea = document.getElementById("messageInput");
    const btn = document.getElementById("scanMessageBtn");

    btn.addEventListener("click", () => {
      const value = textarea.value.trim();
      clearError();
      if (!value){
        showError("Paste a message, email, or SMS text to scan.");
        return;
      }
      if (value.length < 8){
        showError("That message looks too short to analyze meaningfully. Paste the full text.");
        return;
      }
      const preview = value.length > 60 ? value.slice(0, 60) + "…" : value;
      runScan("message", preview, () => ShieldXAPI.analyzeMessage(value));
    });
  }

  /* ---------------- Screenshot scan ---------------- */
  function initScreenshotScan(){
    const dropzone = document.getElementById("dropzone");
    const input = document.getElementById("screenshotInput");
    const preview = document.getElementById("dropzonePreview");
    const content = document.getElementById("dropzoneContent");
    const btn = document.getElementById("scanScreenshotBtn");

    const handleFile = (file) => {
      if (!file) return;
      if (!file.type.startsWith("image/")){
        showError("Please upload an image file (PNG, JPG, or WEBP).");
        return;
      }
      clearError();
      selectedFile = file;
      const reader = new FileReader();
      reader.onload = e => {
        preview.src = e.target.result;
        preview.hidden = false;
        content.hidden = true;
      };
      reader.readAsDataURL(file);
      btn.disabled = false;
    };

    dropzone.addEventListener("click", () => input.click());
    dropzone.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") input.click(); });
    input.addEventListener("change", e => handleFile(e.target.files[0]));

    ["dragenter", "dragover"].forEach(evt => {
      dropzone.addEventListener(evt, e => { e.preventDefault(); dropzone.classList.add("is-dragover"); });
    });
    ["dragleave", "drop"].forEach(evt => {
      dropzone.addEventListener(evt, e => { e.preventDefault(); dropzone.classList.remove("is-dragover"); });
    });
    dropzone.addEventListener("drop", e => {
      const file = e.dataTransfer.files[0];
      handleFile(file);
    });

    btn.addEventListener("click", () => {
      if (!selectedFile){
        showError("Upload a screenshot first.");
        return;
      }
      runScan("screenshot", selectedFile.name, () => ShieldXAPI.analyzeScreenshot(selectedFile));
    });
  }

  /* ---------------- shared scan runner ---------------- */
  function runScan(type, target, apiCall){
    ShieldXApp.navigate("loading");
    ShieldXApp.playLoadingSequence();

    apiCall()
      .then(result => {
        ShieldXResult.render(type, target, result);
        ShieldXHistory.addEntry({
          type,
          target,
          score: result.score,
          riskLevel: result.riskLevel,
          timestamp: Date.now()
        });
        ShieldXApp.navigate("result");
      })
      .catch(err => {
        console.error("Scan failed:", err);
        ShieldXApp.navigate("home");
        showError("Something went wrong running that scan. Please try again.");
      });
  }

  function resetScreenshotField(){
    selectedFile = null;
    const btn = document.getElementById("scanScreenshotBtn");
    const preview = document.getElementById("dropzonePreview");
    const content = document.getElementById("dropzoneContent");
    if (btn) btn.disabled = true;
    if (preview){ preview.hidden = true; preview.src = ""; }
    if (content) content.hidden = false;
  }

  return { init, resetScreenshotField };

})();