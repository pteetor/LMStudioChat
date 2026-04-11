import { readFileSync, writeFileSync, appendFileSync, readdirSync, statSync, mkdirSync } from 'fs';
import { z } from 'zod';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export let safeMode = false;
export function setSafeMode(mode: boolean) {
    safeMode = mode;
}

export interface LocalTool {
    name: string;
    description: string;
    parameters?: z.ZodType<any>;
    execute: (args: any) => any | Promise<any>;
}

export const listFilesTool: LocalTool = {
    name: 'list_files',
    description: 'List the files on the local computer.',
    parameters: z.object({
        path: z.string().default('.').describe('The directory path to list files from.')
    }),
    execute: (args: any) => {
        try {
            const dirPath = args.path || '.';
            let finalPath = dirPath;
            if (!path.isAbsolute(dirPath)) {
                const workspace = process.env.MAXWELL_WORKSPACE;
                if (!workspace) {
                    throw new Error("MAXWELL_WORKSPACE environment variable is not defined");
                }
                if (!path.isAbsolute(workspace)) {
                    throw new Error("MAXWELL_WORKSPACE environment variable must be an absolute path");
                }
                finalPath = path.resolve(workspace, dirPath);
            }
            const files = readdirSync(finalPath);
            return files.map(file => {
                const filePath = path.join(finalPath, file);
                const stats = statSync(filePath);
                return {
                    name: file,
                    mtime: stats.mtime.toISOString(),
                    size: stats.size
                };
            });
        } catch (error) {
            return { error: error instanceof Error ? error.message : String(error) };
        }
    }
};

export const dateTool: LocalTool = {
    name: 'get_current_date_and_time',
    description: 'Returns the current date and time on the client computer.',
    execute: () => {
        return { dateTime: new Date().toISOString() };
    }
};

export const readFileTool: LocalTool = {
    name: 'read_file',
    description: 'Reads files on the client computer.',
    parameters: z.object({
        filePath: z.string().describe('The path to the file to read.')
    }),
    execute: (args: any) => {
        try {
            let finalPath = args.filePath;
            if (!path.isAbsolute(args.filePath)) {
                const workspace = process.env.MAXWELL_WORKSPACE;
                if (!workspace) {
                    throw new Error("MAXWELL_WORKSPACE environment variable is not defined");
                }
                if (!path.isAbsolute(workspace)) {
                    throw new Error("MAXWELL_WORKSPACE environment variable must be an absolute path");
                }
                finalPath = path.resolve(workspace, args.filePath);
            }
            return { content: readFileSync(finalPath, 'utf-8') };
        } catch (error) {
            return { error: error instanceof Error ? error.message : String(error) };
        }
    }
};

export const writeFileTool: LocalTool = {
    name: 'write_file',
    description: 'Writes files on the client computer.',
    parameters: z.object({
        path: z.string().describe('The path to the file to write. Absolute paths are not allowed.'),
        content: z.string().describe('The character string to be written to the file.')
    }),
    execute: (args: any) => {
        try {
            if (path.isAbsolute(args.path)) {
                throw new Error("Absolute paths are not allowed for the write file tool.");
            }
            const workspace = process.env.MAXWELL_WORKSPACE;
            if (!workspace) {
                throw new Error("MAXWELL_WORKSPACE environment variable is not defined");
            }
            if (!path.isAbsolute(workspace)) {
                throw new Error("MAXWELL_WORKSPACE environment variable must be an absolute path");
            }
            const finalPath = path.resolve(workspace, args.path);
            writeFileSync(finalPath, args.content, 'utf-8');
            return { success: true };
        } catch (error) {
            return { error: error instanceof Error ? error.message : String(error) };
        }
    }
};

