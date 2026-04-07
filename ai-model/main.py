import sys
import json

from analyzer import extract_values_from_pdf


if __name__ == "__main__":
    try:
        # ==============================
        # 📥 INPUT FROM NODE
        # ==============================
        file_path = sys.argv[1] if len(sys.argv) > 1 else None

        # ==============================
        # 📄 EXTRACT VALUES ONLY
        # ==============================
        if not file_path or file_path == "null":
            data = {}
        else:
            data = extract_values_from_pdf(file_path)

        # ==============================
        # 📤 FINAL RESPONSE
        # ==============================
        result = {
            "values": data
        }

        # ✅ ONLY JSON OUTPUT
        print(json.dumps(result, ensure_ascii=False))

    except Exception as e:
        # ==============================
        # ❌ ERROR HANDLING
        # ==============================
        error_result = {
            "error": str(e)
        }

        print(json.dumps(error_result, ensure_ascii=False))