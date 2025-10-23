import { GoogleGenAI, Schema, Type } from "@google/genai"
import path from "node:path"
import config from "../config"
import { Translations } from "../types"

type TranslationMap = Record<string, string>

const ai = new GoogleGenAI({})

function createSchemaFromObject(obj: TranslationMap): Schema {
    const keys = Object.keys(obj)
    const properties: Record<string, { type: Type }> = {}

    keys.forEach((key) => {
        properties[key] = { type: Type.STRING }
    })

    return {
        type: Type.OBJECT,
        properties,
        required: keys,
    }
}

function validateResponseKeys(
    source: TranslationMap,
    translated: TranslationMap,
): boolean {
    const sourceKeys = Object.keys(source).sort()
    const translatedKeys = Object.keys(translated).sort()

    if (sourceKeys.length !== translatedKeys.length) {
        return false
    }

    return JSON.stringify(sourceKeys) === JSON.stringify(translatedKeys)
}

function createSystemPrompt(sourceLang: string, targetLang: string) {
    return `
    You are a JSON translation service.
    You will be given a JSON object. Your task is to:
    
    1.  Translate all string values in the JSON object from "${sourceLang}" to the target language: "${targetLang}".
    2.  Keep all JSON keys exactly the same.
    3.  Your output MUST be ONLY the translated, valid JSON object that matches the provided schema.
  `.trim()
}

async function translateJson(
    sourceJson: string,
    sourceLang: string,
    targetLang: string,
    schema: Schema,
    retry = true,
) {
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: [
                {
                    role: "model",
                    parts: [
                        { text: createSystemPrompt(sourceLang, targetLang) },
                    ],
                },
                {
                    role: "user",
                    parts: [{ text: sourceJson }],
                },
            ],
            config: {
                responseMimeType: "application/json",
                responseSchema: schema,
                temperature: 0,
                thinkingConfig: {
                    thinkingBudget: 1000,
                },
            },
        })

        if (!response || !response.text) {
            throw new Error(`Failed to generate content from API`)
        }

        return JSON.parse(response.text)
    } catch (error) {
        console.error(`API Error during translation to ${targetLang}:`, error)

        if (retry) {
            console.log(`Retrying translation for ${targetLang}`)

            await Bun.sleep(3000)

            return translateJson(
                sourceJson,
                sourceLang,
                targetLang,
                schema,
                false,
            )
        }

        throw new Error(`Failed to generate content from API`)
    }
}

export async function translate(forceTranslate = true) {
    if (!forceTranslate && (await hasTranslations())) {
        console.log("Using existing translations.")
        return
    }

    const locale = config.defaultLocale

    const sourceContent = await getTranslations(config.defaultLocale)

    if (!sourceContent) {
        process.exit(1)
    }

    const sourceLang = locale
    const targetLangs = config.locales.filter((lang) => lang !== sourceLang)

    const sourceJsonString = JSON.stringify(sourceContent, null, 2)
    const responseSchema = createSchemaFromObject(sourceContent)

    console.log(`Translating from: ${sourceLang}`)
    console.log(`Target languages: ${targetLangs.join(", ")}`)
    console.log(`Output directory: ${config.localesDir}`)

    await Promise.all(
        targetLangs.map(async (targetLang) => {
            console.log(`Translating to ${targetLang}...`)

            try {
                const translation = await translateJson(
                    sourceJsonString,
                    sourceLang,
                    targetLang,
                    responseSchema,
                )

                if (!validateResponseKeys(sourceContent, translation)) {
                    console.error(
                        `Error validating response for ${targetLang}. The keys do not match the source file.`,
                    )
                    console.error(
                        "Source Keys:",
                        Object.keys(sourceContent).sort(),
                    )
                    console.error(
                        "Received Keys:",
                        Object.keys(translation).sort(),
                    )
                    process.exit(1)
                }

                const outFile = getLocaleFile(targetLang)
                await outFile.write(JSON.stringify(translation, null, 2))

                console.log(`✅ Successfully wrote ${outFile.name}`)
            } catch (error) {
                console.error(`❌ Failed to translate to ${targetLang}:`, error)
                process.exit(1)
            }
        }),
    )
}

function getLocaleFile(locale: string) {
    return Bun.file(path.join(config.localesDir, `${locale}.json`))
}

async function hasTranslations() {
    return Promise.all(
        config.locales.map((locale) => getLocaleFile(locale).exists()),
    ).then((exists) => exists.every(Boolean))
}

export async function getTranslations(
    locale: string,
): Promise<Translations | null> {
    const file = getLocaleFile(locale)

    if (!(await file.exists())) {
        console.error(
            `Locale content not found for locale "${locale}" at ${file.name}.`,
        )
        return null
    }

    return file.json()
}
