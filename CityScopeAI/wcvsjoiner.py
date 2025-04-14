import os
import glob
import pandas as pd

# Path to the input CSV file
input_csv = r"/mnt/c/Users/User/Desktop/Cappystone/Real-Capstone/CityScope-AI-Angular/CityScopeAI/src/assets/data/zip_city_state_with_images_updated.csv"

# Path to where the updated CSV should be saved
output_csv = r"/mnt/c/Users/User/Desktop/Cappystone/Real-Capstone/CityScope-AI-Angular/CityScopeAI/src/assets/data/zip_city_state_with_images_updated(2).csv"

# Base directory where state folders and images live
base_image_dir = r"/mnt/c/Users/User/Desktop/Cappystone/Real-Capstone/CityScope-AI-Angular/CityScopeAI/src/assets/data/us_state_images"

df = pd.read_csv(input_csv, dtype=str)

required_cols = ["Zip_Code", "City", "State", "Image_Path"]
for col in required_cols:
    if col not in df.columns:
        raise ValueError(f"Missing '{col}' in CSV.")

for index, row in df.iterrows():
    zip_code = (row["Zip_Code"] or "").strip()  # strip spaces
    state = (row["State"] or "").strip()

    # If state is empty, skip
    if not state:
        continue

    # Build pattern: e.g. .../Massachusetts/01602.*
    pattern = os.path.join(base_image_dir, state, f"{zip_code}.*")

    # Debug prints
    print(f"Row {index}: ZIP='{zip_code}', State='{state}'")
    print("  Searching with glob pattern:", pattern)

    matches = glob.glob(pattern)
    print("  Matches found:", matches)

    if matches:
        df.at[index, "Image_Path"] = matches[0]
    else:
        df.at[index, "Image_Path"] = "No image available"

df.to_csv(output_csv, index=False)
print(f"Merged CSV saved to {output_csv}")