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
// 💊 FDA MEDICINE CHECK
// ==============================
async function isValidMedicine(med) {
  try {
    const res = await fetch(
      `https://api.fda.gov/drug/label.json?search=openfda.generic_name:${med}&limit=1`
    );
    const data = await res.json();
    return data.results && data.results.length > 0;
  } catch (err) {
    console.error("FDA API error:", err.message);
    return false;
  }
}

// ==============================
// 🧬 ICD MAPPING
// ==============================
const icdMap = {
  anemia: "D64.9",
  diabetes: "E11",
  hypertension: "I10",
  obesity: "E66",
  asthma: "J45"
};

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
// 🔄 NORMALIZER (CRITICAL FIX)
// ==============================
function normalizeAI(ai) {
  return {
    conditions: (ai.conditions || []).map(c => ({
      name: c.name || "",
      reason: c.reason || c.description || "",
    })),

    risks: (ai.risks || []).map(r => ({
      issue: r.issue || r.name || "",
      reason: r.reason || r.description || "",
    })),

    interactions: (ai.interactions || []).map(i => ({
      drugs: i.drugs || (i.name ? [i.name] : []),
      severity: i.severity || "unknown",
      advice: i.advice || i.description || "",
    })),

    diet: (ai.diet || []).map(d => ({
      food: d.food || d.name || "",
      benefit: d.benefit || d.description || "",
    })),

    precautions: (ai.precautions || []).map(p => ({
      step: p.step || p.name || "",
      reason: p.reason || p.description || "",
    })),
  };
}

// ==============================
// 🤖 AI CALL WITH RETRY
// ==============================
async function callAI(prompt, retries = 2) {
  for (let i = 0; i <= retries; i++) {
    try {
      const response = await client.chat.completions.create({
        model: "llama-3.1-8b-instant",
        messages: [
          { role: "system", content: "You are a strict medical AI." },
          { role: "user", content: prompt }
        ],
        temperature: 0,
        max_completion_tokens: 900
      });

      const raw = response.choices[0].message.content;
      console.log("🧠 AI RAW RESPONSE:", raw);

      const parsed = safeParseJSON(raw);
      if (parsed) return parsed;

    } catch (err) {
      console.error("AI call error:", err.message);
    }

    console.log(`🔁 Retrying AI... (${i + 1})`);
  }

  return null;
}

// ==============================
// 🚀 MAIN ROUTE
// ==============================
app.post("/analyze", upload.single("file"), async (req, res) => {
  console.log("📥 Request received");

  const medicines = req.body.medicines || "";

  const medsArray = medicines
    .split(/[, ]+/)
    .map(m => m.trim().toLowerCase())
    .filter(Boolean);

  const validMeds = [];
  const invalidMeds = [];

  for (let med of medsArray) {
    const isValid = await isValidMedicine(med);
    if (isValid) validMeds.push(med);
    else invalidMeds.push(med);
  }

  let values = {};

  // ==============================
  // 🐍 PYTHON (OPTIONAL)
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
            values = parsed.values || {};
          }
        } catch (err) {
          console.error("Python parse error:", err.message);
        }
        resolve();
      });
    });
  }

  const compactData = Object.entries(values)
    .map(([k, v]) => `${k}:${v}`)
    .join(", ");

  // ==============================
  // ❌ NO INPUT
  // ==============================
  if (!compactData && validMeds.length === 0) {
    return res.status(400).json({
      error: "Provide report or medicines"
    });
  }

  // ==============================
  // 🧠 PROMPT
  // ==============================
  const prompt = `
You are a STRICT medical AI.

Patient Data: ${compactData || "none"}
Medicines: ${validMeds.length ? validMeds.join(", ") : "none"}

RULES:
- Return ONLY JSON
- No text outside JSON
- Max 3 conditions, 3 risks, 2 interactions
- Keep each explanation under 12 words

FORMAT:
{
  "conditions": [],
  "risks": [],
  "interactions": [],
  "diet": [],
  "precautions": []
}
`;

  // ==============================
  // 🤖 CALL AI
  // ==============================
  let aiData = await callAI(prompt);

  if (!aiData) {
    aiData = {
      conditions: [],
      risks: [],
      interactions: [],
      diet: [],
      precautions: [],
      error: "AI failed after retries"
    };
  }

  // 🔥 NORMALIZE (KEY FIX)
  aiData = normalizeAI(aiData);

  // ==============================
  // 🧬 ICD ENRICHMENT
  // ==============================
  aiData.conditions = aiData.conditions.map(c => ({
    ...c,
    code: icdMap[c.name?.toLowerCase()] || "N/A"
  }));

  // ==============================
  // 🚀 RESPONSE
  // ==============================
  res.json({
    extractedData: values,
    ai: aiData,
    invalidMedicines: invalidMeds
  });
});

// ==============================
// 🚀 START SERVER
// ==============================
app.listen(5000, () => {
  console.log("🚀 Server running on http://localhost:5000");
});