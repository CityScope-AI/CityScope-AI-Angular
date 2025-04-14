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

# Ensure the columns are present
required_cols = ["Zip_Code", "City", "State", "Image_Path"]
missing_cols = [col for col in required_cols if col not in df.columns]
if missing_cols:
    raise ValueError(f"Missing column(s) in the CSV: {missing_cols}")

# Iterate over each row to find the images if they exist
for index, row in df.iterrows():
    zip_code = row["Zip_Code"]
    state = row["State"]

    # Skip if State is blank or NaN (we wouldn't know which folder)
    if not state or pd.isna(state):
        continue

    # Build a glob pattern:
    #   base_image_dir / state / zip_code / *.*
    # Adjust the pattern to target the specific file naming or extension you expect
    zip_image_dir = os.path.join(base_image_dir, state, zip_code)
    pattern = os.path.join(zip_image_dir, "*")

    # Search for any file inside that {State}/{Zip_Code} folder
    matches = glob.glob(pattern)

    # If at least one match is found, pick the first
    if matches:
        df.at[index, "Image_Path"] = matches[0]
    else:
        # No image found => keep "No image available"
        df.at[index, "Image_Path"] = "No image available"

# Write out the updated CSV
df.to_csv(output_csv, index=False)

print(f"Merged CSV with image paths written to: {output_csv}")