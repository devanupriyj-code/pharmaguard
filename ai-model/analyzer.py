def analyze_report(data):
    result = {}

    if data["hemoglobin"] < 12:
        result["hemoglobin"] = "Low (Possible anemia)"

    return result

# test
print(analyze_report({"hemoglobin": 9.5}))