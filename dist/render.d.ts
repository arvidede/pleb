import { LinkedData, Metadata, PageProps, Script, Translations, UserConfig } from "./types";
interface PageModule {
    default: React.ComponentType<PageProps>;
    generateMetadata?: (content: Translations) => Metadata;
    generateLinkedData?: (content: Translations) => LinkedData;
    script?: Script;
}
export interface PageExports {
    metadata: Metadata;
    linkedData: LinkedData | null;
    script?: Script;
}
export declare function processCSS(config: UserConfig, cssFilePaths?: string[]): Promise<string>;
export declare function extractPageExports(pageModule: PageModule, content: Translations): PageExports;
export declare function renderPage(config: UserConfig, pageModuleBaseDir: string, pageRelativePath: string, locale: string, locales: string[], isDevMode: boolean): Promise<string>;
export declare function buildPage(config: UserConfig, compiledPagesDir: string, pageRelativePath: string, locale: string, locales: string[]): Promise<void>;
export {};
