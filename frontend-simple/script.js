// ==============================
// 📁 ELEMENTS
// ==============================
const fileInput = document.getElementById("reportFile");
const resultPanel = document.getElementById("resultPanel");

let medicines = [];
let lastAIResponse = null;

// ==============================
// 🔥 FIREBASE SAVE
// ==============================
async function saveReportToFirebase(data) {
  try {
    const { addDoc, collection } = await import(
      "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js"
    );
    await addDoc(collection(db, "reports"), {
  values: data.extracted || {},
  medicines: medicines,
  interactions: data.ai?.interactions || [],
  diet: data.ai?.diet || [],
  precautions: data.ai?.precautions || [],
  date: new Date().toISOString(),
});

    console.log("✅ Saved to Firebase");

  } catch (err) {
    console.error("❌ Firebase error:", err);
  }
}

// ==============================
// 📄 FILE NAME
// ==============================
fileInput.addEventListener("change", () => {
  document.getElementById("file-name").textContent =
    fileInput.files[0]?.name || "No file selected";
});

// ==============================
// 🧠 ANALYZE
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

    lastAIResponse = data;

    renderReport(data);
    updateRiskLevel();

    // 🔥 SAVE + REFRESH
    saveReportToFirebase(data);
    loadHistory();

    // ==============================
    // 📊 COMPARE WITH PREVIOUS
    // ==============================
    const { getDocs, collection, query, orderBy, limit } = await import(
      "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js"
    );

    const q = query(
      collection(window.db, "reports"),
      orderBy("date", "desc"),
      limit(2)
    );

    const snapshot = await getDocs(q);

    let reports = [];
    snapshot.forEach(doc => reports.push(doc.data()));

    if (reports.length === 2) {
      const comparison = compareReports(
        reports[1].values,
        reports[0].values
      );

      renderComparison(comparison);
    }

  } catch (err) {
    console.error(err);
  }
}

document.getElementById("analyzeReportBtn").addEventListener("click", analyzeReport);

// ==============================
// 🧠 PROCESS DATA
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
// 📊 COMPARE FUNCTION
// ==============================
function compareReports(oldVals, newVals) {
  const result = [];

  for (let key in newVals) {
    if (oldVals[key]) {
      const oldVal = oldVals[key].value;
      const newVal = newVals[key].value;

      let trend = "same";

      if (newVal > oldVal) trend = "increase";
      else if (newVal < oldVal) trend = "decrease";

      result.push({
        key,
        old: oldVal,
        new: newVal,
        trend
      });
    }
  }

  return result;
}

document.getElementById("dashboardBtn")?.addEventListener("click", () => {
  window.location.href = "dashboard.html";
});

// ==============================
// 📊 RENDER COMPARISON
// ==============================
function renderComparison(data) {
  let html = `
    <div style="margin-top:15px;">
      <h3>📊 Health Trends</h3>
  `;

  data.forEach(item => {
    const goodIncrease = ["hb", "vitamin_d"];

    let color = "gray";

    if (item.trend === "increase") {
      color = goodIncrease.includes(item.key) ? "green" : "red";
    }
    else if (item.trend === "decrease") {
      color = goodIncrease.includes(item.key) ? "red" : "green";
    }

    let symbol =
      item.trend === "increase" ? "⬆️" :
      item.trend === "decrease" ? "⬇️" : "➡️";

    html += `
      <p style="color:${color};">
        ${item.key}: ${item.old} → ${item.new} ${symbol}
      </p>
    `;
  });

  html += `</div>`;

  const card = document.querySelector(".result-card");
  if (card) {
    card.innerHTML += html;
  }
}

// ==============================
// 🎨 UI
// ==============================
function renderReport(data) {
  const ai = data.ai || {};
  const analyzed = data.analyzed || [];

  const interactions = ai.interactions || [];
  const diet = ai.diet || [];
  const precautions = ai.precautions || [];

  let html = `<div class="result-card">`;

  html += `<div><h3 onclick="toggleSection(this)">🧪 Health Values ▼</h3><div style="display:block;">`;

  analyzed.forEach(item => {
    const color =
      item.status === "high" ? "red" :
      item.status === "low" ? "orange" : "green";

    html += `<p style="border-left:4px solid ${color}; padding-left:8px;">
      <strong>${item.key}</strong>: ${item.value}
      <span style="color:${color};">(${item.status})</span>
    </p>`;
  });

  html += `</div></div>`;

  html += `<div><h3 onclick="toggleSection(this)">💊 Drug Interactions ▼</h3><div style="display:block;">`;

  if (medicines.length === 0) {
    html += `<p>No medicines provided</p>`;
  }
  else if (interactions[0]?.severity === "Invalid") {
    html += `<div style="background:#ffe6e6;border-left:5px solid red;padding:10px;color:red;">
      ⚠️ ${interactions[0].advice}
    </div>`;
  }
  else if (interactions.length === 0) {
    html += `<p style="color:green;">No harmful interactions</p>`;
  }
  else {
    interactions.forEach((i, index) => {
      html += `<div onclick="toggleDetail(${index})" style="cursor:pointer;padding:10px;">
        <b>${i.drugs.join(" + ")} → ${i.severity}</b>
        <div id="detail-${index}" style="display:none;">${i.advice}</div>
      </div>`;
    });
  }

  html += `</div></div>`;

  html += `<div><h3 onclick="toggleSection(this)">🥗 Diet ▼</h3><div style="display:none;">`;
  diet.forEach(d => {
    html += `<p>🍎 ${d.food} - ${d.benefit}</p>`;
  });
  html += `</div></div>`;

  html += `<div><h3 onclick="toggleSection(this)">🛡️ Precautions ▼</h3><div style="display:none;">`;
  precautions.forEach(p => {
    html += `<p>⚠️ ${p.step} - ${p.reason}</p>`;
  });
  html += `</div></div>`;

  html += `</div>`;
  resultPanel.innerHTML = html;
}

