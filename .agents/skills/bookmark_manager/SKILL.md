# Bookmark Manager Skill

This skill allows you to save URLs with associated tags and later retrieve those URLs by searching for their tags.

## Functions

### `add_bookmark(url: str, tags: list[str])`
Adds a new URL with a list of tags to your bookmarks.

- `url` (string, required): The web address to bookmark.
- `tags` (list of strings, required): A list of keywords or categories for the bookmark.

### `search_bookmarks(tag_query: str)`
Searches for bookmarked URLs by a specific tag (case-insensitive) and returns matching URLs along with their original tags.

- `tag_query` (string, required): The tag to search for.

### `delete_bookmark(url: str)`
Deletes a bookmark by its URL.

- `url` (string, required): The URL of the bookmark to delete.
