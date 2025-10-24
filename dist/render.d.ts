import { LinkedData, Metadata, PageProps, Script, Translations } from "./types.js"
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
export declare function processCSS(cssFilePaths?: string[]): Promise<string>;
export declare function extractPageExports(pageModule: PageModule, content: Translations): PageExports;
export declare function renderPage(pageRelativePath: string, locale: string, isDevMode: boolean): Promise<string>;
export declare function buildPage(locale: string, pageFilePath: string): Promise<void>;
export {};
