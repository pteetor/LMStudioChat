
import os
import json
from bookmark_manager import add_bookmark, search_bookmarks, BOOKMARK_FILE

def run_tests():
    print("Running bookmark manager tests...")

    # Clean up previous test data
    if os.path.exists(BOOKMARK_FILE):
        os.remove(BOOKMARK_FILE)

    # Test add_bookmark
    print("\nTesting add_bookmark...")
    add_bookmark("https://www.example.com/test1", ["test", "example"])
    add_bookmark("https://www.example.com/test2", ["another", "test"])

    # Verify bookmarks were added
    with open(BOOKMARK_FILE, 'r') as f:
        bookmarks = json.load(f)
        assert len(bookmarks) == 2
        assert bookmarks[0]["url"] == "https://www.example.com/test1"
        assert "test" in bookmarks[0]["tags"]
        print("add_bookmark: PASSED")

    # Test search_bookmarks
    print("\nTesting search_bookmarks...")
    results = search_bookmarks("test")
    assert results["status"] == "success"
    assert len(results["results"]) == 2
    
    found_urls = [item["url"] for item in results["results"]]
    assert "https://www.example.com/test1" in found_urls
    assert "https://www.example.com/test2" in found_urls
    print("search_bookmarks (case-insensitive): PASSED")

    results = search_bookmarks("nonexistent")
    assert results["status"] == "success"
    assert len(results["results"]) == 0
    print("search_bookmarks (no results): PASSED")

    print("\nAll tests passed!")

if __name__ == "__main__":
    run_tests()
