import csv
import os
import glob
import time
import concurrent.futures
import requests
from bs4 import BeautifulSoup

WIKIPEDIA_API_URL = "https://en.wikipedia.org/w/api.php"
WIKIPEDIA_PAGE_URL = "https://en.wikipedia.org/wiki/"

def search_wikipedia(query, retries=3, delay=2):
    """
    Searches Wikipedia using the MediaWiki API for a given query.
    Returns the title of the first result or None if no result is found.
    """
    params = {
        "action": "query",
        "list": "search",
        "srsearch": query,
        "format": "json"
    }
    for attempt in range(1, retries+1):
        try:
            response = requests.get(WIKIPEDIA_API_URL, params=params, timeout=10)
            response.raise_for_status()
            data = response.json()
            search_results = data.get("query", {}).get("search", [])
            if search_results:
                title = search_results[0]["title"]
                return title
            else:
                return None
        except Exception as e:
            print(f"Error searching Wikipedia for '{query}', attempt {attempt}: {e}")
            if attempt < retries:
                time.sleep(delay)
    return None

def get_cover_image_from_page(title, retries=3, delay=2):
    """
    Given a Wikipedia page title, retrieves the page and extracts the first image from the infobox.
    Returns the full image URL (or None if not found).
    """
    page_url = WIKIPEDIA_PAGE_URL + title.replace(" ", "_")
    for attempt in range(1, retries+1):
        try:
            response = requests.get(page_url, timeout=10)
            response.raise_for_status()
            soup = BeautifulSoup(response.content, "html.parser")
            # Look for a table with class 'infobox'
            infobox = soup.find("table", class_="infobox")
            if infobox:
                img = infobox.find("img")
                if img and img.get("src"):
                    src = img["src"]
                    if src.startswith("//"):
                        src = "https:" + src
                    elif src.startswith("/"):
                        src = "https://en.wikipedia.org" + src
                    return src
            return None
        except Exception as e:
            print(f"Error retrieving page '{title}' on attempt {attempt}: {e}")
            if attempt < retries:
                time.sleep(delay)
    return None

def download_image(url, save_path, timeout=15):
    """
    Downloads the image from the given URL and saves it to save_path.
    """
    # Use a compliant User-Agent (change the URL/email to your own details)
    headers = {
        "User-Agent": "MyBot/1.0 (https://example.com/my-bot-info; myemail@example.com)"
    }
    try:
        response = requests.get(url, stream=True, timeout=timeout, headers=headers)
        response.raise_for_status()
        with open(save_path, "wb") as f:
            for chunk in response.iter_content(1024):
                f.write(chunk)
        print(f"Downloaded image to {save_path}")
    except Exception as e:
        print(f"Error downloading image from {url}: {e}")


def rename_downloaded_image(target_dir, zip_code):
    """
    Checks if the downloaded file in target_dir is already named with the zip_code.
    If not, renames the first file in the directory.
    """
    files = glob.glob(os.path.join(target_dir, "*"))
    if files:
        file_path = files[0]
        base_name = os.path.basename(file_path)
        if base_name.startswith(zip_code):
            return  # Already correctly named.
        _, ext = os.path.splitext(file_path)
        new_name = f"{zip_code}{ext}"
        new_path = os.path.join(target_dir, new_name)
        try:
            os.rename(file_path, new_path)
            print(f"Renamed {file_path} to {new_path}")
        except Exception as e:
            print(f"Error renaming {file_path}: {e}")

def process_zip(row, output_folder):
    """
    Processes a single CSV row:
      - Checks if valid data exists,
      - Creates a folder for the state,
      - Skips if the ZIP code has already been processed,
      - Searches Wikipedia for the query "ZIP Code {zip_code}",
      - Retrieves the cover image from the resulting page,
      - Downloads the image and names it with the ZIP code.
    """
    zip_code = row["Zip_Code"].strip()
    city = row["City"].strip()
    state = row["State"].strip()

    # Validate: skip if missing or if city is unknown.
    if not zip_code or not state or city.lower() == "unknown city":
        print(f"Skipping row due to missing/unknown data: {row}")
        return

    # Create state folder (spaces replaced by underscores)
    state_folder = state.replace(" ", "_")
    target_dir = os.path.join(output_folder, state_folder)
    os.makedirs(target_dir, exist_ok=True)

    # If an image for this ZIP code already exists, skip.
    pattern = os.path.join(target_dir, f"{zip_code}.*")
    if glob.glob(pattern):
        print(f"Image for {zip_code} already exists in {state}. Skipping.")
        return

    # Build the query string. You can choose to use just the ZIP code or add a prefix.
    query = f"ZIP Code {zip_code}"
    print(f"Processing {zip_code} with query: '{query}'")

    title = search_wikipedia(query)
    if not title:
        print(f"No Wikipedia page found for query '{query}'")
        return

    print(f"Found page '{title}' for ZIP {zip_code}")

    image_url = get_cover_image_from_page(title)
    if not image_url:
        print(f"No cover image found on the Wikipedia page '{title}' for ZIP {zip_code}")
        return

    # Determine a safe file extension
    ext = os.path.splitext(image_url)[1]
    if not ext or len(ext) > 5:
        ext = ".jpg"
    save_path = os.path.join(target_dir, f"{zip_code}{ext}")

    download_image(image_url, save_path)

    # If needed, you could also rename the file after download.
    rename_downloaded_image(target_dir, zip_code)

    # Short delay to throttle requests.
    time.sleep(1)

def main():
    csv_file = r"/mnt/c/Users/User/Desktop/Cappystone/Real-Capstone/CityScope-AI-Angular/CityScopeAI/src/assets/data/zip_city_state_with_images_updated.csv"

    output_folder = "us_state_images"
    os.makedirs(output_folder, exist_ok=True)

    # Read CSV rows.
    with open(csv_file, newline='', encoding="utf-8") as f:
        reader = csv.DictReader(f)
        rows = list(reader)
    total = len(rows)
    print(f"Total rows to process: {total}")

    # Process rows concurrently (15 workers).
    max_workers = 15
    with concurrent.futures.ThreadPoolExecutor(max_workers=max_workers) as executor:
        futures = [executor.submit(process_zip, row, output_folder) for row in rows]
        for future in concurrent.futures.as_completed(futures):
            try:
                future.result()
            except Exception as e:
                print(f"Error processing a row: {e}")

if __name__ == "__main__":
    main()
