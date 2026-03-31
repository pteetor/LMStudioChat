
import json
import os

BOOKMARK_FILE = os.path.join(os.path.dirname(__file__), "bookmarks.json")

def _load_bookmarks():
    if not os.path.exists(BOOKMARK_FILE):
        return []
    with open(BOOKMARK_FILE, 'r') as f:
        try:
            return json.load(f)
        except json.JSONDecodeError:
            return []

def _save_bookmarks(bookmarks):
    os.makedirs(os.path.dirname(BOOKMARK_FILE), exist_ok=True)
    with open(BOOKMARK_FILE, 'w') as f:
        json.dump(bookmarks, f, indent=2)

def add_bookmark(url: str, tags: list[str]):
    bookmarks = _load_bookmarks()
    for bookmark in bookmarks:
        if bookmark["url"] == url:
            return {"status": "skipped", "message": f"Bookmark already exists: {url}"}
    bookmarks.append({"url": url, "tags": tags})
    _save_bookmarks(bookmarks)
    return {"status": "success", "message": f"Bookmark added: {url} with tags {tags}"}

def delete_bookmark(url: str):
    bookmarks = _load_bookmarks()
    initial_count = len(bookmarks)
    bookmarks = [b for b in bookmarks if b["url"] != url]
    _save_bookmarks(bookmarks)
    if len(bookmarks) < initial_count:
        return {"status": "success", "message": f"Bookmark deleted: {url}"}
    else:
        return {"status": "not_found", "message": f"Bookmark not found: {url}"}

def search_bookmarks(tag_query: str):
    bookmarks = _load_bookmarks()
    results = []
    tag_query_lower = tag_query.lower()
    if not tag_query:
        return {"status": "success", "results": bookmarks}
    for bookmark in bookmarks:
        if any(t.lower() == tag_query_lower for t in bookmark.get("tags", [])):
            results.append({"url": bookmark["url"], "tags": bookmark["tags"]})
    return {"status": "success", "results": results}
