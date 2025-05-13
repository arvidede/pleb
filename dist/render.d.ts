import { UserConfig } from "./types";
export declare function processCSS(config: UserConfig, cssFilePaths?: string[]): Promise<string>;
export declare function renderPage(config: UserConfig, pageModuleBaseDir: string, pageRelativePath: string, locale: string, isDevMode: boolean, passedHtmlTemplateString?: string): Promise<string>;
export declare function buildPage(config: UserConfig, compiledPagesDir: string, pageRelativePath: string, locale: string, htmlTemplateString: string): Promise<void>;
