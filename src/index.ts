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

import { LlmAgent, BaseLlm, InMemoryRunner, setLogLevel, LogLevel, setLogger } from '@google/adk';
import type { LlmRequest, LlmResponse, Logger } from '@google/adk';
import { ConsoleChannel, TelegramChannel, Channel } from './channel.js';

class FileLogger implements Logger {
    private logFile: string;
    private level: LogLevel = LogLevel.INFO;

    constructor() {
        const dirPath = 'logs';
        if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, { recursive: true });
        }
        const dateStr = new Date().toISOString().split('T')[0];
        this.logFile = `${dirPath}/log-${dateStr}.log`;
    }

    private writeLog(levelName: string, ...args: unknown[]) {
        const msg = args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ');
        const timestamp = new Date().toISOString();
        fs.appendFileSync(this.logFile, `[${timestamp}] [${levelName}] ${msg}\n`);
    }

    log(level: LogLevel, ...args: unknown[]): void {
        if (level >= this.level) {
            const levelName = LogLevel[level] || 'UNKNOWN';
            this.writeLog(levelName, ...args);
        }
    }
    debug(...args: unknown[]): void { this.log(LogLevel.DEBUG, ...args); }
    info(...args: unknown[]): void { this.log(LogLevel.INFO, ...args); }
    warn(...args: unknown[]): void { this.log(LogLevel.WARN, ...args); }
    error(...args: unknown[]): void { this.log(LogLevel.ERROR, ...args); }
    setLogLevel(level: LogLevel): void { this.level = level; }
}

// Route ADK logs to a file to keep the console clean for chat
setLogger(new FileLogger());
setLogLevel(LogLevel.INFO);

function convertSchema(googleSchema: any): any {
    if (!googleSchema) return { type: 'object', properties: {} };
    const jsonSchema: any = {};
    if (googleSchema.type) {
        jsonSchema.type = googleSchema.type.toLowerCase();
    }
    if (googleSchema.properties) {
        jsonSchema.properties = {};
        for (const [key, value] of Object.entries(googleSchema.properties)) {
            jsonSchema.properties[key] = convertSchema(value);
        }
    }
    if (googleSchema.items) {
        jsonSchema.items = convertSchema(googleSchema.items);
    }
    if (googleSchema.required) {
        jsonSchema.required = googleSchema.required;
    }
    if (googleSchema.description) {
        jsonSchema.description = googleSchema.description;
    }
    if (googleSchema.enum) {
        jsonSchema.enum = googleSchema.enum;
    }
    return jsonSchema;
}

class LMStudioLlm extends BaseLlm {
  constructor(model: string, private baseUrl: string) {
    super({ model });
  }

  async *generateContentAsync(llmRequest: LlmRequest, stream?: boolean): AsyncGenerator<LlmResponse, void> {
    const messages: any[] = [];

    // Map system instruction
    if (llmRequest.config?.systemInstruction) {
        let content = '';
        if (typeof llmRequest.config.systemInstruction === 'string') {
            content = llmRequest.config.systemInstruction;
        } else if ((llmRequest.config.systemInstruction as any).parts?.[0]?.text) {
            content = (llmRequest.config.systemInstruction as any).parts[0].text;
        }
        if (content) {
            messages.push({ role: 'system', content });
        }
    }

    // Map user/assistant history
    for (const c of llmRequest.contents) {
        if (c.role === 'model') {
            const textParts = c.parts?.filter(p => p.text).map(p => p.text).join('\n') || '';
            const functionCalls = c.parts?.filter(p => p.functionCall).map(p => p.functionCall) || [];
            
            const msg: any = { role: 'assistant', content: textParts };
            
            if (functionCalls.length > 0) {
                msg.tool_calls = functionCalls.map(fc => ({
                    id: `call_${fc?.name}`,
                    type: 'function',
                    function: {
                        name: fc?.name,
                        arguments: JSON.stringify(fc?.args || {})
                    }
                }));
            }
            messages.push(msg);
        } else if (c.role === 'user' || !c.role) {
            const functionResponses = c.parts?.filter(p => p.functionResponse).map(p => p.functionResponse) || [];
            
            if (functionResponses.length > 0) {
                for (const fr of functionResponses) {
                    messages.push({
                        role: 'tool',
                        tool_call_id: `call_${fr?.name}`,
                        name: fr?.name,
                        content: JSON.stringify(fr?.response || {})
                    });
                }
            } else {
                const text = c.parts?.[0]?.text || "";
                messages.push({ role: 'user', content: text });
            }
        }
    }

    const requestBody: any = {
        model: this.model,
        messages: messages,
        temperature: llmRequest.config?.temperature,
        stream: false,
    };

    if (llmRequest.config?.tools && llmRequest.config.tools.length > 0) {
        const tools: any[] = [];
        for (const t of llmRequest.config.tools) {
            const tool = t as any; if (tool.functionDeclarations) {
                for (const fd of tool.functionDeclarations) {
                    tools.push({
                        type: 'function',
                        function: {
                            name: fd.name,
                            description: fd.description,
                            parameters: convertSchema(fd.parameters)
                        }
                    });
                }
            }
        }
        if (tools.length > 0) {
            requestBody.tools = tools;
        }
    }

    try {
        const response = await fetch(`${this.baseUrl}/chat/completions`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer none"
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`LM Studio API error: ${response.status} ${errorText}`);
        }

        const data = await response.json();
        const assistantMessage = data.choices?.[0]?.message;

        if (!assistantMessage) {
            throw new Error("No message returned from LM Studio");
        }

        const parts: any[] = [];
        if (assistantMessage.content) {
            parts.push({ text: assistantMessage.content });
        }

        if (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
            for (const tc of assistantMessage.tool_calls) {
                if (tc.type === 'function') {
                    parts.push({
                        functionCall: {
                            name: tc.function.name,
                            args: tc.function.arguments ? JSON.parse(tc.function.arguments) : {}
                        }
                    });
                }
            }
        }

        yield {
            content: {
                role: "model",
                parts: parts
            }
        };
    } catch (error) {
        yield {
            errorCode: 'LM_STUDIO_ERROR',
            errorMessage: error instanceof Error ? error.message : String(error)
        };
    }
  }

  async connect(llmRequest: LlmRequest): Promise<any> {
      throw new Error("Live connect not supported by LMStudioLlm");
  }
}

