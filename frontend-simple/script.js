// ===============================
// 🧠 GLOBAL STATE
// ===============================
let medicinesList = [];
let uploadedFile = null;

// ===============================
// 📌 DOM ELEMENTS
// ===============================
const fileInput = document.getElementById('reportFile');
const uploadZone = document.getElementById('uploadZone');
const fileNameSpan = document.getElementById('file-name');

const medInput = document.getElementById('medInput');
const addBtn = document.getElementById('addMedBtn');
const medTagsContainer = document.getElementById('medTagsContainer');

const analyzeBtn = document.getElementById('analyzeReportBtn');
const analyzeMedBtn = document.getElementById('analyzeMedBtn');

const resultPanel = document.getElementById('resultPanel');

const medCountSpan = document.getElementById('medCount');
const interactionRiskSpan = document.getElementById('interactionRisk');
const reportStatusSpan = document.getElementById('reportStatus');
const fileSizeSpan = document.getElementById('fileSize');
// ===============================
// ❌ REMOVE MEDICINE (FIXED)
// ===============================
medTagsContainer.addEventListener('click', (e) => {
  const btn = e.target.closest('.remove-med');
  if (!btn) return;

  const idx = parseInt(btn.getAttribute('data-index'));
  medicinesList.splice(idx, 1);

  renderMedTags();
});

// Attach events
analyzeBtn.addEventListener("click", analyze);
analyzeMedBtn.addEventListener("click", analyzeMedicines);

// ===============================
// 🛡️ HELPERS
// ===============================
function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/[&<>]/g, (m) => {
    if (m === '&') return '&amp;';
    if (m === '<') return '&lt;';
    if (m === '>') return '&gt;';
    return m;
  });
}

// ===============================
// 📊 STATS UPDATE
// ===============================
function updateStats() {
  medCountSpan.textContent = medicinesList.length;

  if (medicinesList.length === 0) {
    interactionRiskSpan.textContent = '—';
    interactionRiskSpan.style.color = '#64748b';
  } else {
    interactionRiskSpan.textContent = 'Ready';
    interactionRiskSpan.style.color = '#10b981';
  }
}

// ===============================
// 💊 MEDICINE TAGS
// ===============================
function renderMedTags() {
  if (medicinesList.length === 0) {
    medTagsContainer.innerHTML =
      '<div style="color:#94a3b8; width:100%; text-align:center; padding:1rem;">✨ No medicines added yet</div>';
    updateStats();
    return;
  }

  medTagsContainer.innerHTML = '';

  medicinesList.forEach((med, idx) => {
    const tag = document.createElement('div');
    tag.className = 'med-tag';

    tag.innerHTML = `
      <i class="fas fa-capsules"></i> ${escapeHtml(med)}
      <button class="remove-med" data-index="${idx}">
        <i class="fas fa-times-circle"></i>
      </button>
    `;

    medTagsContainer.appendChild(tag);
  });

  // Remove buttons
  document.querySelectorAll('.remove-med').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = parseInt(btn.getAttribute('data-index'));
      medicinesList.splice(idx, 1);
      renderMedTags();
    });
  });

  updateStats();
}

// ===============================
// ➕ ADD MEDICINE
// ===============================
function addMedicine() {
  let raw = medInput.value.trim();
  if (!raw) return;

  let parts = raw.split(',')
    .map(p => p.trim().toLowerCase())
    .filter(p => p);

  parts.forEach(p => {
    if (!medicinesList.includes(p)) {
      medicinesList.push(p);
    }
  });

  medInput.value = '';
  renderMedTags();
}

// ===============================
// 📂 FILE UPLOAD
// ===============================
uploadZone.addEventListener('click', () => fileInput.click());

fileInput.addEventListener('change', () => {
  if (fileInput.files.length > 0) {
    uploadedFile = fileInput.files[0];

    fileNameSpan.innerHTML = `
      <i class="fas fa-check-circle"></i> 
      ${escapeHtml(uploadedFile.name)}
    `;

    fileSizeSpan.textContent = (uploadedFile.size / 1024).toFixed(1) + ' KB';
    reportStatusSpan.textContent = '✅ Loaded';
    reportStatusSpan.style.color = '#10b981';
  } else {
    uploadedFile = null;
  }
});

// ===============================
// 🖱️ DRAG & DROP
// ===============================
uploadZone.addEventListener('dragover', (e) => {
  e.preventDefault();
  uploadZone.style.borderColor = '#8b5cf6';
});

