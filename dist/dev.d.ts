import { LocaleInfo, UserConfig } from "./types";
export declare function handleSSE(req: Request, sseClients: Set<{
    controller: ReadableStreamDefaultController<unknown>;
}>): Response;
export declare function handleRequest(req: Request, config: UserConfig, locales: string[], defaultLocale: string, pagesDir: string, publicDir: string): Promise<Response>;
export declare function startFileWatcher(config: UserConfig, sseClients: Set<{
    controller: ReadableStreamDefaultController<unknown>;
}>, initialLocaleData: {
    locales: string[];
    defaultLocale: string;
    localeInfos: LocaleInfo[];
}): void;
export declare function startDevServer(config: UserConfig): Promise<void>;
