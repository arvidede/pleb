import React from "react";
import { LinkedData, Metadata, PageProps, Script, ScriptTag, Translations } from "./types";
export declare function loadHtmlTemplate(templatePath: string): Promise<string>;
export declare function renderReactComponentToString(PageComponent: React.ComponentType<PageProps>, translations: Translations): string;
export interface HtmlTemplateData {
    locale: string;
    defaultLocale: string;
    title: string;
    description: string;
    css: string;
    pageContent: string;
    scripts?: Script;
    metadata?: Metadata;
    linkedData?: LinkedData | null;
    translations: Translations;
}
export declare function populateHtmlTemplate(template: string, data: HtmlTemplateData): string;
export declare function injectDevModeSseScript(html: string): string;
export declare function generateScriptTagString(scriptObject: ScriptTag): string;
export declare function renderScripts(html: string, script?: Script): string;
export declare function renderMetadata(html: string, metadata: Metadata): string;
export declare function renderLinkedData(html: string, linkedData: LinkedData): string;
export declare function processHtmlLinks(html: string, locale: string, defaultLocale: string): string;
