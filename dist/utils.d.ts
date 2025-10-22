export declare const getDirname: () => string;
export declare function processPublicDirectory(): Promise<void>;
export declare function getAllTsxFiles(dirPath: string, fileList?: string[]): Promise<string[]>;
export declare function generateSitemap(): Promise<string>;
