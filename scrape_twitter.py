"""
Scraper X/Twitter via Nitter — version unifiée.
Profils (RSS + timeline), recherche mots-clés, hashtags.
Métadonnées complètes : likes, retweets, replies, quote_count, views,
hashtags, mentions, images, has_media, has_video, is_reply, in_reply_to.
Fallback : urllib → curl_cffi → Playwright (instances Anubis PoW).

Usage:
  python scrape_twitter.py --handle LBCgroup
  python scrape_twitter.py --query "Lebanon" --limit 100
  python scrape_twitter.py --hashtag Lebanon
  python scrape_twitter.py --lebanon-full  # phases: handles + search + hashtags
  python scrape_twitter.py  # tous les HANDLES (médias Liban)
"""
import csv
import re
import sys
import time
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET
from html import unescape
from pathlib import Path

ROOT = Path(__file__).resolve().parent
OUT = ROOT / "data" / "raw" / "twitter"
CONFIG_DIR = ROOT / "config"
OUT.mkdir(parents=True, exist_ok=True)

# Lebanon Monitor — handles médias, politiques, actualité
HANDLES = [
    ("LBCgroup", "lbc"),
    ("AlJadeedLive", "aljadeed"),
    ("LBCI_NEWS", "lbci"),
    ("mtvlebanon", "mtv"),
    ("NNA_Lebanon", "nna"),
    ("Lebanon24", "lebanon24"),
    ("The961", "the961"),
    ("LorientLeJour", "lorientlejour"),
    ("ReutersLebanon", "reuters"),
    ("APMiddleEast", "ap"),
]

# Requêtes et hashtags prioritaires pour le Liban
LEBANON_SEARCH_QUERIES = ["Lebanon", "Liban", "لبنان", "Beirut", "Beyrouth", "بيروت"]
LEBANON_HASHTAGS = ["Lebanon", "Liban", "لبنان", "Beirut", "LebanonCrisis", "LebaneseLira"]


def _load_instances(search: bool = False) -> list[str]:
    cfg = CONFIG_DIR / ("nitter_search_instances.txt" if search else "nitter_instances.txt")
    if cfg.exists():
        lines = [l.strip() for l in cfg.read_text().splitlines() if l.strip() and not l.startswith("#")]
        if lines:
            return lines
    return ["https://nitter.net", "https://nitter.tiekoetter.com", "https://nitter.privacyredirect.com"]


INSTANCES = _load_instances()
SEARCH_INSTANCES = _load_instances(search=True)

CURL_CFFI_AVAILABLE = False
try:
    from curl_cffi import requests as curl_requests
    CURL_CFFI_AVAILABLE = True
except ImportError:
    pass

try:
    from bs4 import BeautifulSoup
    BS4_AVAILABLE = True
except ImportError:
    BS4_AVAILABLE = False

UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"


def extract_images_from_html(html: str) -> list[str]:
    if not html:
        return []
    urls = re.findall(r'<img[^>]+src="([^"]+)"', html)
    urls += re.findall(r'src="(https?://[^"]+\.(?:jpg|jpeg|png|gif|webp)[^"]*)"', html)
    urls += re.findall(r'https?://(?:pic\.nitter\.net|pbs\.twimg\.com|[^"\s]+\.twimg\.com)/[^"\'<>\s]+', html)
    return list(dict.fromkeys(u for u in urls if u and "http" in u))


def extract_metadata_from_text(text: str) -> dict:
    text = text or ""
    hashtags = list(dict.fromkeys(re.findall(r"#(\w+)", text)))
    mentions = list(dict.fromkeys(re.findall(r"@(\w+)", text)))
    cashtags = list(dict.fromkeys(re.findall(r"\$([A-Z]{2,5})\b", text)))
    urls = re.findall(r"https?://[^\s<>\"'\]]+", text)
    urls = [u.rstrip(".,;:)") for u in urls if "twimg.com" not in u][:20]
    return {"hashtags": "|".join(hashtags), "mentions": "|".join(mentions), "cashtags": "|".join(cashtags), "urls": "|".join(urls)}


