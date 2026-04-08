// ==============================
// 📁 ELEMENTS
// ==============================
const fileInput = document.getElementById("reportFile");
const resultPanel = document.getElementById("resultPanel");

// ==============================
// 📄 FILE NAME DISPLAY
// ==============================
fileInput.addEventListener("change", () => {
  const fileName = fileInput.files[0]?.name || "No file selected";
  document.getElementById("file-name").textContent = fileName;
});

// ==============================
// 🧠 ANALYZE REPORT
// ==============================
document.getElementById("analyzeReportBtn").addEventListener("click", async () => {
  const file = fileInput.files[0];

  if (!file) {
    alert("Please upload a file first!");
    return;
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("medicines", medicines.join(",")); // ✅ send medicines

  try {
    const res = await fetch("http://localhost:5000/analyze", {
      method: "POST",
      body: formData
    });

    if (!res.ok) throw new Error("Server error");

    const data = await res.json();
    console.log("FULL RESPONSE:", data);

    resultPanel.classList.remove("hidden");

    let extractedData = data.extracted || data.values || {};

    if (Object.keys(extractedData).length > 0) {
      data.analyzed = processHealthData(extractedData);
    } else {
      data.analyzed = data.analyzed || [];
    }

    renderReport(data);

  } catch (err) {
    console.error(err);
    alert("Error analyzing report");
  }
});

// ==============================
// 🧠 PROCESS HEALTH DATA
// ==============================
function processHealthData(extracted) {
  const result = [];

  for (const key in extracted) {
    const item = extracted[key];

    const value = item.value;
    const range = item.range;

    let status = "unknown";

    if (value != null && range) {

      if (range.includes("-")) {
        const [min, max] = range.split("-").map(Number);
        if (value < min) status = "low";
        else if (value > max) status = "high";
        else status = "normal";
      }

      else if (range.includes("<")) {
        const max = Number(range.replace("<", ""));
        status = value < max ? "normal" : "high";
      }

      else if (range.includes(">")) {
        const min = Number(range.replace(">", ""));
        status = value > min ? "normal" : "low";
      }
    }

    result.push({
      key,
      value,
      status
    });
  }

  return result;
}

// ==============================
// 🎨 REPORT UI RENDER
// ==============================
function renderReport(data) {

  if (data.ai?.error) {
    resultPanel.innerHTML = `
      <div class="result-card" style="color:red; font-weight:600;">
        ❌ ${data.ai.error}
      </div>
    `;
    return;
  }

  const analyzed = data.analyzed || [];
  const ai = data.ai || {};

  const interactions = ai.interactions || [];
  const diet = ai.diet || [];
  const precautions = ai.precautions || [];

  let html = `<div class="result-card">
    <div class="result-header">
      <i class="fas fa-brain"></i>
      <h2>Health Report</h2>
    </div>`;

  // ==============================
  // 🧪 HEALTH VALUES
  // ==============================
  html += `<div class="card-section"><h3>🧪 Health Values</h3><div class="grid">`;

  if (analyzed.length === 0) {
    html += `<p>No data extracted</p>`;
  } else {
    analyzed.forEach(item => {

      const color =
        item.status === "normal" ? "green" :
        item.status === "high" ? "red" :
        item.status === "low" ? "orange" : "gray";

      html += `
        <div class="value-card">
          <h4>${item.key.toUpperCase()}</h4>
          <p>
            ${item.value ?? "N/A"} 
            <span style="color:${color}; font-weight:600;">
              (${item.status})
            </span>
          </p>
        </div>
      `;
    });
  }

  html += `</div></div>`;

  // ==============================
  // ⚠️ CONDITIONS
  // ==============================
  html += `<div class="card-section"><h3>⚠️ Conditions</h3>`;

  const abnormal = analyzed.filter(a => a.status === "high" || a.status === "low");

  html += abnormal.length
    ? abnormal.map(a => `
        <span class="badge" style="background:#ffe6e6;">
          <strong>${a.key.toUpperCase()}</strong> is ${a.status.toUpperCase()}
        </span>
      `).join(" ")
    : `<p style="color:green;">Healthy ✅ All values are normal</p>`;

  html += `</div>`;

  // ==============================
  // 🚨 RISKS
  // ==============================
  html += `<div class="card-section"><h3>🚨 Risks</h3>`;

  html += abnormal.length
    ? `<p style="color:red;">Potential health risks detected ⚠️</p>`
    : `<p style="color:green;">No major risks ✅</p>`;

  html += `</div>`;

  // ==============================
  // 💊 DRUG INTERACTIONS (FIXED)
  // ==============================
  html += `<div class="card-section"><h3>💊 Drug Interactions</h3>`;

  if (medicines.length === 0) {
    html += `<p style="color:gray;">No medicines provided</p>`;
  } else if (interactions.length === 0) {
    html += `<p style="color:green;">No harmful interactions detected ✅</p>`;
  } else {
    html += `<ul>`;
    interactions.forEach(d => {
      html += `
        <li>
          <strong>${(d.drugs || []).join(" + ")}</strong><br/>
          🔥 ${d.severity}<br/>
          <small>${d.advice}</small>
        </li>
      `;
    });
    html += `</ul>`;
  }

  html += `</div>`;

  // ==============================
  // 🥗 DIET
  // ==============================
  html += `<div class="card-section"><h3>🥗 Diet</h3>`;

  html += diet.length
    ? `<ul>${diet.map(d => `<li>${d.food} - ${d.benefit}</li>`).join("")}</ul>`
    : `<p>No diet suggestions</p>`;

  html += `</div>`;

  // ==============================
  // 🛡️ PRECAUTIONS
  // ==============================
  html += `<div class="card-section"><h3>🛡️ Precautions</h3>`;

  html += precautions.length
    ? `<ul>${precautions.map(p => `<li>${p.step} - ${p.reason}</li>`).join("")}</ul>`
    : `<p>No precautions</p>`;

  html += `</div>`;

  html += `</div>`;

  resultPanel.innerHTML = html;
}

// ==============================
// 💊 MEDICINE INPUT LOGIC
// ==============================
let medicines = [];

document.getElementById("addMedBtn").onclick = () => {
  const input = document.getElementById("medInput");
  const med = input.value.trim();

  if (!med) return;

  medicines.push(med.toLowerCase());
  input.value = "";

  renderMeds();
};

function renderMeds() {
  const container = document.getElementById("medTagsContainer");
  container.innerHTML = "";

  medicines.forEach((med, i) => {
    const tag = document.createElement("div");
    tag.className = "med-tag";

    tag.innerHTML = `${med} <button>×</button>`;

    tag.onclick = () => {
      medicines.splice(i, 1);
      renderMeds();
    };

    container.appendChild(tag);
  });

  document.getElementById("medCount").textContent = medicines.length;
}