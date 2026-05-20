import { createServer } from "node:http";
import { createReadStream, readFileSync, existsSync, statSync } from "node:fs";
import { extname, join, resolve } from "node:path";

loadEnv();
const port = Number(process.env.COUNCIL_API_PORT || 8787);

const server = createServer(async (req, res) => {
  setCors(res);

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.method === "GET" && req.url === "/health") {
    sendJson(res, 200, { ok: true });
    return;
  }

  if (req.method === "POST" && req.url === "/api/council") {
    try {
      const body = await readBody(req);
      const result = await generateCouncil(body);
      sendJson(res, 200, { result });
    } catch (error) {
      sendJson(res, 500, {
        error: error instanceof Error ? error.message : "Council API failed",
      });
    }
    return;
  }

  if (req.method === "GET" && serveWebBuild(req, res)) {
    return;
  }

  sendJson(res, 404, { error: "Not found" });
});

server.listen(port, () => {
  console.log(`Council API listening on http://localhost:${port}`);
  if (existsSync(join(process.cwd(), "dist", "index.html"))) {
    console.log(`Council web build available at http://localhost:${port}`);
  }
});

async function generateCouncil({ draft, language = "English", variant = "balanced" }) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Missing GEMINI_API_KEY. Add it to server/.env.local or environment variables.");
  }

  const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  const prompt = buildPrompt(draft, language, variant);

  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [
        {
          role: "user",
          parts: [{ text: prompt }],
        },
      ],
      generationConfig: {
        temperature: variant === "cautious" ? 0.35 : 0.55,
        responseMimeType: "application/json",
      },
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Gemini API error ${response.status}: ${text}`);
  }

  const payload = await response.json();
  const text = payload?.candidates?.[0]?.content?.parts?.map((part) => part.text).join("") || "";
  const parsed = parseJson(text);
  return normalizeCouncilResult(parsed, language);
}

function buildPrompt(draft, language, variant) {
  return `
You are Council, a structured decision-support engine. You are not a therapist, lawyer, doctor, financial advisor, or crisis service.

Rules:
- Do not imitate real people, public figures, philosophers, brands, voices, or living persons.
- Use original decision lenses only: Skeptic, Stoic, Strategist, Builder, Systems Thinker, Risk Analyst.
- Never make the final decision for the user.
- State uncertainty and practical next steps.
- Run a consumer-safe version of a council protocol:
  1) Restate the user's problem in one sentence.
  2) Offer one alternative framing.
  3) Preserve at least two real disagreements between lenses.
  4) Include unresolved questions instead of fake certainty.
  5) If the lenses converge too easily, add a minority report that stress-tests the consensus.
- If the user mentions self-harm, violence, medical, legal, or financial topics, include a safety warning and avoid professional advice.
- Reply in ${language}.
- Output JSON only. No markdown.

Variant: ${variant}

Decision draft:
${JSON.stringify(draft, null, 2)}