def extract_reply_metadata(text: str, link_str: str, guid_text: str, desc_html: str) -> dict:
    out = {"is_reply": False, "in_reply_to_status_id": "", "in_reply_to_user_id": ""}
    text = (text or "").strip()
    m = re.match(r"^(?:R\s+to|Replying to)\s+@(\w+)", text, re.I)
    if m:
        out["is_reply"] = True
        out["in_reply_to_user_id"] = m.group(1)
    our_id = ""
    if "/status/" in (link_str or ""):
        our_id = link_str.split("/status/")[-1].split("?")[0].split("#")[0]
    if not our_id and guid_text:
        our_id = str(guid_text).strip()
    combined = (desc_html or "") + " " + (link_str or "")
    for m in re.finditer(r"/status/(\d+)", combined):
        sid = m.group(1)
        if sid != our_id:
            out["in_reply_to_status_id"] = sid
            break
    return out


def fetch_page_html(url: str, wait_js: float = 2.0) -> str | None:
    try:
        req = urllib.request.Request(url, headers={"User-Agent": UA})
        with urllib.request.urlopen(req, timeout=20) as r:
            html = r.read().decode()
            if "Making sure" not in html and "Something went wrong" not in html:
                return html
    except Exception:
        pass
    if CURL_CFFI_AVAILABLE:
        try:
            r = curl_requests.get(url, headers={"User-Agent": UA}, timeout=25, impersonate="chrome120")
            if r.status_code == 200:
                return r.text
        except Exception:
            pass
    try:
        from playwright.sync_api import sync_playwright
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            page = browser.new_page(user_agent=UA)
            page.goto(url, wait_until="domcontentloaded", timeout=30000)
            time.sleep(wait_js)
            html = page.content()
            browser.close()
            return html
    except Exception:
        pass
    return None


def parse_engagement_from_html(html: str) -> dict:
    if not html or "Making sure" in html or "Something went wrong" in html:
        return {}
    out = {}
    for label, class_name in [
        ("likes", "icon-heart"), ("retweets", "icon-retweet"),
        ("replies", "icon-comment"), ("quote_count", "icon-quote"),
    ]:
        pat = rf'class="[^"]*{re.escape(class_name)}[^"]*"[^>]*>.*?(\d[\d,]*)'
        m = re.search(pat, html, re.DOTALL)
        if m:
            out[label] = m.group(1).replace(",", "")
    if "quote_count" not in out:
        m = re.search(r'["\']?(?:Quote|Quotes?)[^>]*>[\s]*(\d[\d,]*)', html, re.I)
        if m:
            out["quote_count"] = m.group(1).replace(",", "")
    for pat in [r'class="[^"]*icon-eye[^"]*"[^>]*>.*?(\d[\d,]*)', r'"views"[^>]*>(\d[\d,]*)']:
        m = re.search(pat, html, re.DOTALL | re.I)
        if m:
            v = m.group(1).replace(",", "").strip().rstrip(".,")
            out["views"] = v if v else ""
            break
    return out


def _parse_count_val(v: str) -> str | None:
    if not v:
        return None
    v = str(v).strip().rstrip(",. ").replace(",", "").upper()
    mult = 1
    if "K" in v:
        mult, v = 1000, v.replace("K", "")
    elif "M" in v:
        mult, v = 1_000_000, v.replace("M", "")
    try:
        return str(int(float(v) * mult))
    except ValueError:
        return None


