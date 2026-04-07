const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

// ✅ THIS IS THE IMPORTANT ROUTE
app.post("/analyze", (req, res) => {
  console.log("Request received:", req.body);

  res.json({
    hb: 10,
    glucose: 160,
    conditions: ["Anemia"],
    diet: ["Eat spinach"],
    warning: "Avoid aspirin + ibuprofen"
  });
});

// optional test route
app.get("/", (req, res) => {
  res.send("Backend working ✅");
});

app.listen(5000, () => {
  console.log("Server running on port 5000");
});