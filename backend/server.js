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
// 📁 FILE UPLOAD SETUP
// ==============================
const uploadDir = path.join(__dirname, "uploads");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

const upload = multer({ dest: uploadDir });

// ==============================
// 🚀 MAIN ANALYZE ROUTE
// ==============================
app.post("/analyze", upload.single("file"), async (req, res) => {
  console.log("📥 Request received");

  // ✅ File check
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  const filePath = req.file.path;
  const medicines = req.body.medicines || "";

  // ==============================
  // 💊 MEDICINE INPUT PROCESSING
  // ==============================
  const medsArray = medicines
    ? medicines
        .split(/[, ]+/)
        .map(m => m.trim().toLowerCase())
        .filter(Boolean)
    : [];

  console.log("💊 Medicines:", medsArray);

  // ==============================
  // 🧠 FDA VALIDATION
  // ==============================
  const validMeds = [];
  const invalidMeds = [];

  for (let med of medsArray) {
    const isValid = await isValidMedicine(med);

    if (isValid) {
      validMeds.push(med);
    } else {
      invalidMeds.push(med);
    }
  }

  console.log("✅ Valid:", validMeds);
  console.log("❌ Invalid:", invalidMeds);

  // ==============================
  // 🐍 RUN PYTHON
  // ==============================
  const pythonProcess = spawn("python", [
    path.join(__dirname, "../ai-model/main.py"),
    filePath
  ]);

  let result = "";

  pythonProcess.stdout.on("data", (data) => {
    result += data.toString();
  });

  pythonProcess.stderr.on("data", (data) => {
    console.error("❌ Python Error:", data.toString());
  });

  pythonProcess.on("close", async () => {
    console.log("✅ Python finished");
    console.log("🐍 RAW PYTHON OUTPUT:", result);

    try {
      if (!result || result.trim() === "") {
        throw new Error("Python returned empty result");
      }

      // ==============================
      // ✅ SAFE JSON PARSE (PYTHON)
      // ==============================
      let parsed;
      try {
        const jsonMatch = result.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error("Invalid Python output");

        parsed = JSON.parse(jsonMatch[0]);
      } catch {
        throw new Error("Python JSON parse failed");
      }

      const values = parsed.values || {};

      // ==============================
      // 🚫 BLOCK INVALID MEDICINES
      // ==============================
      if (validMeds.length === 0) {
        return res.json({
          extractedData: values,
          ai: {
            error: `Medicine not recognized: ${invalidMeds.join(", ")}`,
            conditions: [],
            risks: [],
            drug_interactions: [],
            side_effects: [],
            food_warnings: [],
            diet: [],
            precautions: []
          }
        });
      }

      // ==============================
      // ⚠️ PARTIAL INVALID WARNING
      // ==============================
      if (invalidMeds.length > 0) {
        console.log("⚠️ Ignoring invalid medicines:", invalidMeds);
      }

      // ==============================
      // ⚡ COMPACT DATA
      // ==============================
      const compactData = Object.entries(values)
        .map(([k, v]) => `${k}:${v}`)
        .join(", ");

      const safeData = compactData || "no data";

      // ==============================
      // 🧠 AI PROMPT
      // ==============================
      const prompt = `
You are a STRICT medical safety AI.

Patient Data: ${safeData}

Medicines: ${validMeds.join(", ") || "none"}

TASK:
1. Analyze each medicine
2. Compare every pair of medicines
3. Identify known drug interactions

Return ONLY JSON:
{
  "conditions": [],
  "risks": [],
  "drug_interactions": [
    {
      "drugs": [],
      "severity": "",
      "effect": "",
      "advice": ""
    }
  ],
  "side_effects": [],
  "food_warnings": [],
  "diet": [],
  "precautions": []
}

STRICT RULES:
- Only analyze REAL known medicines
- Do NOT hallucinate interactions
- Return [] if no valid interaction found
- Severity must be LOW / MODERATE / HIGH
- No explanation outside JSON
`;

      // ==============================
      // 🤖 AI CALL
      // ==============================
      const response = await client.chat.completions.create({
        model: "llama-3.1-8b-instant",
        messages: [
          { role: "system", content: "You are a strict medical safety AI." },
          { role: "user", content: prompt }
        ],
        temperature: 0.2,
        max_completion_tokens: 300
      });

      const aiText = response.choices[0].message.content;

      console.log("🧠 AI RAW:", aiText);

      // ==============================
      // ✅ SAFE JSON PARSE (AI)
      // ==============================
      let aiData;

      try {
        const jsonMatch = aiText.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error("Invalid AI output");

        aiData = JSON.parse(jsonMatch[0]);
      } catch {
        aiData = {
          error: "Invalid JSON from AI",
          raw: aiText
        };
      }

      // ==============================
      // 📤 RESPONSE
      // ==============================
      res.json({
        extractedData: values,
        ai: aiData
      });

    } catch (err) {
      console.error("❌ Server Error:", err.message);

      res.status(500).json({
        error: "Processing failed",
        details: err.message
      });
    }
  });
});

// ==============================
// 🚀 START SERVER
// ==============================
app.listen(5000, () => {
  console.log("🚀 Server running on http://localhost:5000");
});