import pdfplumber
import sys
import json

def extract_values_from_pdf(file_path):
    text = ""

    with pdfplumber.open(file_path) as pdf:
        for page in pdf.pages:
            text += page.extract_text() + "\n"

    # Simple extraction logic
    hb = None
    glucose = None

    lines = text.lower().split("\n")

    for line in lines:
        if "hemoglobin" in line or "hb" in line:
            try:
                hb = float(line.split()[-1])
            except:
                pass

        if "glucose" in line:
            try:
                glucose = float(line.split()[-1])
            except:
                pass

    return hb, glucose


def analyze(hb, glucose):
    conditions = []
    diet = []

    if hb and hb < 12:
        conditions.append("Anemia")
        diet.append("Iron-rich foods (spinach, dates)")

    if glucose and glucose > 140:
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