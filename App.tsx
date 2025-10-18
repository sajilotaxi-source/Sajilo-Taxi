

import React, { useState, useEffect, useMemo, useReducer, useRef } from 'react';
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
    admins: [{ id: 99, name: 'System Superadmin', username: 'sajilotaxi@gmail.com', password: 'SajiloAdminPass!', role: 'superadmin', otpEnabled: false }] as Admin[],
    drivers: [
        { id: 1, name: 'Sangeeta Rai', phone: '+91 9876543210', username: 'sangeeta', password: 'SajiloDriverPass!', role: 'driver' },
        { id: 2, name: 'Sunita Rai', phone: '+91 9876543211', username: 'sunita', password: 'SajiloDriverPass!', role: 'driver' },
        { id: 3, name: 'Bikash Gurung', phone: '+91 9876543212', username: 'bikash', password: 'SajiloDriverPass!', role: 'driver' },
        { id: 4, name: 'Pramod Chettri', phone: '+91 9876543213', username: 'pramod', password: 'SajiloDriverPass!', role: 'driver' },
        { id: 5, name: 'Test Driver', phone: '+91 1234567890', username: 'testdriver', password: 'SajiloTestPass!', role: 'driver' },
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
    activeTrips: {} as { [cabId: number]: boolean },
};

const getInitialState = () => {
    const defaultState = JSON.parse(JSON.stringify(initialData));

    try {
        const storedValue = localStorage.getItem(STORAGE_KEY);
        if (storedValue) {
            const parsed = JSON.parse(storedValue);

            // If we have valid, version-matched stored data, use it as the base.
            // Merge it over the default state to pick up any new properties from `initialData`
            // that might have been added in a code update.
            if (parsed && parsed.version === DATA_VERSION && parsed.data) {
                console.log('✅ Loaded and merged state from localStorage.');
                return { ...defaultState, ...parsed.data };
            }
        }

        // Fallback for no stored data, version mismatch, or corruption.
        console.log('✅ No valid stored data found. Using fresh initial state.');
        localStorage.removeItem(STORAGE_KEY); // Clean up any invalid data
        return defaultState;

    } catch (error) {
        console.error("❌ Critical error parsing state from localStorage. Discarding all stored data.", error);
        localStorage.removeItem(STORAGE_KEY);
        return defaultState;
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
        case 'START_TRIP': return { ...state, activeTrips: { ...state.activeTrips, [action.payload.cabId]: true } };
        case 'STOP_TRIP': {
            const { cabId } = action.payload;
            const newActiveTrips = { ...state.activeTrips };
            delete newActiveTrips[cabId];

            const cabToReset = state.cabs.find(c => c.id === cabId);
            if (!cabToReset) {
                return { ...state, activeTrips: newActiveTrips };
            }
            
            // Find the coordinates for the cab's "from" location to reset its position.
            const resetLocation = state.customLocationCoordinates[cabToReset.from] || locationCoordinates[cabToReset.from] || cabToReset.location;

            return {
                ...state,
                activeTrips: newActiveTrips,
                cabs: state.cabs.map(c =>
                    c.id === cabId ? { ...c, location: resetLocation } : c
                )
            };
        }
        case 'UPDATE_CAB_LOCATION': {
            const { cabId, location } = action.payload;
            return { ...state, cabs: state.cabs.map(c => c.id === cabId ? { ...c, location } : c) };
        }
        default: return state;
    }
}