Return exactly this JSON shape:
{
  "problemRestatement": "string",
  "alternativeFraming": "string",
  "mostImportant": "string",
  "keyAgreements": ["string", "string", "string"],
  "disagreements": ["string", "string", "string"],
  "unresolvedQuestions": ["string", "string", "string"],
  "decisionOptions": [
    { "label": "string", "tradeoff": "string", "whenItWins": "string" }
  ],
  "biggestRisks": ["string", "string", "string"],
  "avoidance": "string",
  "missingInformation": ["string", "string", "string"],
  "sevenDayPlan": ["string", "string", "string", "string", "string"],
  "lensResults": [
    {
      "archetypeId": "skeptic|stoic|strategist|builder|systems|risk",
      "headline": "string",
      "restatement": "string",
      "stance": "string",
      "argument": "string",
      "watchOut": "string",
      "nextMove": "string"
    }
  ],
  "safety": {
    "category": "general|crisis|medical|legal|financial|violence|unsafe",
    "label": "string",
    "message": "string",
    "blocksDeepAnalysis": false
  },
  "minorityReport": "string",
  "confidenceNote": "string",
  "protocolNotes": ["string", "string", "string"],
  "generatedAt": "ISO string",
  "variant": "${variant}"
}`;
}

function normalizeCouncilResult(value, language) {
  const fallback = fallbackCopy(language);

  return {
    problemRestatement: asString(value.problemRestatement, fallback.notEnough),
    alternativeFraming: asString(value.alternativeFraming, fallback.notEnough),
    mostImportant: asString(value.mostImportant, fallback.notEnough),
    keyAgreements: asStringArray(value.keyAgreements, 3, fallback.notEnough),
    disagreements: asStringArray(value.disagreements, 3, fallback.notEnough),
    unresolvedQuestions: asStringArray(value.unresolvedQuestions, 3, fallback.notEnough),
    decisionOptions: normalizeOptions(value.decisionOptions, fallback),
    biggestRisks: asStringArray(value.biggestRisks, 3, fallback.notEnough),
    avoidance: asString(value.avoidance, fallback.notEnough),
    missingInformation: asStringArray(value.missingInformation, 3, fallback.notEnough),
    sevenDayPlan: asStringArray(value.sevenDayPlan, 5, fallback.notEnough),
    lensResults: Array.isArray(value.lensResults) ? value.lensResults.map((item) => normalizeLens(item, fallback)).filter(Boolean) : [],
    minorityReport: asString(value.minorityReport, fallback.notEnough),
    confidenceNote: asString(value.confidenceNote, fallback.notEnough),
    protocolNotes: asStringArray(value.protocolNotes, 3, fallback.notEnough),
    safety: {
      category: value.safety?.category || "general",
      label: asString(value.safety?.label || fallback.safetyLabel, fallback.safetyLabel),
      message: asString(
        value.safety?.message ||
          fallback.safetyMessage,
        fallback.safetyMessage
      ),
      blocksDeepAnalysis: Boolean(value.safety?.blocksDeepAnalysis),
    },
    generatedAt: new Date().toISOString(),
    variant: value.variant || "balanced",
  };
}

function normalizeLens(value, fallback = fallbackCopy("English")) {
  const allowed = ["skeptic", "stoic", "strategist", "builder", "systems", "risk"];
  if (!allowed.includes(value?.archetypeId)) return null;

  return {
    archetypeId: value.archetypeId,
    headline: asString(value.headline, fallback.notEnough),
    restatement: asString(value.restatement, fallback.notEnough),
    stance: asString(value.stance, fallback.notEnough),
    argument: asString(value.argument, fallback.notEnough),
    watchOut: asString(value.watchOut, fallback.notEnough),
    nextMove: asString(value.nextMove, fallback.notEnough),
  };
}

function normalizeOptions(value, fallback = fallbackCopy("English")) {
  const items = Array.isArray(value) ? value : [];
  const normalized = items
    .filter((item) => item && typeof item === "object")
    .map((item) => ({
      label: asString(item.label),
      tradeoff: asString(item.tradeoff),
      whenItWins: asString(item.whenItWins),
    }));

  while (normalized.length < 2) {
    normalized.push({
      label: fallback.optionLabel,
      tradeoff: fallback.optionTradeoff,
      whenItWins: fallback.optionWins,
    });
  }

  return normalized.slice(0, 4);
}

function parseJson(text) {
  try {
    return JSON.parse(text);
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("Model did not return JSON.");
    return JSON.parse(match[0]);
  }
}

function asString(value, fallback = "Not enough information.") {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function asStringArray(value, count, fallback = "Not enough information.") {
  const items = Array.isArray(value) ? value.filter((item) => typeof item === "string" && item.trim()) : [];
  while (items.length < count) items.push(fallback);
  return items.slice(0, Math.max(count, items.length));
}

function fallbackCopy(language) {
  const normalized = String(language || "").toLowerCase();
  if (normalized.includes("turkish")) {
    return {
      notEnough: "Yeterli bilgi yok.",
      safetyLabel: "Yapay zeka destekli karar destegi",
      safetyMessage: "Ciktilar eksik veya hatali olabilir. Onemli kararlar icin guvenilir kaynaklarla dogrulayin.",
      optionLabel: "Bekle ve daha fazla bilgi topla",
      optionTradeoff: "Erken taahhudu azaltir, ancak belirsizligi uzatir.",
      optionWins: "Eksik bilgi karari anlamli sekilde degistirebilecekse kullanislidir.",
    };
  }
  if (normalized.includes("russian")) {
    return {
      notEnough: "Недостаточно информации.",
      safetyLabel: "Поддержка решения с ИИ",
      safetyMessage: "Ответы могут быть неполными или ошибочными. Проверяйте важные решения надежными источниками.",
      optionLabel: "Подождать и собрать больше информации",
      optionTradeoff: "Снижает преждевременное обязательство, но продлевает неопределенность.",
      optionWins: "Полезно, если недостающая информация может заметно изменить решение.",
    };
  }
  if (normalized.includes("german")) {
    return {
      notEnough: "Nicht genug Informationen.",
      safetyLabel: "KI-gestuetzte Entscheidungsunterstuetzung",
      safetyMessage: "Ausgaben koennen unvollstaendig oder falsch sein. Pruefen Sie wichtige Entscheidungen mit verlaesslichen Quellen.",
      optionLabel: "Warten und mehr Informationen sammeln",
      optionTradeoff: "Reduziert voreilige Festlegung, verlaengert aber Unsicherheit.",
      optionWins: "Nuetzlich, wenn fehlende Informationen die Entscheidung deutlich aendern koennen.",
    };
  }
  return {
    notEnough: "Not enough information.",
    safetyLabel: "AI-generated decision support",
    safetyMessage: "Outputs may be incomplete or wrong. Verify important decisions with reliable sources.",
    optionLabel: "Wait and gather more information",
    optionTradeoff: "Reduces premature commitment, but extends uncertainty.",
    optionWins: "Useful when missing information could materially change the decision.",
  };
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 100_000) {
        reject(new Error("Request too large"));
        req.destroy();
      }
    });
    req.on("end", () => {
      try {
        resolve(JSON.parse(body || "{}"));
      } catch {
        reject(new Error("Invalid JSON body"));
      }
    });
  });
}

function sendJson(res, status, value) {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(value));
}

function setCors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

function serveWebBuild(req, res) {
  const distDir = resolve(process.cwd(), "dist");
  const indexFile = join(distDir, "index.html");
  if (!existsSync(indexFile)) return false;

  let pathname = "/";
  try {
    pathname = decodeURIComponent(new URL(req.url || "/", `http://localhost:${port}`).pathname);
  } catch {
    pathname = "/";
  }

  const relativePath = pathname === "/" ? "index.html" : pathname.replace(/^\/+/, "");
  let filePath = resolve(distDir, relativePath);

  if (!filePath.startsWith(distDir)) {
    sendJson(res, 403, { error: "Forbidden" });
    return true;
  }

  if (!existsSync(filePath) || !statSync(filePath).isFile()) {
    filePath = indexFile;
  }

  const stream = createReadStream(filePath);
  stream.on("error", () => sendJson(res, 500, { error: "Could not read web build file" }));
  res.writeHead(200, { "Content-Type": contentTypeFor(filePath) });
  stream.pipe(res);
  return true;
}

function contentTypeFor(filePath) {
  const type = extname(filePath).toLowerCase();
  if (type === ".html") return "text/html; charset=utf-8";
  if (type === ".js") return "application/javascript; charset=utf-8";
  if (type === ".css") return "text/css; charset=utf-8";
  if (type === ".json") return "application/json; charset=utf-8";
  if (type === ".png") return "image/png";
  if (type === ".jpg" || type === ".jpeg") return "image/jpeg";
  if (type === ".ico") return "image/x-icon";
  if (type === ".svg") return "image/svg+xml";
  return "application/octet-stream";
}

function loadEnv() {
  for (const file of [join(process.cwd(), "server", ".env.local"), join(process.cwd(), ".env.local")]) {
    if (!existsSync(file)) continue;
    const lines = readFileSync(file, "utf8").split(/\r?\n/);
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const index = trimmed.indexOf("=");
      if (index === -1) continue;
      const key = trimmed.slice(0, index).trim();
      const value = trimmed.slice(index + 1).trim().replace(/^["']|["']$/g, "");
      if (!process.env[key]) process.env[key] = value;
    }
  }
}
