# Channels specification
A *channel* lets this app send and receive messages
between itself an a user.

There are several diffent channels,
such as the console and the Telegram message service,
Each kind of channel is implmeented by a its own object class,
and all those objects inherit from an abstract base class
called simply `Channel`.

There are currently two channel object classes.

- `ConsoleChannel` - read and write to console
- `TelegramChannel` - read and write to the Telegram message service

Object heirarchy:

- Channel
   - ConsoleChannel
   - TelgramChannel

All channel objects provide these methods.

- function send(message: string): void - Queue the message for display on the channel
- async function listen(): Promise<string> - returns the next message sent from the channel.

## ConsoleChannel
Write messages to the console and read user messages from the console

## TelegramChannel
Write messages to a Telegram channel and read user messages from that Telegram channel.
Use the `grammY` package, which is already installed.

You can assume that the following environment variables are set:

- TELEGRAM_BOT_TOKEN - The token for the Telgram bot
- TELEGRAM_USER_ID - Telegram ID for the Telegram user

## File structure
The source code for these object classes lives in the file `src/channel.ts`.
