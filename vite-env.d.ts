// FIX: Removed the /// <reference types="vite/client" /> directive to resolve a
// "Cannot find type definition file" error. This is likely due to an issue with the
// build environment's TypeScript configuration. The interfaces below provide the necessary
// types for `import.meta.env` used throughout the application.

// Add explicit type definitions for environment variables to resolve
// issues with `import.meta.env` and provide type safety. This addresses
// errors where TypeScript cannot find the `env` property on `ImportMeta`.
interface ImportMetaEnv {
    readonly VITE_ODOO_URL: string;
    readonly VITE_GOOGLE_MAPS_API_KEY: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}
