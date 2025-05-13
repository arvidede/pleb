import { UserConfig } from "./types";
export declare const getDirname: () => string;
export declare function copyStatic(config: UserConfig): void;
export declare function getAllTsxFiles(config: UserConfig, dirPath: string, fileList?: string[]): string[];
export declare function findHtmlFilesSync(directory: string): string[];
export declare function generateSitemap(config: UserConfig): Promise<string>;
