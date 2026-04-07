import pdfplumber
import re

# ==============================
# 📄 Extract values from PDF
# ==============================
def extract_values_from_pdf(file_path):
    text = ""

    with pdfplumber.open(file_path) as pdf:
        for page in pdf.pages:
            extracted = page.extract_text()
            if extracted:
                text += extracted + "\n"

    lines = text.lower().split("\n")

    data = {}

    keywords = {
        "hemoglobin": "hb",
        "glucose": "glucose",
        "cholesterol": "cholesterol",
        "creatinine": "creatinine",
        "vitamin d": "vitamin_d",
        "wbc": "wbc",
        "platelet": "platelets"
    }

    for line in lines:
        for key in keywords:
            if key in line:
                match = re.search(r"\d+\.?\d*", line)
                if match:
                    data[keywords[key]] = float(match.group())

    return data


# ==============================
# 🧠 Basic rule-based analysis
# ==============================
