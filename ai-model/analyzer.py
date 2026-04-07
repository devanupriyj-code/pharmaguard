import pdfplumber
import sys
import json
import re   # ✅ NEW

def extract_values_from_pdf(file_path):
    text = ""

    with pdfplumber.open(file_path) as pdf:
        for page in pdf.pages:
            extracted = page.extract_text()
            if extracted:
                text += extracted + "\n"

    hb = None
    glucose = None

    lines = text.lower().split("\n")

    for line in lines:
        # 🧠 DEBUG (optional)
        # print(line)

        # 🩸 Hemoglobin
        if "hemoglobin" in line:
            match = re.search(r"\d+\.?\d*", line)
            if match:
                hb = float(match.group())

        # 🍬 Glucose (handles "fasting blood glucose")
        if "glucose" in line:
            match = re.search(r"\d+\.?\d*", line)
            if match:
                glucose = float(match.group())

    return hb, glucose


def analyze(hb, glucose):
    conditions = []
    diet = []

    if hb is not None and hb < 12:
        conditions.append("Anemia")
        diet.append("Iron-rich foods (spinach, dates)")

    if glucose is not None and glucose > 140:
        conditions.append("High Blood Sugar")
        diet.append("Avoid sugar, eat fiber-rich foods")

    return conditions, diet


if __name__ == "__main__":
    file_path = sys.argv[1]

    hb, glucose = extract_values_from_pdf(file_path)
    conditions, diet = analyze(hb, glucose)

    result = {
        "hb": hb,
        "glucose": glucose,
        "conditions": conditions,
        "diet": diet
    }

    print(json.dumps(result))