def parse_engagement_from_x_html(html: str) -> dict:
    out = {}
    for label, kw in [("likes", "Like"), ("retweets", "Repost"), ("replies", "Repl"), ("quote_count", "Quote")]:
        pat = rf'aria-label="[^"]*?(\d[\d,.]*(?:K|M)?)[^"]*{kw}'
        m = re.search(pat, html)
        if m and _parse_count_val(m.group(1)):
            out[label] = _parse_count_val(m.group(1))
    for pat, key in [(r'"retweetCount"[^>]*>(\d+)', "retweets"), (r'"replyCount"[^>]*>(\d+)', "replies")]:
        if key not in out or not out.get(key):
            m = re.search(pat, html, re.I)
            if m:
                out[key] = m.group(1)
    for pat in [r'(\d[\d,.]*(?:K|M)?)\s*Views?', r'"viewCount"[^>]*>(\d+)', r'aria-label="[^"]*?(\d[\d,.]*(?:K|M)?)\s*[Vv]iew']:
        m = re.search(pat, html, re.I)
        if m:
            out["views"] = _parse_count_val(m.group(1).strip()) or m.group(1).replace(",", "")
            break
    return out


def fetch_tweet_engagement(handle: str, tweet_id: str) -> dict | None:
    for inst in INSTANCES:
        url = f"{inst.rstrip('/')}/{handle}/status/{tweet_id}"
        html = fetch_page_html(url)
        if html:
            out = parse_engagement_from_html(html)
            if out:
                return out
        time.sleep(0.5)
    try:
        from playwright.sync_api import sync_playwright
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            page = browser.new_page(user_agent=UA)
            page.goto(f"https://x.com/{handle}/status/{tweet_id}", wait_until="domcontentloaded", timeout=20000)
            time.sleep(3)
            out = parse_engagement_from_x_html(page.content())
            browser.close()
            return out if out else None
    except Exception:
        pass
    return None


# --- RSS (profils) ---
def fetch_rss(handle: str, instance: str, fetch_engagement: bool, limit: int | None) -> list[dict]:
    url = f"{instance.rstrip('/')}/{handle}/rss"
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (compatible; Paris2026Scraper/1.0)"})
        with urllib.request.urlopen(req, timeout=15) as r:
            root = ET.fromstring(r.read().decode())
    except Exception:
        return []
    items = root.findall(".//item") or root.findall(".//{http://www.w3.org/2005/Atom}entry")
    if limit:
        items = items[:limit]
    out = []
    for item in items:
        title = item.find("title")
        link = item.find("link")
        desc = item.find("description")
        if desc is None:
            desc = item.find("content") or item.find("{http://purl.org/rss/1.0/modules/content/}encoded")
        pub = item.find("pubDate")
        if pub is None:
            pub = item.find("published") or item.find("{http://www.w3.org/2005/Atom}published")
        guid = item.find("guid")
        if guid is None:
            guid = item.find("id")
        creator = item.find("creator") or item.find("{http://purl.org/dc/elements/1.1/}creator")
        source = item.find("source")
        text = (title.text or "") if title is not None else ""
        desc_html = (desc.text or "") if desc is not None else ""
        if not text and desc_html:
            text = re.sub(r"<[^>]+>", " ", unescape(desc_html))[:500].strip()
        link_str = link.text if link is not None and link.text else ""
        tweet_id = ""
        if "/status/" in link_str:
            tweet_id = link_str.split("/status/")[-1].split("?")[0].split("#")[0]
        if not tweet_id and guid is not None and guid.text:
            tweet_id = str(guid.text).strip()
        pub_str = pub.text if pub is not None and pub.text else ""
        creator_str = creator.text if creator is not None and creator.text else ""
        images = extract_images_from_html(desc_html)
        text_clean = (text or "").strip()
        meta = extract_metadata_from_text(text_clean)
        reply_meta = extract_reply_metadata(text_clean, link_str, guid.text if guid is not None and guid.text else "", desc_html or "")
        engagement = fetch_tweet_engagement(handle, tweet_id) if fetch_engagement and tweet_id else None
        if engagement:
            time.sleep(1.2)
        has_media = len(images) > 0 or "gif" in (desc_html or "").lower()
        has_video = "video" in (desc_html or "").lower() or "t.co" in (desc_html or "")
        is_retweet = bool(re.match(r"^RT\s+@\w+", text_clean))
        out.append({
            "tweet_id": tweet_id, "candidate_id": "", "twitter_handle": handle, "timestamp": pub_str, "pubDate": pub_str,
            "text": text_clean, "description_html": (desc_html[:5000] if desc_html else ""),
            "hashtags": meta["hashtags"], "mentions": meta["mentions"], "cashtags": meta["cashtags"], "urls": meta["urls"],
            "is_retweet": "1" if is_retweet else "0", "link": link_str,
            "guid": guid.text if guid is not None and guid.text else "", "creator": creator_str,
            "source": source.text if source is not None and source.text else "",
            "images": "|".join(images) if images else "", "image_count": str(len(images)),
            "has_media": "1" if has_media else "0", "has_video": "1" if has_video else "0",
            "likes": engagement.get("likes", "") if engagement else "",
            "retweets": engagement.get("retweets", "") if engagement else "",
            "replies": engagement.get("replies", "") if engagement else "",
            "quote_count": engagement.get("quote_count", "") if engagement else "",
            "views": engagement.get("views", "") if engagement else "",
            "is_reply": "1" if reply_meta["is_reply"] else "0",
            "in_reply_to_status_id": reply_meta["in_reply_to_status_id"],
            "in_reply_to_user_id": reply_meta["in_reply_to_user_id"],
            "original_twitter_url": f"https://x.com/{handle}/status/{tweet_id}" if tweet_id else "",
        })
    return out


