// This file provides TypeScript definitions for environment variables.
// It declares Node.js `process.env` types for the browser environment,
// as this is how the execution context provides secrets.

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      readonly VITE_ODOO_URL: string;
      readonly VITE_GOOGLE_MAPS_API_KEY: string;
    }
  }
}

// This export is needed to treat the file as a module and allow global declarations.
export {};
