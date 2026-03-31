import * as readline from 'readline';
import { Bot } from 'grammy';

export abstract class Channel {
    abstract send(message: string): void;
    abstract listen(): Promise<string>;
}

export class ConsoleChannel extends Channel {
    private rl: readline.Interface;

    constructor() {
        super();
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
    }

    send(message: string): void {
        console.log(message);
    }

    listen(): Promise<string> {
        return new Promise((resolve) => {
            this.rl.question('> ', (answer) => {
                resolve(answer);
            });
        });
    }
}

export class TelegramChannel extends Channel {
    private bot: Bot;
    private userId: number;
    private messageQueue: string[] = [];
    private resolveListen: ((value: string) => void) | null = null;

    constructor() {
        super();
        const token = process.env.TELEGRAM_BOT_TOKEN;
        const userIdStr = process.env.TELEGRAM_USER_ID;

        if (!token) {
            throw new Error("TELEGRAM_BOT_TOKEN environment variable is not set.");
        }
        if (!userIdStr) {
            throw new Error("TELEGRAM_USER_ID environment variable is not set.");
        }

        this.userId = parseInt(userIdStr, 10);
        if (isNaN(this.userId)) {
            throw new Error("TELEGRAM_USER_ID must be a valid number.");
        }

        this.bot = new Bot(token);

        this.bot.on('message:text', (ctx) => {
            if (ctx.from.id === this.userId) {
                const text = ctx.message.text;
                if (this.resolveListen) {
                    this.resolveListen(text);
                    this.resolveListen = null;
                } else {
                    this.messageQueue.push(text);
                }
            }
        });

        // Start the bot in the background
        this.bot.start().catch(console.error);
    }

    send(message: string): void {
        this.bot.api.sendMessage(this.userId, message).catch(console.error);
    }

    listen(): Promise<string> {
        return new Promise((resolve) => {
            if (this.messageQueue.length > 0) {
                resolve(this.messageQueue.shift()!);
            } else {
                this.resolveListen = resolve;
            }
        });
    }
}
