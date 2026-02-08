(function () {

  // ---------- ANALYTICS ----------
const ARTICLE_ID = document.body.dataset.articleId || "unknown";

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

  fetch("/analytics/event", {
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


  if (window.__LANG_EXPLAINER_LOADED__) return;
  window.__LANG_EXPLAINER_LOADED__ = true;

  const article = document.getElementById("article");
  const buttonContainer = document.getElementById("languageButtonContainer");
  const status = document.getElementById("languageStatus");

  if (!article || !buttonContainer || !status) return;

  const originalHTML = article.innerHTML;
  const sourceText = article.innerText;

  let loading = false;
  let currentLanguage = "english";
  const cache = {};

  function createButton(text) {
    const btn = document.createElement("button");
    btn.textContent = text;
    btn.className = "lang-btn";
    return btn;
  }

  const hinglishBtn = createButton("Understand in Hinglish");
  const telgishBtn = createButton("Understand in Telgish");
  const englishBtn = createButton("Read in English");

  // Default active
  hinglishBtn.classList.add("primary");
  englishBtn.style.display = "none";

  buttonContainer.appendChild(hinglishBtn);
  buttonContainer.appendChild(telgishBtn);
  buttonContainer.appendChild(englishBtn);
  trackEvent("explainer_visible");


  function resetButtons() {
    hinglishBtn.classList.remove("primary");
    telgishBtn.classList.remove("primary");
    englishBtn.classList.remove("primary");
  }

  function setActive(btn) {
    resetButtons();
    btn.classList.add("primary");
  }

  async function convert(language) {
    if (cache[language]) return cache[language];

    const res = await fetch("/convert", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: sourceText,
        language,
        articleUrl: window.location.pathname
      }),
    });

    const data = await res.json();
    cache[language] = data.result;
    return data.result;
  }

  async function handleLanguage(language, btn) {
    if (loading || currentLanguage === language) return;

    loading = true;
    status.textContent = "Explaining in simple language…";
    article.innerHTML = "";
    setActive(btn);

    try {
      const result = await convert(language);

      article.innerHTML =
        "<p>" + result.replace(/\n\n/g, "</p><p>") + "</p>";

      // ✅ ADD THIS LINE (THIS FIXES EVERYTHING)
      status.textContent = "";

      currentLanguage = language;
      englishBtn.style.display = "inline-block";

    } catch {
      article.innerHTML = originalHTML;
      status.textContent = "";
      setActive(hinglishBtn);
    } finally {
      loading = false;
    }
  }

  hinglishBtn.onclick = () => {
    trackEvent("explainer_clicked", "hinglish");
    handleLanguage("hinglish", hinglishBtn);
  };

  telgishBtn.onclick = () => {
    trackEvent("explainer_clicked", "telgish");
    handleLanguage("telgish", telgishBtn);
  };


  englishBtn.onclick = () => {
  trackEvent("returned_to_original");

  article.innerHTML = originalHTML;
    status.textContent = "";
    currentLanguage = "english";
    englishBtn.style.display = "none";
    setActive(hinglishBtn);
  };

})();