# --- Timeline HTML (search, hashtag, profil fallback) ---
def _tweet_stat_from_bs(tweet, index: int, default: str = "") -> str:
    stats = tweet.find_all("span", class_="tweet-stat")
    if index < len(stats) and stats[index].find("div"):
        return (stats[index].find("div").text or "").strip().replace(",", "")
    return default


def _extract_tweet_from_timeline(tweet_div, instance_base: str) -> dict | None:
    if not BS4_AVAILABLE:
        return None
    try:
        link_el = tweet_div.find("span", class_="tweet-date")
        if not link_el or not link_el.find("a"):
            return None
        href = link_el.find("a").get("href", "")
        if "/status/" not in href:
            return None
        parts = href.split("/status/")
        if len(parts) < 2:
            return None
        tweet_id = parts[-1].split("?")[0].split("#")[0]
        username = ""
        for p in parts[0].split("/"):
            if p and not p.startswith("http"):
                username = p
                break
        if not username:
            uname_el = tweet_div.find("a", class_="username")
            username = (uname_el.text or "").strip().lstrip("@") if uname_el else ""
        link = "https://twitter.com" + href if href.startswith("/") else instance_base + href
        text_el = tweet_div.find("div", class_="tweet-content") or tweet_div.find("div", class_="quote-text")
        text = (text_el.text or "").strip().replace("\n", " ") if text_el else ""
        date_el = tweet_div.find("span", class_="tweet-date")
        timestamp = ""
        if date_el and date_el.find("a"):
            timestamp = date_el.find("a").get("title", "")
            if "/" in timestamp:
                timestamp = timestamp.split("/")[-1].split("#")[0]
        stats = {"replies": _tweet_stat_from_bs(tweet_div, 0, "0"), "retweets": _tweet_stat_from_bs(tweet_div, 1, "0"),
                 "quotes": _tweet_stat_from_bs(tweet_div, 2, "0"), "likes": _tweet_stat_from_bs(tweet_div, 3, "0")}
        is_retweet = tweet_div.find("div", class_="retweet-header") is not None
        replying = tweet_div.find("div", class_="replying-to")
        replying_to = [a.text.strip() for a in replying.find_all("a")] if replying else []
        attachments = tweet_div.find("div", class_="attachments")
        has_media = attachments is not None
        images = []
        if attachments:
            for img in attachments.find_all("img"):
                src = img.get("src", "")
                if src and ("twimg.com" in src or "pic.nitter" in src):
                    images.append((instance_base.rstrip("/") + src) if src.startswith("/") else src)
        meta = extract_metadata_from_text(text)
        return {
            "tweet_id": tweet_id, "candidate_id": "", "twitter_handle": username, "timestamp": timestamp, "pubDate": timestamp,
            "text": text, "description_html": "",
            "hashtags": meta["hashtags"], "mentions": meta["mentions"], "cashtags": meta["cashtags"], "urls": meta["urls"],
            "is_retweet": "1" if is_retweet else "0", "link": link, "guid": tweet_id, "creator": "", "source": "",
            "images": "|".join(images[:10]), "image_count": str(len(images)),
            "has_media": "1" if has_media else "0", "has_video": "0",
            "likes": stats["likes"], "retweets": stats["retweets"], "replies": stats["replies"], "quote_count": stats["quotes"],
            "views": "", "is_reply": "1" if replying_to else "0", "in_reply_to_user_id": replying_to[0] if replying_to else "",
            "in_reply_to_status_id": "", "original_twitter_url": f"https://x.com/{username}/status/{tweet_id}",
        }
    except Exception:
        return None


