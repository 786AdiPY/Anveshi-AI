import json
import os
import urllib.parse
import urllib.request

from langchain_core.tools import tool
from langchain_community.document_loaders import WebBaseLoader, FireCrawlLoader
# fastCRW (Firecrawl-compatible web scraper; single binary, self-host or cloud)
from langchain_crw import CrwLoader
from typing import Annotated, List
from bs4 import BeautifulSoup

from ..logger import setup_logger
from ..config import (
    FIRECRAWL_API_KEY,
    CRW_API_KEY,
    CRW_API_URL,
    CHROMEDRIVER_PATH,
    TAVILY_API_KEY,
)
# Set up logger
logger = setup_logger()

# Browsers are only used as a last-resort search backend, so Selenium is
# imported lazily: a machine without Chrome or a driver must still be able to
# import this module and use the API-based backends.
_USER_AGENT = (
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/124.0 Safari/537.36"
)
_SEARCH_TIMEOUT = 30


def _format_results(results: List[dict]) -> str:
    """Render search results as the plain title/snippet/link blocks agents parse."""
    blocks = []
    for item in results:
        title = (item.get("title") or "No Title").strip()
        snippet = (item.get("snippet") or "No Snippet").strip().replace("\n", " ")
        link = (item.get("link") or "No Link").strip()
        blocks.append(f"{title}\n{snippet}\n{link}\n")
    return "\n".join(blocks)


def _tavily_search(query: str, max_results: int = 5) -> List[dict]:
    """Search via the Tavily API. Requires TAVILY_API_KEY."""
    if not TAVILY_API_KEY:
        raise ValueError("Tavily API key is not set")

    payload = json.dumps(
        {
            "query": query,
            "max_results": max_results,
            "search_depth": "basic",
            "include_answer": False,
        }
    ).encode("utf-8")
    request = urllib.request.Request(
        "https://api.tavily.com/search",
        data=payload,
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {TAVILY_API_KEY}",
        },
    )
    with urllib.request.urlopen(request, timeout=_SEARCH_TIMEOUT) as response:
        data = json.load(response)

    results = [
        {
            "title": item.get("title"),
            "snippet": item.get("content"),
            "link": item.get("url"),
        }
        for item in data.get("results", [])
    ]
    if not results:
        raise ValueError("Tavily returned no results")
    return results


def _duckduckgo_search(query: str, max_results: int = 5) -> List[dict]:
    """Search via DuckDuckGo's keyless HTML endpoint."""
    url = "https://html.duckduckgo.com/html/?q=" + urllib.parse.quote_plus(query)
    request = urllib.request.Request(url, headers={"User-Agent": _USER_AGENT})
    with urllib.request.urlopen(request, timeout=_SEARCH_TIMEOUT) as response:
        html = response.read().decode("utf-8", errors="replace")

    soup = BeautifulSoup(html, "html.parser")
    results = []
    for node in soup.select(".result")[: max_results * 2]:
        link_element = node.select_one("a.result__a")
        if not link_element:
            continue
        link = link_element.get("href", "")
        # DuckDuckGo wraps outbound links in a redirector; unwrap to the target.
        if "uddg=" in link:
            parsed = urllib.parse.parse_qs(urllib.parse.urlparse(link).query)
            link = parsed.get("uddg", [link])[0]
        snippet_element = node.select_one(".result__snippet")
        results.append(
            {
                "title": link_element.get_text(strip=True),
                "snippet": snippet_element.get_text(strip=True) if snippet_element else "",
                "link": link,
            }
        )
        if len(results) >= max_results:
            break

    if not results:
        raise ValueError("DuckDuckGo returned no results")
    return results


def _selenium_google_search(query: str, max_results: int = 5) -> List[dict]:
    """Scrape Google with a headless browser. Needs Chrome plus a driver."""
    from selenium import webdriver
    from selenium.webdriver.chrome.options import Options
    from selenium.webdriver.chrome.service import Service

    chrome_options = Options()
    chrome_options.add_argument("--headless=new")
    chrome_options.add_argument("--no-sandbox")
    chrome_options.add_argument("--disable-dev-shm-usage")
    # An explicit driver path is optional: without it Selenium Manager resolves
    # a driver for the installed Chrome.
    service = Service(CHROMEDRIVER_PATH) if os.path.exists(CHROMEDRIVER_PATH) else Service()

    with webdriver.Chrome(options=chrome_options, service=service) as driver:
        driver.set_page_load_timeout(_SEARCH_TIMEOUT)
        driver.get("https://www.google.com/search?q=" + urllib.parse.quote_plus(query))
        html = driver.page_source

    soup = BeautifulSoup(html, "html.parser")
    results = []
    for node in soup.select(".g")[:max_results]:
        title_element = node.select_one("h3")
        snippet_element = node.select_one(".VwiC3b")
        link_element = node.select_one("a")
        results.append(
            {
                "title": title_element.text if title_element else "",
                "snippet": snippet_element.text if snippet_element else "",
                "link": link_element["href"] if link_element else "",
            }
        )

    if not results:
        raise ValueError("Google returned no parseable results")
    return results


