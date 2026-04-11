# LM Studio chat app

Write an app in TypeScript that lets a user chat with an LLM
hosted on an LM Studio server.

Use an OpenAI-compatible framework for the implementation.

The app will use *channels* to communicate with the user.
The app's loop is

- Read one line of text from the channel.
- Send that line of text to LM Studio
- Show the reply back to the user on the same channel.
- Repeat

## LM Studio server

You can assume that these environment variables are set:

- `LM_STUDIO_BASE_URL` - Base URL for the LM Studio server
- `LM_STUDIO_MODEL` - Name of the LLM model to use

For example, a typical base URL is "http://omega.tail18a196.ts.net:1234/v1",
and a typical model is "gemma-3-12b".

Use the LM Studio API that is compatible with the OpenAI API.
Assume that the LM Studio server does not require a password.
If a password is demanded, however, just use the string "none".

## Channels
A *channel* lets this app send and receive messages
between itself an a user.

Create the channels described in `doc/channels.md`.

## User commands
The user can enter these one-line commands:

- `/exit` or `/quit` - Exit the app
- `/reset` or `/new` - Close the current LLM session and start a new session
- `/model` - Reply with the name of the current LLM model
- `/url` - Reply with the URL of the LLM service

## Command line options
Implement the command line options described in `doc/command-line.md`.

## Tools
Create the tools defined in `doc/tools.md`
and use the ADK to expose the tools to the LLM.

## File structure
This is a multi-file project. TypeScript source code files are in the directory `src/`.

- GEMINI.md - Directives for the Gemini coding agent
- .gemini/
    - settings.json - Gemini settings
    - skills/ - Directory of skill definitions
- MAXWELL.md - Directives for the user agent
- README.md - Notes for humans
- SPEC.md - Project specification
- doc/ - Additional specifications and design notes
- logs/ - Run-time log files
- memory/
    - sessions/ - Session logs
- package.json
- set-env.sh - Script for setting needed environment variables
- src/
    - channel.ts
    - index.ts
    - tools.ts
- tsconfig.json
- workspace/
    - downloads/ - Files downloaded by the web download tool
