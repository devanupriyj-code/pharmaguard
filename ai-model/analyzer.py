import pdfplumber
import re
import json
import sys

# ==============================
# 📄 Extract values + ranges from PDF
# ==============================
def extract_values_from_pdf(file_path):
    text = ""

    with pdfplumber.open(file_path) as pdf:
        for page in pdf.pages:
            extracted = page.extract_text()
            if extracted:
                text += extracted + "\n"

    text = text.lower()

    data = {}

    # 🔥 Strong patterns (real-world matching)
    patterns = {
        "glucose": r"(glucose|fasting blood glucose)[^\d]*(\d+\.?\d*)[^\d]*(\d+\.?\d*\s*-\s*\d+\.?\d*|<\s*\d+)?",
        "cholesterol": r"(cholesterol|total cholesterol)[^\d]*(\d+\.?\d*)[^\d]*(<\s*\d+\.?\d*)?",
        "creatinine": r"(creatinine)[^\d]*(\d+\.?\d*)[^\d]*(\d+\.?\d*\s*-\s*\d+\.?\d*)?",
        "vitamin_d": r"(vitamin d)[^\d]*(\d+\.?\d*)[^\d]*(\d+\.?\d*\s*-\s*\d+\.?\d*)?",
        "hb": r"(hemoglobin|hb)[^\d]*(\d+\.?\d*)[^\d]*(\d+\.?\d*\s*-\s*\d+\.?\d*)?",
        "wbc": r"(wbc|white blood)[^\d]*(\d+\.?\d*)[^\d]*(\d+\.?\d*\s*-\s*\d+\.?\d*)?",
        "platelets": r"(platelet)[^\d]*(\d+\.?\d*)[^\d]*(\d+\.?\d*\s*-\s*\d+\.?\d*)?"
    }

    for key, pattern in patterns.items():
        match = re.search(pattern, text)

        if match:
            value = float(match.group(2)) if match.group(2) else None
            range_value = match.group(3).replace(" ", "") if match.group(3) else None

            data[key] = {
                "value": value,
                "range": range_value
            }

    return data


# ==============================
# 🚀 MAIN ENTRY (for Node.js)
# ==============================
if __name__ == "__main__":
    try:
        file_path = sys.argv[1]

        result = extract_values_from_pdf(file_path)

        print(json.dumps(result))

    except Exception as e:
        print(json.dumps({"error": str(e)}))