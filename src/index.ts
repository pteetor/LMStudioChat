import { parseArgs } from 'node:util';
import * as fs from 'node:fs';

// Suppress punycode deprecation warning
const originalEmit = process.emit;
process.emit = function (name: any, data: any, ...args: any[]) {
  if (
    name === 'warning' &&
    typeof data === 'object' &&
    data.name === 'DeprecationWarning' &&
    data.message.includes('punycode')
  ) {
    return false;
  }
  return originalEmit.apply(process, [name, data, ...args] as any);
} as any;

import { ConsoleChannel, TelegramChannel, Channel } from './channel.js';
import { dateTool, listFilesTool, readFileTool, writeFileTool, appendFileTool, webSearchTool, webDownloadTool, shellTool, setSafeMode } from './tools.js';
import type { LocalTool } from './tools.js';

import OpenAI from 'openai';
import { zodFunction } from 'openai/helpers/zod.mjs';
import { z } from 'zod';

interface ChatEvent {
    author: 'user' | 'assistant';
    timestamp: number;
    date: string;
    text: string;
}

async function main() {
  const { values } = parseArgs({
    options: {
      model: { type: 'string', short: 'm' },
      url: { type: 'string', short: 'u' },
      channel: { type: 'string', short: 'c' },
      help: { type: 'boolean', short: 'h' },
      safe: { type: 'boolean' },
    },
    strict: false,
  });

  if (values.help) {
    console.log(`
Usage: npm start -- [options]

Options:
  --help, -h       Show this help message and exit
  --channel, -c    Set the channel to use ('telegram' or 'console'). Default: telegram
  --model, -m      Set the LLM model name to use. Default: gemma-3-12b (or LM_STUDIO_MODEL env)
  --url, -u        Set the LM Studio base URL. Default: http://127.0.0.1:1234/v1 (or LM_STUDIO_BASE_URL env)
  --safe           Operate in "safe mode". Dangerous commands are logged on the console but not executed.
`);
    process.exit(0);
  }

  if (values.safe) {
      setSafeMode(true);
      console.log("Operating in safe mode.");
  }

  const baseUrl = (values.url as string) || process.env.LM_STUDIO_BASE_URL || "http://127.0.0.1:1234/v1";
  const modelName = (values.model as string) || process.env.LM_STUDIO_MODEL || "gemma-3-12b";
  const channelType = (values.channel as string) || "telegram";

  console.log(`Connecting to LM Studio at ${baseUrl} using model '${modelName}'`);

  const openai = new OpenAI({
    baseURL: baseUrl,
    apiKey: 'lm-studio', // Required by SDK, but LM Studio accepts any string
  });

  let systemInstruction = 'You are a helpful AI assistant.';
  try {
      systemInstruction = fs.readFileSync('MAXWELL.md', 'utf-8');
  } catch (error) {
      console.warn("Could not read MAXWELL.md, using default system instruction.");
  }

  const toolsList: LocalTool[] = [dateTool, listFilesTool, readFileTool, writeFileTool, appendFileTool, webSearchTool, webDownloadTool, shellTool];
  
  const openAiTools: OpenAI.Chat.ChatCompletionTool[] = toolsList.map(t => zodFunction({
      name: t.name,
      description: t.description,
      parameters: t.parameters || z.object({})
  }));

  let channel: Channel;
  if (channelType === 'console') {
      channel = new ConsoleChannel();
      console.log("Using Console channel");
  } else {
      channel = new TelegramChannel();
      console.log("Using Telegram channel");
  }

  channel.send('Chat started. Type your message below.');
  channel.send('Commands: /exit or /quit to exit, /reset or /new to start a new session, /model to show current model.');

  let sessionIndex = 1;
  let sessionId = `session-${sessionIndex}`;

  let messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: 'system', content: systemInstruction }
  ];
  let events: ChatEvent[] = [];

  async function saveCurrentSession() {
      try {
          const history = events.map(e => {
              const cleanText = e.text.replace(/<think>[\s\S]*?<\/think>\n*/g, '').trim();
              if (!cleanText) return null;
              return { ...e, text: cleanText };
          }).filter(e => e !== null);

          if (history.length > 0) {
              const dirPath = 'memory/sessions';
              if (!fs.existsSync(dirPath)) {
                  fs.mkdirSync(dirPath, { recursive: true });
              }
              const dateStr = new Date().toISOString().replace(/[:.]/g, '-');
              const fileName = `${dirPath}/${dateStr}-${sessionId}.json`;
              fs.writeFileSync(fileName, JSON.stringify(history, null, 2));
              console.log(`\nSession saved to ${fileName}`);
          }
      } catch (err) {
          console.error(`\nFailed to save session: ${err}`);
      }
  }

  process.on('SIGINT', async () => {
      console.log("\nCaught interrupt signal (SIGINT). Saving session...");
      await saveCurrentSession();
      process.exit(0);
  });

  while (true) {
    const userInput = await channel.listen();
    const input = userInput.trim().toLowerCase();
    
    if (input === '/exit' || input === '/quit') {
      await saveCurrentSession();
      process.exit(0);
    }

    if (input === '/model') {
      channel.send(`\nCurrent model: ${modelName}\n`);
      continue;
    }

    if (input === '/reset' || input === '/new') {
      await saveCurrentSession();
      sessionIndex++;
      sessionId = `session-${sessionIndex}`;
      messages = [
          { role: 'system', content: systemInstruction }
      ];
      events = [];
      channel.send(`\nStarted new session.\n`);
      continue;
    }

    messages.push({ role: 'user', content: userInput });
    events.push({ author: 'user', timestamp: Date.now(), date: new Date().toISOString(), text: userInput });

    try {
        let keepGoing = true;
        while (keepGoing) {
            const requestBody: any = {
                model: modelName,
                messages: messages,
            };
            if (openAiTools.length > 0) {
                requestBody.tools = openAiTools;
            }

            const response = await openai.chat.completions.create(requestBody);

            const message = response.choices?.[0]?.message;
            if (!message) {
                channel.send("\nError: No response from model.\n");
                keepGoing = false;
                break;
            }
            messages.push(message);

            if (message.content) {
                events.push({ author: 'assistant', timestamp: Date.now(), date: new Date().toISOString(), text: message.content });
                channel.send(`\nAssistant: ${message.content}\n`);
            }

            if (message.tool_calls && message.tool_calls.length > 0) {
                for (const toolCall of message.tool_calls) {
                    if (toolCall.type !== 'function') continue;

                    const tool = toolsList.find(t => t.name === toolCall.function.name);
                    let toolResult;
                    if (tool) {
                        try {
                            const args = toolCall.function.arguments ? JSON.parse(toolCall.function.arguments) : {};
                            toolResult = await tool.execute(args);
                        } catch (e) {
                            toolResult = { error: e instanceof Error ? e.message : String(e) };
                        }
                    } else {
                        toolResult = { error: `Tool ${toolCall.function.name} not found.` };
                    }
                    messages.push({
                        role: 'tool',
                        tool_call_id: toolCall.id,
                        content: JSON.stringify(toolResult)
                    });
                }
            } else {
                keepGoing = false;
            }
        }
    } catch (error) {
        channel.send(`\nError running agent: ${error}\n`);
    }
  }
}

main().catch(console.error);
