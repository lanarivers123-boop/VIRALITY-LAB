"""
URL scraping via Playwright — fetches page content, extracts text + image URLs.
"""

import httpx


async def scrape_url(url: str) -> dict:
    """
    Fetch a URL, return structured data: title, description, text content,
    and image URLs found on the page.
    Uses httpx for fast fetch, with fallbacks for common page structures.
    """
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    }

    async with httpx.AsyncClient(timeout=30.0, follow_redirects=True) as client:
        response = await client.get(url, headers=headers)
        response.raise_for_status()
        html = response.text

    from bs4 import BeautifulSoup
    soup = BeautifulSoup(html, "html.parser")

    # Remove script/style tags
    for tag in soup(["script", "style", "nav", "footer", "header", "aside"]):
        tag.decompose()

    title = (
        soup.find("meta", property="og:title")
        or soup.find("meta", attrs={"name": "title"})
        or soup.find("title")
    )
    title = title.get("content", title.get_text(strip=True)) if title else ""

    description = (
        soup.find("meta", property="og:description")
        or soup.find("meta", attrs={"name": "description"})
    )
    description = description.get("content", "") if description else ""

    # Primary text content
    text = soup.get_text(separator="\n", strip=True)
    # Collapse blank lines
    lines = [l.strip() for l in text.splitlines() if l.strip()]
    text = "\n".join(lines[:500])  # cap at 500 lines

    # Image URLs
    image_urls = []
    for img in soup.find_all("img"):
        src = img.get("src") or img.get("data-src") or img.get("data-lazy-src")
        if src and src.startswith("http") and not src.endswith(".svg"):
            image_urls.append(src)
        if len(image_urls) >= 10:
            break

    # Open Graph or Twitter image
    og_image = soup.find("meta", property="og:image")
    if og_image and og_image.get("content"):
        image_urls.insert(0, og_image["content"])

    return {
        "url": url,
        "title": title[:200],
        "description": description[:500],
        "text": text[:5000],
        "image_urls": image_urls[:10],
    }