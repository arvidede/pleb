# pleb

This library provides a subpar and inflexible way to build static websites using React, TypeScript, and static site generation (SSG). It supports internationalization, page-specific CSS, metadata generation, and a configurable build process.

It really is utter crap, barely useful. You should be using [astro](https://astro.build/), but if you, for whatever reason, enjoy (unnecessarily) taking the harder path in life - by all means, carry on.

## Table of Contents

- [Getting Started](#getting-started)
    - [Prerequisites](#prerequisites)
    - [1. Project Setup](#1-project-setup)
    - [2. Create Basic Project Structure](#2-create-basic-project-structure)
    - [3. Configure Your Site (`config.js`)](#3-configure-your-site-configjs)
    - [4. Create a Default Locale File](#4-create-a-default-locale-file)
    - [5. Create an HTML Template](#5-create-an-html-template)
    - [6. Create Your First Page](#6-create-your-first-page)
    - [7. Add Scripts to `package.json`](#7-add-scripts-to-packagejson)
    - [8. TypeScript Configuration (`tsconfig.json`)](#8-typescript-configuration-tsconfigjson)
    - [9. Running the Development Server](#9-running-the-development-server)
    - [10. Building for Production](#10-building-for-production)
- [Features](#features)
- [Project Structure](#project-structure)
- [Configuration](#configuration)
- [Creating Pages](#creating-pages)
- [Styling](#styling)
- [Internationalization (i18n)](#internationalization-i18n)
- [Providing Translation Type Overrides](#providing-translation-type-overrides)
- [HTML Template](#html-template)
- [Usage (Development and Build)](#usage-development-and-build)
- [Public Assets](#public-assets)

## Getting Started

This guide will walk you through the basic steps to get a static site up and running using this library.

### Prerequisites

- Bun installed (v1.x or higher recommended).
- Familiarity with React and TypeScript.

### 1. Project Setup

If you're starting a new project with Bun, create a new directory and initialize it:

```bash
mkdir my-static-site
cd my-static-site
bun init
```

Install the pleb library:

```bash
bun add pleb
```

You'll also need React, ReactDOM, and their types, plus TypeScript:

```bash
bun add react react-dom
bun add -d @types/react @types/react-dom typescript
```

### 2. Create Basic Project Structure

Refer to the "Project Structure" section for a typical layout. At a minimum, you'll need:

```
/my-static-site
├── app/
│   ├── pages/
│   │   └── index.tsx
│   ├── locales/
│   │   └── en.json
│   └── template.html
├── config.js
├── package.json
└── tsconfig.json
```

### 3. Configure Your Site (`config.js`)

Create a `config.js` file in your project root. This file tells the library where to find your source files and how to build your site.

```javascript
// /my-static-site/config.js
/**
 *  @type {import('pleb').UserConfig}
 */
const config = {
    port: 3000,
    outDir: "./out",
    defaultLocale: "sv",
    cssFilePath: "./app/styles/global.css",
}

export default config
```

### 4. Create a Default Locale File

Create `app/locales/en.json`:

```json
// app/locales/en.json
{
    "hello": "Hello from the Home Page!",
    "homePageTitle": "My Static Site"
}
```

### 5. Create an HTML Template

Create `app/template.html`:

```html
<!DOCTYPE html>
<html lang="{{locale}}">
    <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>{{title}}</title>
        <meta name="description" content="{{description}}" />
        {{metaTags}}
        <style>
            {{css}}
        </style>
        {{scriptsBefore}}
    </head>
    <body>
        <div id="root">{{pageContent}}</div>
        {{scriptsAfter}}
    </body>
</html>
```

### 6. Create Your First Page

Create `app/pages/index.tsx`:

```typescript jsx
// app/pages/index.tsx
import React from 'react';

import { PageProps, Metadata, Translations } from 'pleb';


export const generateMetadata = (content: Translations): Metadata => {
    return {
        title: content.homePageTitle || "Home",
        description: "Welcome to the homepage.",
    };
};

const HomePage: React.FC<PageProps> = ({ content }) => {
    return (
        <div>
            <h1>{content.hello || 'Hello, world!'}</h1>
        </div>
    );
};

export default HomePage;
```

**Note:** The import path for `PageProps`, `Metadata`, `Translations`, and other exports assumes that the `pleb` package is configured to make these available directly (e.g., via its main entry point and `package.json` exports/types fields). If you encounter issues, double-check the `pleb` package's documentation or its structure in `node_modules`.

### 7. Add Scripts to `package.json`

```json
// package.json (scripts section)
"scripts": {
  "dev": "pleb dev",
  "build": "pleb build"
  // If you want to serve your 'outDir' (e.g., 'out') after building, you can use a simple server like 'serve':
  // "serve": "serve out"
  // You might need to install it first: bun add -d serve
},
```

### 8. TypeScript Configuration (`tsconfig.json`)

Create a basic `tsconfig.json` in your project root:

```json
// /my-static-site/tsconfig.json
{
    "compilerOptions": {
        "target": "ES2020",
        "module": "esnext",
        "moduleResolution": "bundler",
        "jsx": "react-jsx",
        "esModuleInterop": true,
        "strict": true,
        "skipLibCheck": true,
        "outDir": "./out",
        "rootDir": "./",
        "baseUrl": "./",
        "paths": {
            "*": ["node_modules/*"]
        }
    },
    "include": ["app/**/*", "config.js"],
    "exclude": ["node_modules", "out"]
}
```

### 9. Running the Development Server

Once the setup is complete and your `package.json` scripts are configured correctly:

```bash
bun run dev
```

This should start the development server (e.g., on `http://localhost:3000`).

### 10. Building for Production

To build your static site:

```bash
bun run build
```

This will generate the static files in the directory specified by `outDir` in your `config.js` (e.g., `/my-static-site/out`).

This "Getting Started" section provides a foundational guide. Refer to the rest of this README for more detailed information on features, configuration, and advanced usage.

## Features

- **React & TypeScript:** Write pages as `.tsx` or `.ts` components.
- **Server-Side Rendering (SSR):** Pages are rendered to static HTML.
- **File-based Routing:** Pages are created based on the file structure in the `pages` directory.
- **Internationalization (i18n):** Support for multiple locales using JSON translation files.
- **CSS Handling:**
    - Global stylesheet.
    - Page-specific CSS for `.tsx` components (co-located or in `styles/pages`).
    - PostCSS processing with `autoprefixer` and `cssnano`.
- **Metadata Generation:** Define `title`, `description`, and other meta tags per page.
- **Customizable HTML Template:** Use your own `template.html` file.
- **Script Injection:** Add custom scripts before or after the main page content.
- **Development Server:** Provides live reloading and on-the-fly compilation of TypeScript/JSX, powered by Bun.
- **Static Build:** Generates a production-ready `out` (or configurable `outDir`) folder.

## Project Structure

A typical project using this library might look like this:

```
/projectRoot
├── app/                    # (Convention, based on UserConfig.appDir)
│   ├── pages/              # Your page components
│   │   ├── index.tsx
│   │   └── about.tsx
│   ├── locales/            # Translation files
│   │   ├── en.json
│   │   └── sv.json
│   ├── styles/             # CSS files
│   │   ├── global.css      # Main global stylesheet
│   │   └── pages/          # Page-specific styles (optional structure)
│   │       └── about.css   # e.g., for about.tsx
│   ├── public/             # Static assets (copied to output directory)
│   │   └── images/
│   │       └── logo.png
│   └── template.html       # Main HTML template for all pages
├── config.js
├── package.json
└── tsconfig.json
```

## Configuration

The library is configured through a `UserConfig` object in `/projectRoot/config.js`:

- `projectRoot`: The root directory of your project.
- `port`: Port for the development server.
- `appDir`: The base directory for your application source files (pages, locales, etc.).
- `outDir`: The directory where the static site will be built (e.g., `out`).
- `pagesDir`: Directory containing your page components (e.g., `app/pages`).
- `localesDir`: Directory containing locale JSON files (e.g., `app/locales`).
- `stylesDir`: Directory containing CSS files (e.g., `app/styles`).
- `publicDir`: Directory for static assets to be copied to `outDir` (e.g., `app/public`).
- `templatePath`: Path to the main HTML template file (e.g., `app/template.html`).
- `cssFilePath`: Path to the global CSS file (e.g., `app/styles/global.css`).
- `defaultLocale`: The default language for your site (e.g., `"en"`).
- `baseUrl`: The base URL of your site (e.g., `"https://example.com"`).

## Creating Pages

Pages are React components written in `.tsx` (for JSX) or `.ts`.

1.  **Location:** Place your page files in the directory specified by `config.pagesDir`.

    - `pages/index.tsx` maps to `/`
    - `pages/about.tsx` maps to `/about/`
    - `pages/blog/my-post.tsx` maps to `/blog/my-post/`

2.  **Structure of a Page Component:**

    ```typescript jsx
    // Example: app/pages/about.tsx
    import React from 'react';
    import { PageProps, Metadata, Script, Translations } from '../path/to/static/src/types'; // Adjust path as needed

    // Optional: Define metadata for the page
    export const generateMetadata = (content: Translations): Metadata => {
        return {
            title: content.aboutPageTitle || "About Us",
            description: content.aboutPageDescription || "Learn more about our company.",
            og: {
                title: "Custom OG Title for About Page"
            }
        };
    };

    // Optional: Define scripts to be injected
    export const script: Script = {
        before: [
            // { textContent: "console.log('Script before body for About page');" }
        ],
        after: [
            { src: "/assets/js/about-specific.js", async: true }
        ]
    };

    // The default export is the page component
    const AboutPage: React.FC<PageProps> = ({ content }) => {
        return (
            <div>
                <h1>{content.aboutTitle || 'About Us'}</h1>
                <p>{content.aboutIntro || 'This is the about page.'}</p>
            </div>
        );
    };

    export default AboutPage;
    ```

3.  **Page Props (`PageProps`):**

    - `content`: An object containing translations for the current locale. Keys are strings from your locale JSON files.

4.  **`generateMetadata` (Optional Export):**

    - A function that takes the `content` (translations) object.
    - Returns a `Metadata` object (`{ title: string, description: string, og?: {...}, twitter?: {...} }`).
    - Used to set `<title>`, `<meta name="description">`, and other meta tags in the page's `<head>`.

5.  **`script` (Optional Export):**
    - An object of type `Script` with optional `before` and `after` arrays.
    - Each array can contain `ScriptTag` objects to define scripts to be injected.
        - `before`: Injected at the end of the `<head>`.
        - `after`: Injected at the end of the `<body>`.
    - `ScriptTag` properties: `src`, `type`, `async`, `defer`, `textContent`, and other custom attributes.

## Styling

- **Global CSS:** Defined by `config.cssFilePath`. This file's content is processed and inlined into every page.
- **Page-Specific CSS:** For `.tsx` pages, you can create a corresponding `.css` file.
    - If your page is `app/pages/foo/bar.tsx`, the library will look for `app/styles/pages/foo/bar.css`.
    - This CSS will be processed and inlined along with the global CSS, specific to that page.

## Internationalization (i18n)

1.  **Locale Files:** Store translation files as JSON in the directory specified by `config.localesDir`.
    - Example: `app/locales/en.json`, `app/locales/sv.json`
    - ```json
      // app/locales/en.json
      {
          "welcomeMessage": "Hello and Welcome!",
          "aboutPageTitle": "About Our Company"
      }
      ```
2.  **Default Locale:** Set `config.defaultLocale`. Pages in the default locale are typically served from the root path (e.g., `/about/`), while other locales are prefixed (e.g., `/sv/about/`).
3.  **Accessing Translations:** Use the `content` prop passed to your page components.
    - `<h1>{content.welcomeMessage}</h1>`

## Providing Translation Type Overrides

For better type safety when accessing translations, you can use TypeScript module augmentation to extend the `Translations` interface provided by `pleb`. This allows you to define the shape of your translation objects based on your locale JSON files.

1. Create a TypeScript declaration file (e.g., `app/types/pleb.d.ts`).
2. Import `pleb` and your locale JSON files within this declaration file.
3. Use module augmentation to extend the `Translations` interface with the types derived from your locale files.

Here's an example using a Swedish (`sv.json`) locale file:

```typescript
// app/types/pleb.d.ts
import "pleb"
import sv from "../locales/sv.json"

type SV = typeof sv

declare module "pleb" {
    export interface Translations extends SV {}
}
```

Make sure this declaration file is included in your `tsconfig.json` (it should be if it's within a directory included in your `include` array).

By doing this, TypeScript will provide auto-completion and type checking for your translation keys when you access the `content` prop in your page components.

## HTML Template

Customize the base HTML structure by providing a template file at `config.templatePath`. The template should include placeholders that the library will replace:

- `{{locale}}`: The current page's locale code (e.g., "en").
- `{{title}}`: The page title from metadata.
- `{{description}}`: The page description from metadata.
- `{{metaTags}}`: For additional meta tags generated from metadata (like OG, Twitter).
- `{{css}}`: Inlined CSS (global + page-specific).
- `{{pageContent}}`: The server-rendered HTML of your React page component.
- `{{scriptsBefore}}`: Scripts to be injected at the end of `<head>`.
- `{{scriptsAfter}}`: Scripts to be injected at the end of `<body>`.

Example `template.html`:

```html
<!DOCTYPE html>
<html lang="{{locale}}">
    <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>{{title}}</title>
        <meta name="description" content="{{description}}" />
        {{metaTags}}
        <style>
            {{css}}
        </style>
        {{scriptsBefore}}
    </head>
    <body>
        <div id="root">{{pageContent}}</div>
        {{scriptsAfter}}
    </body>
</html>
```

## Usage (Development and Build)

- **Development Server:**

    - Started with `bun run dev`.
    - Bun's development server compiles TypeScript/JSX files on the fly and serves pages, typically with live reloading capabilities.

- **Building for Production:**
    - Typically started with a command like `pnpm run build` or `yarn build`.
    - This command should invoke a function (e.g., `runBuild` from `cli.ts`) that:
        1.  (Potentially) Compiles your page components from `app/pages/**/*.tsx` (and `.ts`) to JavaScript files in a temporary build directory (e.g., a `compiledPagesDir`).
        2.  Outputs the static HTML files, CSS, and public assets to the `config.outDir` directory.

_(Please refer to your project's specific `package.json` scripts or CLI documentation for the exact commands.)_

## Public Assets

Files placed in the `config.publicDir` (e.g., `app/public/`) will be copied to the root of your `config.outDir` during the build process. This is useful for images, fonts, `favicon.ico`, `robots.txt`, etc.
