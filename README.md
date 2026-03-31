# LM Studio Chat App

A CLI chat application using Google Agent Development Kit (ADK) configured to communicate with an LM Studio instance using its OpenAI compatible API.

## Running

1. Compile the code: `npx tsc`
2. Start LM Studio server.
3. Export environment variables if different from defaults:
   - `export LM_STUDIO_BASE_URL="http://127.0.0.1:1234/v1"`
   - `export LM_STUDIO_MODEL="your-model-name"`
4. Run the app: `node index.js`

