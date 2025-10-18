import React, { useState, useEffect, useMemo, useReducer } from 'react';
import type { Cab, Trip, Customer, Admin, Driver, AuthState, AppMeta } from './types.ts';
import { CustomerApp } from './components/customer.tsx';
import { AdminPanel } from './components/admin.tsx';
import { DriverApp } from './components/driver.tsx';
import { AppLoginPage } from './components/auth.tsx';
import { DriverOnboardingPage } from './components/onboarding.tsx';
import { UpdateToast } from './components/ui.tsx';

// --- TYPE DEFINITIONS ---
declare global {
    interface Window {
        Razorpay: any;
        // FIX: Add google property for Google Maps API to fix errors in other components.
        google: any;
    }
}

// --- DATA & STATE MANAGEMENT ---
const STORAGE_KEY = 'sajilo_taxi_data';
const AUTH_STORAGE_KEY = 'sajilo_taxi_auth';
const DATA_VERSION = '1.4.3'; // Incremented to force invalidation of corrupt localStorage data on mobile.

const locationCoordinates: { [key: string]: [number, number] } = {
    'Gangtok': [27.3314, 88.6138], 'Pelling': [27.3165, 88.2415], 'Lachung': [27.6896, 88.7431],
    'Lachen': [27.7167, 88.5500], 'Yuksom': [27.3700, 88.2200], 'Namchi': [27.1700, 88.3500],
    'Ravangla': [27.3000, 88.3667], 'Zuluk': [27.2550, 88.7750], 'Mangan': [27.5000, 88.5333],
    'Darjeeling': [27.0410, 88.2663], 'Kalimpong': [27.0600, 88.4700], 'Kurseong': [26.8833, 88.2833],
    'Mirik': [26.9000, 88.1667], 'Siliguri': [26.7271, 88.3953], 'Bagdogra': [26.7000, 88.3167],
    'New Jalpaiguri (NJP)': [26.6833, 88.4333], 'Thimphu': [27.4667, 89.6333], 'Paro': [27.4333, 89.4167],
    'Punakha': [27.5833, 89.8667], 'Phuentsholing': [26.8500, 89.3833]
};

