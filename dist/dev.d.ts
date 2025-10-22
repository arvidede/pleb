export declare function handleSSE(req: Request, sseClients: Set<{
    controller: ReadableStreamDefaultController<unknown>;
}>): Response;
export declare function handleRequest(req: Request): Promise<Response>;
type SSEClients = Set<{
    controller: ReadableStreamDefaultController<unknown>;
}>;
export declare function startFileWatcher(sseClients: SSEClients): void;
export declare function startDevServer(): Promise<void>;
export {};
