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
// 🧪 FDA VALIDATION
// ==============================
async function validateMedicines(medicines) {
  const valid = [];

  for (let med of medicines) {
    try {
      const res = await fetch(
        `https://api.fda.gov/drug/label.json?search=openfda.brand_name:${med}&limit=1`
      );

      const data = await res.json();

      if (data.results && data.results.length > 0) {
        valid.push(med);
      }

    } catch (err) {
      console.log("FDA check failed:", med);
    }
  }

  return valid;
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
  // 🐍 PYTHON (PDF)
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
  // 🧠 VALIDATE MEDICINES
  // ==============================
  const validMedicines = await validateMedicines(medicines);

  console.log("✅ Valid Medicines:", validMedicines);

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
  // 💊 STRICT INTERACTION LOGIC
  // ==============================
  let interactions = [];

  // ❌ BLOCK if ANY invalid medicine
  if (validMedicines.length !== medicines.length) {
    interactions.push({
      drugs: medicines,
      severity: "Invalid",
      advice: "One or more medicines are not recognized. Please check spelling."
    });
  }

  // ✅ ONLY if ALL are valid
  else if (validMedicines.length > 0) {
    const interactionData = await callAI(`
You are a STRICT clinical drug interaction checker.

Medicines:
${validMedicines.join(", ")}

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
    `);

    interactions = interactionData?.interactions || [];
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
// 💬 CHATBOT ROUTE (ADDED)
// ==============================
app.post("/chat", async (req, res) => {
  try {
    const { message, report } = req.body;

    const response = await client.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [
        {
role: "system",
content: `
You are a medical assistant.

- Give SHORT and PRECISE answers (2-4 lines max)
- Do NOT give long explanations
- Be clear and direct
- Focus only on important points
`
        },
        {
          role: "user",
          content: `
Answer briefly.

Report:
${JSON.stringify(report)}

User Question:
${message}
          `
        }
      ],
      temperature: 0.5,
      max_completion_tokens: 800
    });

    const reply = response.choices[0].message.content;

    res.json({ reply });

  } catch (err) {
    console.error("Chat error:", err.message);
    res.status(500).json({ error: "Chat failed" });
  }
});

// ==============================
// 🚀 START SERVER
// ==============================
app.listen(5000, () => {
  console.log("🚀 Server running on http://localhost:5000");
});