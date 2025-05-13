import React from "react";
import { Metadata, PageProps, Script, ScriptTag, Translations } from "./types";
export declare function loadHtmlTemplate(templatePath: string): Promise<string>;
export interface PageExports {
    metadata: Metadata;
    script?: Script;
}
interface PageModuleExports {
    generateMetadata?: (content: Translations) => Metadata;
    script?: Script;
}
export declare function extractPageExports(pageModule: PageModuleExports, content: Translations): PageExports;
export declare function renderReactComponentToString(PageComponent: React.ComponentType<PageProps>, translations: Translations): string;
export interface HtmlTemplateData {
    locale: string;
    title: string;
    description: string;
    css: string;
    pageContent: string;
}
export declare function populateHtmlTemplate(template: string, data: HtmlTemplateData): string;
export declare function injectDevModeSseScript(html: string): string;
export declare function generateScriptTagString(scriptObject: ScriptTag): string;
export declare function renderScripts(html: string, script?: Script): string;
export declare function renderMetadata(html: string, metadata: Metadata): string;
export declare function processHtmlLinks(html: string, locale: string, defaultLocale: string): string;
export {};
