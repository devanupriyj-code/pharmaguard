const express = require("express");
const cors = require("cors");
const { spawn } = require("child_process");

const app = express();

app.use(cors());
app.use(express.json());

app.post("/analyze", (req, res) => {
  const python = spawn("python", ["../ai-model/analyzer.py"]);

  python.stdin.write(JSON.stringify(req.body));
  python.stdin.end();

  let result = "";

  python.stdout.on("data", (data) => {
    result += data.toString();
  });

  python.on("close", () => {
    res.json(JSON.parse(result));
  });
});

app.get("/", (req, res) => {
  res.send("Backend working ✅");
});

app.listen(5000, () => {
  console.log("Server running on port 5000");
});
const multer = require("multer");
const { exec } = require("child_process");

const upload = multer({ dest: "uploads/" });

app.post("/analyze", upload.single("report"), (req, res) => {
  const filePath = req.file.path;

  exec(`python ai-model/analyzer.py ${filePath}`, (error, stdout, stderr) => {
    if (error) {
      console.error(error);
      return res.status(500).send("Error processing file");
    }

    const result = JSON.parse(stdout);
    res.json(result);
  });
});