async function analyze() {
  const resultDiv = document.getElementById("result");

  resultDiv.innerHTML = "Analyzing...";
  resultDiv.classList.remove("hidden");

  const res = await fetch("http://localhost:5000/analyze", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      hb: 10,
      glucose: 160,
      drugs: ["aspirin", "ibuprofen"]
    }),
  });

  const data = await res.json();

  resultDiv.innerHTML = `
    <h2>Results</h2>
    <p><b>Hb:</b> ${data.hb}</p>
    <p><b>Glucose:</b> ${data.glucose}</p>
    <p><b>Conditions:</b> ${data.conditions}</p>
    <p><b>Diet:</b> ${data.diet}</p>
    <p><b>Warning:</b> ${data.warning}</p>
  `;
}