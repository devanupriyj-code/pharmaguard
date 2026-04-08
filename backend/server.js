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

  const medicines = req.body.medicines
    ? req.body.medicines.split(",").filter(m => m.trim() !== "")
    : [];

  console.log("💊 Medicines:", medicines);

  // ==============================
  // 🐍 PYTHON (ONLY FOR PDF VALUES)
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
            values = parsed.values || parsed;
          }
        } catch (err) {
          console.error("Python parse error:", err.message);
        }
        resolve();
      });
    });
  }

  // ==============================
  // 🤖 AI → DIET + PRECAUTIONS
  // ==============================
  const healthPrompt = `
You are a medical assistant.

Here are patient lab results:
${JSON.stringify(values)}

Generate:

1. Diet recommendations
2. Health precautions

Return ONLY JSON:
{
  "diet": [{ "food": "", "benefit": "" }],
  "precautions": [{ "step": "", "reason": "" }]
}
`;

  let aiData = await callAI(healthPrompt);

  if (!aiData) {
    aiData = { diet: [], precautions: [] };
  }

  // ==============================
  // 💊 AI DRUG INTERACTIONS (FIXED)
  // ==============================
  let interactions = [];

  if (medicines.length > 0) {
    const interactionData = await callAI(`
You are a STRICT clinical drug interaction checker.

Rules:
- ALWAYS check interactions carefully
- If ANY known interaction exists → include it
- If unsure → mark as "Moderate"
- NEVER ignore well-known interactions
- Warfarin interactions are usually HIGH risk
- Antibiotics can increase drug effects

Medicines:
${medicines.join(", ")}

Return ONLY JSON:

{
  "interactions": [
    {
      "drugs": ["drug1", "drug2"],
      "severity": "Low | Moderate | High | Severe",
      "advice": "Short clinical explanation"
    }
  ]
}

If no interaction:
{
  "interactions": []
}
    `);

    console.log("AI interaction response:", interactionData);

    interactions = interactionData?.interactions || [];
  }

  // ✅ Safety fallback
  if (interactions.length === 0 && medicines.length > 1) {
    interactions.push({
      drugs: medicines,
      severity: "Moderate",
      advice: "No confirmed interaction found, but consult a doctor to be safe"
    });
  }

  // ==============================
  // 🚀 FINAL RESPONSE
  // ==============================
  res.json({
    extracted: values,
    analyzed: [],
    ai: {
      diet: aiData.diet || [],
      precautions: aiData.precautions || [],
      interactions
    }
  });
});

// ==============================
// 🚀 START SERVER
// ==============================
app.listen(5000, () => {
  console.log("🚀 Server running on http://localhost:5000");
});