const App = () => {
    const [state, dispatch] = useReducer(appReducer, undefined, getInitialState);
    // FIX: Replaced NodeJS.Timeout with `number` for browser compatibility, as `setInterval` in a browser returns a number.
    const tripIntervals = useRef<Record<number, number>>({});
    
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
    
    // This effect synchronizes the client-side driver list with the server-side authentication service.
    // It runs whenever the `state.drivers` array changes, ensuring logins work for newly added drivers.
    useEffect(() => {
        const syncDriversWithApi = async (drivers: Driver[]) => {
            try {
                const response = await fetch('/api/auth', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: 'sync-drivers', drivers })
                });
                if (response.ok) {
                    console.log("✅ Drivers list successfully synchronized with the authentication service.");
                } else {
                    const errorData = await response.json().catch(() => ({}));
                    console.error("API sync failed:", errorData.error || 'Unknown error');
                }
            } catch (error) {
                console.error("Error synchronizing drivers:", error);
            }
        };

        if (state.drivers) {
            syncDriversWithApi(state.drivers);
        }
    }, [state.drivers]);


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
            signUp: (details: { name: string; phone: string; email: string; }) => {
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
            updateAdminPassword: ({ id, newPassword }: { id: number, newPassword: string; }) => dispatch({ type: 'UPDATE_ADMIN_PASSWORD', payload: { id, newPassword } }),
        },
        driver: {
            getData: (driver: Driver) => {
                const driverTrips = state.trips.filter(t => t.driverId === driver.id);
                const today = new Date().toISOString().split('T')[0];
                const todaysTrips = driverTrips.filter(trip => trip.booking.date === today);
                return { trips: todaysTrips, activeTrips: state.activeTrips };
            },
            startTrip: (cabId: number) => {
                const cab = state.cabs.find(c => c.id === cabId);
                if (!cab || tripIntervals.current[cabId]) return;

                dispatch({ type: 'START_TRIP', payload: { cabId } });

                let step = 0;
                const totalSteps = 100; // More steps for a smoother animation
                const startLoc = cab.location;
                const endLoc = cab.destination;

                tripIntervals.current[cabId] = setInterval(() => {
                    step++;
                    const progress = step / totalSteps;
                    const newLat = startLoc[0] + (endLoc[0] - startLoc[0]) * progress;
                    const newLon = startLoc[1] + (endLoc[1] - startLoc[1]) * progress;

                    dispatch({ type: 'UPDATE_CAB_LOCATION', payload: { cabId, location: [newLat, newLon] } });

                    if (step >= totalSteps) {
                        dataApi.driver.stopTrip(cabId);
                    }
                }, 2000); // Update every 2 seconds
            },
            stopTrip: (cabId: number) => {
                if (tripIntervals.current[cabId]) {
                    clearInterval(tripIntervals.current[cabId]);
                    delete tripIntervals.current[cabId];
                    dispatch({ type: 'STOP_TRIP', payload: { cabId } });
                }
            },
        }
    }), [state]);

    const handleLogin = async ({ username, password, otp }: { username: string, password?: string, otp?: string; }) => {
        setLoginError('');
        const role = getInitialView();

        if (role !== 'superadmin' && role !== 'driver') {
            setLoginError('Invalid login page.');
            return { otpRequired: false };
        }

        // Handle OTP login flow (admin only)
        if (otp && role === 'superadmin') {
            try {
                const response = await fetch('/api/auth', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: 'login-otp', username, otp })
                });
                const data = await response.json();
                if (response.ok && data.success) {
                    setAuth({ user: data.user, role: 'superadmin' });
                    return { otpRequired: false };
                } else {
                    setLoginError(data.error || 'Invalid OTP code.');
                    return { otpRequired: false };
                }
            } catch (error) {
                 setLoginError('Could not connect to the server.');
                 return { otpRequired: false };
            }
        }
        
        // Handle password login flow (both admin and driver)
        if (password) {
            try {
                const response = await fetch('/api/auth', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: 'login', username, password, role })
                });

                const data = await response.json();

                if (response.ok && data.success) {
                    if (data.otpRequired) { // Admin 2FA challenge
                        return { otpRequired: true, username: data.username };
                    }
                    // Successful login for driver or admin (without 2FA)
                    setAuth({ user: data.user, role: role as 'superadmin' | 'driver' });
                    return { otpRequired: false };
                } else {
                    // Failed login
                    setLoginError(data.error || 'Invalid credentials.');
                    return { otpRequired: false };
                }
            } catch (error) {
                setLoginError('Could not connect to the server.');
                return { otpRequired: false };
            }
        }

        // Fallback for any other case (e.g., calling login without password or otp)
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
                return <AdminPanel onLogout={handleLogout} auth={auth as AuthState & { user: Admin; }} dataApi={dataApi} />;
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