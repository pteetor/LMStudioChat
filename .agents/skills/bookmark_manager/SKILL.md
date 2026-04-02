---
name: bookmark-manager-skill
description: Use this skill to save and retrieve bookmarks,
which are URLs with tags.
---

## File
The bookmarks are saved in the file `workspace/bookmarks.jsonl`.

## File format
The file format is JSONL, so each line is a valid JSON object
and each object has two elements.

- `url` - A saved URL
- `tags` - An array of strings

For example, one line might be

```
{ "url": "http://www.example.com", "tags": [ "example", "random" ] }
```

## Saving bookmarks
To save a new bookmark, format the URL and tags as a JSON object
and append to the bookmarks file.
If the user does not provide at least one tag, ask for a tag.

# Searching for bookmarks
To search for saved bookmarks by their tag,
use `grep` to search the bookmarks file for lines that match the tag.
