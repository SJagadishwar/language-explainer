const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = 3000;

// ⚠️ Move API key to env later (OK for now)
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;


app.use(cors());
app.use(express.json());

// ✅ THIS WAS MISSING (CRITICAL)
app.use(express.static(__dirname));

// ---------- CACHE ----------
const CACHE_FILE = path.join(__dirname, "cache.json");

function readCache() {
  if (!fs.existsSync(CACHE_FILE)) {
    fs.writeFileSync(CACHE_FILE, "{}");
  }
  return JSON.parse(fs.readFileSync(CACHE_FILE, "utf8"));
}

function writeCache(cache) {
  fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2));
}

// ---------- AI ----------
async function convertWithAI(text, language) {
  let systemPrompt;

  if (language === "hinglish") {
    systemPrompt = `You are a calm, senior Indian explainer with 80+ years of experience in reading newspapers, business news, and current affairs and analyzing them and and you are expert in news analysis and explanation. You are specialist in explaining the any news and articles in Hinglish language.

Your job is to help a normal reader understand the article quickly and clearly, without confusion and without over-explaining.

Explain the article in SIMPLE, NATURAL HINGLISH.

Rules (follow strictly):
- Use very simple Hinglish, like how educated Indians speak casually
- Keep important terms in English (interest rates, inflation, economy, loan, EMI, etc.)
- Avoid heavy Hindi words or shuddh Hindi
- Short, clear sentences
- Use commas naturally so it feels easy to read
- No filler phrases
- No teaching or lecture tone
- Do not translate sentence-by-sentence
- Prefer clarity over completeness (KISS principle)

First:
Explain the core idea in 2–4 clear sentences.
Focus on what is happening and why it matters.

Then:
ONLY if an analogy adds clarity, add real world analogy explanation in simple, natural Hinglish slang.
If not, skip the analogy.

`;

  } else if (language === "telgish") {
    systemPrompt = `You are a calm, senior Telugu Indian explainer, has 80+ years of experience in reading newspapers, business news, current affairs, analyzing them and you are expert in news analysis and explanation. You are specialist in explaining any news and articles in Telgish language.

Your job is to help a normal reader understand the article quickly and clearly, without confusion and without over-explaining.

Explain the article in very SIMPLE, NATURAL TELGISH tone like whatsapp Telgish language, only use daily telgish words used by telugu people in states like Telangana and AndhraPradesh.

Rules (follow strictly):
- Use very simple Telgish, like how educated Indians speak casually
- Keep important terms in English (interest rates, inflation, economy, loan, EMI, etc.)
- Avoid heavy Telugu words
- Short, clear sentences
- Use commas naturally so it feels easy to read
- No filler phrases
- No teaching or lecture tone
- Do not translate sentence-by-sentence
- Prefer clarity over completeness (KISS principle)
- Do not add headings just explain the article

First:
Explain the core idea in clear sentences.
Focus on what is happening and why it matters.

Then:
ONLY if an analogy adds clarity, 
add real world analogy explanation in simple, natural telgish slang like whatsapp Telgish language, only use daily telgish words used by telugu people in states like Telangana and AndhraPradesh.
If not, skip the analogy.`;

  } else {
    throw new Error("Unsupported language");
  }

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-5-mini",
      input: [
        { role: "system", content: systemPrompt },
        { role: "user", content: text },
      ],
    }),
  });

  const data = await response.json();

  let outputText = "";

  if (Array.isArray(data.output)) {
    for (const block of data.output) {
      if (block.type === "message" && Array.isArray(block.content)) {
        for (const part of block.content) {
          if (part.text) outputText += part.text;
        }
      }
    }
  }

  if (!outputText.trim()) {
    console.error("Empty AI response:", data);
    throw new Error("Empty AI response");
  }

  return outputText;
}

// ---------- API ----------
app.post("/convert", async (req, res) => {
  try {
    let { articleUrl, text, language } = req.body;
    language = language.toLowerCase();

    const cacheKey = `${articleUrl}::${language}`;
    const cache = readCache();

    if (cache[cacheKey]) {
      console.log("🟢 Cache hit:", cacheKey);
      return res.json({ result: cache[cacheKey], cached: true });
    }

    console.log("🔵 Cache miss:", cacheKey);

    const result = await convertWithAI(text, language);
    cache[cacheKey] = result;
    writeCache(cache);

    res.json({ result, cached: false });
  } catch (err) {
    console.error("❌ Conversion error:", err.message);
    res.status(500).json({ error: "Conversion failed" });
  }
});

