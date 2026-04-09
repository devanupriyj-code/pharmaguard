# 🏥 PharmaGuard — AI-Powered Health Insight Platform

🚀 **PharmaGuard** is an intelligent healthcare platform that analyzes medical reports, detects health risks, and ensures safe medication usage using AI.

It transforms complex medical data into **simple, actionable insights**, enabling smarter and safer healthcare decisions.

---

# 🌟 Features

## 📄 Medical Report Analysis

* Upload reports (PDF, Image, TXT)
* Extracts key health parameters like:

  * Glucose
  * Hemoglobin
  * Cholesterol
  * WBC, Platelets, etc.

---

## ⚠️ Abnormality Detection

* Detects:

  * High / Low / Normal values
* Provides:

  * Clear explanations
  * Health risk indicators

---

## 💊 Drug Interaction Checker

* Validates medicines using FDA APIs
* Detects harmful combinations
* Displays:

  * Severity (Low / Moderate / High)
  * Warnings & advice

---

## 🥗 Dietary Recommendations

* AI-generated suggestions based on report data:

  * Foods to eat 🍎
  * Foods to avoid 🚫
  * Lifestyle tips ⚠️

---

## 📊 Smart Dashboard

* Visual representation of health:

  * Health score
  * Charts (Glucose, Hb, Cholesterol)
  * Alerts system
* Tracks trends across reports

---

## 💬 AI Chatbot Assistant

* Ask health-related questions
* Uses report context
* Provides short, accurate responses

---

## 🧠 AI-Powered Logic

* Combines:

  * Rule-based analysis
  * LLM (Groq / LLaMA)
* Ready for ML integration

---

# 🛠️ Tech Stack

| Layer         | Technology                         |
| ------------- | ---------------------------------- |
| 💻 Frontend   | HTML, CSS, JavaScript              |
| ⚙️ Backend    | Node.js, Express                   |
| 🧠 AI/ML      | Python (NLP, rule-based)           |
| 📄 Processing | pdfplumber, PyMuPDF, Tesseract OCR |
| 🗄️ Database  | Firebase (Firestore)               |
| 🌐 APIs       | OpenFDA, Groq API                  |

---

# 📂 Project Structure

```
pharmaguard/
├── frontend/        # UI (HTML, CSS, JS)
├── backend/         # Node.js server
├── ai-model/        # Python processing
├── dashboard.html   # Dashboard UI
├── index.html       # Main app
├── script.js        # Frontend logic
└── README.md
```

---

# ⚙️ Installation & Setup

## 🔹 1. Clone the Repository

```
git clone https://github.com/your-username/pharmaguard.git
cd pharmaguard
```

---

## 🔹 2. Backend Setup (Node.js)

```
cd backend
npm install
```

### Install required packages:

```
npm install express multer cors axios dotenv
```

---

## 🔹 3. Python Setup (AI Processing)

Make sure Python 3.8+ is installed

Install dependencies:

```
pip install pdfplumber pymupdf pytesseract pillow
```

---

## 🔹 4. Start Backend Server

```
node server.js
```

Server runs on:

```
http://localhost:5000
```

---

## 🔹 5. Frontend Setup

Open:

```
frontend/index.html
```

OR use Live Server (recommended)

---

## 🔹 6. Firebase Setup

1. Go to Firebase Console
2. Create project
3. Enable Firestore Database
4. Copy config into your code:

```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID"
};
```

---

# ⚙️ How It Works

1️⃣ Upload medical report
2️⃣ Python extracts health values
3️⃣ Node.js processes data
4️⃣ AI analyzes conditions
5️⃣ Medicines are validated
6️⃣ Interactions are detected
7️⃣ Diet & precautions generated
8️⃣ Results shown on dashboard

---

# 🧠 Example Output

### Input:

```
Hemoglobin: 9.5 g/dL  
Medicines: Iron + Antacid
```

### Output:

```
❌ Low Hemoglobin (Possible anemia)
⚠️ Drug interaction detected
🥗 Avoid tea/coffee near medication
💡 Suggested precautions provided
```

---

# 🎯 Use Cases

* 👤 Patients understanding reports
* 💊 Safe medication usage
* ⚠️ Early risk detection
* 🏥 Healthcare assistance tools

---

# 🔮 Future Scope

* 📱 Mobile app
* 🤖 AI disease prediction
* 🧑‍⚕️ Doctor integration
* 🏥 Hospital system integration
* 📊 Advanced analytics dashboard

---

# 👥 Team

* Devanupriy Jain
* Sarthak Narang
* Apoorva Sahu
* Arush maheshwari

---

# 📌 Note

This project was developed during a hackathon to demonstrate how AI can make healthcare:

✔ More accessible
✔ Safer
✔ Intelligent

---

# ⭐ Support

If you like this project:

👉 Give it a ⭐ on GitHub

---

# 📜 License

For educational and hackathon purposes.
