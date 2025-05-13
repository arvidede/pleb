import { UserConfig } from "./types";
export declare function prepareBuildDirectory(config: UserConfig): Promise<void>;
export declare function buildLocalizedPages(config: UserConfig, pagesDir: string, allPages: string[], locales: string[], htmlTemplateString: string): Promise<void>;
export declare function performPostBuildActions(config: UserConfig): Promise<void>;
export declare function buildSite(config: UserConfig): Promise<void>;