// ---------- ARTICLES ----------
const ARTICLES_FILE = path.join(__dirname, "articles.json");

function readArticles() {
  return JSON.parse(fs.readFileSync(ARTICLES_FILE, "utf8"));
}

app.get("/article/:id", (req, res) => {
  const articles = readArticles();
  const article = articles[req.params.id];

  if (!article) {
    return res.status(404).json({ error: "Article not found" });
  }

  res.json(article);
});


// ---------- ANALYTICS ----------
const ANALYTICS_FILE = path.join(__dirname, "analytics.json");

function readAnalytics() {
  if (!fs.existsSync(ANALYTICS_FILE)) {
    fs.writeFileSync(ANALYTICS_FILE, "[]");
  }
  return JSON.parse(fs.readFileSync(ANALYTICS_FILE, "utf8"));
}

function writeAnalytics(events) {
  fs.writeFileSync(ANALYTICS_FILE, JSON.stringify(events, null, 2));
}

app.post("/analytics/event", (req, res) => {
  try {
    const { articleId, event, language, sessionId, timeOnPage } = req.body;

    if (!articleId || !event || !sessionId) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const analytics = readAnalytics();

    analytics.push({
      articleId,
      event,
      language: language || null,
      sessionId,
      timeOnPage: timeOnPage || null,
      timestamp: new Date().toISOString()
    });

    writeAnalytics(analytics);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Analytics failed" });
  }
});

// ---------- ANALYTICS SUMMARY (READ-ONLY) ----------
// ---------- ANALYTICS SUMMARY (FIXED METRICS) ----------
app.get("/analytics/summary", (req, res) => {
  try {
    const ANALYTICS_FILE = path.join(__dirname, "analytics.json");

    if (!fs.existsSync(ANALYTICS_FILE)) {
      return res.json({
        totalSessions: 0,
        adoptionRate: 0,
        engagementIntensity: 0,
        languages: { hinglish: 0, telgish: 0 },
        avgTimeBefore: 0,
        avgTimeAfter: 0,
        avgExtraTime: 0,
        returnedToOriginal: 0
      });
    }

    const events = JSON.parse(fs.readFileSync(ANALYTICS_FILE, "utf8"));

    const visibleSessions = new Set();
    const clickedSessions = new Set();

    let totalClicks = 0;
    let hinglish = 0;
    let telgish = 0;
    let returned = 0;

    let beforeTimes = [];
    let afterTimes = [];

    events.forEach(e => {
      if (e.event === "explainer_visible") {
        visibleSessions.add(e.sessionId);
        if (typeof e.timeOnPage === "number") {
          beforeTimes.push(e.timeOnPage);
        }
      }

      if (e.event === "explainer_clicked") {
        clickedSessions.add(e.sessionId);
        totalClicks++;

        if (e.language === "hinglish") hinglish++;
        if (e.language === "telgish") telgish++;

        if (typeof e.timeOnPage === "number") {
          afterTimes.push(e.timeOnPage);
        }
      }

      if (e.event === "returned_to_original") {
        returned++;
      }
    });

    const avg = arr =>
      arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : 0;

    const totalSessions = visibleSessions.size;
    const adoptionRate =
      totalSessions === 0
        ? 0
        : Math.round((clickedSessions.size / totalSessions) * 100);

    const engagementIntensity =
      clickedSessions.size === 0
        ? 0
        : Math.round((totalClicks / clickedSessions.size) * 10) / 10;

    res.json({
      totalSessions,
      adoptionRate,               // ✅ publisher metric (≤ 100%)
      engagementIntensity,        // ✅ depth metric
      languages: {
        hinglish,
        telgish
      },
      avgTimeBefore: avg(beforeTimes),
      avgTimeAfter: avg(afterTimes),
      avgExtraTime: avg(afterTimes) - avg(beforeTimes),
      returnedToOriginal: returned
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Summary failed" });
  }
});




app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
