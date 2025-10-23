declare class ImageRegistry {
    private queue;
    private outDir;
    private processing;
    constructor();
    private setupOutDir;
    get images(): string[];
    get hasUnprocessed(): boolean;
    add(src: string): void;
    private getFilePath;
    private imageProcessed;
    private processImage;
    processImages(): Promise<void>;
}
declare const imageRegistry: ImageRegistry;
export default imageRegistry;
