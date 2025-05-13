import { UserConfig } from "./types";
export declare const getDirname: () => string;
export declare function processPublicDirectory(config: UserConfig): Promise<void>;
export declare function getAllTsxFiles(dirPath: string, fileList?: string[]): Promise<string[]>;
export declare function generateSitemap(config: UserConfig): Promise<string>;
