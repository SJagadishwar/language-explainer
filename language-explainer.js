(function () {
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

  function createButton(text, className) {
    const btn = document.createElement("button");
    btn.textContent = text;
    btn.className = className;
    return btn;
  }

  const hinglishBtn = createButton("Understand in Hinglish", "lang-btn primary");
  const telgishBtn = createButton("Understand in Telgish", "lang-btn");
  const englishBtn = createButton("Read in English", "lang-btn");

  englishBtn.style.display = "none";

  buttonContainer.appendChild(hinglishBtn);
  buttonContainer.appendChild(telgishBtn);
  buttonContainer.appendChild(englishBtn);

  async function convert(language) {
    if (cache[language]) return cache[language];

    const res = await fetch("/convert", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        articleUrl: "/index.html",
        text: sourceText,
        language,
      }),
    });

    const data = await res.json();
    cache[language] = data.result;
    return data.result;
  }

  async function handleClick(language) {
    if (loading || currentLanguage === language) return;

    loading = true;
    status.textContent = "Explaining in simple language…";
    article.innerHTML = "";

    try {
      const result = await convert(language);
      article.innerHTML =
        "<p>" + result.replace(/\n\n/g, "</p><p>") + "</p>";
      currentLanguage = language;
      englishBtn.style.display = "inline-block";
    } catch (e) {
      article.innerHTML = originalHTML;
      status.textContent = "";
    } finally {
      loading = false;
    }
  }

  hinglishBtn.onclick = () => handleClick("hinglish");
  telgishBtn.onclick = () => handleClick("telgish");

  englishBtn.onclick = () => {
    article.innerHTML = originalHTML;
    status.textContent = "";
    currentLanguage = "english";
    englishBtn.style.display = "none";
  };
})();
