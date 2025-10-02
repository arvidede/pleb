import { Config } from "./types";
export declare const getDirname: () => string;
export declare function processPublicDirectory(config: Config): Promise<void>;
export declare function getAllTsxFiles(dirPath: string, fileList?: string[]): Promise<string[]>;
export declare function generateSitemap(config: Config): Promise<string>;
