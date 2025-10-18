// FIX: Removed the reference to "vite/client" to resolve a "Cannot find type definition file" error.
// The interfaces below define the structure of `import.meta.env` for the application.

interface ImportMetaEnv {
  readonly VITE_GOOGLE_MAPS_API_KEY: string;
  readonly VITE_ODOO_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
