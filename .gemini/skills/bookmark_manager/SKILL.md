---
name: bookmark-manager-skill
description: Use this skill to save URLs in a file and retrieve them later.
             The saved URLs are called "bookmarks",
             and each one has associated tags.
---

## File
The URLs are saved in a workspace file called `bookmarks.jsonl`.

The file format is JSONL, so each line is a valid JSON object
and each object has two elements.

- `url` - A saved URL
- `tags` - An array of strings

For example, one line might be

```
{ "url": "http://www.example.com", "tags": [ "example", "random" ] }
```

## Saving bookmarks
When the user tells you to save a URL,
format the URL and tags into a one-line JSON object
and append the JSON object to the bookmarks file.

If the user does not provide at least one tag, use the tag "none".

# Searching for bookmarks
When the user asks to search the bookmarks for a given tag,
use the `jq` command to search the file.
Use a case-insensitive comparison.
Format the matching line nicely, if any.
