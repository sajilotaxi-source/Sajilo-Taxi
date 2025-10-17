// FIX: Replaced content to manually define ImportMeta and ImportMetaEnv. This resolves errors related to 'import.meta.env' and avoids the "Cannot find type definition file for 'vite/client'" error.
interface ImportMetaEnv {
    readonly VITE_GOOGLE_MAPS_API_KEY: string;
    readonly VITE_ODOO_URL: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}