def parse_timeline_html(html: str, instance_base: str) -> list[dict]:
    if not BS4_AVAILABLE or not html:
        return []
    soup = BeautifulSoup(html, "lxml")
    seen, out = set(), []
    for div in soup.find_all("div", class_="timeline-item"):
        if "thread" in (div.get("class") or []):
            continue
        t = _extract_tweet_from_timeline(div, instance_base)
        if t and t.get("tweet_id") and t["tweet_id"] not in seen:
            seen.add(t["tweet_id"])
            out.append(t)
    return out


def get_next_page_url(html: str, instance_base: str, mode: str, term: str) -> str | None:
    if not BS4_AVAILABLE or not html:
        return None
    soup = BeautifulSoup(html, "lxml")
    more = soup.find_all("div", class_="show-more")
    if not more:
        return None
    a = more[-1].find("a") if more[-1] else None
    raw_href = a.get("href") if a else None
    if not raw_href:
        return None
    href = str(raw_href).strip()
    if not href:
        return None
    base = instance_base.rstrip("/")
    if mode == "user" and term:
        params = href.split("?")[-1] if "?" in href else href
        return f"{base}/{term}?{params}" if params else f"{base}/{term}"
    if mode in ("search", "hashtag"):
        return base + "/search" + (href if href.startswith("?") else ("?" + href))
    return base + (href if href.startswith("/") else "/" + href)


def fetch_timeline(instance: str, endpoint: str, limit: int) -> list[dict]:
    base = instance.rstrip("/")
    url = base + endpoint
    all_tweets, seen, page = [], set(), 0
    while len(all_tweets) < limit and page < 20:
        html = fetch_page_html(url, wait_js=3.0 if page > 0 else 2.0)
        if not html:
            break
        tweets = parse_timeline_html(html, base)
        for t in tweets:
            tid = t.get("tweet_id", "")
            if tid and tid not in seen:
                seen.add(tid)
                all_tweets.append(t)
                if len(all_tweets) >= limit:
                    break
        if len(all_tweets) >= limit:
            break
        mode = "search" if "/search" in endpoint else "user"
        term = (endpoint.strip("/").split("/")[0] or "") if mode == "user" else ""
        next_url = get_next_page_url(html, base, mode, term)
        if not next_url or next_url == url:
            break
        url, page = next_url, page + 1
        time.sleep(2)
    return all_tweets[:limit]