uploadZone.addEventListener('dragleave', () => {
  uploadZone.style.borderColor = '#c7d2fe';
});

uploadZone.addEventListener('drop', (e) => {
  e.preventDefault();

  if (e.dataTransfer.files.length > 0) {
    fileInput.files = e.dataTransfer.files;
    fileInput.dispatchEvent(new Event('change'));
  }
});

// ===============================
// 🚀 ANALYZE REPORT (BACKEND)
// ===============================
async function analyze() {
  if (!uploadedFile) {
    alert("Please upload a report first");
    return;
  }

  const formData = new FormData();
  formData.append("report", uploadedFile);
  formData.append("medicines", JSON.stringify(medicinesList));

  try {
    analyzeBtn.innerHTML = "⏳ Analyzing...";
    analyzeBtn.disabled = true;

    const res = await fetch("http://localhost:3000/analyze", {
      method: "POST",
      body: formData
    });

    const data = await res.json();

    resultPanel.classList.remove("hidden");

    resultPanel.innerHTML = `
      <div class="result-card">
        <h2>🧠 AI Health Report</h2>

        <p><strong>Hemoglobin:</strong> ${data.hb ?? "Not found"}</p>
        <p><strong>Glucose:</strong> ${data.glucose ?? "Not found"}</p>

        <h3>⚠️ Conditions</h3>
        <ul>
          ${data.conditions.length ? data.conditions.map(c => `<li>${c}</li>`).join("") : "<li>None</li>"}
        </ul>

        <h3>🥗 Diet Recommendations</h3>
        <ul>
          ${data.diet.length ? data.diet.map(d => `<li>${d}</li>`).join("") : "<li>No suggestions</li>"}
        </ul>

        <p style="margin-top:10px; color:#64748b;">
          Medicines: ${medicinesList.join(", ") || "None"}
        </p>
      </div>
    `;

    // Risk indicator
    if (data.conditions.includes("High Blood Sugar")) {
      interactionRiskSpan.textContent = "⚠️ High";
    } else if (data.conditions.length > 0) {
      interactionRiskSpan.textContent = "⚠️ Moderate";
    } else {
      interactionRiskSpan.textContent = "✅ Low";
    }

  } catch (err) {
    console.error(err);
    alert("Error connecting to backend");
  } finally {
    analyzeBtn.innerHTML = "🧠 Analyze Report";
    analyzeBtn.disabled = false;
  }
}

// ===============================
// 💊 ANALYZE MEDICINES
// ===============================
function analyzeMedicines() {
  if (medicinesList.length < 2) {
    alert("Add at least 2 medicines");
    return;
  }

  resultPanel.classList.remove("hidden");

  resultPanel.innerHTML = `
    <div class="result-card">
      <h2>💊 Drug Interaction Check</h2>
      <p>Analyzing medicines:</p>
      <p><strong>${medicinesList.join(", ")}</strong></p>
      <p style="margin-top:10px;">⚠️ Potential interactions may exist. Consult a doctor.</p>
    </div>
  `;

  interactionRiskSpan.textContent = "⚠️ Check";
}

// ===============================
// ⚡ PRESET BUTTONS
// ===============================
document.querySelectorAll('.preset-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const meds = btn.getAttribute('data-meds');

    if (!meds) return;

    meds.split(',').forEach(med => {
      const m = med.trim().toLowerCase();
      if (m && !medicinesList.includes(m)) {
        medicinesList.push(m);
      }
    });

    renderMedTags();
  });
});

// ===============================
// 🎛️ EVENTS
// ===============================
addBtn.addEventListener('click', addMedicine);

medInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') addMedicine();
});

// ===============================
// 🚀 INIT
// ===============================
function renderMedTags() {
  if (medicinesList.length === 0) {
    medTagsContainer.innerHTML =
      '<div style="color:#94a3b8; width:100%; text-align:center; padding:1rem;">✨ No medicines added yet</div>';
    updateStats();
    return;
  }

  medTagsContainer.innerHTML = medicinesList.map((med, idx) => `
    <div class="med-tag">
      <i class="fas fa-capsules"></i> ${escapeHtml(med)}
      <button class="remove-med" data-index="${idx}">
        ❌
      </button>
    </div>
  `).join("");

  updateStats();
} 