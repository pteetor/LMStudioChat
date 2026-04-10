# Tools

Create the following tools for the LLM
and use the ADK to expose the tools to the LLM.

In all these tool definitions, a "relative path"
is relative to the directory path defined
by environment variable `MAXWELL_WORKSPACE`,
which must defined and must be an absolute path.

## Date and time tool
This tool lets the LLM query the current date and time
on the client computer.

## List files tool
List the files in a directory on the agent's computer.
Returns the name, size, and mtime of each file.

- The only argument is a directory path.
- The default path is ".", meaning the agent workspace.
- Absolute paths are allowed
- Relative paths are allowed.

The tool returns a JSON array of objects, one per file,
with keys `name`, `mtime` (modification time), and `size`.
For example,

```json
[
    { "name": "a_file.txt",
      "size": 100,
      "mtime": "2206-03-28T11:30:25.783Z"
    }
]
```

## Read file tool
This tool lets the LLM read files on the agent's computer.

- The only argument is the path of the file to be read
- Absolute paths are allowed
- Relative paths are allowed.

## Write file tool
This tool lets the LLM write files on the agent's computer.

- The arguments are
    - path of the file to be written
    - character string to be written to the file
- Absolute paths are *not* allowed
- Relative paths are allowed.

## Append file tool
This tool lets the LLM append text to files on the agent's computer.

- The arguments are
    - `path` - path of file to be updated
    - `content` - character string to append to file
- Absolute paths are *not* allowed
- Relative paths are allowed.

## Web search tool
This tool lets the LLM search the web.

- arguments are
    - `query` - search for this string

The tool returns 5 search results.

The web search tool uses the API of the Brave search engine.
The Brave API key is available in the environment variable `BRAVE_API_KEY`,
which must be defined.

## Web download tool
Download a file from the web into the `downloads` directory of the workspace.

- Arguments
    - `url` - string; the file's URL
    - `filename` - optional string; name for the downloaded file
- Returns a object with
    - `status` - string;
    - `path` - string; path of the output file, relative to the workspace directory
      (so it will always begin with `downloads/`.)

If `filename` is missing, the agent will create a unique name.

## Shell tool
Execute a shell command on the agent's host computer
and return the output.
In safe mode, show the command on the console but do not execute.

- Arguments:
    - `cmd` - string; the shell command
- Returns an object with
    - `cmd` - string; the given shell command
    - `status` - integer; the return code from the command execution
    - `stdout` - string; the captured standard output
    - `stderr` - string; the captured standard error

If the agent is running in *safe mode* (`--safe` on the command line), do not actually execute the command.
Instead, show the command on the console and return a `status` of 2.
