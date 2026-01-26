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
      body: JSON.stringify({ text: sourceText, language }),
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

  hinglishBtn.onclick = () => handleLanguage("hinglish", hinglishBtn);
  telgishBtn.onclick = () => handleLanguage("telgish", telgishBtn);

  englishBtn.onclick = () => {
    article.innerHTML = originalHTML;
    status.textContent = "";
    currentLanguage = "english";
    englishBtn.style.display = "none";
    setActive(hinglishBtn);
  };
})();
