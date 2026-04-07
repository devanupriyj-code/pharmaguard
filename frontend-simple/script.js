// ==============================
// 📁 ELEMENTS
// ==============================
const fileInput = document.getElementById("reportFile");
const resultPanel = document.getElementById("resultPanel");

// ==============================
// 📄 FILE NAME DISPLAY (NEW FIX)
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
  formData.append("medicines", medicines.join(","));

  try {
    const res = await fetch("http://localhost:5000/analyze", {
      method: "POST",
      body: formData
    });

    if (!res.ok) throw new Error("Server error");

    const data = await res.json();

    resultPanel.classList.remove("hidden");
    renderReport(data);

  } catch (err) {
    console.error(err);
    alert("Error analyzing report");
  }
});

// ==============================
// 🎨 REPORT UI RENDER
// ==============================
function renderReport(data) {

  // ==============================
  // ❌ HANDLE INVALID MEDICINE ERROR (NEW FIX)
  // ==============================
  if (data.ai?.error) {
    resultPanel.innerHTML = `
      <div class="result-card" style="color:red; font-weight:600;">
        ❌ ${data.ai.error}
      </div>
    `;
    return;
  }

  const values = data.extractedData?.values || data.extractedData || {};
  const ai = data.ai || {};

  const conditions = ai.conditions || [];
  const risks = ai.risks || [];
  const diet = ai.diet || [];
  const precautions = ai.precautions || [];

  const drugInteractions = ai.drug_interactions || [];
  const sideEffects = ai.side_effects || [];
  const foodWarnings = ai.food_warnings || [];

  let html = `<div class="result-card"><div class="result-header">
                <i class="fas fa-brain"></i>
                <h2>Health Report</h2>
              </div>`;

  // ==============================
  // 🧪 VALUES
  // ==============================
  html += `<div class="card-section"><h3>🧪 Health Values</h3><div class="grid">`;

  if (Object.keys(values).length === 0) {
    html += `<p>No data extracted</p>`;
  } else {
    for (let key in values) {
      html += `
        <div class="value-card">
          <h4>${key.toUpperCase()}</h4>
          <p>${values[key]}</p>
        </div>
      `;
    }
  }

  html += `</div></div>`;

  // ==============================
  // ⚠️ CONDITIONS
  // ==============================
  html += `<div class="card-section"><h3>⚠️ Conditions</h3>`;
  html += conditions.length
    ? conditions.map(c => `<span class="badge">${c}</span>`).join(" ")
    : `<p>No major issues detected ✅</p>`;
  html += `</div>`;

  // ==============================
  // 🚨 RISKS
  // ==============================
  html += `<div class="card-section"><h3>🚨 Risks</h3>`;
  html += risks.length
    ? `<ul>${risks.map(r => `<li>${typeof r === "object" ? r.message || JSON.stringify(r) : r}</li>`).join("")}</ul>`
    : `<p>No major risks</p>`;
  html += `</div>`;

  // ==============================
  // 💊 DRUG INTERACTIONS
  // ==============================
  html += `<div class="card-section"><h3>💊 Drug Interactions</h3>`;

  if (drugInteractions.length === 0) {
    html += `<p style="color:green">No harmful interactions detected ✅</p>`;
  } else {
    html += `<ul>`;
    drugInteractions.forEach(d => {
      html += `
        <li style="color:red; margin-bottom:10px;">
          <strong>${(d.drugs || []).join(" + ")}</strong><br/>
          ⚠️ Effect: ${d.effect || "Unknown"}<br/>
          🔥 Severity: <b>${d.severity || "Unknown"}</b><br/>
          💡 Advice: ${d.advice || "Consult doctor"}
        </li>
      `;
    });
    html += `</ul>`;
  }

  html += `</div>`;

  // ==============================
  // 💥 SIDE EFFECTS
  // ==============================
  html += `<div class="card-section"><h3>💥 Side Effects</h3>`;
  html += sideEffects.length
    ? `<ul>${sideEffects.map(s => `<li>${s}</li>`).join("")}</ul>`
    : `<p>No major side effects</p>`;
  html += `</div>`;

  // ==============================
  // 🍽️ FOOD WARNINGS
  // ==============================
  html += `<div class="card-section"><h3>🍽️ Food Warnings</h3>`;
  html += foodWarnings.length
    ? `<ul>${foodWarnings.map(f => `<li>${f}</li>`).join("")}</ul>`
    : `<p>No food restrictions</p>`;
  html += `</div>`;

  // ==============================
  // 🥗 DIET
  // ==============================
  html += `<div class="card-section"><h3>🥗 Diet</h3>`;
  html += diet.length
    ? `<ul>${diet.map(d => `<li>${d}</li>`).join("")}</ul>`
    : `<p>No suggestions</p>`;
  html += `</div>`;

  // ==============================
  // 🛡️ PRECAUTIONS
  // ==============================
  html += `<div class="card-section"><h3>🛡️ Precautions</h3>`;
  html += precautions.length
    ? `<ul>${precautions.map(p => `<li>${p}</li>`).join("")}</ul>`
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