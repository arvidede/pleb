import pluginJs from "@eslint/js" // Recommended rules from ESLint itself
import pluginReact from "eslint-plugin-react" // React plugin
import pluginReactHooks from "eslint-plugin-react-hooks" // React Hooks plugin
import globals from "globals" // Helper for common global variables
import tseslint from "typescript-eslint" // TypeScript ESLint plugin

export default tseslint.config(
    {
        // Global ignores
        ignores: ["dist/", "node_modules/", ".pleb/"],
    },
    pluginJs.configs.recommended, // Use ESLint's recommended rules
    ...tseslint.configs.recommended, // Use TypeScript ESLint's recommended rules
    {
        // Configuration for React files
        files: ["src/**/*.{ts,tsx}"], // Apply this config only to TS/TSX files in src
        plugins: {
            react: pluginReact,
            "react-hooks": pluginReactHooks,
        },
        settings: {
            react: {
                version: "detect", // Automatically detect React version
            },
        },
        languageOptions: {
            parser: tseslint.parser, // Specify the TypeScript parser
            parserOptions: {
                ecmaFeatures: {
                    jsx: true, // Enable JSX parsing
                },
                project: ["./tsconfig.json"], // Optional: Enable type-aware rules (requires tsconfig.json)
                // tsconfigRootDir: __dirname, // Optional: Set root directory for tsconfig
            },
            globals: {
                ...globals.browser, // Add browser globals if needed (unlikely for SSG Node.js code)
                ...globals.node, // Add Node.js globals (includes __dirname)
            },
        },
        rules: {
            // Add or override rules here using the new flat config format
            // Rule format: "plugin-name/rule-name": "level" or ["level", { ...options }]
            // For rules from the recommended configs, you might just override the level or options.
            "@typescript-eslint/no-empty-object-type": "off",
            "@typescript-eslint/no-require-imports": "off",
            "@typescript-eslint/explicit-function-return-type": "off", // Disable rule for explicit return types
            "@typescript-eslint/no-explicit-any": "warn", // Warn on explicit any
            "react/react-in-jsx-scope": "off", // Not needed with the new JSX transform
            "@typescript-eslint/no-unused-vars": [
                "warn",
                { argsIgnorePattern: "^_" },
            ], // Warn on unused variables, allow underscore prefix
            // Note: Some rules might have moved or changed names in v9 or plugin updates.
            // Refer to the plugin documentation for the exact rule names and options.
        },
    },
)
