export const googleMapsApiKey: string = (import.meta.env?.VITE_GOOGLE_MAPS_API_KEY) || "";

export const getApiKeyStatus = (): { isValid: boolean; status: 'OK' | 'MISSING' | 'INVALID_FORMAT' } => {
    if (!googleMapsApiKey) {
        return { isValid: false, status: 'MISSING' };
    }
    // Basic structural check for a Maps API key
    if (!googleMapsApiKey.startsWith('AIza') || googleMapsApiKey.length < 20) {
        return { isValid: false, status: 'INVALID_FORMAT' };
    }
    return { isValid: true, status: 'OK' };
};

export const mapContainerStyle = {
  width: '100%',
  height: '100%',
};

export const mapOptions = {
    disableDefaultUI: true,
    zoomControl: true,
    mapTypeControl: true,
    streetViewControl: false,
};
