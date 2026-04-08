import sys
import json
from analyzer import extract_values_from_pdf

if __name__ == "__main__":
    try:
        file_path = sys.argv[1] if len(sys.argv) > 1 else None

        if not file_path or file_path == "null":
            data = {}
        else:
            data = extract_values_from_pdf(file_path)

        result = {
            "values": data
        }

        print(json.dumps(result, ensure_ascii=False))

    except Exception as e:
        print(json.dumps({"error": str(e)}, ensure_ascii=False))