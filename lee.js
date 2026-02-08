const API_BASE = "https://language-explainer.onrender.com";

(function () {
  // Prevent double loading
  if (window.__LEE_LOADED__) return;
  window.__LEE_LOADED__ = true;

  // -------- READ CONFIG FROM SCRIPT TAG --------
  const currentScript = document.currentScript;
  if (!currentScript) return;

  const ARTICLE_SELECTOR = currentScript.getAttribute("data-article-selector");
  const ARTICLE_ID = currentScript.getAttribute("data-article-id") || "unknown";

  if (!ARTICLE_SELECTOR) {
    console.warn("LEE: data-article-selector missing");
    return;
  }

  const articleEl = document.querySelector(ARTICLE_SELECTOR);
  if (!articleEl) {
    console.warn("LEE: Article element not found");
    return;
  }

  const originalHTML = articleEl.innerHTML;
  const sourceText = articleEl.innerText;

  // -------- SESSION (ANALYTICS SAFE) --------
  const SESSION_ID =
    sessionStorage.getItem("lee_session") ||
    (() => {
      const id = "sess_" + Math.random().toString(36).slice(2);
      sessionStorage.setItem("lee_session", id);
      return id;
    })();

  const pageLoadTime = Date.now();

  function trackEvent(event, language = null) {
    const timeOnPage = Math.floor((Date.now() - pageLoadTime) / 1000);

    fetch(`${API_BASE}/analytics/event`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        articleId: ARTICLE_ID,
        event,
        language,
        sessionId: SESSION_ID,
        timeOnPage
      })
    }).catch(() => {});
  }

  // -------- UI INJECTION --------
  const container = document.createElement("div");
  container.style.margin = "16px 0";

  const status = document.createElement("div");
  status.style.fontSize = "14px";
  status.style.fontStyle = "italic";
  status.style.margin = "8px 0";
  status.style.color = "#555";

  function createButton(text) {
    const btn = document.createElement("button");
    btn.textContent = text;
    btn.style.marginRight = "10px";
    btn.style.padding = "8px 14px";
    btn.style.borderRadius = "6px";
    btn.style.border = "1px solid #ccc";
    btn.style.cursor = "pointer";
    btn.style.fontWeight = "600";
    return btn;
  }

  const hinglishBtn = createButton("Understand in Hinglish");
  const telgishBtn = createButton("Understand in Telgish");
  const englishBtn = createButton("Read Original");

  englishBtn.style.display = "none";

  container.appendChild(hinglishBtn);
  container.appendChild(telgishBtn);
  container.appendChild(englishBtn);
  container.appendChild(status);

  articleEl.parentNode.insertBefore(container, articleEl);

  trackEvent("explainer_visible");

  // -------- AI CONVERSION --------
  let loading = false;
  let currentLanguage = "original";
  const localCache = {};

  async function convert(language) {
    if (localCache[language]) return localCache[language];

    const res = await fetch(`${API_BASE}/convert`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: sourceText,
        language,
        articleUrl: window.location.pathname
      })
    });

    const data = await res.json();
    localCache[language] = data.result;
    return data.result;
  }

  async function handleLanguage(language) {
    if (loading || currentLanguage === language) return;

    loading = true;
    status.textContent = "Explaining in simple language…";
    articleEl.innerHTML = "";

    try {
      const result = await convert(language);
      articleEl.innerHTML =
        "<p>" + result.replace(/\n\n/g, "</p><p>") + "</p>";

      englishBtn.style.display = "inline-block";
      currentLanguage = language;
    } catch {
      articleEl.innerHTML = originalHTML;
      status.textContent = "";
    } finally {
      loading = false;
    }
  }

  hinglishBtn.onclick = () => {
    trackEvent("explainer_clicked", "hinglish");
    handleLanguage("hinglish");
  };

  telgishBtn.onclick = () => {
    trackEvent("explainer_clicked", "telgish");
    handleLanguage("telgish");
  };

  englishBtn.onclick = () => {
    trackEvent("returned_to_original");
    articleEl.innerHTML = originalHTML;
    status.textContent = "";
    englishBtn.style.display = "none";
    currentLanguage = "original";
  };
})();
