require("dotenv").config(); 

const express = require("express");
const cors = require("cors");
const multer = require("multer");
const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs");
const OpenAI = require("openai");

const app = express();

app.use(cors());
app.use(express.json());

// ==============================
// 🔐 GROQ SETUP
// ==============================
const client = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1"
});

// ==============================
// 📁 FILE UPLOAD
// ==============================
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);
const upload = multer({ dest: uploadDir });

// ==============================
// 🛠 SAFE JSON PARSER
// ==============================
function safeParseJSON(raw) {
  try {
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("No JSON found");
    return JSON.parse(match[0]);
  } catch {
    return null;
  }
}

// ==============================
// 🔄 NORMALIZER
// ==============================
function normalizeAI(ai) {
  return {
    conditions: ai.conditions || [],
    risks: ai.risks || [],
    interactions: ai.interactions || [],
    diet: ai.diet || [],
    precautions: ai.precautions || []
  };
}

// ==============================
// 🧠 RANGE ENGINE
// ==============================
function parseRange(rangeStr) {
  if (!rangeStr) return {};

  if (rangeStr.includes("-")) {
    const [min, max] = rangeStr.split("-").map(v => parseFloat(v));
    return { min, max };
  }

  if (rangeStr.includes("<")) {
    return { max: parseFloat(rangeStr.replace("<", "")) };
  }

  if (rangeStr.includes(">")) {
    return { min: parseFloat(rangeStr.replace(">", "")) };
  }

  return {};
}

function checkStatus(value, range) {
  if (range.min !== undefined && value < range.min) return "low";
  if (range.max !== undefined && value > range.max) return "high";
  return "normal";
}

// ==============================
// 🤖 AI CALL
// ==============================
async function callAI(prompt) {
  try {
    const response = await client.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [
        { role: "system", content: "You are a helpful medical assistant." },
        { role: "user", content: prompt }
      ],
      temperature: 0.3,
      max_completion_tokens: 900
    });

    const raw = response.choices[0].message.content;
    return safeParseJSON(raw);

  } catch (err) {
    console.error("AI call error:", err.message);
    return null;
  }
}

// ==============================
// 🚀 MAIN ROUTE
// ==============================
app.post("/analyze", upload.single("file"), async (req, res) => {
  console.log("📥 Request received");

  let values = {};

  // ==============================
  // 🐍 PYTHON CALL
  // ==============================
  if (req.file) {
    const filePath = req.file.path;

    const pythonProcess = spawn("python", [
      path.join(__dirname, "../ai-model/main.py"),
      filePath
    ]);

    let result = "";

    pythonProcess.stdout.on("data", (data) => {
      result += data.toString();
    });

    await new Promise((resolve) => {
      pythonProcess.on("close", () => {
        try {
          const match = result.match(/\{[\s\S]*\}/);

          if (match) {
            const parsed = JSON.parse(match[0]);

            // ✅ FIX: correct extraction
            values = parsed.values || parsed;

            console.log("✅ Parsed Python output:", parsed);
          }

        } catch (err) {
          console.error("Python parse error:", err.message);
        }

        resolve();
      });
    });
  }

  console.log("📊 Extracted values:", values);

  // ==============================
  // 🧠 RULE ENGINE
  // ==============================
  const results = [];
  const conditions = [];
  const risks = [];

  for (const key in values) {
    const item = values[key];

    if (!item || item.value === undefined) continue;

    const value = item.value;
    const range = parseRange(item.range);
    const status = checkStatus(value, range);

    results.push({ key, value, status });

    if (status === "high" || status === "low") {
      conditions.push({
        name: key,
        reason: `${key} is ${status}`
      });

      risks.push({
        issue: `${key} imbalance`,
        reason: `${key} is ${status}`
      });
    }
  }

  if (conditions.length === 0) {
    conditions.push({
      name: "Healthy",
      reason: "All values are normal"
    });
  }

  // ==============================
  // 🤖 AI WITH CONTEXT (🔥 FIX)
  // ==============================
  const prompt = `
You are a medical assistant.

Here are patient lab results:
${JSON.stringify(values)}

Generate:

1. Diet recommendations
2. Health precautions
3. Drug interaction warnings

Return ONLY JSON:
{
  "diet": [{ "food": "", "benefit": "" }],
  "precautions": [{ "step": "", "reason": "" }],
  "interactions": [{ "drugs": [], "severity": "", "advice": "" }]
}
`;

  let aiData = await callAI(prompt);

  if (!aiData) {
    aiData = { diet: [], precautions: [], interactions: [] };
  }

  aiData = normalizeAI(aiData);

  // ==============================
  // 🚀 FINAL RESPONSE (🔥 FIXED KEYS)
  // ==============================
  res.json({
    extracted: values,   // ✅ FIXED (frontend expects this)
    analyzed: results,
    ai: {
      ...aiData,
      conditions,
      risks
    }
  });
});

// ==============================
// 🚀 START SERVER
// ==============================
app.listen(5000, () => {
  console.log("🚀 Server running on http://localhost:5000");
});