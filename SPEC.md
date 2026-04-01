# LM Studio chat app

Write an app in typescript that lets a user chat with an LLM
hosted on an LM Studio server.

Use the Google Agent Development Kit (ADK) package for this application.
That is important, because I want to understand how to use the ADK.

The app will use *channels* to communicate with the user.
The app's loop is

- Read one line of text from the channel.
- Send that line of text to LM Studio
- Show the reply back to the user on the same channel.
- Repeat

## LM Studio server

You can assume that this environment variable is set:

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
There are several kinds of channels.

Create the channels described in `doc/channels.md`.

## User commands
The user can enter one-line commands such as:

- `/exit` or `/quit` - Exit the app
- `/reset` or `/new` - Close the current LLM session and start a new session
- `/model` - Reply with the name of the current LLM model

## Tools
Create the tools defined in `doc/tools.md`
and use the ADK to expose the tools to the LLM.

## File structure
This is a multi-file project. TypeScript source code files are in the directory `src/`.
Those files are

- `src/index.ts`' - the main program
- `src/tools.ts` - tool functions
- `src/channel.ts` - `Channel` super class and its subclasses for managing user connections

Future source files may include

- `src/dashboard.ts` - `Dashboard` class for displaying the application dashboard
