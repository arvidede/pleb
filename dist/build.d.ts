import { Config } from "./types";
export declare function prepareBuildDirectory(config: Config): Promise<void>;
export declare function buildLocalizedPages(config: Config): Promise<void>;
export declare function performPostBuildActions(config: Config): Promise<void>;
export declare function buildSite(config: Config): Promise<void>;