// ==============================
// 🔁 TOGGLES
// ==============================
function toggleSection(el) {
  const content = el.nextElementSibling;
  content.style.display =
    content.style.display === "none" ? "block" : "none";
}

function toggleDetail(index) {
  const el = document.getElementById(`detail-${index}`);
  el.style.display =
    el.style.display === "none" ? "block" : "none";
}

// ==============================
// 💊 MEDICINES
// ==============================
document.getElementById("addMedBtn").onclick = () => {
  const input = document.getElementById("medInput");
  const med = input.value.trim().toLowerCase();

  if (!med) return;

  if (!medicines.includes(med)) medicines.push(med);

  input.value = "";
  renderMeds();
  analyzeReport();
};

document.querySelectorAll(".preset-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    const meds = btn.innerText.toLowerCase().split("+").map(m => m.trim());

    meds.forEach(m => {
      if (!medicines.includes(m)) medicines.push(m);
    });

    renderMeds();
    analyzeReport();
  });
});

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
// 🔥 RISK LEVEL
// ==============================
function updateRiskLevel() {
  const risk = document.getElementById("riskLevel");

  if (!lastAIResponse) return;

  const interactions = lastAIResponse.ai?.interactions || [];

  if (interactions[0]?.severity === "Invalid") {
    risk.textContent = "Invalid";
    risk.style.color = "red";
    return;
  }

  if (medicines.length === 0) risk.textContent = "-";
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

// ==============================
// 📁 LOAD HISTORY
// ==============================
async function loadHistory() {
  try {
    const { getDocs, collection, query, orderBy, deleteDoc, doc } = await import(
      "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js"
    );

    const q = query(
      collection(window.db, "reports"),
      orderBy("date", "desc")
    );

    const snapshot = await getDocs(q);

    const historyList = document.getElementById("historyList");
    if (!historyList) return;

    historyList.innerHTML = "";

    snapshot.forEach((docSnap) => {
      const data = docSnap.data();

      const item = document.createElement("div");
      item.style = `
        padding:10px;
        margin:8px 0;
        background:#f3f3f3;
        border-radius:6px;
        display:flex;
        justify-content:space-between;
        align-items:center;
      `;

      item.innerHTML = `
        <div>
          <b>${(data.medicines || []).join(", ")}</b><br/>
          <small>${new Date(data.date).toLocaleString()}</small>
        </div>
        <button style="background:red;color:white;border:none;padding:6px 10px;border-radius:4px;cursor:pointer;">🗑️</button>
      `;

      const deleteBtn = item.querySelector("button");
      deleteBtn.onclick = async (e) => {
        e.stopPropagation();
        await deleteDoc(doc(window.db, "reports", docSnap.id));
        loadHistory();
      };

      item.onclick = () => {
        medicines = data.medicines || [];
        renderMeds();

        const reconstructed = {
          extracted: data.values,
          analyzed: processHealthData(data.values),
          ai: {
            interactions: data.interactions || [],
            diet: data.diet || [],
            precautions: data.precautions || []
          }
        };

        renderReport(reconstructed);

        lastAIResponse = {
          ai: {
            interactions: data.interactions || []
          }
        };

        updateRiskLevel();
        resultPanel.classList.remove("hidden");
      };

      historyList.appendChild(item);
    });

  } catch (err) {
    console.error("History load error:", err);
  }
}

// ==============================
// 🔁 LOAD ON START
// ==============================
window.onload = () => {
  loadHistory();
};

// ==============================
// 💬 CHATBOT FUNCTION (ADDED ONLY)
// ==============================
async function sendMessage() {
  const input = document.getElementById("chatInput");
  const chat = document.getElementById("chatMessages");

  const message = input.value.trim();
  if (!message) return;

  chat.innerHTML += `<p><b>You:</b> ${message}</p>`;
  input.value = "";

  try {
    const res = await fetch("http://localhost:5000/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        message,
        report: lastAIResponse
      })
    });

    const data = await res.json();

    chat.innerHTML += `<p><b>AI:</b> ${data.reply}</p>`;
    chat.scrollTop = chat.scrollHeight;

  } catch (err) {
    chat.innerHTML += `<p style="color:red;">Error connecting to AI</p>`;
  }
}
// ==============================
// 🖱️ DRAG CHATBOT (ADD BELOW EVERYTHING)
// ==============================
// ==============================
// 🖱️ DRAG CHATBOT (FINAL FIX)
// ==============================
window.addEventListener("load", () => {

  const chatbot = document.getElementById("chatbot");
  const header = document.getElementById("chatHeader");

  if (!chatbot || !header) return;

  let isDragging = false;
  let offsetX = 0;
  let offsetY = 0;

  header.onmousedown = (e) => {
    isDragging = true;

    offsetX = e.clientX - chatbot.getBoundingClientRect().left;
    offsetY = e.clientY - chatbot.getBoundingClientRect().top;

    document.body.style.userSelect = "none";
  };

  document.onmousemove = (e) => {
    if (!isDragging) return;

    chatbot.style.left = (e.clientX - offsetX) + "px";
    chatbot.style.top = (e.clientY - offsetY) + "px";

    chatbot.style.bottom = "auto";
    chatbot.style.right = "auto";
  };

  document.onmouseup = () => {
    isDragging = false;
    document.body.style.userSelect = "auto";
  };

});
// ==============================
// 🔐 AUTH SYSTEM
// ==============================

// ==============================
// 🔐 AUTH SYSTEM (FINAL FIX)
// ==============================

