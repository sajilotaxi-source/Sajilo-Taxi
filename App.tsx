
import React, { useState, useEffect, useMemo, useReducer } from 'react';
import type { Cab, Trip, Customer, Admin, Driver, AuthState } from './types.ts';
import { CustomerApp } from './components/customer.tsx';
import { AdminPanel } from './components/admin.tsx';
import { DriverApp } from './components/driver.tsx';
import { AppLoginPage } from './components/auth.tsx';
import { DriverOnboardingPage } from './components/onboarding.tsx';

// --- TYPE DEFINITIONS ---
declare global {
    interface Window {
        Razorpay: any;
        google: any;
    }
}

// --- DATA & STATE MANAGEMENT ---
// The application state is now primarily managed on the server.
// The client-side reducer just sets the state received from the server.

const emptyInitialData = {
    admins: [], drivers: [], cabs: [], locations: [],
    pickupPoints: {}, trips: [], customers: [],
    customLocationCoordinates: {},
};

function appReducer(state: any, action: any): any {
    switch (action.type) {
        case 'SET_STATE':
            return action.payload;
        default:
            return state;
    }
}

const App = () => {
    const [state, dispatch] = useReducer(appReducer, emptyInitialData);
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);

    const getInitialView = () => {
        const path = window.location.pathname.toLowerCase();
        if (path.startsWith('/admin')) return 'superadmin';
        if (path.startsWith('/driver-onboarding')) return 'driver-onboarding';
        if (path.startsWith('/driver')) return 'driver';
        return 'customer';
    };

    const getInitialAuth = (): AuthState => {
        try {
            // Auth state is still kept in localStorage for session persistence
            const storedAuth = localStorage.getItem('sajilo_taxi_auth');
            if (storedAuth) {
                const parsedAuth = JSON.parse(storedAuth);
                if (parsedAuth && parsedAuth.user && parsedAuth.role) {
                    return parsedAuth;
                }
            }
        } catch (error) {
            console.error("Failed to retrieve auth state from localStorage:", error);
            localStorage.removeItem('sajilo_taxi_auth');
        }
        return { user: null, role: null };
    };

    const [auth, setAuth] = useState<AuthState>(getInitialAuth);
    const [loginError, setLoginError] = useState('');
    
    // Fetch the entire application state from the server on initial load.
    useEffect(() => {
        const fetchInitialState = async () => {
            try {
                const response = await fetch('/api/auth', { method: 'GET' });
                 if (!response.ok) {
                    const errorText = await response.text();
                    let errorMessage = `Failed to fetch app state. Status: ${response.status}`;
                    // Provide a more specific error for common Vercel deployment issues.
                    if (errorText.includes('NO_RESPONSE_FROM_FUNCTION') || response.status === 404) {
                         errorMessage = 'The server API is not responding. This is likely a deployment issue with the serverless functions.';
                    } else if (errorText) {
                        errorMessage += ` - ${errorText}`;
                    }
                    throw new Error(errorMessage);
                }
                const data = await response.json();
                dispatch({ type: 'SET_STATE', payload: data });
            } catch (error: any) {
                console.error("Could not load application data:", error);
                setLoadError(error.message || 'An unknown error occurred while loading application data.');
            } finally {
                setIsLoading(false);
            }
        };
        fetchInitialState();
    }, []);

    // Persist authentication state to localStorage
    useEffect(() => {
        try {
            if (auth.user) {
                localStorage.setItem('sajilo_taxi_auth', JSON.stringify(auth));
            } else {
                localStorage.removeItem('sajilo_taxi_auth');
            }
        } catch (error) {
            console.error("Failed to save auth state to localStorage:", error);
        }
    }, [auth]);

    // This function sends an action to the server and updates the local state with the response.
    const updateStateOnServer = async (action: { type: string, payload?: any }) => {
        try {
            const response = await fetch('/api/auth', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'update_state', ...action })
            });
            if (!response.ok) throw new Error('Server update failed');
            const newState = await response.json();
            dispatch({ type: 'SET_STATE', payload: newState });
        } catch (error) {
            console.error(`Failed to perform action ${action.type}:`, error);
        }
    };
    
    const dataApi = useMemo(() => ({
        customer: {
            getData: () => ({ 
                locations: state.locations, 
                pickupPoints: state.pickupPoints, 
                availableCars: state.cabs.map((c: Cab) => {
                    const driver = state.drivers.find((d: Driver) => d.id === c.driverId);
                    return {
                        ...c, 
                        driverName: driver?.name || 'N/A',
                        driverPhone: driver?.phone || 'N/A'
                    };
                }), 
                trips: state.trips 
            }),
            getCarById: (id: number) => {
                const cab = state.cabs.find((c: Cab) => c.id === id);
                if (!cab) return undefined;
                const driver = state.drivers.find((d: Driver) => d.id === cab.driverId);
                return {
                    ...cab,
                    driverName: driver?.name || 'N/A',
                    driverPhone: driver?.phone || 'N/A',
                };
            },
            findByPhone: (phone: string) => state.customers.find((c: Customer) => c.phone === phone),
            signUp: (details: { name: string, phone: string, email: string }) => {
                const newUser = { ...details, id: Date.now() };
                updateStateOnServer({ type: 'ADD_CUSTOMER', payload: newUser });
                return newUser;
            },
            bookTrip: (t: Trip) => updateStateOnServer({ type: 'ADD_TRIP', payload: t }),
        },
        admin: {
            getData: () => {
                const allCabs = state.cabs.map((c: Cab) => ({...c, driverName: state.drivers.find((d: Driver) => d.id === c.driverId)?.name || 'N/A'}));
                const allTrips = state.trips;
                const totalRevenue = allTrips.reduce((s: number, t: Trip) => s + (Number(t.car.price || 0) * (t.details?.selectedSeats?.length || 0)), 0);
                return { 
                    cabs: allCabs, trips: allTrips, drivers: state.drivers, locations: state.locations, pickupPoints: state.pickupPoints, allDrivers: state.drivers, allTrips,
                    stats: { 
                        totalTrips: allTrips.length, 
                        totalRevenue, 
                        totalBookedSeats: allTrips.reduce((s: number, t: Trip) => s + (t.details?.selectedSeats?.length || 0), 0), 
                        totalSystemSeats: allCabs.reduce((s: number, c: Cab) => s + c.totalSeats, 0), 
                        totalCabs: allCabs.length, 
                        totalDrivers: state.drivers.length 
                    }
                };
            },
            addCab: (d: any) => updateStateOnServer({ type: 'ADD_CAB', payload: d }), 
            updateCab: (d: any) => updateStateOnServer({ type: 'UPDATE_CAB', payload: d }), 
            deleteCab: (id: number) => updateStateOnServer({ type: 'DELETE_CAB', payload: id }),
            addDriver: (d: any) => updateStateOnServer({ type: 'ADD_DRIVER', payload: d }), 
            updateDriver: (d: any) => updateStateOnServer({ type: 'UPDATE_DRIVER', payload: d }), 
            deleteDriver: (id: number) => updateStateOnServer({ type: 'DELETE_DRIVER', payload: id }),
            addLocation: (d: any) => updateStateOnServer({ type: 'ADD_LOCATION', payload: d }), 
            deleteLocation: (n: string) => updateStateOnServer({ type: 'DELETE_LOCATION', payload: n }),
            addPoint: (l: string, p: string) => updateStateOnServer({ type: 'ADD_POINT', payload: { loc: l, point: p } }), 
            deletePoint: (l: string, p: string) => updateStateOnServer({ type: 'DELETE_POINT', payload: { loc: l, point: p } }),
            resetData: () => updateStateOnServer({ type: 'RESET_STATE' }),
            updateAdminPassword: ({ id, newPassword }: { id: number, newPassword: string }) => {
                // Password change is an auth concern, not a state mutation sent to the reducer.
                // It still calls the same API endpoint but with a different top-level action.
                fetch('/api/auth', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: 'change-password', userId: id, newPassword: newPassword }),
                }).then(() => {
                    updateStateOnServer({ type: 'UPDATE_ADMIN_PASSWORD', payload: { id, newPassword } });
                });
            },
        },
        driver: {
            getData: (driver: Driver) => {
                const cab = state.cabs.find((c: Cab) => c.driverId === driver.id);
                return { trips: cab ? state.trips.filter((t: Trip) => t.car.id === cab.id) : [] };
            }
        }
    }), [state]);

    const handleLogin = async ({ username, password, otp }: { username: string, password?: string, otp?: string }) => {
        setLoginError('');
        const role = getInitialView();

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
                setAuth({ user: data.user, role });
                return { otpRequired: false };
            } else {
                setLoginError(data.error || 'Invalid credentials.');
                return { otpRequired: false };
            }
        } catch (error) {
            setLoginError('Could not connect to the server.');
            return { otpRequired: false };
        }
    };
    
    const handleLogout = () => { setAuth({ user: null, role: null }); setLoginError(''); };

    const renderContent = () => {
        const currentView = getInitialView();

        if (auth.user) {
            if (auth.role === 'superadmin' && currentView === 'superadmin') {
                return <AdminPanel onLogout={handleLogout} auth={auth as AuthState & { user: Admin }} dataApi={dataApi} />;
            }
            if (auth.role === 'driver' && currentView === 'driver') {
                return <DriverApp onLogout={handleLogout} driver={auth.user as Driver} dataApi={dataApi} />;
            }
        }
        
        if (currentView === 'driver-onboarding') {
            return <DriverOnboardingPage />;
        }

        if (currentView === 'superadmin' || currentView === 'driver') {
            return <AppLoginPage role={currentView} onLogin={handleLogin} error={loginError} />;
        }
        
        return <CustomerApp dataApi={dataApi} />;
    };
    
    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-screen bg-light-gray text-dark font-bold">
                Loading Application...
            </div>
        );
    }
    
    if (loadError) {
        return (
            <div className="flex flex-col items-center justify-center h-screen bg-light-gray text-dark p-4">
                <div className="text-center bg-white p-8 rounded-lg shadow-lg border-2 border-danger max-w-lg">
                    <h1 className="text-2xl font-bold text-danger mb-4">Application Error</h1>
                    <p className="font-semibold">Could not load application data:</p>
                    <p className="mt-2 text-sm bg-gray-100 p-2 rounded font-mono text-left">{loadError}</p>
                    <p className="mt-4 text-gray-600">Please try refreshing the page. If the problem persists, it may be a server deployment issue.</p>
                </div>
            </div>
        );
    }

    return renderContent();
};

export default App;
