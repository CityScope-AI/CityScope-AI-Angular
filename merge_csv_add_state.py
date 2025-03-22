import pandas as pd

# Load the merged census file and city images file
census_city_df = pd.read_csv('merged_census_with_city_state.csv')
city_images_df = pd.read_csv('city_images.csv')

# Optional: Strip whitespace from City and Image_URL columns
city_images_df['City'] = city_images_df['City'].str.strip()
city_images_df['Image_URL'] = city_images_df['Image_URL'].str.strip()

# Merge on 'City' column (left join so we retain all census rows)
final_df = census_city_df.merge(city_images_df, on='City', how='left')

# Fill missing Image_URLs with default
final_df['Image_URL'] = final_df['Image_URL'].fillna('No image available')

# Save to new CSV
final_df.to_csv('final_census_with_images.csv', index=False)

print("✅ Final merged file created: final_census_with_images.csv")
