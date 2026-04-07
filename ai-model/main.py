import sys
import json

from analyzer import extract_values_from_pdf, analyze_report
from medicine_analyzer import check_medicines
from food_recommender import recommend_food


if __name__ == "__main__":
    file_path = sys.argv[1]

    # medicines passed as comma-separated string
    medicines = sys.argv[2].split(",") if len(sys.argv) > 2 else []

    # Step 1: Extract data
    data = extract_values_from_pdf(file_path)

    # Step 2: Analyze report
    conditions = analyze_report(data)

    # Step 3: Check medicines
    med_result = check_medicines(medicines)

    # Step 4: Recommend food
    food = recommend_food(conditions)

    result = {
        "values": data,
        "conditions": conditions,
        "medicine_analysis": med_result,
        "food_recommendations": food
    }

    print("\n========== 🏥 PharmaGuard Report ==========\n")

# 🧪 Values
print("🔬 Extracted Values:")
for key, value in result["values"].items():
    print(f"  - {key.upper()}: {value}")

# ⚠️ Conditions
print("\n⚠️ Detected Conditions:")
if result["conditions"]:
    for cond in result["conditions"]:
        print(f"  - {cond}")
else:
    print("  - None")

# 💊 Medicine Analysis
print("\n💊 Medicine Analysis:")
print("  Ingredients:", ", ".join(result["medicine_analysis"]["ingredients"]))

if result["medicine_analysis"]["warnings"]:
    print("  ⚠️ Warnings:")
    for w in result["medicine_analysis"]["warnings"]:
        print(f"    - {w}")
else:
    print("  No warnings")

# 🥗 Food Recommendations
print("\n🥗 Food Recommendations:")
for rec in result["food_recommendations"]:
    print(f"\n👉 {rec['condition']}")
    print("  Nutrients:", ", ".join(rec["nutrients"]))
    print("  Foods:", ", ".join(rec["foods"]))
    print("  Avoid:", ", ".join(rec["avoid"]))
    print("  Meals:", ", ".join(rec["meals"]))
    print("  Tip:", rec["tips"][0])

    print("  Avoid:")
for item in rec["avoid"]:
    print(f"    - {item}")

print("\n==========================================\n")