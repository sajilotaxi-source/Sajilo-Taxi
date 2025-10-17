
// FIX: Manually define types for import.meta.env to resolve type errors
// related to Vite environment variables and the missing 'vite/client' type definitions.
interface ImportMetaEnv {
  readonly VITE_GOOGLE_MAPS_API_KEY: string;
  // FIX: Add VITE_ODOO_URL to the environment variables type definition
  // to resolve the TypeScript error in services/odooService.ts.
  readonly VITE_ODOO_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
