# -------------------------------------------------------------------------------- 
# Author:       Tim Allec
# File name:    cluster_5_similiar_zipcodes.py
# Date Created: 2024-09-12
#
# Description: This script processes ZIP code demographic data to identify the most 
#              demographically similar ZIP codes using t-SNE dimensionality reduction 
#              and Euclidean distance for similarity. It uses the same method as the 
#              2D visualization script to ensure consistency in clustering methodology.
#              The results are saved as a JSON file for further visualization and analysis.
#
# Usage: Run this script to analyze ZIP code similarities and generate 'zip_code_similarities.json' 
#        containing the most similar ZIP codes for each ZIP code in the dataset.
# --------------------------------------------------------------------------------

import pandas as pd
from sklearn.manifold import TSNE
from sklearn.metrics.pairwise import euclidean_distances
from sklearn.preprocessing import StandardScaler
import numpy as np
import json
from tqdm import tqdm
import time

# Load data from local CSV files
census_data_path = './src/assets/data/census_zipcode_percentages.csv'
enrollment_data_path = './src/assets/data/enrollment 2019-2023.csv'

census_data = pd.read_csv(census_data_path)
enrollment_data = pd.read_csv(enrollment_data_path)

# Check column names in enrollment data to avoid KeyError
print("Enrollment Data Columns:", enrollment_data.columns)

# Use the correct column name for ZIP codes
zip_code_column = 'Mailing Zip/Postal Code'

# Ensure both Zip_Code columns are of the same type (string) before merging
# Remove rows with empty or invalid ZIP codes before counting
enrollment_data = enrollment_data[enrollment_data[zip_code_column].notnull()]
enrollment_data[zip_code_column] = enrollment_data[zip_code_column].str.strip()

census_data['Zip_Code'] = census_data['Zip_Code'].astype(str)

# 1. Count the occurrences of each ZIP code in the enrollment dataset
zip_code_counts = enrollment_data[zip_code_column].value_counts().reset_index()
zip_code_counts.columns = ['Zip_Code', 'Count']

# Limit to top 50 ZIP codes by count
top_50_zip_codes = zip_code_counts.head(50)

print("Top 50 ZIP Codes by number of students:")
print(top_50_zip_codes)

# Limit features to align with the 2D map script
features = ['Population', 'Median_Income', 'Bachelor_Degree', 'Graduate_Professional_Degree',
            'White_Alone', 'Black_Alone', 'Hispanic_Latino', 'Unemployment', 'Median_Home_Value']

print("Numerical features used for similarity calculation:", features)

# Replace NULL (NaN) values with 0 or the median average for that column
census_data.fillna({
    'Population': 0,
    'Median_Income': census_data['Median_Income'].median(),
    'Bachelor_Degree': 0,
    'Graduate_Professional_Degree': 0,
    'White_Alone': 0,
    'Black_Alone': 0,
    'Hispanic_Latino': 0,
    'Unemployment': census_data['Unemployment'].median(),
    'Median_Home_Value': census_data['Median_Home_Value'].median()
}, inplace=True)

# Standardize the data
scaler = StandardScaler()
census_data_scaled = scaler.fit_transform(census_data[features])

# Perform t-SNE to reduce data to 2D space
print("Performing t-SNE dimensionality reduction...")
start_time = time.time()
tsne = TSNE(n_components=2, random_state=42, perplexity=10, learning_rate=200, init='random')
census_data_2d = tsne.fit_transform(census_data_scaled)
print(f"t-SNE completed in {time.time() - start_time:.2f} seconds.")

# Merge census data with the top 50 enrollment data based on ZIP codes
merged_data = pd.merge(top_50_zip_codes, census_data[['Zip_Code'] + features], on='Zip_Code', how='left')

# Initialize a list to hold the output for saving to JSON
output_data = []

# Calculate top 5 most demographically similar ZIP codes using Euclidean distance
print(f"Calculating top 5 similar ZIP codes for the top 50 ZIP codes...")

for index, row in tqdm(merged_data.iterrows(), total=len(merged_data), desc="Processing ZIP Codes"):
    zip_output = {
        "zip_code": row['Zip_Code'],
        "count": row['Count'],
        "similar_zips": []
    }

    if row['Zip_Code'] not in census_data['Zip_Code'].values:
        print(f"ZIP Code {row['Zip_Code']} not found in census data. Skipping.")
        continue

    current_zip_index = census_data[census_data['Zip_Code'] == row['Zip_Code']].index[0]
    current_zip_features = census_data_2d[current_zip_index].reshape(1, -1)
    all_other_zips_features = census_data_2d[census_data['Zip_Code'] != row['Zip_Code']]

    distances = euclidean_distances(current_zip_features, all_other_zips_features).flatten()

    top_5_indices = np.argsort(distances)[:5]
    similar_zips = census_data[census_data['Zip_Code'] != row['Zip_Code']].iloc[top_5_indices]

    for i, similar_zip_row in enumerate(similar_zips.itertuples()):
        zip_output['similar_zips'].append({
            "zip_code": str(similar_zip_row.Zip_Code),
            "population": int(similar_zip_row.Population) if not pd.isna(similar_zip_row.Population) else None,
            "median_income": int(similar_zip_row.Median_Income) if not pd.isna(similar_zip_row.Median_Income) else None,
            "similarity": float(round(1 / (float(distances[top_5_indices[i]]) + 1e-5), 4))
        })

    output_data.append(zip_output)

print("Finished calculating similarities for the top 50 ZIP codes.")

output_file = "./src/assets/data/zip_code_similarities.json"
with open(output_file, 'w') as f:
    json.dump(output_data, f, indent=4)

print(f"\nData successfully saved to {output_file}")