def enrich_with_engagement(tweets: list[dict], fetch_views: bool, delay: float) -> None:
    for t in tweets:
        if not t.get("tweet_id") or not t.get("twitter_handle"):
            continue
        if fetch_views or not (t.get("likes") or t.get("retweets")):
            eng = fetch_tweet_engagement(t["twitter_handle"], t["tweet_id"])
            if eng:
                t["likes"] = eng.get("likes", t.get("likes", ""))
                t["retweets"] = eng.get("retweets", t.get("retweets", ""))
                t["replies"] = eng.get("replies", t.get("replies", ""))
                t["quote_count"] = eng.get("quote_count", t.get("quote_count", ""))
                if fetch_views:
                    t["views"] = eng.get("views", "")
            time.sleep(delay)


def scrape_profile(handle: str, limit: int, fetch_engagement: bool, use_rss_first: bool = True) -> list[dict]:
    tweets = []
    if use_rss_first:
        for inst in INSTANCES:
            tweets = fetch_rss(handle, inst, fetch_engagement, limit)
            if tweets:
                break
            time.sleep(1)
    if not tweets:
        for inst in INSTANCES:
            tweets = fetch_timeline(inst, f"/{handle}", limit)
            if tweets:
                if fetch_engagement:
                    enrich_with_engagement(tweets, False, 1.2)
                break
            time.sleep(2)
    return tweets[:limit]


def scrape_search(query: str, limit: int, fetch_engagement: bool) -> list[dict]:
    endpoint = f"/search?f=tweets&q={urllib.parse.quote(query)}&scroll=false"
    tweets = []
    for inst in SEARCH_INSTANCES:
        tweets = fetch_timeline(inst, endpoint, limit)
        if tweets:
            if fetch_engagement:
                enrich_with_engagement(tweets, False, 1.2)
            break
        time.sleep(2)
    return tweets[:limit]


def scrape_hashtag(tag: str, limit: int, fetch_engagement: bool) -> list[dict]:
    tag = tag.lstrip("#")
    endpoint = f"/search?f=tweets&q={urllib.parse.quote('#' + tag)}&scroll=false"
    tweets = []
    for inst in SEARCH_INSTANCES:
        tweets = fetch_timeline(inst, endpoint, limit)
        if tweets:
            if fetch_engagement:
                enrich_with_engagement(tweets, False, 1.2)
            break
        time.sleep(2)
    return tweets[:limit]


KEYS = [
    "tweet_id", "candidate_id", "twitter_handle", "timestamp", "pubDate", "text", "description_html",
    "hashtags", "mentions", "cashtags", "urls", "link", "guid", "creator", "source",
    "images", "image_count", "has_media", "has_video", "is_retweet",
    "likes", "retweets", "replies", "quote_count", "views",
    "is_reply", "in_reply_to_status_id", "in_reply_to_user_id", "original_twitter_url",
]


