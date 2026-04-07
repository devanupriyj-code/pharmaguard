import sys
import json

from analyzer import extract_values_from_pdf, analyze_report
from medicine_analyzer import check_medicines
from food_recommender import recommend_food

if __name__ == "__main__":
    try:
        # ==============================
        # 📥 INPUT FROM NODE
        # ==============================
        file_path = sys.argv[1] if len(sys.argv) > 1 else "null"
        medicines = sys.argv[2].split(",") if len(sys.argv) > 2 and sys.argv[2] else []

        # ==============================
        # 📄 STEP 1: EXTRACT DATA (SAFE)
        # ==============================
        if not file_path or file_path == "null":
            data = {}  # No report uploaded
        else:
            data = extract_values_from_pdf(file_path)

        # ==============================
        # ⚠️ STEP 2: ANALYZE REPORT
        # ==============================
        conditions = analyze_report(data) if data else []

        # ==============================
        # 💊 STEP 3: MEDICINE CHECK
        # ==============================
        med_result = check_medicines(medicines) if medicines else {}

        # ==============================
        # 🥗 STEP 4: FOOD RECOMMENDATION
        # ==============================
        food = recommend_food(conditions) if conditions else []

        # ==============================
        # 📤 FINAL RESPONSE
        # ==============================
        result = {
            "values": data,
            "conditions": conditions,
            "medicine_analysis": med_result,
            "food_recommendations": food
        }

        # ✅ ONLY JSON OUTPUT (VERY IMPORTANT)
        print(json.dumps(result))

    except Exception as e:
        # ❌ SEND ERROR AS JSON (so Node doesn't crash)
        error_result = {
            "error": str(e)
        }
        print(json.dumps(error_result))