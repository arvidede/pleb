import { Config, LocaleInfo } from "./types";
export declare function handleSSE(req: Request, sseClients: Set<{
    controller: ReadableStreamDefaultController<unknown>;
}>): Response;
export declare function handleRequest(req: Request, config: Config, locales: string[], defaultLocale: string): Promise<Response>;
type SSEClients = Set<{
    controller: ReadableStreamDefaultController<unknown>;
}>;
export declare function startFileWatcher(config: Config, sseClients: SSEClients, initialLocaleData: {
    locales: string[];
    defaultLocale: string;
    localeInfos: LocaleInfo[];
}): void;
export declare function startDevServer(config: Config): Promise<void>;
export {};
