# -*- coding: utf-8 -*-

import requests
from bs4 import BeautifulSoup
import os
import glob

# Base URL for Wikipedia
BASE_URL = "https://en.wikipedia.org"

# Define headers to mimic a browser and identify your scraper
headers = {
    'User-Agent': 'Mozilla/5.0 (compatible; MyScraper/1.0; +http://example.com/my-scraper)'
}

def get_category_pages(category_url, visited=None):
    """
    Recursively scrapes a Wikipedia category page for city links,
    including those from any subcategories and paginated pages.
    """
    if visited is None:
        visited = set()
    if category_url in visited:
        return []
    visited.add(category_url)
    
    try:
        response = requests.get(category_url, headers=headers)
    except Exception as e:
        print(f"Error accessing {category_url}: {e}")
        return []
    
    soup = BeautifulSoup(response.content, 'html.parser')
    pages = []
    
    # Get direct pages from the "mw-pages" section
    pages_div = soup.find("div", id="mw-pages")
    if pages_div:
        for ul in pages_div.find_all("ul"):
            for li in ul.find_all("li"):
                a = li.find("a")
                if a and a.get("href"):
                    full_url = BASE_URL + a["href"]
                    pages.append(full_url)
        
        # Check for a "next page" link in the pagination navigation
        nav_div = pages_div.find("div", class_="mw-content-ltr")
        if nav_div:
            next_link = nav_div.find("a", string="next page")
            if next_link and next_link.get("href"):
                next_page_url = BASE_URL + next_link["href"]
                print(f"Found pagination link: {next_page_url}")
                pages.extend(get_category_pages(next_page_url, visited))
    
    # Process subcategories
    subcat_div = soup.find("div", id="mw-subcategories")
    if subcat_div:
        for ul in subcat_div.find_all("ul"):
            for li in ul.find_all("li"):
                a = li.find("a")
                if a and a.get("href"):
                    subcat_url = BASE_URL + a["href"]
                    pages.extend(get_category_pages(subcat_url, visited))
    
    return pages

def get_city_links_from_georgia_list(url):
    """
    Scrapes the Georgia list page ("List_of_municipalities_in_Georgia_(U.S._state)")
    to extract city links.
    """
    try:
        response = requests.get(url, headers=headers)
    except Exception as e:
        print(f"Error accessing {url}: {e}")
        return []
    
    soup = BeautifulSoup(response.content, 'html.parser')
    city_links = []
    # Assuming the page contains a wikitable listing the municipalities
    table = soup.find("table", class_="wikitable")
    if table:
        rows = table.find_all("tr")
        # Skip the header row
        for row in rows[1:]:
            cells = row.find_all("td")
            if cells:
                # Assume the first cell holds the municipality name with a link
                a = cells[0].find("a")
                if a and a.get("href"):
                    full_url = BASE_URL + a["href"]
                    city_links.append(full_url)
    else:
        print("No wikitable found on the Georgia list page.")
    return city_links

def get_all_city_links_by_state():
    """
    Iterates through a list of US states and for each state, checks:
      - For Georgia, use the special list page.
      - For all others, check both "Cities_in_{State}" and 
        "Incorporated_cities_and_towns_in_{State}" categories.
    Combines the results (removing duplicates) and returns a dictionary
    mapping state names to a list of city links.
    """
    states = [
        "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado", "Connecticut",
        "Delaware", "Florida", "Georgia", "Hawaii", "Idaho", "Illinois", "Indiana", "Iowa",
        "Kansas", "Kentucky", "Louisiana", "Maine", "Maryland", "Massachusetts", "Michigan",
        "Minnesota", "Mississippi", "Missouri", "Montana", "Nebraska", "Nevada", "New_Hampshire",
        "New_Jersey", "New_Mexico", "New_York_(state)", "North_Carolina", "North_Dakota", "Ohio",
        "Oklahoma", "Oregon", "Pennsylvania", "Rhode_Island", "South_Carolina", "South_Dakota",
        "Tennessee", "Texas", "Utah", "Vermont", "Virginia", "Washington", "West_Virginia",
        "Wisconsin", "Wyoming"
    ]
    state_city_links = {}
    for state in states:
        links = []
        if state == "Georgia":
            georgia_url = "https://en.wikipedia.org/wiki/List_of_municipalities_in_Georgia_(U.S._state)"
            print(f"Scraping Georgia using special list page: {georgia_url}")
            links = get_city_links_from_georgia_list(georgia_url)
            print(f"Found {len(links)} cities for Georgia")
        else:
            # List the two category names to try for each state.
            category_names = [
                f"Cities_in_{state}",
                f"Incorporated_cities_and_towns_in_{state}"
            ]
            for category_name in category_names:
                category_url = f"{BASE_URL}/wiki/Category:{category_name}"
                print(f"Scraping {state} using category {category_name}: {category_url}")
                new_links = get_category_pages(category_url)
                print(f"Found {len(new_links)} cities in category {category_name} for {state}")
                links.extend(new_links)
        # Deduplicate the list of links
        unique_links = list(set(links))
        print(f"Total unique cities found for {state}: {len(unique_links)}")
        state_city_links[state] = unique_links
    return state_city_links

def get_cover_image(city_url):
    """
    Given a city's Wikipedia URL, fetch the page and extract the cover image URL 
    from the infobox. Uses a CSS selector to match any table that includes "infobox" as a class.
    """
    response = requests.get(city_url, headers=headers)
    soup = BeautifulSoup(response.content, 'html.parser')
    infobox = soup.select_one("table.infobox")
    if infobox:
        img = infobox.find("img")
        if img and img.get("src"):
            src = img["src"]
            if src.startswith("//"):
                src = "https:" + src
            return src
    return None

def download_image(url, save_path):
    """
    Downloads an image from the URL and saves it to the specified path.
    """
    try:
        response = requests.get(url, headers=headers)
        if response.status_code == 200:
            with open(save_path, "wb") as f:
                f.write(response.content)
            print("Downloaded image to {}".format(save_path))
        else:
            print("Failed to download image from {}".format(url))
    except Exception as e:
        print("Error downloading image: {}".format(e))

def main():
    # Create a top-level folder to save images
    base_folder = "city_images"
    os.makedirs(base_folder, exist_ok=True)
    
    # Get a dictionary mapping each state to its list of city links from the combined sources
    state_city_links = get_all_city_links_by_state()
    print("Total states processed: {}".format(len(state_city_links)))
    
    # Process each state individually
    for state, city_links in state_city_links.items():
        # Create a subfolder for the state
        state_folder = os.path.join(base_folder, state)
        os.makedirs(state_folder, exist_ok=True)
        print(f"\nProcessing {len(city_links)} cities for state {state}")
        for city_url in city_links:
            # Determine city name from URL (e.g., Los_Angeles)
            city_name = city_url.split("/")[-1]
            # Check if the file for this city already exists (regardless of extension)
            pattern = os.path.join(state_folder, f"{city_name}.*")
            if glob.glob(pattern):
                print(f"Skipping {city_name}: file already exists.")
                continue

            print("\nProcessing {}".format(city_url))
            image_url = get_cover_image(city_url)
            if image_url:
                parts = image_url.split(".")
                file_extension = parts[-1].split("?")[0] if len(parts) > 1 else "jpg"
                save_filepath = os.path.join(state_folder, "{}.{}".format(city_name, file_extension))
                download_image(image_url, save_filepath)
            else:
                print("No cover image found for this city.")

if __name__ == "__main__":
    main()
