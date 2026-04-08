// ==============================
// 📁 ELEMENTS
// ==============================
const fileInput = document.getElementById("reportFile");
const resultPanel = document.getElementById("resultPanel");

let medicines = [];
let lastAIResponse = null; // 🔥 store backend response

// ==============================
// 📄 FILE NAME DISPLAY
// ==============================
fileInput.addEventListener("change", () => {
  const fileName = fileInput.files[0]?.name || "No file selected";
  document.getElementById("file-name").textContent = fileName;
});

// ==============================
// 🧠 AUTO ANALYZE FUNCTION
// ==============================
async function analyzeReport() {
  const file = fileInput.files[0];
  if (!file) return;

  const formData = new FormData();
  formData.append("file", file);
  formData.append("medicines", medicines.join(","));

  try {
    const res = await fetch("http://localhost:5000/analyze", {
      method: "POST",
      body: formData
    });

    const data = await res.json();
    resultPanel.classList.remove("hidden");

    let extractedData = data.extracted || {};

    if (Object.keys(extractedData).length > 0) {
      data.analyzed = processHealthData(extractedData);
    }

    lastAIResponse = data; // 🔥 store response
    renderReport(data);
    updateRiskLevel(); // 🔥 FIX

  } catch (err) {
    console.error(err);
  }
}

// ==============================
// 🧠 BUTTON ANALYZE
// ==============================
document.getElementById("analyzeReportBtn").addEventListener("click", analyzeReport);

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

    result.push({ key, value, status });
  }

  return result;
}

// ==============================
// 🎨 INTERACTIVE REPORT UI
// ==============================
function renderReport(data) {
  const ai = data.ai || {};
  const analyzed = data.analyzed || [];

  const interactions = ai.interactions || [];
  const diet = ai.diet || [];
  const precautions = ai.precautions || [];

  let html = `<div class="result-card">`;

  // ==============================
  // 🧪 HEALTH VALUES
  // ==============================
  html += `
    <div>
      <h3 onclick="toggleSection(this)">🧪 Health Values ▼</h3>
      <div style="display:block;">
  `;

  analyzed.forEach(item => {
    const color =
      item.status === "high" ? "red" :
      item.status === "low" ? "orange" : "green";

    html += `
      <p style="border-left:4px solid ${color}; padding-left:8px;">
        <strong>${item.key}</strong>: ${item.value}
        <span style="color:${color};">(${item.status})</span>
      </p>
    `;
  });

  html += `</div></div>`;

  // ==============================
  // 💊 DRUG INTERACTIONS
  // ==============================
  html += `
    <div>
      <h3 onclick="toggleSection(this)">💊 Drug Interactions ▼</h3>
      <div style="display:block;">
  `;

  if (medicines.length === 0) {
    html += `<p>No medicines provided</p>`;
  } 

  else if (interactions[0]?.severity === "Invalid") {
    html += `
      <div style="
        background:#ffe6e6;
        border-left:5px solid red;
        padding:10px;
        border-radius:6px;
        color:red;
        font-weight:bold;
      ">
        ⚠️ ${interactions[0].advice}
      </div>
    `;
  }

  else if (interactions.length === 0) {
    html += `<p style="color:green;">No harmful interactions</p>`;
  } 

  else {
    interactions.forEach((i, index) => {
      const color =
        i.severity === "High" ? "red" :
        i.severity === "Moderate" ? "orange" : "green";

      html += `
        <div onclick="toggleDetail(${index})"
             style="cursor:pointer; margin:10px 0; padding:10px; border-radius:6px; background:#f9f9f9;">
          
          <div style="color:${color}; font-weight:bold;">
            ${i.drugs.join(" + ")} → ${i.severity}
          </div>

          <div id="detail-${index}" style="display:none; margin-top:5px;">
            ${i.advice}
          </div>
        </div>
      `;
    });
  }

  html += `</div></div>`;

  // ==============================
  // 🥗 DIET
  // ==============================
  html += `
    <div>
      <h3 onclick="toggleSection(this)">🥗 Diet ▼</h3>
      <div style="display:none;">
  `;

  diet.forEach(d => {
    html += `<p>🍎 <b>${d.food}</b>: ${d.benefit}</p>`;
  });

  html += `</div></div>`;

  // ==============================
  // 🛡️ PRECAUTIONS
  // ==============================
  html += `
    <div>
      <h3 onclick="toggleSection(this)">🛡️ Precautions ▼</h3>
      <div style="display:none;">
  `;

  precautions.forEach(p => {
    html += `<p>⚠️ <b>${p.step}</b>: ${p.reason}</p>`;
  });

  html += `</div></div>`;

  html += `</div>`;

  resultPanel.innerHTML = html;
}

// ==============================
// 🔁 TOGGLE SECTION
// ==============================
function toggleSection(el) {
  const content = el.nextElementSibling;
  content.style.display =
    content.style.display === "none" ? "block" : "none";
}

// ==============================
// 🔁 TOGGLE DETAIL
// ==============================
function toggleDetail(index) {
  const el = document.getElementById(`detail-${index}`);
  el.style.display =
    el.style.display === "none" ? "block" : "none";
}

// ==============================
// 💊 MEDICINE LOGIC
// ==============================

// ADD MEDICINE
document.getElementById("addMedBtn").onclick = () => {
  const input = document.getElementById("medInput");
  const med = input.value.trim().toLowerCase();

  if (!med) return;

  if (!medicines.includes(med)) {
    medicines.push(med);
  }

  input.value = "";
  renderMeds();
  analyzeReport();
};

// QUICK PRESETS
document.querySelectorAll(".preset-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    const meds = btn.innerText.toLowerCase().split("+").map(m => m.trim());

    meds.forEach(m => {
      if (!medicines.includes(m)) {
        medicines.push(m);
      }
    });

    renderMeds();
    analyzeReport();
  });
});

// RENDER MEDS
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
      analyzeReport();
    };

    container.appendChild(tag);
  });

  document.getElementById("medCount").textContent = medicines.length;
}

// ==============================
// 🔥 FIXED RISK LEVEL LOGIC
// ==============================
function updateRiskLevel() {
  const risk = document.getElementById("riskLevel");

  if (!lastAIResponse) return;

  const interactions = lastAIResponse.ai?.interactions || [];

  // 🔴 INVALID
  if (interactions[0]?.severity === "Invalid") {
    risk.textContent = "Invalid";
    risk.style.color = "red";
    return;
  }

  // 🟢 NORMAL
  if (medicines.length === 0) {
    risk.textContent = "-";
  } 
  else if (medicines.length === 1) {
    risk.textContent = "Low";
    risk.style.color = "green";
  } 
  else if (medicines.length === 2) {
    risk.textContent = "Moderate";
    risk.style.color = "orange";
  } 
  else {
    risk.textContent = "High";
    risk.style.color = "red";
  }
}