# Migrating from Google ADK to an OpenAI-Compatible Library

Converting this project from the Google Agent Development Kit (ADK) to an OpenAI-compatible library (such as Vercel's AI SDK or the official `openai` package) is highly feasible and will significantly simplify your codebase.

Because LM Studio exposes an OpenAI-compatible API, you are currently forced to maintain a cumbersome translation layer to make the Google ADK talk to it. Switching libraries will remove this friction.

Here is a breakdown of what you would need to change and why:

### 1. Dependencies (`package.json`)
*   **What to change:** Remove `@google/adk` and install your target library (e.g., `@ai-sdk/openai` and `ai`, or `openai`). You will keep `zod`.
*   **Why:** You no longer need the Google-specific abstractions. Modern AI libraries use standard Zod schemas and OpenAI message formats natively.

### 2. Tool Definitions (`src/tools.ts`)
*   **What to change:** Remove all usages of `@google/adk`'s `FunctionTool`. Instead, define your tools using standard objects containing the `description`, your existing Zod `parameters`, and the `execute` function.
*   **Why:** OpenAI-compatible libraries can directly consume Zod schemas and automatically convert them into the JSON Schema format required by the LLM. You keep the internal logic of your tools exactly the same while dropping the ADK wrapper.

### 3. Deleting the Custom Translation Layer (`src/index.ts`)
*   **What to change:** You can completely delete the `LMStudioLlm` class and the `convertSchema` function.
*   **Why:** Currently, your `LMStudioLlm` class is doing the heavy lifting of manually mapping ADK's `LlmRequest` format into OpenAI's `role`/`content` format, stringifying tool call arguments, and managing raw `fetch` requests to `http://127.0.0.1:1234/v1/chat/completions`. An OpenAI-compatible library will handle all of this network communication and formatting out-of-the-box simply by pointing its base URL to your LM Studio instance.

### 4. Agent Lifecycle and Execution (`src/index.ts`)
*   **What to change:** Replace the ADK `LlmAgent` and `InMemoryRunner` with a standard conversation loop native to your new SDK (for example, `generateText` in Vercel's AI SDK, or `client.chat.completions.create` in the standard OpenAI SDK).
*   **Why:** The `InMemoryRunner` is tightly coupled to the Google ADK event loop. OpenAI-compatible libraries expect a standard array of message objects. You will replace the runner with a simple array (`Array<Message>`) that you append to on every user turn and tool execution.

### 5. Session Management & Saving (`src/index.ts`)
*   **What to change:** Rewrite the `saveCurrentSession` function. Instead of fetching sessions via `runner.sessionService` and deeply parsing ADK event objects to filter out tool calls and `<think>` tags, you will just serialize your standard message history array. 
*   **Why:** Because you will no longer be using ADK's event-driven runner, your chat history will be a straightforward array of message objects natively. This makes saving transcripts to the `memory/sessions/` folder much cleaner and less error-prone.