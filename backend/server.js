
const express = require("express");
const cors = require("cors");
const multer = require("multer");
const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs");

const app = express();

app.use(cors());
app.use(express.json());

// ==============================
// 📁 File Upload Config
// ==============================
const uploadDir = path.join(__dirname, "uploads");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

const upload = multer({ dest: uploadDir });

// ==============================
// 🧠 REPORT ANALYZER (WITH FILE)
// ==============================
app.post("/analyze-report", upload.single("file"), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const filePath = req.file.path;

    console.log("📄 File:", filePath);

    const pythonPath = path.resolve(__dirname, "../ai-model/main.py");

    const python = spawn("python", [pythonPath, filePath]);

    let result = "";
    let errorData = "";

    python.stdout.on("data", (data) => {
      result += data.toString();
    });

    python.stderr.on("data", (data) => {
      console.error("PYTHON ERROR:", data.toString());
      errorData += data.toString();
    });

    python.on("close", (code) => {
      if (code !== 0) {
        return res.status(500).json({
          error: "Python failed",
          details: errorData
        });
      }

      try {
        const parsed = JSON.parse(result);
        res.json(parsed);
      } catch (err) {
        res.status(500).json({
          error: "Invalid JSON from Python",
          raw: result
        });
      }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server crashed" });
  }
});

// ==============================
// 💊 MEDICINE ANALYZER (NO FILE)
// ==============================
app.post("/check-medicines", (req, res) => {
  try {
    const medicines = req.body.medicines;

    console.log("💊 Medicines received:", medicines);

    if (!medicines || medicines.length === 0) {
      return res.status(400).json({ error: "No medicines provided" });
    }

    res.json({
      risk: "Medium",
      advice: "Some medicines may interact"
    });

  } catch (err) {
    console.error("❌ Medicine route error:", err);
    res.status(500).json({ error: "Server crashed" });
  }
});

// ==============================
// ❤️ HEALTH CHECK
// ==============================
app.get("/", (req, res) => {
  res.send("Backend working ✅");
});

// ==============================
app.listen(5000, () => {
  console.log("🚀 Server running on http://localhost:5000");
});
