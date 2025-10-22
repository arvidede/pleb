import { existsSync, mkdirSync } from "fs"
import path from "path"
import sharp from "sharp"
import config from "../config"
import { getFileName, ImageFormat, ImageSize, SIZES } from "./utils"

const SUPPORTED_EXTENSIONS: Set<string> = new Set([
    ".jpg",
    ".jpeg",
    ".png",
    ".webp",
    ".gif",
    ".avif",
    ".tiff",
])

function extensionIsSupported(src: string) {
    return SUPPORTED_EXTENSIONS.has(path.extname(src).toLowerCase())
}

const WEBP_QUALITY: number = 50
const JPEG_QUALITY: number = 50

class ImageRegistry {
    private queue: Set<string>
    private outDir: string
    private processing: Set<string>

    constructor() {
        this.queue = new Set<string>()
        this.outDir = path.join(config.outDir, config.imgDir)
        this.processing = new Set<string>()
        this.setupOutDir()
    }

    private setupOutDir() {
        if (!existsSync(this.outDir)) {
            mkdirSync(this.outDir, { recursive: true })
        }
    }

    public get images() {
        return Array.from(this.queue.values())
    }

    public get hasUnprocessed() {
        return this.queue.size > 0
    }

    public add(src: string) {
        if (
            this.processing.has(src) ||
            this.queue.has(src) ||
            this.imageProcessed(src) ||
            !extensionIsSupported(src)
        ) {
            return
        }

        this.queue.add(src)
    }

    private getFilePath(src: string, size: ImageSize, format: ImageFormat) {
        return path.join(this.outDir, getFileName(src, size, format))
    }

    private imageProcessed(src: string): boolean {
        const width = SIZES[0]

        const webpPath = this.getFilePath(src, width, ImageFormat.Webp)
        const jpegPath = this.getFilePath(src, width, ImageFormat.Jpg)

        return existsSync(webpPath) && existsSync(jpegPath)
    }

    private async processImage(src: string): Promise<void> {
        if (this.imageProcessed(src)) {
            this.queue.delete(src)
            return
        }

        const imagePath = path.join(config.appDir, src)
        const image = sharp(imagePath)

        const processingTasks: Promise<sharp.OutputInfo>[] = []

        for (const width of SIZES) {
            const webpTask = image
                .clone()
                .resize({ width })
                .webp({ quality: WEBP_QUALITY })
                .toFile(this.getFilePath(src, width, ImageFormat.Webp))

            const jpegTask = image
                .clone()
                .resize({ width })
                .jpeg({ quality: JPEG_QUALITY })
                .toFile(this.getFilePath(src, width, ImageFormat.Jpg))

            processingTasks.push(webpTask, jpegTask)
        }

        await Promise.all(processingTasks)

        console.log(`✅ Processed ${src}`)
    }

    public async processImages() {
        if (!this.hasUnprocessed) {
            return
        }

        const imagesToProcess = this.images
        console.log(`Found ${imagesToProcess.length} images to process...`)

        await Promise.all(
            imagesToProcess.map(async (src) => {
                try {
                    this.queue.delete(src)
                    this.processing.add(src)

                    await this.processImage(src)
                } catch (error) {
                    this.queue.add(src)
                    console.error(`❌ Failed to process ${src}:`, error)
                } finally {
                    this.processing.delete(src)
                }
            }),
        )

        console.log("Image processing complete.")
    }
}

const imageRegistry = new ImageRegistry()

export default imageRegistry
