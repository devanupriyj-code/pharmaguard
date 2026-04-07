def check_medicines(medicines):
    medicine_db = {
        "crocin": ["paracetamol"],
        "combiflam": ["ibuprofen", "paracetamol"],
        "aspirin": ["acetylsalicylic acid"]
    }

    ingredients = []
    warnings = []

    for med in medicines:
        med = med.lower()
        if med in medicine_db:
            ingredients.extend(medicine_db[med])

    # Check duplicate ingredients
    duplicates = set([x for x in ingredients if ingredients.count(x) > 1])

    if duplicates:
        warnings.append(f"Duplicate ingredient risk: {', '.join(duplicates)}")

    return {
        "ingredients": ingredients,
        "warnings": warnings
    }