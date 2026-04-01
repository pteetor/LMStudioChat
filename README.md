# LM Studio Chat App

A CLI chat application using Google Agent Development Kit (ADK)
configured to communicate with an LM Studio instance using its OpenAI compatible API.

## Running

1. Compile the code: `npm run build`.
2. Start LM Studio server.
3. Export environment variables if different from defaults (see below).
4. Run the app: `npm start`

## Environment variables

- LM_STUDIO_BASE_URL="http://omega.tail18a196.ts.net:1234/v1"
- LM_STUDIO_MODEL="gemma-3-12b"
- MAXWELL_WORKSPACE=/home/paul/Projects/workspace
- GEMINI_API_KEY
- GOOGLE_WORKSPACE_CLI_TOKEN
- GOOGLE_WORKSPACE_CLI_CREDENTIALS_FILE=/home/paul/Projects/LMStudioChat/credentials.json
- TELEGRAM_BOT_TOKEN
- TELEGRAM_USER_ID
- BRAVE_API_KEY