import { dateTool, listFilesTool, readFileTool, writeFileTool, appendFileTool, webSearchTool } from './tools.js';

async function main() {
  const { values } = parseArgs({
    options: {
      model: { type: 'string', short: 'm' },
      url: { type: 'string', short: 'u' },
      channel: { type: 'string', short: 'c' },
      help: { type: 'boolean', short: 'h' },
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
`);
    process.exit(0);
  }

  const baseUrl = (values.url as string) || process.env.LM_STUDIO_BASE_URL || "http://127.0.0.1:1234/v1";
  const modelName = (values.model as string) || process.env.LM_STUDIO_MODEL || "gemma-3-12b";
  const channelType = (values.channel as string) || "telegram";

  console.log(`Connecting to LM Studio at ${baseUrl} using model '${modelName}'`);

  const lmStudioLlm = new LMStudioLlm(modelName, baseUrl);

  let systemInstruction = 'You are a helpful AI assistant.';
  try {
      systemInstruction = fs.readFileSync('MAXWELL.md', 'utf-8');
  } catch (error) {
      console.warn("Could not read MAXWELL.md, using default system instruction.");
  }

  const agent = new LlmAgent({
    name: 'lm_studio_agent',
    description: 'An AI assistant powered by LM Studio.',
    model: lmStudioLlm,
    instruction: systemInstruction,
    tools: [dateTool, listFilesTool, readFileTool, writeFileTool, appendFileTool, webSearchTool],
  });

  const runner = new InMemoryRunner({
    agent,
    appName: 'LMStudioChat'
  });

  const userId = 'user-1';
  let sessionIndex = 1;
  let sessionId = `session-${sessionIndex}`;

  await runner.sessionService.createSession({
    appName: 'LMStudioChat',
    userId,
    sessionId
  });

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

  async function saveCurrentSession() {
      try {
          const session = await runner.sessionService.getSession({
              appName: 'LMStudioChat',
              userId,
              sessionId
          });
          
          if (session && session.events) {
              const history = session.events
                  .map(e => {
                      // Filter out events that contain tool calls or tool responses
                      const hasToolCall = e.content?.parts?.some((p: any) => p.functionCall);
                      const hasToolResponse = e.content?.parts?.some((p: any) => p.functionResponse);
                      if (hasToolCall || hasToolResponse) return null;

                      let text = e.content?.parts?.filter((p: any) => p.text).map((p: any) => p.text).join('\n');
                      if (!text) return null;
                      
                      // Remove LLM thoughts (typically enclosed in <think>...</think> tags)
                      text = text.replace(/<think>[\s\S]*?<\/think>\n*/g, '').trim();
                      if (!text) return null;

                      return {
                          author: e.author === 'lm_studio_agent' ? 'assistant' : 'user',
                          timestamp: e.timestamp,
                          date: new Date(e.timestamp).toISOString(),
                          text: text
                      };
                  })
                  .filter(e => e !== null);

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
      await runner.sessionService.createSession({
        appName: 'LMStudioChat',
        userId,
        sessionId
      });
      channel.send(`\nStarted new session.\n`);
      continue;
    }

    try {
      const events = runner.runAsync({
          userId,
          sessionId,
          newMessage: { role: 'user', parts: [{ text: userInput }] }
      });

      for await (const event of events) {
        if (event.content?.parts?.[0]?.text) {
            if (event.author === 'lm_studio_agent') {
                channel.send(`\nAssistant: ${event.content.parts[0].text}\n`);
            }
        } else if (event.errorMessage) {
            channel.send(`\nAgent Error: ${event.errorMessage}\n`);
        }
      }
    } catch (error) {
      channel.send(`\nError running agent: ${error}\n`);
    }
  }
}

main().catch(console.error);
