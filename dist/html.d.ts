import React from "react";
import { Config, LinkedData, Metadata, PageProps, Script, Translations } from "./types";
export declare function loadHtmlTemplate(templatePath: string): Promise<string>;
export declare function renderReactComponentToString(PageComponent: React.ComponentType<PageProps>, translations: Translations): string;
export interface HtmlTemplateData {
    locale: string;
    title: string;
    description: string;
    css: string;
    pageContent: string;
    scripts?: Script;
    metadata?: Metadata;
    linkedData?: LinkedData | null;
    translations: Translations;
    dev: boolean;
}
export declare function populateHtmlTemplate(config: Config, data: HtmlTemplateData): Promise<string>;
export declare function renderError(error: unknown): string;
