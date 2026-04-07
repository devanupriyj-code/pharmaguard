import pdfplumber
import re

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


def analyze_report(data):
    conditions = []

    if "hb" in data and data["hb"] < 12:
        conditions.append("Anemia")

    if "glucose" in data and data["glucose"] > 140:
        conditions.append("High Blood Sugar")

    if "cholesterol" in data and data["cholesterol"] > 200:
        conditions.append("High Cholesterol")

    if "vitamin_d" in data and data["vitamin_d"] < 30:
        conditions.append("Vitamin D Deficiency")

    return conditions