export const appendFileTool: LocalTool = {
    name: 'append_file',
    description: 'Appends text to files on the client computer.',
    parameters: z.object({
        path: z.string().describe('The path of the file to be updated. Absolute paths are not allowed.'),
        content: z.string().describe('The character string to be appended to the file.')
    }),
    execute: (args: any) => {
        try {
            if (path.isAbsolute(args.path)) {
                throw new Error("Absolute paths are not allowed for the append file tool.");
            }
            const workspace = process.env.MAXWELL_WORKSPACE;
            if (!workspace) {
                throw new Error("MAXWELL_WORKSPACE environment variable is not defined");
            }
            if (!path.isAbsolute(workspace)) {
                throw new Error("MAXWELL_WORKSPACE environment variable must be an absolute path");
            }
            const finalPath = path.resolve(workspace, args.path);
            appendFileSync(finalPath, args.content, 'utf-8');
            return { success: true };
        } catch (error) {
            return { error: error instanceof Error ? error.message : String(error) };
        }
    }
};


export const webSearchTool: LocalTool = {
    name: 'web_search',
    description: 'Searches the web using the Brave search engine.',
    parameters: z.object({
        query: z.string().describe('search for this string')
    }),
    execute: async (args: any) => {
        try {
            const apiKey = process.env.BRAVE_API_KEY;
            if (!apiKey) {
                throw new Error('BRAVE_API_KEY environment variable is not defined');
            }

            const url = `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(args.query)}`;
            const response = await fetch(url, {
                headers: {
                    'Accept': 'application/json',
                    'X-Subscription-Token': apiKey
                }
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Brave API error: ${response.status} ${errorText}`);
            }

            const data = await response.json();
            const results = data.web?.results || [];
            
            // Return up to 5 results
            const topResults = results.slice(0, 5).map((r: any) => ({
                title: r.title,
                url: r.url,
                description: r.description
            }));

            return { results: topResults };
        } catch (error) {
            return { error: error instanceof Error ? error.message : String(error) };
        }
    }
};

export const webDownloadTool: LocalTool = {
    name: 'web_download',
    description: 'Download a file from the web into the downloads directory of the workspace.',
    parameters: z.object({
        url: z.string().describe("the file's URL"),
        name: z.string().optional().nullable().describe("optional name for the downloaded file")
    }),
    execute: async (args: any) => {
        try {
            const workspace = process.env.MAXWELL_WORKSPACE;
            if (!workspace) {
                throw new Error("MAXWELL_WORKSPACE environment variable is not defined");
            }
            if (!path.isAbsolute(workspace)) {
                throw new Error("MAXWELL_WORKSPACE environment variable must be an absolute path");
            }

            const downloadsDir = path.join(workspace, 'downloads');
            mkdirSync(downloadsDir, { recursive: true });

            let fileName = args.name;
            if (!fileName) {
                fileName = `download_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
            }

            const finalFilePath = path.join(downloadsDir, fileName);
            const relativeFilePath = 'downloads/' + fileName;

            const response = await fetch(args.url);
            if (!response.ok) {
                throw new Error(`Failed to download: ${response.status} ${response.statusText}`);
            }

            const arrayBuffer = await response.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            writeFileSync(finalFilePath, buffer);

            return {
                status: "success",
                path: relativeFilePath
            };
        } catch (error) {
            return { error: error instanceof Error ? error.message : String(error) };
        }
    }
};

export const shellTool: LocalTool = {
    name: 'shell',
    description: 'Execute a shell command on the agent\'s host computer and return the output.',
    parameters: z.object({
        cmd: z.string().describe('the shell command')
    }),
    execute: async (args: any) => {
        if (safeMode) {
            console.log(`[SAFE MODE] Would execute shell command: ${args.cmd}`);
            return {
                cmd: args.cmd,
                status: 2,
                stdout: '',
                stderr: ''
            };
        }

        try {
            const { stdout, stderr } = await execAsync(args.cmd);
            return {
                cmd: args.cmd,
                status: 0,
                stdout: stdout,
                stderr: stderr
            };
        } catch (error: any) {
            return {
                cmd: args.cmd,
                status: error.code !== undefined ? error.code : 1,
                stdout: error.stdout || '',
                stderr: error.stderr || error.message || String(error)
            };
        }
    }
};