const initialData = {
    admins: [{ id: 99, name: 'System Superadmin', username: 'sajilotaxi@gmail.com', password: 'admin', role: 'superadmin', otpEnabled: false }] as Admin[],
    drivers: [
        { id: 1, name: 'Sangeeta Rai', phone: '+91 9876543210', username: 'sangeeta', password: 'password', role: 'driver' },
        { id: 2, name: 'Sunita Rai', phone: '+91 9876543211', username: 'sunita', password: 'password', role: 'driver' },
        { id: 3, name: 'Bikash Gurung', phone: '+91 9876543212', username: 'bikash', password: 'password', role: 'driver' },
        { id: 4, name: 'Pramod Chettri', phone: '+91 9876543213', username: 'pramod', password: 'password', role: 'driver' },
    ] as Driver[],
    cabs: [
        { id: 1, type: 'SUV (7 Seater)', vehicle: 'SK01 J 1234', from: 'Kalimpong', to: 'Gangtok', price: 400, totalSeats: 7, driverId: 1, location: locationCoordinates['Kalimpong'], destination: locationCoordinates['Gangtok'], departureTime: '09:00 AM', imageUrl: 'https://images.unsplash.com/photo-1554224311-39a092c6126c?q=80&w=870&auto=format&fit=crop' },
        { id: 2, type: 'Sedan (4 Seater)', vehicle: 'SK04 P 5678', from: 'Siliguri', to: 'Darjeeling', price: 600, totalSeats: 4, driverId: 2, location: locationCoordinates['Siliguri'], destination: locationCoordinates['Darjeeling'], departureTime: '09:30 AM', imageUrl: 'https://images.unsplash.com/photo-1580273916550-4852b64d123c?q=80&w=764&auto=format&fit=crop' },
        { id: 3, type: 'Sumo (10 Seater)', vehicle: 'WB74 A 9012', from: 'Gangtok', to: 'Pelling', price: 350, totalSeats: 10, driverId: 3, location: locationCoordinates['Gangtok'], destination: locationCoordinates['Pelling'], departureTime: '10:15 AM', imageUrl: 'https://imgd.aeplcdn.com/1280x720/n/cw/ec/40432/scorpio-classic-exterior-right-front-three-quarter-15.jpeg?isig=0&q=80' },
        { id: 4, type: 'SUV (8 Seater)', vehicle: 'SK01 T 4321', from: 'Gangtok', to: 'Lachung', price: 650, totalSeats: 8, driverId: 4, location: locationCoordinates['Gangtok'], destination: locationCoordinates['Lachung'], departureTime: '08:00 AM', imageUrl: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?q=80&w=870&auto=format&fit=crop' },
    ] as Cab[],
    locations: Object.keys(locationCoordinates).sort(),
    pickupPoints: {
        'Gangtok': ['MG Marg', 'Deorali', 'Tadong', 'Ranipool'], 'Pelling': ['Upper Pelling', 'Lower Pelling', 'Helipad'],
        'Darjeeling': ['Chowrasta Mall', 'Darjeeling Station', 'Ghoom Monastery'], 'Kalimpong': ['Kalimpong Main Market', 'Deolo Hill', 'Durpin Dara'],
        'Siliguri': ['City Centre', 'Sevoke Road', 'NJP Station'], 'Default': ['Main Bus Stand', 'City Center']
    },
    trips: [] as Trip[], 
    customers: [] as Customer[], 
    customLocationCoordinates: {} as { [key: string]: [number, number] },
};

const getInitialState = () => {
    // Start with a clean slate of default data. This is our trusted base.
    const defaultState = JSON.parse(JSON.stringify(initialData));

    try {
        const storedValue = localStorage.getItem(STORAGE_KEY);
        if (!storedValue) {
            console.log('✅ No stored data found. Using fresh initial state.');
            return defaultState;
        }

        const parsed = JSON.parse(storedValue);

        // **Strict Version Check:** If version mismatches, nuke the old data and start fresh.
        if (!parsed || parsed.version !== DATA_VERSION) {
            localStorage.removeItem(STORAGE_KEY);
            console.log(`✅ LocalStorage reset due to version mismatch. Expected v${DATA_VERSION}, found v${parsed?.version}.`);
            return defaultState;
        }

        const storedData = parsed.data;
        if (!storedData) {
             console.warn("⚠️ Stored data object is missing. Falling back to default data.");
             return defaultState;
        }

        // **Paranoid Driver Validation:**
        // We will merge stored data BUT we will be extremely strict about the drivers array.
        // If it's anything but perfect, we replace it with the default drivers.
        let finalDrivers = defaultState.drivers; // Assume we need to use the default drivers.
        
        const storedDrivers = storedData.drivers;
        const driversAreValid =
            Array.isArray(storedDrivers) &&
            storedDrivers.length > 0 && // Must not be empty
            storedDrivers.every(d =>
                d && // driver object exists
                typeof d.id === 'number' &&
                typeof d.username === 'string' && d.username.length > 0 && // username is a non-empty string
                typeof d.password === 'string' && d.password.length > 0 // password is a non-empty string
            );

        if (driversAreValid) {
            console.log('✅ Stored driver data is valid. Using stored drivers.');
            finalDrivers = storedDrivers;
        } else {
            console.warn("⚠️ Self-healed: Stored 'drivers' array was missing, empty, or corrupt. Injecting default driver data to ensure login functionality.");
        }
        
        // Merge stored state, but overwrite with our validated or default drivers.
        const mergedState = {
             ...defaultState, // Start with defaults
             ...storedData,   // Overlay stored data
             drivers: finalDrivers // Explicitly set the drivers
        };

        return mergedState;

    } catch (error) {
        console.error("❌ Critical error parsing state from localStorage. Discarding all stored data.", error);
        localStorage.removeItem(STORAGE_KEY);
        return defaultState; // Return clean default state on any parsing error.
    }
};


function appReducer(state: typeof initialData, action: any): typeof initialData {
    const getCoords = (locName: string, currentState: typeof initialData) => currentState.customLocationCoordinates[locName] || locationCoordinates[locName];
    switch (action.type) {
        case 'SET_STATE': return action.payload;
        case 'RESET_STATE': return JSON.parse(JSON.stringify(initialData));
        case 'ADD_CAB': { const cab = action.payload; const loc = getCoords(cab.from, state); const dest = getCoords(cab.to, state); return { ...state, cabs: [...state.cabs, { ...cab, id: Date.now(), location: loc, destination: dest }] }; }
        case 'UPDATE_CAB': { return { ...state, cabs: state.cabs.map(c => c.id === action.payload.id ? { ...c, ...action.payload, location: getCoords(action.payload.from, state), destination: getCoords(action.payload.to, state) } : c) }; }
        case 'DELETE_CAB': return { ...state, cabs: state.cabs.filter(c => c.id !== action.payload) };
        case 'ADD_DRIVER': return { ...state, drivers: [...state.drivers, { ...action.payload, id: Date.now(), role: 'driver' }] };
        case 'UPDATE_DRIVER': { return { ...state, drivers: state.drivers.map(d => d.id === action.payload.id ? { ...d, name: action.payload.name, phone: action.payload.phone, username: action.payload.username, password: action.payload.password || d.password } : d)}; }
        case 'DELETE_DRIVER': { const id = action.payload; return { ...state, drivers: state.drivers.filter(d => d.id !== id), cabs: state.cabs.map(c => c.driverId === id ? { ...c, driverId: null } : c) }; }
        case 'ADD_LOCATION': { const { name, lat, lon } = action.payload; if (state.locations.includes(name)) return state; const newCoords = { ...state.customLocationCoordinates, [name]: [parseFloat(lat), parseFloat(lon)] }; return { ...state, locations: [...state.locations, name].sort(), customLocationCoordinates: newCoords }; }
        case 'DELETE_LOCATION': { const loc = action.payload; const newPoints = { ...state.pickupPoints }; delete newPoints[loc]; const newCoords = { ...state.customLocationCoordinates }; delete newCoords[loc]; return { ...state, locations: state.locations.filter(l => l !== loc), pickupPoints: newPoints, customLocationCoordinates: newCoords }; }
        case 'ADD_POINT': { const { loc, point } = action.payload; return { ...state, pickupPoints: { ...state.pickupPoints, [loc]: [...(state.pickupPoints[loc] || []), point] } }; }
        case 'DELETE_POINT': { const { loc, point } = action.payload; return { ...state, pickupPoints: { ...state.pickupPoints, [loc]: state.pickupPoints[loc].filter(p => p !== point) } }; }
        case 'ADD_CUSTOMER': return { ...state, customers: [...state.customers, action.payload] };
        case 'ADD_TRIP': return { ...state, trips: [action.payload, ...state.trips] };
        case 'UPDATE_ADMIN_PASSWORD': { const { id, newPassword } = action.payload; return { ...state, admins: state.admins.map(a => a.id === id ? { ...a, password: newPassword } : a) }; }
        default: return state;
    }
}

const App = () => {
    const [state, dispatch] = useReducer(appReducer, undefined, getInitialState);
    
    const getInitialView = () => {
        const path = window.location.pathname.toLowerCase();
        if (path.startsWith('/admin')) return 'superadmin';
        if (path.startsWith('/driver-onboarding')) return 'driver-onboarding';
        if (path.startsWith('/driver')) return 'driver';
        return 'customer';
    };

    const getInitialAuth = (): AuthState => {
        try {
            const storedAuth = localStorage.getItem(AUTH_STORAGE_KEY);
            if (storedAuth) {
                const parsedAuth = JSON.parse(storedAuth);
                if (parsedAuth && parsedAuth.user && parsedAuth.role) {
                    return parsedAuth;
                }
            }
        } catch (error) {
            console.error("Failed to retrieve auth state from localStorage:", error);
            localStorage.removeItem(AUTH_STORAGE_KEY);
        }
        return { user: null, role: null };
    };

    const [auth, setAuth] = useState<AuthState>(getInitialAuth);
    const [loginError, setLoginError] = useState('');
    const [appMeta, setAppMeta] = useState<AppMeta | null>(null);
    const [isUpdateAvailable, setIsUpdateAvailable] = useState(false);

    useEffect(() => {
        const fetchMeta = async () => {
            try {
                const response = await fetch('/app-meta.json', { cache: 'no-store' });
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const text = await response.text();
                // This might fail if the server returns HTML (e.g., a 404 page) instead of JSON
                const meta = JSON.parse(text); 
                setAppMeta(meta);
                console.log(`
=== Sajilo Taxi Build Info ===
Data Version: ${meta.dataVersion}
Cache Version: ${meta.cacheVersion}
Build Time: ${meta.buildTime}
==============================
                `);
            } catch (err) {
                console.warn("Failed to fetch or parse app metadata:", err, "Using fallback versions.");
                // Fallback to constants if fetch fails, so the app remains usable for login.
                setAppMeta({
                    dataVersion: DATA_VERSION,
                    cacheVersion: 'v7', // Must match sw.js
                    buildTime: new Date(0).toISOString(), // Use an old date to prevent update loops
                    lastDeployedBy: 'N/A'
                });
            }
        };

        fetchMeta();
    }, []);

    const handleReset = async () => {
        try {
            console.log('> Full application reset initiated.');
            localStorage.clear();
            if ('serviceWorker' in navigator) {
                const registrations = await navigator.serviceWorker.getRegistrations();
                for (const registration of registrations) {
                    await registration.unregister();
                }
                console.log('  - All service workers unregistered.');
            }
            if ('caches' in window) {
                const keys = await caches.keys();
                await Promise.all(keys.map(key => caches.delete(key)));
                console.log('  - All caches cleared.');
            }
            console.log("✅ Full App Reset Complete — Clean State Loaded.");
            // Force a reload from the server, bypassing the cache.
            // FIX: The boolean argument for reload() is deprecated and can cause type errors like "Expected 0 arguments, but got 1.".
            // The standard reload() method is sufficient for forcing a reload after clearing caches.
            window.location.reload();
        } catch (err) {
            console.error("Error during full app reset:", err);
            alert("Could not complete the reset. Please check the console and try reloading manually.");
            window.location.reload();
        }
    };
    
    useEffect(() => {
      if (!appMeta || appMeta.buildTime === new Date(0).toISOString()) return; // Don't run on initial or fallback meta

      const checkForUpdate = async () => {
        try {
          const response = await fetch('/app-meta.json', { cache: 'no-store' });
          if (!response.ok) return;
          const latestMeta = await response.json();
          if (latestMeta.buildTime !== appMeta.buildTime) {
            setIsUpdateAvailable(true);
            if (intervalId) clearInterval(intervalId);
          }
        } catch (err) {
          console.error("Update check failed:", err);
        }
      };

      // Check for updates every 10 minutes
      const intervalId = setInterval(checkForUpdate, 10 * 60 * 1000); 
      return () => clearInterval(intervalId);
    }, [appMeta]);

    useEffect(() => {
        const versionedState = {
            version: DATA_VERSION,
            data: state,
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(versionedState));
    }, [state]);
    
    useEffect(() => {
        try {
            if (auth.user) {
                localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(auth));
            } else {
                localStorage.removeItem(AUTH_STORAGE_KEY);
            }
        } catch (error) {
            console.error("Failed to save auth state to localStorage:", error);
        }
    }, [auth]);

    useEffect(() => {
        const handleStorage = (e: StorageEvent) => { 
            if (e.key === STORAGE_KEY && e.newValue) {
                try {
                    const parsed = JSON.parse(e.newValue);
                    if (parsed && parsed.version === DATA_VERSION && parsed.data) {
                        dispatch({ type: 'SET_STATE', payload: parsed.data });
                    }
                } catch (error) {
                     console.error("Error processing storage event:", error);
                }
            }
        };
        window.addEventListener('storage', handleStorage);
        return () => window.removeEventListener('storage', handleStorage);
    }, []);
    
    const dataApi = useMemo(() => ({
        customer: {
            getData: () => ({ 
                locations: state.locations, 
                pickupPoints: state.pickupPoints, 
                availableCars: state.cabs.map(c => {
                    const driver = state.drivers.find(d => d.id === c.driverId);
                    return {
                        ...c, 
                        driverName: driver?.name || 'N/A',
                        driverPhone: driver?.phone || 'N/A'
                    };
                }), 
                trips: state.trips 
            }),
            getCarById: (id: number) => {
                const cab = state.cabs.find(c => c.id === id);
                if (!cab) return undefined;
                const driver = state.drivers.find(d => d.id === cab.driverId);
                return {
                    ...cab,
                    driverName: driver?.name || 'N/A',
                    driverPhone: driver?.phone || 'N/A',
                };
            },
            findByPhone: (phone: string) => state.customers.find(c => c.phone === phone),
            signUp: (details: { name: string, phone: string, email: string }) => {
                const newUser = { ...details, id: Date.now() };
                dispatch({ type: 'ADD_CUSTOMER', payload: newUser });
                return newUser;
            },
            bookTrip: (t: Trip) => dispatch({ type: 'ADD_TRIP', payload: t }),
        },
        admin: {
            getData: (auth: AuthState) => {
                const allCabs = state.cabs.map(c => ({...c, driverName: state.drivers.find(d => d.id === c.driverId)?.name || 'N/A'}));
                const allTrips = state.trips;
                const totalRevenue = allTrips.reduce((s, t) => s + (Number(t.car.price || 0) * (t.details?.selectedSeats?.length || 0)), 0);
                return { cabs: allCabs, trips: allTrips, drivers: state.drivers, locations: state.locations, pickupPoints: state.pickupPoints, allDrivers: state.drivers, allTrips, stats: { totalTrips: allTrips.length, totalRevenue, totalBookedSeats: allTrips.reduce((s, t) => s + (t.details?.selectedSeats?.length || 0), 0), totalSystemSeats: allCabs.reduce((s, c) => s + c.totalSeats, 0), totalCabs: allCabs.length, totalDrivers: state.drivers.length }};
            },
            addCab: (d: any) => dispatch({ type: 'ADD_CAB', payload: d }), updateCab: (d: any) => dispatch({ type: 'UPDATE_CAB', payload: d }), deleteCab: (id: number) => dispatch({ type: 'DELETE_CAB', payload: id }),
            addDriver: (d: any) => dispatch({ type: 'ADD_DRIVER', payload: d }), updateDriver: (d: any) => dispatch({ type: 'UPDATE_DRIVER', payload: d }), deleteDriver: (id: number) => dispatch({ type: 'DELETE_DRIVER', payload: id }),
            addLocation: (d: any) => dispatch({ type: 'ADD_LOCATION', payload: d }), deleteLocation: (n: string) => dispatch({ type: 'DELETE_LOCATION', payload: n }),
            addPoint: (l: string, p: string) => dispatch({ type: 'ADD_POINT', payload: { loc: l, point: p } }), deletePoint: (l: string, p: string) => dispatch({ type: 'DELETE_POINT', payload: { loc: l, point: p } }),
            resetData: () => dispatch({ type: 'RESET_STATE' }),
            updateAdminPassword: ({ id, newPassword }: { id: number, newPassword: string }) => dispatch({ type: 'UPDATE_ADMIN_PASSWORD', payload: { id, newPassword } }),
        },
        driver: {
            getData: (driver: Driver) => {
                // Filter trips directly by the driver's ID for robustness.
                const driverTrips = state.trips.filter(t => t.driverId === driver.id);
                
                // A driver only needs to see their manifest for the current day.
                const today = new Date().toISOString().split('T')[0];
                const todaysTrips = driverTrips.filter(trip => trip.booking.date === today);

                return { trips: todaysTrips };
            }
        }
    }), [state]);

    const handleLogin = async ({ username, password, otp }: { username: string, password?: string, otp?: string }) => {
        setLoginError('');
        const role = getInitialView();

        // For drivers, authenticate against the local state, which is the source of truth
        if (role === 'driver') {
            if (!username || !password) {
                setLoginError('Username and password are required.');
                return { otpRequired: false };
            }
            const normalizedUsername = username.trim().toLowerCase();
            // FIX: Trim password from input to handle trailing spaces from mobile keyboards.
            const normalizedPassword = password.trim();
            
            const driver = state.drivers.find(d =>
                d.username && d.username.trim().toLowerCase() === normalizedUsername && d.password === normalizedPassword
            );

            if (driver) {
                setAuth({ user: driver, role: 'driver' });
                return { otpRequired: false };
            } else {
                setLoginError('Invalid username or password.');
                return { otpRequired: false };
            }
        }

        // For admin, continue using the API for features like 2FA
        if (role === 'superadmin') {
            try {
                const response = await fetch('/api/auth', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: otp ? 'login-otp' : 'login', username, password, otp, role })
                });
                const data = await response.json();
                if (response.ok && data.success) {
                    if (data.otpRequired) {
                        return { otpRequired: true, username: data.username };
                    }
                    setAuth({ user: data.user, role: 'superadmin' });
                    return { otpRequired: false };
                } else {
                    setLoginError(data.error || 'Invalid credentials.');
                    return { otpRequired: false };
                }
            } catch (error) {
                setLoginError('Could not connect to the server.');
                return { otpRequired: false };
            }
        }
        
        // Fallback for any other case
        setLoginError('Invalid login attempt.');
        return { otpRequired: false };
    };
    const handleLogout = () => { setAuth({ user: null, role: null }); setLoginError(''); };

    const renderContent = () => {
        // FIX: Re-evaluate the view on every render to correctly handle URL changes
        // in a simple SPA setup without a dedicated router.
        const currentView = getInitialView();

        // If a user is logged in, show their dedicated panel ONLY if they are on the correct path.
        // This prevents an admin from seeing the admin panel on the root "/" customer URL.
        if (auth.user) {
            // FIX: If a logged-in driver lands on the customer page (e.g., root '/'), redirect them to the driver dashboard.
            if (auth.role === 'driver' && currentView === 'customer') {
                window.location.replace('/driver');
                // Render a temporary loading message to prevent flicker during redirection.
                return <div className="min-h-screen flex items-center justify-center bg-light-gray font-bold text-dark">Redirecting to Driver Dashboard...</div>;
            }
            
            if (auth.role === 'superadmin' && currentView === 'superadmin') {
                return <AdminPanel onLogout={handleLogout} auth={auth as AuthState & { user: Admin }} dataApi={dataApi} />;
            }
            if (auth.role === 'driver' && currentView === 'driver') {
                return <DriverApp onLogout={handleLogout} driver={auth.user as Driver} dataApi={dataApi} />;
            }
        }
        
        // Handle public, non-customer-facing pages like driver onboarding
        if (currentView === 'driver-onboarding') {
            return <DriverOnboardingPage />;
        }

        // If not logged in (or on the wrong path), show the login page for protected routes.
        if (currentView === 'superadmin' || currentView === 'driver') {
            return <AppLoginPage role={currentView} onLogin={handleLogin} error={loginError} auth={auth} appMeta={appMeta} onReset={handleReset} />;
        }
        
        // Default to the customer application for the root URL and any other path.
        return <CustomerApp dataApi={dataApi} />;
    };

    return (
        <>
            {renderContent()}
            {isUpdateAvailable && <UpdateToast onRefresh={handleReset} />}
        </>
    );
};

export default App;