@tool
def google_search(query: Annotated[str, "The search query to use"]) -> Annotated[str, "The top 5 web search results."]:
    """
    Search the web for the given query and return the top 5 results.

    Each result is returned as a title, a snippet, and a URL. Backends are tried
    in order — Tavily, DuckDuckGo, then a headless Google scrape — so the search
    still works when an API key is missing or a browser is unavailable.
    """
    logger.info(f"Performing web search for query: {query}")
    backends = (
        ("Tavily", _tavily_search),
        ("DuckDuckGo", _duckduckgo_search),
        ("Google/Selenium", _selenium_google_search),
    )

    errors = []
    for name, backend in backends:
        try:
            results = backend(query, 5)
        except Exception as e:
            logger.warning(f"{name} search failed: {e}")
            errors.append(f"{name}: {e}")
            continue
        logger.info(f"Web search completed successfully via {name}")
        return _format_results(results)

    logger.error(f"All web search backends failed: {'; '.join(errors)}")
    return f"Error: web search failed on all backends ({'; '.join(errors)})"


def _scrape_webpages(urls: Annotated[List[str], "List of URLs to scrape"]) -> Annotated[str, "The scraped content from WebBaseLoader."]:
    """
    Scrape the provided web pages for detailed information using WebBaseLoader.

    This function uses the WebBaseLoader to load and scrape the content of the provided URLs.
    """
    try:
        logger.info(f"Scraping webpages: {urls}")
        loader = WebBaseLoader(urls)
        docs = loader.load()
        content = "\n\n".join([f'\n{doc.page_content[:3000]}\n' for doc in docs])[:12000]
        logger.info("Webpage scraping completed successfully")
        return content
    except Exception as e:
        logger.error(f"Error during webpage scraping: {str(e)}")
        raise  # Re-raise the exception to be caught by the calling function

def _firecrawl_scrape_webpages(urls: Annotated[List[str], "List of URLs to scrape"]) -> Annotated[str, "The scraped content from FireCrawl."]:
    """
    Scrape the provided web pages for detailed information using FireCrawlLoader.

    This function uses the FireCrawlLoader to load and scrape the content of the provided URLs.

    """
    if not FIRECRAWL_API_KEY:
        raise ValueError("FireCrawl API key is not set")

    try:
        logger.info(f"Scraping webpages using FireCrawl: {urls}")
        results = []
        for url in urls:
            loader = FireCrawlLoader(
                api_key=FIRECRAWL_API_KEY,
                url=url,
                mode="scrape"
            )
            res = loader.load()
            # Normalize different possible return types from the loader
            if isinstance(res, list):
                for doc in res:
                    if hasattr(doc, "page_content"):
                        results.append(str(doc.page_content))
                    else:
                        results.append(str(doc))
            else:
                results.append(str(res))
        aggregated = "\n\n".join(results)
        logger.info("FireCrawl scraping completed successfully")
        return aggregated
    except Exception as e:
        logger.error(f"Error during FireCrawl scraping: {str(e)}")
        raise  # Re-raise the exception to be caught by the calling function
def _crw_scrape_webpages(urls: Annotated[List[str], "List of URLs to scrape"]) -> Annotated[str, "The scraped content from fastCRW."]:
    """
    Scrape the provided web pages for detailed information using fastCRW.

    fastCRW is a Firecrawl-compatible web scraper (single binary; self-host or cloud).
    This function uses the CrwLoader to load and scrape the content of the provided URLs.

    """
    try:
        logger.info(f"Scraping webpages using fastCRW: {urls}")
        results = []
        for url in urls:
            loader = CrwLoader(
                api_key=CRW_API_KEY,
                api_url=CRW_API_URL,
                url=url,
                mode="scrape"
            )
            res = loader.load()
            # Normalize different possible return types from the loader
            if isinstance(res, list):
                for doc in res:
                    if hasattr(doc, "page_content"):
                        results.append(str(doc.page_content))
                    else:
                        results.append(str(doc))
            else:
                results.append(str(res))
        aggregated = "\n\n".join(results)
        logger.info("fastCRW scraping completed successfully")
        return aggregated
    except Exception as e:
        logger.error(f"Error during fastCRW scraping: {str(e)}")
        raise  # Re-raise the exception to be caught by the calling function
@tool
def scrape_webpages(urls: Annotated[List[str], "List of URLs to scrape"]) -> Annotated[str, "The scraped content from fastCRW, FireCrawl or WebBaseLoader."]:
    """
    Attempt to scrape webpages using fastCRW, falling back to FireCrawl then WebBaseLoader if unsuccessful.
    """
    try:
        return _crw_scrape_webpages(urls)
    except Exception as e:
        logger.warning(f"fastCRW scraping failed: {str(e)}. Falling back to FireCrawl.")
    try:
        return _firecrawl_scrape_webpages(urls)
    except Exception as e:
        logger.warning(f"FireCrawl scraping failed: {str(e)}. Falling back to WebBaseLoader.")
        try:
            return _scrape_webpages(urls)
        except Exception as e:
            logger.error(f"Both scraping methods failed. Error: {str(e)}")
            return f"Error: Unable to scrape webpages using both methods. {str(e)}"

logger.info("Web scraping tools initialized")