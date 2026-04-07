# 🏥 PharmaGuard

### ⚡ AI-Powered Health Insight Platform

![React](https://img.shields.io/badge/Frontend-React-blue)
![Node](https://img.shields.io/badge/Backend-Node.js-green)
![Python](https://img.shields.io/badge/AI-Python-yellow)

---

## 🚀 Overview

PharmaGuard is an intelligent healthcare platform designed to help users understand medical reports, detect health risks, and avoid harmful drug interactions.

It transforms complex medical data into simple, actionable insights, enabling safer, smarter, and more proactive healthcare decisions.

---

## ✨ Key Features

### 📄 Medical Report Analysis

* Extracts key health parameters from uploaded reports (PDF/Image)

### ⚠️ Abnormality Detection

* Identifies health risks with simple explanations

### 💊 Drug Interaction Checker

* Detects unsafe medicine combinations
* Highlights duplicate ingredients and risks

### 🥗 Dietary Recommendations

* Suggests:

  * What to eat
  * What to avoid
  * Meal ideas & lifestyle tips

### 📊 Smart Dashboard

* Clean UI to display insights

### 🧠 AI-Powered Logic

* Rule-based system (ML-ready for future upgrades)

---

## 🛠️ Tech Stack

| Layer         | Technology                         |
| ------------- | ---------------------------------- |
| 💻 Frontend   | HTML, CSS, JavaScript / React      |
| ⚙️ Backend    | Node.js, Express                   |
| 🧠 AI         | Python                             |
| 📄 Processing | pdfplumber, PyMuPDF, Tesseract OCR |
| 🗄️ Database  | MongoDB / Firebase (optional)       |
---

## 📂 Project Structure

```
pharmaguard/
├── frontend/              # UI
│   ├── index.html
│   ├── style.css
│   └── script.js
│
├── backend/               # Server
│   └── server.js
│
├── ai-model/              # AI Engine
│   ├── main.py
│   ├── analyzer.py
│   ├── medicine_analyzer.py
│   └── food_recommender.py
│
└── README.md
```

---

## ⚙️ How It Works

1️⃣ Upload medical report (PDF)
2️⃣ Extract health data
3️⃣ Analyze values using AI logic
4️⃣ Input medicines
5️⃣ Detect drug interactions
6️⃣ Generate food recommendations
7️⃣ Display results

---

## 🧠 Example

**Input:**

```
Hemoglobin: 9.5 g/dL
Medicines: Crocin, Combiflam
```

**Output:**

```
❌ Anemia detected  
⚠️ Duplicate ingredient (Paracetamol)  
🥗 Avoid tea/coffee with iron  
💡 Suggested diet & precautions  
```

---

# 🧪 Installation & Setup Guide

## 🔹 1. Clone the Repository

```bash
git clone https://github.com/your-username/pharmaguard.git
cd pharmaguard
```

---

## 🔹 2. Setup Backend (Node.js)

```bash
cd backend
npm install
```

### Install required packages:

```bash
npm install express cors
```

### Run backend:

```bash
node server.js
```

---

## 🔹 3. Setup Python AI

Go to AI folder:

```bash
cd ../ai-model
```

### Install dependencies:

```bash
pip install pdfplumber
pip install pymupdf
pip install pytesseract
```

(If using Windows, also install Tesseract OCR separately)

---

## 🔹 4. Run AI Manually (Test)

```bash
python main.py sample.pdf crocin,combiflam
```

---

## 🔹 5. Run Frontend

Open:

```bash
frontend/index.html
```

OR use Live Server in VS Code

---

# 🚀 Future Scope

* 📱 Mobile app
* 🤖 ML-based predictions
* 🏥 Hospital integration
* 💊 Real drug APIs
* 📊 Advanced dashboard

---

# 👥 Team

* Devanupriy Jain
* Sarthak Narang
* Apoorva Sahu
* Arush Maheshwari

---

# 📌 Note

This project is built during a hackathon to demonstrate how AI can simplify healthcare and improve decision-making.

---

# ⭐ Support

If you like this project, give it a ⭐ on GitHub!

---

# 📜 License

For educational and hackathon purposes.
