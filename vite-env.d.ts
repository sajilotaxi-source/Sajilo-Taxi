// FIX: Manually define types for import.meta.env to resolve type errors
// related to Vite environment variables and the missing 'vite/client' type definitions.
interface ImportMetaEnv {
  readonly VITE_GOOGLE_MAPS_API_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
