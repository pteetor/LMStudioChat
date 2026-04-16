---
name: bookmarks
description: Use this skill to save URLs in the workspace or retrieve them.
             The saved URLs are called *bookmarks*.
             Each bookmark has one or more tags.
---

## File
The URLs are saved in the workspace file `bookmarks.jsonl`.
This is called *the bookmarks file*.

The file format is JSONL, so each line is a valid JSON object
and each object has two elements.

- `url` - A saved URL
- `tags` - An array of strings

For example, one line might be

```
{ "url": "http://www.example.com", "tags": [ "example", "random" ] }
```

## Saving bookmarks
When the user tells you to "save" a URL or "bookmark" a URL,

- Format the URL and tags into a one-line JSON object
- Append the JSON object to the bookmarks file
- Tell the user that the URL is saved

If the user does not provide at least one tag, use the tag "none".

# Searching for bookmarks
When the user asks to search for a saved URL or "bookmark",
use the `jq` command to search the bookmarks file.
Use a case-insensitive comparison.
Nicely format the matching lines, if any.
