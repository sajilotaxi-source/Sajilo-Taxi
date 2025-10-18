/// <reference types="vite/client" />

// FIX: Manually define ImportMeta and ImportMetaEnv to provide types for Vite's environment variables.
// This resolves "Property 'env' does not exist on type 'ImportMeta'" errors when the `vite/client`
// reference above is not resolved by the TypeScript compiler in some environments.
interface ImportMetaEnv {
  readonly VITE_GOOGLE_MAPS_API_KEY: string;
  readonly VITE_ODOO_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
