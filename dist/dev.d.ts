import { Config } from "./types";
export declare function handleSSE(req: Request, sseClients: Set<{
    controller: ReadableStreamDefaultController<unknown>;
}>): Response;
export declare function handleRequest(req: Request, config: Config): Promise<Response>;
type SSEClients = Set<{
    controller: ReadableStreamDefaultController<unknown>;
}>;
export declare function startFileWatcher(config: Config, sseClients: SSEClients): void;
export declare function startDevServer(config: Config): Promise<void>;
export {};