def main():
    import argparse
    ap = argparse.ArgumentParser(description="Scraper X/Twitter via Nitter — profils, search, hashtags")
    ap.add_argument("--handle", type=str, help="Handle unique (ex: egregoire)")
    ap.add_argument("--query", type=str, help="Recherche mots-clés")
    ap.add_argument("--hashtag", type=str, help="Hashtag")
    ap.add_argument("--limit", type=int, default=50, help="Max tweets")
    ap.add_argument("--engagement", action="store_true", help="Fetch likes/retweets/replies")
    ap.add_argument("--no-engagement", action="store_true", help="Ne pas fetch likes/RT/replies (rétrocompat)")
    ap.add_argument("--views", action="store_true", help="Fetch views (lent)")
    ap.add_argument("--no-rss", action="store_true", help="Profil: forcer timeline HTML")
    ap.add_argument("--output", "-o", type=str, help="Fichier CSV")
    ap.add_argument("--output-dir", type=str, default=None, help="Dossier sortie")
    ap.add_argument("--lebanon-full", action="store_true", help="Phase complète: handles + search Lebanon + hashtag")
    args = ap.parse_args()

    if not BS4_AVAILABLE:
        print("pip install beautifulsoup4")
        return 1

    out_dir = Path(args.output_dir) if args.output_dir else OUT
    out_dir.mkdir(parents=True, exist_ok=True)
    fetch_eng = (args.engagement or args.views) and not args.no_engagement
    all_rows = []
    seen_ids = set()

    def dedup_append(rows):
        for t in rows:
            tid = t.get("tweet_id", "")
            if tid and tid not in seen_ids:
                seen_ids.add(tid)
                all_rows.append(t)

    if args.lebanon_full:
        # Phase 1: profils
        for handle, candidate_id in HANDLES:
            try:
                tweets = scrape_profile(handle, args.limit, fetch_eng, use_rss_first=not args.no_rss)
                for t in tweets:
                    t["candidate_id"] = candidate_id
                dedup_append(tweets)
                print(f"{handle}: {len(tweets)} tweets")
            except Exception as e:
                print(f"{handle}: FAIL {e}")
        # Phase 2: recherche
        for q in LEBANON_SEARCH_QUERIES[:3]:
            try:
                tweets = scrape_search(q, min(args.limit, 30), fetch_eng)
                dedup_append(tweets)
                print(f"search '{q}': {len(tweets)} tweets")
            except Exception as e:
                print(f"search '{q}': FAIL {e}")
        # Phase 3: hashtags
        for tag in LEBANON_HASHTAGS[:3]:
            try:
                tweets = scrape_hashtag(tag, min(args.limit, 25), fetch_eng)
                dedup_append(tweets)
                print(f"#{tag}: {len(tweets)} tweets")
            except Exception as e:
                print(f"#{tag}: FAIL {e}")
    elif args.handle:
        handles = [(h, c) for h, c in HANDLES if h == args.handle]
        if not handles:
            handles = [(args.handle, "")]
        for handle, candidate_id in handles:
            try:
                tweets = scrape_profile(handle, args.limit, fetch_eng, use_rss_first=not args.no_rss)
                for t in tweets:
                    t["candidate_id"] = candidate_id
                dedup_append(tweets)
                print(f"{handle}: {len(tweets)} tweets")
            except Exception as e:
                print(f"{handle}: FAIL {e}")
    elif args.query:
        print(f"Recherche '{args.query}'...")
        all_rows = scrape_search(args.query, args.limit, fetch_eng)
        print(f"  => {len(all_rows)} tweets")
    elif args.hashtag:
        print(f"Hashtag #{args.hashtag.lstrip('#')}...")
        all_rows = scrape_hashtag(args.hashtag, args.limit, fetch_eng)
        print(f"  => {len(all_rows)} tweets")
    else:
        for handle, candidate_id in HANDLES:
            try:
                tweets = scrape_profile(handle, args.limit, fetch_eng, use_rss_first=True)
                for t in tweets:
                    t["candidate_id"] = candidate_id
                dedup_append(tweets)
                print(f"{handle}: {len(tweets)} tweets")
            except Exception as e:
                print(f"{handle}: FAIL {e}")

    if args.views and all_rows:
        print("Fetch views...")
        enrich_with_engagement(all_rows, fetch_views=True, delay=1.5)

    out_file = args.output
    if not out_file:
        if args.lebanon_full:
            out_file = out_dir / "tweets_lebanon_full.csv"
        elif args.output_dir and not args.query and not args.hashtag:
            out_file = out_dir / "tweets_rss.csv"
        elif args.handle or args.query or args.hashtag:
            suffix = (args.handle or args.query or args.hashtag or "out").replace(" ", "_")[:30]
            suffix = re.sub(r"[^\w\-]", "_", suffix)
            out_file = out_dir / f"tweets_{suffix}.csv"
        else:
            out_file = out_dir / "tweets_all.csv"
    else:
        out_file = Path(out_file)

    if all_rows:
        with open(out_file, "w", encoding="utf-8", newline="") as f:
            w = csv.DictWriter(f, fieldnames=KEYS, extrasaction="ignore")
            w.writeheader()
            w.writerows(all_rows)
        print(f"Saved -> {out_file}")
    return 0 if all_rows else 1


if __name__ == "__main__":
    sys.exit(main())
