/// <reference types="vite/client" />

// FIX: Correctly augment the `ImportMetaEnv` interface for Vite environment variables.
// The `ImportMeta` interface itself should not be redeclared, as it's provided by `vite/client`.
// This change prevents type conflicts and resolves potential type resolution errors for the reference directive above.
interface ImportMetaEnv {
  readonly VITE_GOOGLE_MAPS_API_KEY: string;
  readonly VITE_ODOO_URL: string;
}
