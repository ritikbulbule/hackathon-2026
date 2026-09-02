/* ============================================================
   ShieldX — api.js
   ------------------------------------------------------------
   Single point of contact with the backend. Every other module
   calls the functions in ShieldXAPI instead of touching
   fetch() directly, so swapping mock logic for the real Flask/
   FastAPI service later only means editing this file.

   Expected real endpoints:
     POST /api/analyze-url          { url }
     POST /api/analyze-message      { message }
     POST /api/analyze-screenshot   { file }  (multipart/form-data)

   Expected response shape (all three endpoints):
     {
       riskLevel: "safe" | "suspicious" | "high",
       score: 0-100,                 // phishing probability
       indicators: [ { id, label, triggered, detail } ],
       reasons: [ "string", ... ],
       breakdown: [ { label, value } ],
       recommendation: "string"
     }
   ============================================================ */

const ShieldXAPI = (() => {

  const USE_MOCK = true;               // flip to false once a backend is running
  const BASE_URL  = "http://localhost:5000/api";
  const MOCK_DELAY_MS = 1100;

  function delay(ms){
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /* ---------------------------------------------------------
     Real network calls (used once USE_MOCK is false)
  --------------------------------------------------------- */

  async function postJSON(path, body){
    const res = await fetch(`${BASE_URL}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    if (!res.ok) throw new Error(`Request to ${path} failed with status ${res.status}`);
    return res.json();
  }

  async function postFile(path, file){
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch(`${BASE_URL}${path}`, { method: "POST", body: formData });
    if (!res.ok) throw new Error(`Request to ${path} failed with status ${res.status}`);
    return res.json();
  }

  /* ---------------------------------------------------------
     Mock analysis logic
     Simple, transparent heuristics standing in for the real
     ML model. Good enough to make the frontend feel alive and
     to demo the full result UI end to end.
  --------------------------------------------------------- */

  function clampScore(n){ return Math.max(0, Math.min(100, Math.round(n))); }

  function levelFromScore(score){
    if (score >= 67) return "high";
    if (score >= 34) return "suspicious";
    return "safe";
  }

  function mockAnalyzeUrl(url){
    let score = 6;
    const indicators = [];
    const reasons = [];

    let hostname = "";
    let parsed = null;
    try{
      parsed = new URL(url);
      hostname = parsed.hostname;
    }catch(e){
      hostname = url;
    }

    const test = (id, label, condition, weight, reason) => {
      const triggered = !!condition;
      if (triggered){ score += weight; if (reason) reasons.push(reason); }
      indicators.push({ id, label, triggered });
    };

    const hasHttps = parsed ? parsed.protocol === "https:" : false;
    indicators.push({ id: "protocol", label: "Missing HTTPS encryption", triggered: !hasHttps });
    if (!hasHttps){ score += 14; reasons.push("The link does not use HTTPS, so any data submitted could be sent unencrypted."); }

    test("ip-host", "Uses a raw IP address instead of a domain", /^(\d{1,3}\.){3}\d{1,3}$/.test(hostname), 22,
      "The address uses a raw IP instead of a normal domain name, a common way to hide the real destination.");

    test("at-symbol", "Contains an \"@\" symbol in the address", url.includes("@"), 20,
      "An \"@\" symbol in the URL can hide the real destination after it.");

    test("many-hyphens", "Unusually many hyphens in the domain", (hostname.match(/-/g) || []).length >= 3, 12,
      "The domain has an unusually high number of hyphens, often used to mimic a real brand name.");

    test("long-url", "Unusually long web address", url.length > 75, 8,
      "The link is much longer than a typical web address, which can be used to bury a fake domain.");

    const sensitiveWords = ["login", "verify", "secure", "account", "update", "confirm", "bank", "signin", "password", "billing"];
    const matchedWord = sensitiveWords.find(w => url.toLowerCase().includes(w));
    test("keyword", "Uses urgency/security keywords in the URL", !!matchedWord, 14,
      matchedWord ? `The URL contains "${matchedWord}", a word often used to imitate account or security pages.` : null);

    const suspiciousTlds = [".xyz", ".top", ".club", ".gq", ".tk", ".ml", ".work", ".zip", ".loan"];
    const matchedTld = suspiciousTlds.find(t => hostname.toLowerCase().endsWith(t));
    test("tld", "Uses an uncommon or high-risk domain ending", !!matchedTld, 16,
      matchedTld ? `The domain ends in "${matchedTld}", an ending frequently abused for throwaway phishing sites.` : null);

    const knownBrands = ["paypal", "google", "microsoft", "apple", "amazon", "netflix", "instagram", "facebook", "bank"];
    const mentionsBrand = knownBrands.find(b => hostname.toLowerCase().includes(b));
    const looksOfficial = mentionsBrand && !hostname.toLowerCase().endsWith(`${mentionsBrand}.com`);
    test("lookalike", "Brand name combined with an unofficial domain", !!looksOfficial, 24,
      looksOfficial ? `The domain references "${mentionsBrand}" but is not that company's official domain.` : null);

    test("subdomain-depth", "Deeply nested subdomain structure", hostname.split(".").length > 4, 10,
      "The address has an unusually deep subdomain structure, sometimes used to disguise the true domain.");

    score = clampScore(score);
    const riskLevel = levelFromScore(score);

    if (reasons.length === 0){
      reasons.push("No major red flags were found in the address structure.");
      reasons.push("The domain pattern is consistent with typical, legitimate websites.");
    }

    const breakdown = [
      { label: "Full URL", value: url },
      { label: "Domain", value: hostname || "—" },
      { label: "Protocol", value: hasHttps ? "HTTPS (encrypted)" : "HTTP (not encrypted)" },
      { label: "Domain length", value: `${hostname.length} characters` },
      { label: "Path depth", value: parsed ? `${parsed.pathname.split("/").filter(Boolean).length} segment(s)` : "—" }
    ];

    return {
      riskLevel,
      score,
      indicators,
      reasons,
      breakdown,
      recommendation: recommendationFor(riskLevel, "url")
    };
  }

  function mockAnalyzeMessage(message){
    let score = 8;
    const indicators = [];
    const reasons = [];
    const lower = message.toLowerCase();

    const test = (id, label, condition, weight, reason) => {
      const triggered = !!condition;
      if (triggered){ score += weight; if (reason) reasons.push(reason); }
      indicators.push({ id, label, triggered });
    };

    const urgencyWords = ["urgent", "immediately", "act now", "24 hours", "suspend", "expire", "limited time", "final notice"];
    const matchedUrgency = urgencyWords.find(w => lower.includes(w));
    test("urgency", "Creates a false sense of urgency", !!matchedUrgency, 20,
      matchedUrgency ? `The message uses urgency language ("${matchedUrgency}") to pressure a fast reaction.` : null);

    const credWords = ["password", "otp", "one-time code", "pin", "cvv", "card number", "ssn", "social security", "login details"];
    const matchedCred = credWords.find(w => lower.includes(w));
    test("credentials", "Requests sensitive personal or account information", !!matchedCred, 26,
      matchedCred ? `The message asks for sensitive information ("${matchedCred}"), which legitimate organizations rarely request this way.` : null);

    const moneyWords = ["gift card", "wire transfer", "bitcoin", "crypto", "payment", "processing fee", "claim your prize", "lottery", "inheritance"];
    const matchedMoney = moneyWords.find(w => lower.includes(w));
    test("money", "Asks for money, gift cards, or payment details", !!matchedMoney, 22,
      matchedMoney ? `The message references "${matchedMoney}", a common thread in financial scams.` : null);

    const linkMatch = message.match(/https?:\/\/[^\s]+/i);
    test("link", "Contains an embedded link", !!linkMatch, 10,
      linkMatch ? "The message includes a link, which is worth checking on its own before clicking." : null);

    test("greeting", "Uses a generic greeting instead of your name", /\b(dear (user|customer|member|sir|madam)|valued customer|dear account holder)\b/i.test(message), 12,
      "The greeting is generic rather than personalized, typical of mass-sent phishing messages.");

    test("shouting", "Excessive capital letters or exclamation marks", (message.match(/[A-Z]{4,}/g) || []).length > 1 || (message.match(/!/g) || []).length >= 3, 10,
      "The message relies on capital letters or repeated exclamation marks to grab attention.");

    test("mismatched-domain", "Sender or link domain looks unofficial", /@[a-z0-9.-]+\.(xyz|top|club|support|info)\b/i.test(message) || (linkMatch && /(xyz|top|club|tk|gq)/i.test(linkMatch[0])), 18,
      "The sender address or linked domain uses an ending rarely used by legitimate organizations.");

    score = clampScore(score);
    const riskLevel = levelFromScore(score);

    if (reasons.length === 0){
      reasons.push("The message doesn't contain the urgency, payment, or credential-harvesting language typical of phishing.");
      reasons.push("No suspicious links or generic mass-messaging patterns were detected.");
    }

    const wordCount = message.trim().split(/\s+/).filter(Boolean).length;
    const breakdown = [
      { label: "Message length", value: `${wordCount} words` },
      { label: "Links found", value: linkMatch ? "1 or more" : "None" },
      { label: "Urgency language", value: matchedUrgency ? "Detected" : "Not detected" },
      { label: "Requests for sensitive info", value: matchedCred ? "Detected" : "Not detected" }
    ];

    return {
      riskLevel,
      score,
      indicators,
      reasons,
      breakdown,
      recommendation: recommendationFor(riskLevel, "message")
    };
  }

  function mockAnalyzeScreenshot(file){
    // Placeholder until OCR + backend analysis is wired in.
    // Returns a fixed, clearly-labeled demo result so the result UI
    // can be exercised end to end for this content type.
    const indicators = [
      { id: "ocr", label: "Text extraction (OCR)", triggered: false },
      { id: "link-in-image", label: "Link detected in image", triggered: false },
      { id: "brand-logo", label: "Known brand logo match", triggered: false }
    ];

    const breakdown = [
      { label: "File name", value: file ? file.name : "—" },
      { label: "File size", value: file ? `${Math.round(file.size / 1024)} KB` : "—" },
      { label: "OCR status", value: "Not yet implemented in this build" }
    ];

    return {
      riskLevel: "suspicious",
      score: 50,
      indicators,
      reasons: [
        "Screenshot text extraction (OCR) and image analysis are not implemented yet in this frontend-only build.",
        "This is a placeholder result so the result screen can be reviewed before the backend is connected."
      ],
      breakdown,
      recommendation: "This is a demo result. Once OCR is connected, ShieldX will read the text in your screenshot and analyze it the same way as a pasted message.",
      isPlaceholder: true
    };
  }

  function recommendationFor(level, type){
    const subject = type === "url" ? "link" : type === "message" ? "message" : "screenshot";
    if (level === "safe"){
      return `No major phishing indicators were found in this ${subject}. Stay alert regardless — verify anything asking for logins or payment through an official app or website.`;
    }
    if (level === "suspicious"){
      return `This ${subject} shows some warning signs. Avoid entering any personal details or credentials, and confirm its legitimacy directly with the organization using a known, official contact method.`;
    }
    return `This ${subject} shows strong signs of phishing. Do not click any links, reply, or share personal or financial information. Report it and delete the message.`;
  }

  /* ---------------------------------------------------------
     Public methods — same shape whether mocked or real
  --------------------------------------------------------- */

  async function analyzeUrl(url){
    if (USE_MOCK){
      await delay(MOCK_DELAY_MS);
      return mockAnalyzeUrl(url);
    }
    return postJSON("/analyze-url", { url });
  }

  async function analyzeMessage(message){
    if (USE_MOCK){
      await delay(MOCK_DELAY_MS);
      return mockAnalyzeMessage(message);
    }
    return postJSON("/analyze-message", { message });
  }

  async function analyzeScreenshot(file){
    if (USE_MOCK){
      await delay(MOCK_DELAY_MS);
      return mockAnalyzeScreenshot(file);
    }
    return postFile("/analyze-screenshot", file);
  }

  return { analyzeUrl, analyzeMessage, analyzeScreenshot };

})();