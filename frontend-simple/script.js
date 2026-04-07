
const fileInput = document.getElementById("reportFile");
const resultPanel = document.getElementById("resultPanel");

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

  try {
    const res = await fetch("http://localhost:5000/analyze-report", {
      method: "POST",
      body: formData
    });

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
  const values = data.values || {};
  const conditions = data.conditions || [];
  const foods = data.food_recommendations || [];

  let html = `<h2>🧠 Health Report</h2>`;

  // 🧪 VALUES
  html += `<div class="card-section"><h3>🧪 Health Values</h3><div class="grid">`;
  for (let key in values) {
    html += `
      <div class="value-card">
        <h4>${key.toUpperCase()}</h4>
        <p>${values[key]}</p>
      </div>
    `;
  }
  html += `</div></div>`;

  // ⚠️ CONDITIONS
  html += `<div class="card-section"><h3>⚠️ Conditions</h3>`;
  if (conditions.length === 0) {
    html += `<p>No major issues detected ✅</p>`;
  } else {
    conditions.forEach(c => {
      html += `<span class="badge-danger">${c}</span>`;
    });
  }
  html += `</div>`;

  // 🍎 FOOD RECOMMENDATIONS
  foods.forEach(f => {
    html += `
      <div class="card-section">
        <h3>🍎 ${f.condition}</h3>

        <p><strong>Nutrients:</strong> ${f.nutrients.join(", ")}</p>

        <p><strong>Recommended Foods:</strong></p>
        <ul>
          ${f.foods.map(food => `<li>${food}</li>`).join("")}
        </ul>

        <p><strong>Avoid:</strong></p>
        <ul>
          ${f.avoid.map(a => `<li>${a}</li>`).join("")}
        </ul>
      </div>
    `;
  });

  resultPanel.innerHTML = html;
}

// ==============================
// 💊 MEDICINE LOGIC
// ==============================
let medicines = [];

document.getElementById("addMedBtn").onclick = () => {
  const input = document.getElementById("medInput");
  const med = input.value.trim();

  if (!med) return;

  medicines.push(med);
  input.value = "";

  renderMeds();
};

function renderMeds() {
  const container = document.getElementById("medTagsContainer");
  container.innerHTML = "";

  medicines.forEach((med, i) => {
    const tag = document.createElement("div");
    tag.className = "med-tag";
    tag.innerHTML = med + " ❌";

    tag.onclick = () => {
      medicines.splice(i, 1);
      renderMeds();
    };

    container.appendChild(tag);
  });
}

// ==============================
// 💊 CHECK MEDICINES
// ==============================
document.getElementById("analyzeMedBtn").onclick = async () => {
  if (medicines.length === 0) {
    alert("Add medicines first!");
    return;
  }

  try {
    const res = await fetch("http://localhost:5000/check-medicines", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ medicines })
    });

    if (!res.ok) {
      throw new Error("Server error");
    }

    const data = await res.json();

    resultPanel.classList.remove("hidden");
    resultPanel.innerHTML = `
      <div class="card-section">
        <h2>💊 Medicine Analysis</h2>
        <p><strong>Risk Level:</strong> ${data.risk}</p>
        <p><strong>Advice:</strong> ${data.advice}</p>
      </div>
    `;

  } catch (err) {
    console.error(err);
    alert("Error checking medicines");
  }
};
