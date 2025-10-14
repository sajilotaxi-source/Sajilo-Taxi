import React, { useState, useEffect, useMemo, useReducer } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import { GoogleGenAI, Type } from "@google/genai";


// --- ICONS ---
const ClockIcon = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <circle cx="12" cy="12" r="10"></circle>
        <polyline points="12 6 12 12 16 14"></polyline>
    </svg>
);
const TaxiIcon = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path d="M21.92,6.62a1,1,0,0,0-.8-0.53L16,5.66A3,3,0,0,0,13.23,3H10.77A3,3,0,0,0,8,5.66L2.88,6.09a1,1,0,0,0-.8.53,1,1,0,0,0-.1,1L3,11.33V18a2,2,0,0,0,2,2H6a2,2,0,0,0,2-2V17h8v1a2,2,0,0,0,2,2h1a2,2,0,0,0,2-2V11.33l1-3.71A1,1,0,0,0,21.92,6.62ZM8.44,14a1.5,1.5,0,1,1,1.5-1.5A1.5,1.5,0,0,1,8.44,14Zm7.12,0a1.5,1.5,0,1,1,1.5-1.5A1.5,1.5,0,0,1,15.56,14ZM16.34,9,15,5.1a1,1,0,0,0-.91-.6H10.91a1,1,0,0,0-.91-.6L8.66,9Z"/>
    </svg>
);
const BackArrowIcon = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <line x1="19" y1="12" x2="5" y2="12"></line>
        <polyline points="12 19 5 12 12 5"></polyline>
    </svg>
);
const UserIcon = (props) => (
     <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path d="M12,12c2.21,0,4-1.79,4-4s-1.79-4-4-4-4,1.79-4,4S9.79,12,12,12Zm0,2c-2.67,0-8,1.34-8,4v2H20V18C20,15.34,14.67,14,12,14Z"/>
    </svg>
);
const MapPinIcon = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
    </svg>
);
const PlusIcon = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
    </svg>
);
const MinusIcon = (props) => (
     <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path d="M19 13H5v-2h14v2z"/>
    </svg>
);
const MenuIcon = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/>
    </svg>
);
const DashboardIcon = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect>
        <rect x="3" y="14" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect>
    </svg>
);
const LocationIcon = (props) => <MapPinIcon {...props} />;
const DriverIcon = (props) => <UserIcon {...props} />;
const UsersIcon = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
        <circle cx="9" cy="7" r="4"></circle>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
    </svg>
);
const SteeringWheelIcon = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <circle cx="12" cy="12" r="8"></circle>
        <circle cx="12" cy="12" r="2"></circle>
        <line x1="12" y1="4" x2="12" y2="10"></line>
        <line x1="12" y1="14" x2="12" y2="20"></line>
        <line x1="20" y1="12" x2="14" y2="12"></line>
        <line x1="10" y1="12" x2="4" y2="12"></line>
    </svg>
);
const SeatIcon = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path d="M4 18v3h3v-3h10v3h3v-6H4v3zm15-8h3v3h-3v-3zM2 10h3v3H2v-3zm15 3H7V5c0-1.1.9-2 2-2h6c1.1 0 2 .9 2 2v8z"/>
    </svg>
);
const CreditCardIcon = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
        <line x1="1" y1="10" x2="23" y2="10"></line>
    </svg>
);
const WalletIcon = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"></path>
        <path d="M3 5v14a2 2 0 0 0 2 2h16v-5"></path>
        <path d="M18 12a2 2 0 0 0 0 4h4v-4h-4z"></path>
    </svg>
);
const UpiIcon = (props) => (
     <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <path d="M12 19l-7-7 7-7 7 7-7 7Z"></path>
        <path d="m10 14-3 3"></path>
        <path d="m14 10 3-3"></path>
        <path d="m10 10 4 4"></path>
    </svg>
);
const PhoneIcon = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.63A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
    </svg>
);
const TrashIcon = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <polyline points="3 6 5 6 21 6"></polyline>
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
        <line x1="10" y1="11" x2="10" y2="17"></line>
        <line x1="14" y1="11" x2="14" y2="17"></line>
    </svg>
);
const EditIcon = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
    </svg>
);
const XIcon = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
);
const LogoutIcon = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
        <polyline points="16 17 21 12 16 7"></polyline>
        <line x1="21" y1="12" x2="9" y2="12"></line>
    </svg>
);
const MapIcon = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"></polygon>
        <line x1="8" y1="2" x2="8" y2="18"></line>
        <line x1="16" y1="6" x2="16" y2="22"></line>
    </svg>
);
const InfoIcon = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="16" x2="12" y2="12"></line>
        <line x1="12" y1="8" x2="12.01" y2="8"></line>
    </svg>
);
const SettingsIcon = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <circle cx="12" cy="12" r="3"></circle>
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V12h.09a2 2 0 0 1 2 2v0a2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
    </svg>
);
const SparklesIcon = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
        <path d="M5 21v-2" /><path d="M19 21v-2" />
        <path d="M21 5h-2" /><path d="M5 5H3" />
        <path d="m3 3 2 2" /><path d="m19 3-2 2" />
    </svg>
);


// --- UI HELPERS ---
const Logo = ({ className = '' }) => (
    <div className={`inline-block border-2 border-black p-1 bg-yellow-400 ${className}`}>
        <div className="flex items-center gap-2">
            <span className="font-bold text-3xl tracking-tighter text-black">sajilo</span>
            <div className="flex flex-col items-center justify-center">
                <TaxiIcon className="h-6 w-6 text-black"/>
                <span className="text-xs font-bold text-black tracking-widest">TAXI</span>
            </div>
        </div>
    </div>
);


const getPointsForLocation = (location, allPoints) => {
    return allPoints[location] || allPoints['Default'];
}

// --- CUSTOMER APP COMPONENTS ---
const GeminiTripPlanner = ({ locations, onPlanGenerated }) => {
    const [prompt, setPrompt] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    const handlePlanTrip = async () => {
        if (!prompt.trim()) return;
        setIsLoading(true);
        setError(null);
        try {
            const apiResponse = await fetch('/api/plan-trip', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ prompt, locations }),
            });

            if (!apiResponse.ok) {
                const errorData = await apiResponse.json().catch(() => ({}));
                throw new Error(errorData.error || `Request failed with status ${apiResponse.status}`);
            }

            const parsedData = await apiResponse.json();
            onPlanGenerated(parsedData);
            setPrompt('');

        } catch (e) {
            console.error("API error:", e);
            setError("I couldn't understand that. Please try rephrasing.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-2 pb-4 mb-4 border-b-2 border-black/20">
            <label className="block text-sm font-bold text-black">Plan with AI</label>
            <div className="flex gap-2">
                <input
                    type="text"
                    value={prompt}
                    onChange={e => setPrompt(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handlePlanTrip()}
                    placeholder="e.g., Gangtok to Pelling for 2 people tomorrow"
                    className="flex-grow w-full px-3 py-3 bg-white text-black border-2 border-black rounded-lg focus:outline-none focus:ring-yellow-500 focus:border-yellow-500 font-semibold"
                />
                <button
                    type="button"
                    onClick={handlePlanTrip}
                    disabled={isLoading}
                    className="flex-shrink-0 bg-black text-yellow-400 font-bold p-3 rounded-lg border-2 border-black hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:bg-gray-600 flex items-center justify-center"
                    aria-label="Plan Trip with AI"
                >
                    {isLoading ? (
                        <div className="w-6 h-6 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                        <SparklesIcon className="w-6 h-6" />
                    )}
                </button>
            </div>
            {error && <p className="text-red-600 text-sm font-semibold">{error}</p>}
        </div>
    );
};

const BookingPage = ({ locations, availableCars, onBook, onExit, trips }) => {
    // A single state for all booking criteria to ensure consistency and smart defaults.
    const [bookingCriteria, setBookingCriteria] = useState(() => {
        const initialRoute = { from: 'Kalimpong', to: 'Gangtok' };

        // Find a better initial route if possible, prioritizing one with available cars.
        if (availableCars && availableCars.length > 0) {
            const firstValidCar = availableCars.find(c => locations.includes(c.from) && locations.includes(c.to));
            if (firstValidCar) {
                initialRoute.from = firstValidCar.from;
                initialRoute.to = firstValidCar.to;
            }
        } else {
            // Fallback to first available locations if hardcoded ones aren't in the list
            if (!locations.includes(initialRoute.from) && locations.length > 0) {
                initialRoute.from = locations[0];
            }
            if (!locations.includes(initialRoute.to) && locations.length > 0) {
                // Find a 'to' that is different from 'from'
                initialRoute.to = locations.find(l => l !== initialRoute.from) || locations[0];
            }
        }
        
        return {
            from: initialRoute.from,
            to: initialRoute.to,
            date: new Date().toISOString().split('T')[0],
            seats: 1,
        };
    });
    
    const { from, to, date, seats } = bookingCriteria;
    
    const setFrom = (newFrom) => setBookingCriteria(c => ({...c, from: newFrom}));
    const setTo = (newTo) => setBookingCriteria(c => ({...c, to: newTo}));
    const setDate = (newDate) => setBookingCriteria(c => ({...c, date: newDate}));
    const handleSeatChange = (amount) => {
        setBookingCriteria(c => ({ ...c, seats: Math.max(1, Math.min(10, c.seats + amount)) }))
    };
    
    const handlePlanGenerated = (plan) => {
        const updates: Partial<typeof bookingCriteria> = {};
        if (plan.from && locations.includes(plan.from)) {
            updates.from = plan.from;
        }
        if (plan.to && locations.includes(plan.to)) {
            updates.to = plan.to;
        }
        // Basic date validation (YYYY-MM-DD format and not in the past)
        const today = new Date();
        today.setHours(0,0,0,0);
        const planDate = new Date(plan.date);
        if (plan.date && /^\d{4}-\d{2}-\d{2}$/.test(plan.date) && planDate >= today) {
            updates.date = plan.date;
        }
        if (plan.seats && typeof plan.seats === 'number' && plan.seats > 0 && plan.seats <= 10) {
            updates.seats = plan.seats;
        }
        
        if (Object.keys(updates).length > 0) {
            setBookingCriteria(c => ({...c, ...updates}));
        }
    };


    const filteredCars = useMemo(() => {
        return availableCars
            .map(car => {
                const tripsForThisCarOnThisDate = trips.filter(t => 
                    t.car.id === car.id && t.booking.date === date
                );
                const seatsAlreadyBooked = tripsForThisCarOnThisDate.reduce((sum, t) => sum + (t.details?.seats?.length || 0), 0);
                const availableSeats = car.totalSeats - seatsAlreadyBooked;
                return { ...car, availableSeats };
            })
            .filter(car => 
                car.from === from && 
                car.to === to && 
                car.availableSeats >= seats
            );
    }, [availableCars, from, to, seats, date, trips]);
    
    const bookingDetailsForCar = { from, to, date, seats };

    return (
        <div className="min-h-screen flex flex-col bg-gray-100">
            <header className="bg-yellow-400 p-4 border-b-2 border-black sticky top-0 z-10 flex items-center">
                <button onClick={onExit} className="p-2 rounded-full hover:bg-black/20 transition-colors" aria-label="Go back">
                    <BackArrowIcon className="h-6 w-6 text-black"/>
                </button>
                <div className="flex-grow text-center">
                    <Logo />
                </div>
                <div className="w-10"></div>
            </header>
            <div className="flex-grow w-full max-w-7xl mx-auto p-4 lg:p-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Search Form Column */}
                    <div className="lg:col-span-1">
                        <div className="bg-yellow-400 border-2 border-black rounded-xl p-6 sticky top-24">
                            <h2 className="text-2xl font-bold text-black mb-4">Book Your Ride</h2>
                            <GeminiTripPlanner locations={locations} onPlanGenerated={handlePlanGenerated} />
                            <form className="space-y-4">
                                <div>
                                    <label htmlFor="from" className="block text-sm font-bold text-black mb-1">From</label>
                                    <select id="from" value={from} onChange={e => setFrom(e.target.value)} className="block w-full px-3 py-3 bg-white text-black border-2 border-black rounded-lg focus:outline-none focus:ring-yellow-500 focus:border-yellow-500 font-semibold">
                                        {locations.map(location => <option key={location} value={location}>{location}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label htmlFor="to" className="block text-sm font-bold text-black mb-1">To</label>
                                    <select id="to" value={to} onChange={e => setTo(e.target.value)} className="block w-full px-3 py-3 bg-white text-black border-2 border-black rounded-lg focus:outline-none focus:ring-yellow-500 focus:border-yellow-500 font-semibold">
                                        {locations.map(location => <option key={location} value={location}>{location}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label htmlFor="date" className="block text-sm font-bold text-black mb-1">Date</label>
                                    <input
                                        type="date"
                                        id="date"
                                        value={date}
                                        min={new Date().toISOString().split('T')[0]}
                                        onChange={(e) => setDate(e.target.value)}
                                        className="block w-full px-3 py-3 bg-white text-black border-2 border-black rounded-lg focus:outline-none focus:ring-yellow-500 focus:border-yellow-500 font-semibold"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-black mb-1">Seats</label>
                                    <div className="flex items-center justify-between bg-white border-2 border-black rounded-lg p-1">
                                        <button type="button" onClick={() => handleSeatChange(-1)} className="p-2 text-black hover:bg-gray-200 rounded-md" aria-label="Decrease seats"><MinusIcon /></button>
                                        <span className="font-bold text-xl text-black">{seats}</span>
                                        <button type="button" onClick={() => handleSeatChange(1)} className="p-2 text-black hover:bg-gray-200 rounded-md" aria-label="Increase seats"><PlusIcon /></button>
                                    </div>
                                </div>
                            </form>
                        </div>
                    </div>
                    
                    {/* Results Column */}
                    <div className="lg:col-span-2">
                        <h2 className="text-2xl font-bold text-black mb-4">Available Departures</h2>
                         {filteredCars.length > 0 ? (
                            <div className="space-y-4">
                                {filteredCars.map(car => (
                                    <div key={car.id} className="bg-white border-2 border-black rounded-xl p-4 transition-shadow hover:shadow-lg">
                                        <div className="flex flex-col sm:flex-row justify-between gap-4">
                                            <div className="flex-grow">
                                                <p className="font-bold text-lg text-black">{car.type}</p>
                                                <p className="text-sm text-gray-600">Driver: {car.driverName}</p>
                                                <p className="text-sm text-gray-600">Vehicle: {car.vehicle}</p>
                                            </div>
                                            <div className="flex flex-col items-start sm:items-end">
                                                <p className="font-bold text-xl text-black">₹{car.price}<span className="text-base font-normal text-gray-700"> / seat</span></p>
                                                <div className="flex items-center gap-2 text-black mt-1">
                                                    <ClockIcon className="h-5 w-5"/>
                                                    <p className="font-bold">{car.departureTime}</p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="mt-4 pt-4 border-t border-gray-200 flex justify-between items-center">
                                            <div className="flex items-center gap-2 font-semibold text-gray-800">
                                                <SeatIcon className="h-5 w-5 text-green-600"/>
                                                <span>{car.availableSeats} / {car.totalSeats} Seats Available</span>
                                            </div>
                                            <button onClick={() => onBook(car, bookingDetailsForCar)} className="bg-black text-yellow-400 font-bold py-2 px-4 rounded-lg border-2 border-black hover:bg-gray-800 transition-colors">
                                                Select Seats
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="bg-white border-2 border-black rounded-xl p-8 text-center">
                                <p className="font-bold text-black">No scheduled cabs found.</p>
                                <p className="text-gray-600">Please try adjusting your route or number of seats.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

const getSeatLayout = (totalSeats) => {
    switch (totalSeats) {
        case 4:
            return [['F1'], ['M1', 'M2', 'M3']];
        case 7:
            return [['F1'], ['M1', 'M2', 'M3'], ['B1', 'B2', 'B3']];
        case 10:
            return [['F1', 'F2'], ['M1', 'M2', 'M3', 'M4'], ['B1', 'B2', 'B3', 'B4']];
        default:
            return [['F1'], ['M1', 'M2', 'M3']]; 
    }
};

const SeatSelectionPage = ({ car, bookingDetails, pickupPoints, onConfirm, onBack, trips }) => {
    const [selectedSeats, setSelectedSeats] = useState([]);
    const [selectedPickup, setSelectedPickup] = useState('');
    const [selectedDrop, setSelectedDrop] = useState('');

    const bookedSeats = useMemo(() => {
        if (!trips) return [];
        const tripsForThisCarOnThisDate = trips.filter(t => 
            t.car.id === car.id && t.booking.date === bookingDetails.date
        );
        return tripsForThisCarOnThisDate.flatMap(t => t.details.seats);
    }, [trips, car.id, bookingDetails.date]);

    const layout = getSeatLayout(car.totalSeats);
    const seatsToSelect = bookingDetails.seats;

    const pickupOptions = getPointsForLocation(bookingDetails.from, pickupPoints);
    const dropOptions = getPointsForLocation(bookingDetails.to, pickupPoints);

    useEffect(() => {
        if (pickupOptions.length > 0) setSelectedPickup(pickupOptions[0]);
    }, [bookingDetails.from, pickupOptions]);

    useEffect(() => {
        if (dropOptions.length > 0) setSelectedDrop(dropOptions[0]);
    }, [bookingDetails.to, dropOptions]);

    const handleSeatClick = (seatId) => {
        if (bookedSeats.includes(seatId)) return;

        setSelectedSeats(current => {
            if (current.includes(seatId)) return current.filter(s => s !== seatId);
            if (current.length < seatsToSelect) return [...current, seatId];
            return current;
        });
    };
    
    const canConfirm = selectedSeats.length === seatsToSelect && selectedPickup && selectedDrop;

    return (
        <div className="min-h-screen flex flex-col bg-yellow-400">
            <header className="bg-yellow-400 p-4 border-b-2 border-black sticky top-0 z-10 flex items-center">
                <button onClick={onBack} className="p-2 rounded-full hover:bg-black/20 transition-colors" aria-label="Go back">
                    <BackArrowIcon className="h-6 w-6 text-black"/>
                </button>
                <div className="flex-grow text-center"><Logo /></div><div className="w-10"></div>
            </header>
            <main className="flex-grow p-4 flex flex-col items-center">
                <h2 className="text-2xl font-bold text-black mb-2">Select Your Seats</h2>
                <p className="text-black font-semibold mb-6">Please select {seatsToSelect} seat(s). ({selectedSeats.length}/{seatsToSelect} selected)</p>

                <div className="w-full max-w-xs border-2 border-black rounded-lg p-4 bg-black/5">
                    <div className="flex justify-end pr-4 mb-4">
                        <div className="flex flex-col items-center">
                            <SteeringWheelIcon className="h-8 w-8 text-black/50" />
                            <span className="text-xs font-bold text-black/50">DRIVER</span>
                        </div>
                    </div>
                    <div className="space-y-4">
                        {layout.map((row, rowIndex) => (
                            <div key={rowIndex} className="flex justify-around">
                                {row.map(seatId => {
                                    const isSelected = selectedSeats.includes(seatId);
                                    const isBooked = bookedSeats.includes(seatId);
                                    return (
                                        <button 
                                            key={seatId} 
                                            onClick={() => handleSeatClick(seatId)} 
                                            disabled={isBooked}
                                            aria-label={isBooked ? `${seatId} (Booked)` : `Select seat ${seatId}`}
                                            className={`p-2 rounded-lg transition-colors ${
                                                isBooked 
                                                ? 'bg-gray-300 cursor-not-allowed' 
                                                : isSelected 
                                                ? 'bg-black' 
                                                : 'bg-transparent border-2 border-black hover:bg-black/10'
                                            }`}>
                                            <SeatIcon className={`h-8 w-8 ${
                                                isBooked
                                                ? 'text-gray-500'
                                                : isSelected 
                                                ? 'text-yellow-400' 
                                                : 'text-black'
                                            }`} />
                                        </button>
                                    );
                                })}
                            </div>
                        ))}
                    </div>
                </div>

                 <div className="w-full max-w-xs mt-8 space-y-4">
                    <div>
                        <label htmlFor="pickup-point" className="block text-sm font-bold text-black mb-1">Select Pickup Point</label>
                        <select id="pickup-point" value={selectedPickup} onChange={e => setSelectedPickup(e.target.value)} className="block w-full px-3 py-3 bg-transparent text-black border-2 border-black rounded-lg focus:outline-none focus:ring-yellow-500 focus:border-yellow-500 font-semibold">
                            {pickupOptions.map(point => <option key={point} value={point}>{point}</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="drop-point" className="block text-sm font-bold text-black mb-1">Select Drop Point</label>
                        <select id="drop-point" value={selectedDrop} onChange={e => setSelectedDrop(e.target.value)} className="block w-full px-3 py-3 bg-transparent text-black border-2 border-black rounded-lg focus:outline-none focus:ring-yellow-500 focus:border-yellow-500 font-semibold">
                            {dropOptions.map(point => <option key={point} value={point}>{point}</option>)}
                        </select>
                    </div>
                </div>
            </main>
             <footer className="p-4 sticky bottom-0 bg-yellow-400">
                <button onClick={() => onConfirm({ seats: selectedSeats, pickup: selectedPickup, drop: selectedDrop })} disabled={!canConfirm} className="w-full bg-transparent text-black font-bold py-3 px-4 rounded-lg border-2 border-black hover:bg-black/10 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent">
                    Confirm Booking
                </button>
            </footer>
        </div>
    );
};

const LoginPage = ({ onSignIn, onCreateAccount, onBack, message, error }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    
    const canSignIn = email.trim() && password.trim();

    return (
        <div className="min-h-screen flex flex-col bg-yellow-400">
            <header className="bg-yellow-400 p-4 border-b-2 border-black sticky top-0 z-10 flex items-center">
                <button onClick={onBack} className="p-2 rounded-full hover:bg-black/20 transition-colors" aria-label="Go back"><BackArrowIcon className="h-6 w-6 text-black"/></button>
                <div className="flex-grow text-center"><Logo /></div><div className="w-10"></div>
            </header>
            <main className="flex-grow p-4 flex flex-col items-center justify-center">
                <div className="w-full max-w-sm mx-auto space-y-6">
                    <h2 className="text-3xl font-bold text-black text-center">Sign In</h2>
                    {message && <p className="text-center font-semibold text-green-700 bg-green-100 border border-green-700 rounded-lg p-2">{message}</p>}
                    {error && <p className="text-center font-semibold text-red-700 bg-red-100 border border-red-700 rounded-lg p-2">{error}</p>}
                    <form onSubmit={(e) => { e.preventDefault(); onSignIn({ email, password }); }} className="space-y-4">
                        <div>
                            <label htmlFor="email-login" className="block text-sm font-bold text-black mb-1">Email or Phone</label>
                            <input type="text" id="email-login" value={email} onChange={e => setEmail(e.target.value)} required className="block w-full px-3 py-3 bg-transparent text-black border-2 border-black rounded-lg font-semibold" placeholder="Enter your email or phone" />
                        </div>
                        <div>
                            <label htmlFor="password-login" className="block text-sm font-bold text-black mb-1">Password</label>
                            <input type="password" id="password-login" value={password} onChange={e => setPassword(e.target.value)} required className="block w-full px-3 py-3 bg-transparent text-black border-2 border-black rounded-lg font-semibold" placeholder="Enter your password" />
                        </div>
                        <button type="submit" disabled={!canSignIn} className="w-full mt-4 bg-transparent text-black font-bold py-3 px-4 rounded-lg border-2 border-black hover:bg-black/10 disabled:opacity-50 disabled:cursor-not-allowed">Sign In</button>
                    </form>
                    <div className="text-center">
                        <p className="text-black">Don't have an account?</p>
                        <button onClick={onCreateAccount} className="font-bold text-black hover:underline">Create Account</button>
                    </div>
                </div>
            </main>
        </div>
    );
};

const SignUpPage = ({ onSignUp, onBack }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');

    const passwordsMatch = password && password === confirmPassword;
    const canSignUp = email.trim() && password.trim() && confirmPassword.trim() && passwordsMatch && name.trim() && phone.trim();

    const handleSubmit = (e) => {
        e.preventDefault();
        if (canSignUp) {
            onSignUp({ email, password, name, phone });
        }
    };

    return (
        <div className="min-h-screen flex flex-col bg-yellow-400">
            <header className="bg-yellow-400 p-4 border-b-2 border-black sticky top-0 z-10 flex items-center">
                <button onClick={onBack} className="p-2 rounded-full hover:bg-black/20 transition-colors"><BackArrowIcon className="h-6 w-6 text-black"/></button>
                <div className="flex-grow text-center"><Logo /></div><div className="w-10"></div>
            </header>
            <main className="flex-grow p-4 flex flex-col items-center justify-center">
                <div className="w-full max-w-sm mx-auto space-y-6">
                    <h2 className="text-3xl font-bold text-black text-center">Create Your Account</h2>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-bold text-black mb-1">Name</label>
                            <input type="text" value={name} onChange={e => setName(e.target.value)} required className="block w-full px-3 py-3 bg-transparent text-black border-2 border-black rounded-lg font-semibold" placeholder="Enter your full name" />
                        </div>
                         <div>
                            <label className="block text-sm font-bold text-black mb-1">Phone No.</label>
                            <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} required className="block w-full px-3 py-3 bg-transparent text-black border-2 border-black rounded-lg font-semibold" placeholder="Enter your phone number" />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-black mb-1">Email Address</label>
                            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required className="block w-full px-3 py-3 bg-transparent text-black border-2 border-black rounded-lg font-semibold" placeholder="Enter your email" />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-black mb-1">Password</label>
                            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required className="block w-full px-3 py-3 bg-transparent text-black border-2 border-black rounded-lg font-semibold" placeholder="Create a password" />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-black mb-1">Confirm Password</label>
                            <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required className="block w-full px-3 py-3 bg-transparent text-black border-2 border-black rounded-lg font-semibold" placeholder="Confirm your password" />
                             {!passwordsMatch && confirmPassword && <p className="text-red-600 text-sm mt-1">Passwords do not match.</p>}
                        </div>
                        <button type="submit" disabled={!canSignUp} className="w-full mt-4 bg-black text-yellow-400 font-bold py-3 px-4 rounded-lg border-2 border-black hover:bg-black/80 disabled:opacity-50">Sign Up</button>
                    </form>
                </div>
            </main>
        </div>
    );
};

const PaymentPage = ({ car, bookingDetails, onConfirm, onBack }) => {
    const totalPrice = (car.price || 0) * (bookingDetails?.seats || 1);

    return (
        <div className="min-h-screen flex flex-col bg-yellow-400">
            <header className="bg-yellow-400 p-4 border-b-2 border-black sticky top-0 z-10 flex items-center">
                <button onClick={onBack} className="p-2 rounded-full hover:bg-black/20 transition-colors"><BackArrowIcon className="h-6 w-6 text-black"/></button>
                <div className="flex-grow text-center"><Logo /></div><div className="w-10"></div>
            </header>
            <main className="flex-grow p-4 flex flex-col items-center justify-center text-center">
                <div className="w-full max-w-sm mx-auto space-y-6">
                    <h2 className="text-3xl font-bold text-black">Complete Your Payment</h2>
                    <div className="bg-transparent border-2 border-black rounded-lg p-4">
                        <p className="text-black/80 text-lg">Total Amount</p>
                        <p className="text-4xl font-bold text-black">₹{totalPrice.toLocaleString()}</p>
                    </div>
                    <div className="space-y-4 pt-4">
                        <button onClick={onConfirm} className="w-full bg-transparent text-black font-bold py-3 px-4 rounded-lg border-2 border-black hover:bg-black/10 flex items-center justify-center gap-3"><UpiIcon className="h-6 w-6" stroke="currentColor"/><span>Pay with UPI</span></button>
                        <button onClick={onConfirm} className="w-full bg-transparent text-black font-bold py-3 px-4 rounded-lg border-2 border-black hover:bg-black/10 flex items-center justify-center gap-3"><CreditCardIcon className="h-6 w-6" stroke="currentColor"/><span>Pay with Card</span></button>
                        <button onClick={onConfirm} className="w-full bg-black text-yellow-400 font-bold py-3 px-4 rounded-lg border-2 border-black hover:bg-black/80 flex items-center justify-center gap-3"><WalletIcon className="h-6 w-6" stroke="currentColor"/><span>Pay on Arrival</span></button>
                    </div>
                </div>
            </main>
        </div>
    );
};

const TripTrackingPage = ({ car, trip, onBack }) => {
    const position = car.location;
    const destination = car.destination;
    const route = [position, destination];

    return (
        <div className="h-screen flex flex-col bg-yellow-400">
            <header className="bg-yellow-400 p-4 shadow-md z-20 flex items-center border-b-2 border-black">
                <button onClick={onBack} className="p-2 rounded-full hover:bg-black/20 transition-colors"><BackArrowIcon className="h-6 w-6 text-black"/></button>
                <div className="flex-grow text-center"><Logo /></div><div className="w-10"></div>
            </header>
            <div className="flex-grow relative">
                <MapContainer center={position} zoom={13} scrollWheelZoom={false} className="absolute inset-0">
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    <Marker position={position}><Popup>{trip.details.pickup}</Popup></Marker>
                    <Marker position={destination}><Popup>{trip.details.drop}</Popup></Marker>
                    <Polyline pathOptions={{ color: 'black' }} positions={route} />
                </MapContainer>
                <div className="absolute bottom-0 left-0 right-0 p-4 z-10">
                     <div className="bg-yellow-400 border-2 border-black rounded-2xl p-4 flex items-center gap-4">
                        <div className="bg-black rounded-full p-3"><UserIcon className="h-8 w-8 text-yellow-400" /></div>
                        <div>
                            <p className="font-bold text-lg text-black">{car.driverName}</p>
                            <p className="text-black">{car.driverPhone}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const CustomerApp = ({ dataApi, onExit }) => {
    const [page, setPage] = useState('booking'); // booking, seatSelection, login, signup, payment, tracking
    const [bookingDetails, setBookingDetails] = useState(null);
    const [selectedCar, setSelectedCar] = useState(null);
    const [finalBookingDetails, setFinalBookingDetails] = useState(null);
    const [loggedInUser, setLoggedInUser] = useState(null);
    const [loginMessage, setLoginMessage] = useState('');
    const [loginError, setLoginError] = useState('');
    
    const { locations, pickupPoints, availableCars, trips, customers } = dataApi.customer.getData();

    const handleBookCar = (car, details) => {
        setSelectedCar(car);
        setBookingDetails(details);
        setPage('seatSelection');
    };
    
    const handleSeatConfirm = (details) => {
        setFinalBookingDetails(details);
        setPage('login');
    };
    const handleGoToSignUp = () => setPage('signup');
    
    const handleSignInSuccess = (credentials) => {
        setLoginMessage('');
        const { email, password } = credentials;
        const foundCustomer = customers.find(c => (c.email === email || c.phone === email) && c.password === password);
        if(foundCustomer) {
            setLoggedInUser(foundCustomer);
            setPage('payment');
            setLoginError('');
        } else {
            setLoginError('Invalid credentials. Please try again.');
        }
    };

    const handleSignUpSuccess = (userDetails) => {
        dataApi.customer.signUp(userDetails);
        setLoginMessage('Account created successfully! Please sign in.');
        setPage('login');
    };

    const handlePaymentConfirm = () => {
        const freshCarData = dataApi.customer.getCarById(selectedCar.id) || selectedCar;

        const trip = {
            id: Date.now(),
            customer: loggedInUser,
            car: freshCarData,
            booking: bookingDetails,
            details: finalBookingDetails,
            timestamp: new Date().toISOString()
        };
        dataApi.customer.bookTrip(trip);

        setSelectedCar(freshCarData);
        setPage('tracking');
    };

    const resetBooking = () => {
        setPage('booking'); setBookingDetails(null); setSelectedCar(null);
        setFinalBookingDetails(null); setLoggedInUser(null); setLoginMessage(''); setLoginError('');
    };
    
    switch(page) {
        case 'booking': return <BookingPage locations={locations} availableCars={availableCars} onBook={handleBookCar} onExit={onExit} trips={trips} />;
        case 'seatSelection': return <SeatSelectionPage car={selectedCar} bookingDetails={bookingDetails} pickupPoints={pickupPoints} onConfirm={handleSeatConfirm} onBack={() => setPage('booking')} trips={trips} />;
        case 'login': return <LoginPage onSignIn={handleSignInSuccess} onCreateAccount={handleGoToSignUp} onBack={() => setPage('seatSelection')} message={loginMessage} error={loginError} />;
        case 'signup': return <SignUpPage onSignUp={handleSignUpSuccess} onBack={() => setPage('login')} />;
        case 'payment': return <PaymentPage car={selectedCar} bookingDetails={bookingDetails} onConfirm={handlePaymentConfirm} onBack={() => setPage('login')} />;
        case 'tracking': return <TripTrackingPage car={selectedCar} trip={{ details: finalBookingDetails }} onBack={resetBooking} />;
        default: return <BookingPage locations={locations} availableCars={availableCars} onBook={handleBookCar} onExit={onExit} trips={trips} />;
    }
};

// --- ADMIN PANEL COMPONENTS ---
const Modal = ({ isOpen, onClose, title, children }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-yellow-400 w-full max-w-md rounded-lg border-2 border-black shadow-lg">
                <header className="flex items-center justify-between p-4 border-b-2 border-black">
                    <h3 className="text-xl font-bold text-black">{title}</h3>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-black/20"><XIcon className="h-6 w-6 text-black"/></button>
                </header>
                <div className="p-4">{children}</div>
            </div>
        </div>
    );
};

const CabDetailsModal = ({ isOpen, onClose, cab, allTrips }) => {
    if (!isOpen) return null;
    
    const cabTrips = allTrips.filter(trip => trip.car.id === cab.id);
    const totalEarnings = cabTrips.reduce((sum, trip) => sum + (Number(trip.car.price || 0) * (trip.details?.seats?.length || 0)), 0);
    
    const latestTrip = cabTrips.length > 0 ? cabTrips.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0] : null;
    const bookedSeats = latestTrip ? latestTrip.details.seats.length : 0;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Details for ${cab.vehicle}`}>
            <div className="space-y-4">
                <div className="h-48 border-2 border-black rounded-lg">
                     <MapContainer center={cab.location} zoom={13} scrollWheelZoom={false} className="h-full w-full">
                        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                        <Marker position={cab.location} />
                    </MapContainer>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-black/5 p-3 rounded-lg text-center">
                        <p className="text-black font-bold text-2xl">₹{totalEarnings.toLocaleString()}</p>
                        <p className="text-black font-semibold text-sm">Total Earnings</p>
                    </div>
                    <div className="bg-black/5 p-3 rounded-lg text-center">
                        <p className="text-black font-bold text-2xl">{bookedSeats} / {cab.totalSeats}</p>
                        <p className="text-black font-semibold text-sm">Booked Seats (Latest Trip)</p>
                    </div>
                </div>
            </div>
        </Modal>
    );
};


const AdminSidebar = ({ currentView, setView, onLogout, isOpen, onClose }) => {
    const navItems = [
        { id: 'dashboard', label: 'Dashboard', icon: DashboardIcon },
        { id: 'fleet', label: 'Fleet', icon: MapIcon },
        { id: 'cabs', label: 'Cabs', icon: TaxiIcon },
        { id: 'drivers', label: 'Drivers', icon: DriverIcon },
        { id: 'locations', label: 'Locations', icon: LocationIcon },
        { id: 'system', label: 'System', icon: SettingsIcon },
    ];
    
    const handleItemClick = (viewId) => {
        setView(viewId);
        onClose(); // Close sidebar on item click for mobile
    };

    return (
        <div className={`
            fixed lg:relative lg:translate-x-0
            inset-y-0 left-0 z-40 bg-black text-white w-64 lg:w-24
            transition-transform duration-300 ease-in-out
            flex flex-col
            ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}>
            <div className="flex items-center justify-between p-4 lg:justify-center">
                <Logo />
                <button onClick={onClose} className="lg:hidden text-white hover:text-yellow-400 p-2">
                    <XIcon className="h-6 w-6" />
                </button>
            </div>
            <nav className="flex flex-col items-center space-y-8 mt-8 flex-grow">
                {navItems.map(item => (
                    <button key={item.id} onClick={() => handleItemClick(item.id)} className={`flex flex-col items-center ${currentView === item.id ? 'text-yellow-400' : 'hover:text-yellow-400'}`}>
                        <item.icon className="h-7 w-7"/>
                        <span className="text-xs mt-1 font-bold">{item.label}</span>
                    </button>
                ))}
            </nav>
            <div className="mb-4">
                 <button onClick={onLogout} className="flex flex-col items-center text-gray-400 hover:text-yellow-400">
                    <LogoutIcon className="h-7 w-7"/>
                    <span className="text-xs mt-1 font-bold">Logout</span>
                </button>
            </div>
        </div>
    );
};

const AdminDashboard = ({ stats, trips }) => (
    <div>
        <header className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-black">Dashboard</h1>
        </header>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 mb-8">
            <div className="bg-transparent border-2 border-black rounded-lg p-4 text-center">
                <p className="text-4xl font-bold text-black">{stats.totalTrips}</p><p className="font-semibold text-black">Total Trips</p>
            </div>
            <div className="bg-transparent border-2 border-black rounded-lg p-4 text-center">
                <p className="text-4xl font-bold text-black">₹{stats.totalRevenue.toLocaleString()}</p><p className="font-semibold text-black">Total Revenue</p>
            </div>
            <div className="bg-transparent border-2 border-black rounded-lg p-4 text-center">
                <p className="text-4xl font-bold text-black">{stats.totalBookedSeats}<span className="text-2xl font-normal text-gray-600">/{stats.totalSystemSeats}</span></p>
                <p className="font-semibold text-black">Booked Seats</p>
            </div>
            <div className="bg-transparent border-2 border-black rounded-lg p-4 text-center">
                <p className="text-4xl font-bold text-black">{stats.totalCabs}</p><p className="font-semibold text-black">Total Cabs</p>
            </div>
             <div className="bg-transparent border-2 border-black rounded-lg p-4 text-center">
                <p className="text-4xl font-bold text-black">{stats.totalDrivers}</p><p className="font-semibold text-black">Total Drivers</p>
            </div>
        </div>
        <div>
            <h2 className="text-2xl font-bold text-black mb-4">Recent Bookings</h2>
            <div className="bg-transparent border-2 border-black rounded-lg p-4 space-y-3">
                {trips.length > 0 ? trips.slice(0, 5).map(trip => (
                    <div key={trip.id} className="flex flex-wrap justify-between items-start border-b-2 border-black/20 pb-3 last:border-b-0 gap-2">
                        <div>
                            <p className="font-bold text-black">{trip.booking.from} to {trip.booking.to}</p>
                            <p className="text-sm text-gray-700">Car: {trip.car.type} ({trip.car.vehicle})</p>
                            <p className="text-sm text-gray-700">Driver: {trip.car.driverName}</p>
                            {trip.customer && (
                                <div className="mt-2 pt-2 border-t border-black/10">
                                    <p className="text-sm font-semibold text-black flex items-center gap-1.5"><UserIcon className="h-4 w-4"/>{trip.customer.name}</p>
                                    <p className="text-sm text-gray-700 flex items-center gap-1.5 mt-1"><PhoneIcon className="h-4 w-4 stroke-current"/>{trip.customer.phone}</p>
                                </div>
                            )}
                        </div>
                        <div className="text-right flex-shrink-0">
                            <p className="font-bold text-lg text-black">₹{(Number(trip.car.price || 0) * (trip.details?.seats?.length || 0)).toLocaleString()}</p>
                            <p className="text-sm text-gray-700">{trip.details?.seats?.length || 0} seat(s) booked</p>
                        </div>
                    </div>
                )) : <p className="text-black">No recent bookings.</p>}
            </div>
        </div>
    </div>
);

const AdminFleetView = ({ cabs }) => (
    <div>
        <header className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-black">Fleet Overview</h1>
        </header>
        <div className="h-[60vh] bg-transparent border-2 border-black rounded-lg">
            <MapContainer center={[27.33, 88.61]} zoom={9} scrollWheelZoom={true} className="h-full w-full">
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                {cabs.map(cab => (
                    <Marker key={cab.id} position={cab.location}>
                        <Popup>
                            <div className="font-bold text-base">{cab.vehicle}</div>
                            <div>Driver: {cab.driverName || 'N/A'}</div>
                            <div>Status: On Route</div>
                        </Popup>
                    </Marker>
                ))}
            </MapContainer>
        </div>
    </div>
);


const AdminCabsView = ({ cabs, drivers, locations, allTrips, onAdd, onDelete, onUpdate }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [selectedCabForDetails, setSelectedCabForDetails] = useState(null);
    const [editingCab, setEditingCab] = useState(null);
    
    const [type, setType] = useState('');
    const [vehicle, setVehicle] = useState('');
    const [totalSeats, setTotalSeats] = useState('4');
    const [price, setPrice] = useState('');
    const [driverId, setDriverId] = useState('');
    const [from, setFrom] = useState('');
    const [to, setTo] = useState('');
    const [departureTime, setDepartureTime] = useState('');

    const unassignedDrivers = drivers.filter(d => !cabs.some(c => c.driverId === d.id));
    const availableDriversForEdit = editingCab ? [...unassignedDrivers, drivers.find(d => d.id === editingCab.driverId)].filter(Boolean) : unassignedDrivers;

    const resetForm = () => {
        setEditingCab(null);
        setType(''); setVehicle(''); setTotalSeats('4'); setPrice(''); setDriverId('');
        setFrom(''); setTo(''); setDepartureTime('');
    };

    const openAddModal = () => { resetForm(); setIsModalOpen(true); };
    const openDetailsModal = (cab) => { setSelectedCabForDetails(cab); setIsDetailsModalOpen(true); };
    const openEditModal = (cab) => {
        setEditingCab(cab);
        setType(cab.type);
        setVehicle(cab.vehicle);
        setTotalSeats(String(cab.totalSeats));
        setPrice(String(cab.price));
        setDriverId(cab.driverId ? String(cab.driverId) : '');
        setFrom(cab.from || '');
        setTo(cab.to || '');
        setDepartureTime(cab.departureTime || '');
        setIsModalOpen(true);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const cabData = { type, vehicle, from, to, departureTime, totalSeats: parseInt(totalSeats, 10), price: parseInt(price, 10), driverId: parseInt(driverId, 10) || null };
        if (editingCab) {
            onUpdate({ ...cabData, id: editingCab.id });
        } else {
            onAdd(cabData);
        }
        setIsModalOpen(false);
    };

    return (
        <div>
            <header className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-black">Manage Cabs</h1>
                <button onClick={openAddModal} className="bg-black text-yellow-400 font-bold py-2 px-4 rounded-lg flex items-center gap-2 hover:bg-black/80"><PlusIcon/> Add Cab</button>
            </header>
            <div className="bg-transparent border-2 border-black rounded-lg">
                <table className="w-full text-left">
                    <thead className="border-b-2 border-black"><tr><th className="p-4">Vehicle</th><th className="p-4">Route</th><th className="p-4">Departure</th><th className="p-4">Driver</th><th className="p-4"></th></tr></thead>
                    <tbody>
                        {cabs.map(cab => (
                            <tr key={cab.id} className="border-b border-black/20 last:border-b-0">
                                <td className="p-4 font-semibold text-black">{cab.vehicle}<br/><span className="font-normal text-sm">{cab.type}</span></td>
                                <td className="p-4 text-black">{cab.from} to {cab.to}</td>
                                <td className="p-4 text-black">{cab.departureTime}</td>
                                <td className="p-4 text-black">{cab.driverName || 'Unassigned'}</td>
                                <td className="p-4 text-right">
                                    <button onClick={() => openDetailsModal(cab)} className="text-gray-600 hover:text-black p-2"><InfoIcon className="h-5 w-5"/></button>
                                    <button onClick={() => openEditModal(cab)} className="text-blue-600 hover:text-blue-800 p-2"><EditIcon className="h-5 w-5"/></button>
                                    <button onClick={() => onDelete(cab.id)} className="text-red-600 hover:text-red-800 p-2"><TrashIcon className="h-5 w-5"/></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingCab ? 'Edit Cab' : 'Add New Cab'}>
                <form onSubmit={handleSubmit} className="space-y-4">
                     <div><label className="block text-sm font-bold text-black mb-1">Cab Type</label><input type="text" value={type} onChange={e => setType(e.target.value)} required className="w-full p-2 border-2 border-black rounded" placeholder="e.g., SUV (7 Seater)"/></div>
                     <div><label className="block text-sm font-bold text-black mb-1">Vehicle No.</label><input type="text" value={vehicle} onChange={e => setVehicle(e.target.value)} required className="w-full p-2 border-2 border-black rounded" placeholder="e.g., SK01 J 1234"/></div>
                     <div><label className="block text-sm font-bold text-black mb-1">From Location</label>
                        <select value={from} onChange={e => setFrom(e.target.value)} required className="w-full p-2 border-2 border-black rounded bg-white">
                            <option value="" disabled>Select a location</option>
                            {locations.map(loc => <option key={loc} value={loc}>{loc}</option>)}
                        </select>
                    </div>
                    <div><label className="block text-sm font-bold text-black mb-1">To Location</label>
                        <select value={to} onChange={e => setTo(e.target.value)} required className="w-full p-2 border-2 border-black rounded bg-white">
                            <option value="" disabled>Select a location</option>
                            {locations.map(loc => <option key={loc} value={loc}>{loc}</option>)}
                        </select>
                    </div>
                    <div><label className="block text-sm font-bold text-black mb-1">Departure Time</label><input type="text" value={departureTime} onChange={e => setDepartureTime(e.target.value)} required className="w-full p-2 border-2 border-black rounded" placeholder="e.g., 09:00 AM"/></div>
                     <div><label className="block text-sm font-bold text-black mb-1">Total Seats</label><input type="number" value={totalSeats} onChange={e => setTotalSeats(e.target.value)} required className="w-full p-2 border-2 border-black rounded"/></div>
                     <div><label className="block text-sm font-bold text-black mb-1">Price per Seat</label><input type="number" value={price} onChange={e => setPrice(e.target.value)} required className="w-full p-2 border-2 border-black rounded" placeholder="e.g., 500"/></div>
                     <div><label className="block text-sm font-bold text-black mb-1">Assign Driver</label>
                        <select value={driverId} onChange={e => setDriverId(e.target.value)} required className="w-full p-2 border-2 border-black rounded bg-white">
                            <option value="">Select a driver</option>
                            {(editingCab ? availableDriversForEdit : unassignedDrivers).map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                        </select>
                    </div>
                     <button type="submit" className="w-full bg-black text-yellow-400 font-bold py-2 px-4 rounded-lg">{editingCab ? 'Update Cab' : 'Add Cab'}</button>
                </form>
            </Modal>
            {selectedCabForDetails && <CabDetailsModal isOpen={isDetailsModalOpen} onClose={() => setIsDetailsModalOpen(false)} cab={selectedCabForDetails} allTrips={allTrips} />}
        </div>
    );
};

const AdminDriversView = ({ drivers, onAdd, onDelete, onUpdate }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingDriver, setEditingDriver] = useState(null);
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    const resetForm = () => {
        setEditingDriver(null);
        setName(''); setPhone(''); setUsername(''); setPassword('');
    };

    const openAddModal = () => {
        resetForm();
        setIsModalOpen(true);
    };

    const openEditModal = (driver) => {
        setEditingDriver(driver);
        setName(driver.name);
        setPhone(driver.phone);
        setUsername(driver.username);
        setPassword(''); // Password field is blank for editing for security
        setIsModalOpen(true);
    };
    
    const handleSubmit = e => {
        e.preventDefault();
        const driverData = { name, phone, username, password };
        if (editingDriver) {
            onUpdate({ ...driverData, id: editingDriver.id });
        } else {
            onAdd(driverData);
        }
        setIsModalOpen(false);
    };

    return (
        <div>
            <header className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-black">Manage Drivers</h1>
                <button onClick={openAddModal} className="bg-black text-yellow-400 font-bold py-2 px-4 rounded-lg flex items-center gap-2 hover:bg-black/80"><PlusIcon/> Add Driver</button>
            </header>
            <div className="bg-transparent border-2 border-black rounded-lg">
                <table className="w-full text-left">
                    <thead className="border-b-2 border-black"><tr><th className="p-4">Name</th><th className="p-4">Phone</th><th className="p-4">Username</th><th className="p-4"></th></tr></thead>
                    <tbody>
                        {drivers.map(driver => (
                            <tr key={driver.id} className="border-b border-black/20 last:border-b-0">
                                <td className="p-4 font-semibold text-black">{driver.name}</td>
                                <td className="p-4 text-black">{driver.phone}</td>
                                <td className="p-4 text-black">{driver.username}</td>
                                <td className="p-4 text-right">
                                    <button onClick={() => openEditModal(driver)} className="text-blue-600 hover:text-blue-800 p-2"><EditIcon className="h-5 w-5"/></button>
                                    <button onClick={() => onDelete(driver.id)} className="text-red-600 hover:text-red-800 p-2"><TrashIcon className="h-5 w-5"/></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
             <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingDriver ? "Edit Driver" : "Add New Driver"}>
                <form onSubmit={handleSubmit} className="space-y-4">
                     <div><label className="block text-sm font-bold text-black mb-1">Full Name</label><input type="text" value={name} onChange={e => setName(e.target.value)} required className="w-full p-2 border-2 border-black rounded"/></div>
                     <div><label className="block text-sm font-bold text-black mb-1">Phone Number</label><input type="tel" value={phone} onChange={e => setPhone(e.target.value)} required className="w-full p-2 border-2 border-black rounded"/></div>
                     <div><label className="block text-sm font-bold text-black mb-1">Username</label><input type="text" value={username} onChange={e => setUsername(e.target.value)} required className="w-full p-2 border-2 border-black rounded"/></div>
                     <div><label className="block text-sm font-bold text-black mb-1">Password</label><input type="password" value={password} onChange={e => setPassword(e.target.value)} required={!editingDriver} className="w-full p-2 border-2 border-black rounded" placeholder={editingDriver ? "Leave blank to keep current" : ""}/></div>
                     <button type="submit" className="w-full bg-black text-yellow-400 font-bold py-2 px-4 rounded-lg">{editingDriver ? "Update Driver" : "Add Driver"}</button>
                </form>
            </Modal>
        </div>
    );
};

const AdminLocationsView = ({ locations, pickupPoints, allLocationCoordinates, onAddLocation, onDeleteLocation, onAddPoint, onDeletePoint, onUpdateLocation }) => {
    // Modal states
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    // Form states
    const [isEditing, setIsEditing] = useState(false);
    const [editingLocation, setEditingLocation] = useState(null); // The original name
    const [locationName, setLocationName] = useState('');
    const [locationLat, setLocationLat] = useState('');
    const [locationLon, setLocationLon] = useState('');
    
    const [selectedLocation, setSelectedLocation] = useState(locations[0]);
    const [newPoint, setNewPoint] = useState('');

    useEffect(() => {
        if (!locations.includes(selectedLocation) && locations.length > 0) {
            setSelectedLocation(locations[0]);
        }
    }, [locations, selectedLocation]);
    
    const resetForm = () => {
        setEditingLocation(null);
        setLocationName('');
        setLocationLat('');
        setLocationLon('');
        setIsEditing(false);
    };

    const handleAddPoint = (e) => { e.preventDefault(); onAddPoint(selectedLocation, newPoint); setNewPoint(''); };
    
    const openAddModal = () => {
        resetForm();
        setIsEditing(false);
        setIsModalOpen(true);
    };

    const openEditModal = (locName) => {
        const coords = allLocationCoordinates[locName] || [null, null];
        setEditingLocation(locName);
        setLocationName(locName);
        setLocationLat(String(coords[0] || ''));
        setLocationLon(String(coords[1] || ''));
        setIsEditing(true);
        setIsModalOpen(true);
    };

    const handleSubmitLocation = (e) => {
        e.preventDefault();
        const payload = { 
            newName: locationName.trim(), 
            lat: locationLat, 
            lon: locationLon 
        };
        if (isEditing) {
             onUpdateLocation({ ...payload, oldName: editingLocation });
        } else {
             onAddLocation({ name: locationName.trim(), lat: locationLat, lon: locationLon });
        }
        setIsModalOpen(false);
    };

    return (
        <div>
            <header className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-black">Manage Locations</h1>
            </header>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-1 space-y-4">
                    <div className="flex justify-between items-center">
                        <h2 className="text-xl font-bold text-black">Service Locations</h2>
                        <button onClick={openAddModal} className="bg-black text-yellow-400 font-bold py-2 px-4 rounded-lg flex items-center gap-2 hover:bg-black/80 text-sm"><PlusIcon/> Add</button>
                    </div>
                     <div className="bg-transparent border-2 border-black rounded-lg p-2 space-y-1 min-h-[40vh]">
                        {locations.map(loc => (
                            <div key={loc} className={`flex justify-between items-center p-2 rounded-md cursor-pointer ${selectedLocation === loc ? 'bg-black text-yellow-400' : 'text-black hover:bg-black/10'}`} onClick={() => setSelectedLocation(loc)}>
                                <span className="font-semibold">{loc}</span>
                                <div className="flex items-center">
                                    <button onClick={(e) => { e.stopPropagation(); openEditModal(loc); }} className={`p-1 ${selectedLocation === loc ? 'text-yellow-400 hover:text-white' : 'text-blue-600 hover:text-blue-800'}`}><EditIcon className="h-4 w-4"/></button>
                                    <button onClick={(e) => {e.stopPropagation(); onDeleteLocation(loc);}} className={`p-1 ${selectedLocation === loc ? 'text-yellow-400 hover:text-white' : 'text-red-600 hover:text-red-800'}`}><TrashIcon className="h-4 w-4"/></button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="md:col-span-2 space-y-4">
                    <h2 className="text-xl font-bold text-black">Pickup/Drop Points for <span className="text-yellow-600">{selectedLocation}</span></h2>
                    <form onSubmit={handleAddPoint} className="flex gap-2"><input type="text" value={newPoint} onChange={e => setNewPoint(e.target.value)} required className="flex-grow p-2 border-2 border-black rounded" placeholder="Add new point"/><button type="submit" className="bg-black text-yellow-400 p-2 rounded-lg"><PlusIcon/></button></form>
                     <div className="bg-transparent border-2 border-black rounded-lg p-2 space-y-1 min-h-[40vh]">
                        {(pickupPoints[selectedLocation] || []).map(point => (
                            <div key={point} className="flex justify-between items-center p-2 rounded-md text-black">
                                <span className="font-semibold">{point}</span>
                                <button onClick={() => onDeletePoint(selectedLocation, point)} className="text-red-600 hover:text-red-800 p-1"><TrashIcon className="h-4 w-4"/></button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={isEditing ? 'Edit Location' : 'Add New Location'}>
                <form onSubmit={handleSubmitLocation} className="space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-black mb-1">Location Name</label>
                        <input type="text" value={locationName} onChange={e => setLocationName(e.target.value)} required className="w-full p-2 border-2 border-black rounded bg-white"/>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                         <div>
                            <label className="block text-sm font-bold text-black mb-1">Latitude</label>
                            <input type="number" step="any" value={locationLat} onChange={e => setLocationLat(e.target.value)} required className="w-full p-2 border-2 border-black rounded bg-white"/>
                        </div>
                         <div>
                            <label className="block text-sm font-bold text-black mb-1">Longitude</label>
                            <input type="number" step="any" value={locationLon} onChange={e => setLocationLon(e.target.value)} required className="w-full p-2 border-2 border-black rounded bg-white"/>
                        </div>
                    </div>
                    <button type="submit" className="w-full bg-black text-yellow-400 font-bold py-2 px-4 rounded-lg">{isEditing ? 'Update Location' : 'Add Location'}</button>
                </form>
            </Modal>
        </div>
    );
};

const AdminSystemView = ({ onReset }) => {
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [confirmText, setConfirmText] = useState('');

    const handleReset = () => {
        if (confirmText === 'RESET') {
            onReset();
            setIsConfirmOpen(false);
        }
    };
    
    const openModal = () => {
        setConfirmText('');
        setIsConfirmOpen(true);
    };

    const closeModal = () => {
        setIsConfirmOpen(false);
        setConfirmText('');
    };

    return (
        <div>
            <header className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-black">System Settings</h1>
            </header>
            <div className="bg-transparent border-2 border-red-500 rounded-lg p-6">
                <h2 className="text-xl font-bold text-red-700">Danger Zone</h2>
                <p className="text-gray-700 mt-2 mb-4">This action is irreversible. It will delete all bookings, customers, and custom configurations, resetting the application to its original default state.</p>
                <button 
                    onClick={openModal}
                    className="bg-red-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-red-700 transition-colors"
                >
                    Reset Application Data
                </button>
            </div>
            <Modal isOpen={isConfirmOpen} onClose={closeModal} title="Confirm Data Reset">
                <div className="space-y-4">
                    <p className="text-black">Are you absolutely sure you want to reset all application data to its default state? This cannot be undone.</p>
                    <p className="text-black font-semibold">To confirm, please type <code className="bg-black/10 p-1 rounded font-mono text-black">RESET</code> in the box below.</p>
                    
                    <input 
                        type="text" 
                        value={confirmText}
                        onChange={(e) => setConfirmText(e.target.value)}
                        className="w-full p-2 border-2 border-black rounded font-mono bg-white"
                        aria-label="Confirmation input for resetting data"
                        placeholder="RESET"
                    />

                    <div className="flex justify-end gap-4 pt-2">
                        <button onClick={closeModal} className="bg-gray-300 text-black font-bold py-2 px-4 rounded-lg hover:bg-gray-400 transition-colors">Cancel</button>
                        <button 
                            onClick={handleReset} 
                            disabled={confirmText !== 'RESET'}
                            className="bg-red-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-red-700 transition-colors disabled:bg-red-300 disabled:cursor-not-allowed"
                        >
                            Yes, Reset Data
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};


const AdminPanel = ({ onLogout, auth, dataApi }) => {
    const [view, setView] = useState('dashboard');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    
    const { 
        cabs, drivers, trips, locations, pickupPoints, 
        allCabs, allDrivers, allTrips, stats, allLocationCoordinates
    } = dataApi.admin.getData(auth);

    const handlers = {
        addCab: (payload) => dataApi.admin.addCab(payload),
        deleteCab: (payload) => dataApi.admin.deleteCab(payload),
        updateCab: (payload) => dataApi.admin.updateCab(payload),
        addDriver: (payload) => dataApi.admin.addDriver(payload),
        deleteDriver: (payload) => dataApi.admin.deleteDriver(payload),
        updateDriver: (payload) => dataApi.admin.updateDriver(payload),
        addLocation: (payload) => dataApi.admin.addLocation(payload),
        deleteLocation: (payload) => dataApi.admin.deleteLocation(payload),
        updateLocation: (payload) => dataApi.admin.updateLocation(payload),
        addPoint: (loc, point) => dataApi.admin.addPoint(loc, point),
        deletePoint: (loc, point) => dataApi.admin.deletePoint(loc, point),
        resetData: () => dataApi.admin.resetData(),
    };

    const renderView = () => {
        switch(view) {
            case 'fleet': return <AdminFleetView cabs={cabs} />;
            case 'cabs': return <AdminCabsView cabs={cabs} drivers={allDrivers} locations={locations} allTrips={allTrips} onAdd={handlers.addCab} onDelete={handlers.deleteCab} onUpdate={handlers.updateCab} />;
            case 'drivers': return <AdminDriversView drivers={drivers} onAdd={handlers.addDriver} onDelete={handlers.deleteDriver} onUpdate={handlers.updateDriver} />;
            case 'locations': return <AdminLocationsView locations={locations} pickupPoints={pickupPoints} allLocationCoordinates={allLocationCoordinates} onAddLocation={handlers.addLocation} onDeleteLocation={handlers.deleteLocation} onUpdateLocation={handlers.updateLocation} onAddPoint={handlers.addPoint} onDeletePoint={handlers.deletePoint}/>;
            case 'system': return <AdminSystemView onReset={handlers.resetData} />;
            case 'dashboard':
            default: return <AdminDashboard stats={stats} trips={trips}/>;
        }
    };
    
    return (
        <div className="flex h-screen app-container bg-yellow-400 overflow-hidden relative">
            {isSidebarOpen && (
                <div 
                    className="fixed inset-0 bg-black/50 z-30 lg:hidden" 
                    onClick={() => setIsSidebarOpen(false)}
                    aria-hidden="true"
                ></div>
            )}
            <AdminSidebar 
                currentView={view} 
                setView={setView} 
                onLogout={onLogout} 
                isOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
            />
            <main className="flex-1 flex flex-col bg-gray-100 overflow-y-auto">
                <header className="bg-yellow-400 p-4 shadow-sm flex justify-between items-center lg:hidden sticky top-0 z-20">
                    <button onClick={() => setIsSidebarOpen(true)} className="p-2 -ml-2 text-black">
                        <MenuIcon className="h-6 w-6"/>
                    </button>
                    <Logo />
                    <div className="w-6"></div> {/* Spacer to balance logo */}
                </header>
                <div className="p-6 flex-grow">{renderView()}</div>
            </main>
        </div>
    );
};

// --- DRIVER APP COMPONENTS ---
const DriverApp = ({ onLogout, driver, dataApi }) => {
    const { trips } = dataApi.driver.getData(driver);
    
    const AppHeader = () => (
        <header className="bg-yellow-400 p-4 shadow-md flex items-center border-b-2 border-black sticky top-0 z-10">
            <h2 className="font-bold text-black flex-1 truncate">{driver.name}</h2>
            <div className="flex-grow text-center"><Logo /></div>
            <div className="flex-1 flex justify-end">
                <button onClick={onLogout} className="p-2 rounded-full hover:bg-black/10" aria-label="Logout"><LogoutIcon className="h-6 w-6 text-black"/></button>
            </div>
        </header>
    );

    if (!trips || trips.length === 0) {
        return (
            <div className="min-h-screen bg-yellow-400">
                <AppHeader />
                <main className="p-4 flex items-center justify-center flex-grow" style={{minHeight: 'calc(100vh - 80px)'}}>
                    <div className="text-center p-8">
                        <TaxiIcon className="h-16 w-16 mx-auto text-black/20 mb-4" />
                        <h2 className="text-2xl font-bold text-black">No active trips.</h2>
                        <p className="text-black">You're all set for today!</p>
                    </div>
                </main>
            </div>
        );
    }
    
    // Assuming all trips passed are for the same journey (car, route, time) but different customers.
    const firstTrip = trips[0];
    const totalSeatsBooked = trips.reduce((sum, trip) => sum + trip.details.seats.length, 0);

    return (
        <div className="min-h-screen flex flex-col bg-gray-100">
            <AppHeader />
            <main className="p-4 flex-grow">
                <div className="w-full max-w-md mx-auto border-2 border-black rounded-2xl p-4 sm:p-5 space-y-4 bg-yellow-400">
                    <div>
                        <h3 className="text-lg font-bold text-black mb-2 text-center">Today's Trip</h3>
                        <div className="flex justify-between items-center text-md font-semibold text-black bg-black/5 p-3 rounded-lg">
                            <span>{firstTrip.booking.from}</span>
                            <TaxiIcon className="h-5 w-5 text-black flex-shrink-0 mx-2"/>
                            <span>{firstTrip.booking.to}</span>
                        </div>
                        <div className="text-center text-sm text-black font-semibold mt-1">{firstTrip.car.departureTime} &middot; {firstTrip.car.vehicle}</div>
                    </div>

                    <div className="border-t-2 border-black/20 pt-4">
                        <h4 className="text-lg font-bold text-black mb-3">Passenger Manifest ({totalSeatsBooked} seats)</h4>
                        <div className="space-y-3 max-h-[55vh] overflow-y-auto pr-1">
                            {trips.map(trip => (
                                <div key={trip.id} className="bg-white/50 p-3 rounded-lg border-2 border-black/80 shadow-sm">
                                    <div className="flex items-start gap-3">
                                        <div className="mt-1 text-black"><UserIcon className="h-6 w-6" /></div>
                                        <div className="flex-grow">
                                            <p className="font-bold text-black">{trip.customer.name}</p>
                                            <a href={`tel:${trip.customer.phone}`} className="text-sm text-black hover:underline flex items-center gap-1">
                                                <PhoneIcon className="h-3 w-3" />
                                                {trip.customer.phone}
                                            </a>
                                        </div>
                                        <div className="ml-auto text-right flex-shrink-0 bg-black text-yellow-400 px-3 py-1.5 rounded-lg">
                                            <div className="flex items-center gap-1.5 font-bold">
                                                <SeatIcon className="h-4 w-4" />
                                                <span className="text-sm">{trip.details.seats.join(', ')}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-sm space-y-1.5 mt-2 pt-2 border-t border-black/20">
                                         <div className="flex items-start gap-2">
                                            <MapPinIcon className="h-4 w-4 text-green-700 mt-0.5 flex-shrink-0" />
                                            <div><span className="font-semibold">Pickup:</span> {trip.details.pickup}</div>
                                         </div>
                                         <div className="flex items-start gap-2">
                                             <MapPinIcon className="h-4 w-4 text-red-700 mt-0.5 flex-shrink-0" />
                                             <div><span className="font-semibold">Drop:</span> {trip.details.drop}</div>
                                         </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                     <button onClick={() => alert('Navigation logic would start here.')} className="w-full mt-2 bg-black text-yellow-400 font-bold py-3 px-4 rounded-lg border-2 border-black hover:bg-gray-800 transition-colors">Start Trip</button>
                </div>
            </main>
        </div>
    );
};

// --- AUTH & MAIN APP ROUTER ---
const AppLoginPage = ({ role, onLogin, onBack, error }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    const titleMap = {
        superadmin: 'Admin Login',
        driver: 'Driver Login',
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onLogin({ username, password });
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-yellow-400">
            <div className="w-full max-w-sm mx-auto space-y-6">
                <div className="text-center"><Logo /></div>
                <h2 className="text-3xl font-bold text-black text-center">{titleMap[role] || 'Login'}</h2>
                {error && <p className="text-center font-semibold text-red-700 bg-red-100 border border-red-700 rounded-lg p-2">{error}</p>}
                <form onSubmit={handleSubmit} className="space-y-4">
                     <div>
                        <label className="block text-sm font-bold text-black mb-1">Username / Email</label>
                        <input type="text" value={username} onChange={e => setUsername(e.target.value)} required className="block w-full px-3 py-3 bg-transparent text-black border-2 border-black rounded-lg font-semibold" placeholder="Enter username or email"/>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-black mb-1">Password</label>
                        <input type="password" value={password} onChange={e => setPassword(e.target.value)} required className="block w-full px-3 py-3 bg-transparent text-black border-2 border-black rounded-lg font-semibold" placeholder="Enter password"/>
                    </div>
                    <button type="submit" className="w-full mt-4 bg-transparent text-black font-bold py-3 px-4 rounded-lg border-2 border-black hover:bg-black/10">Login</button>
                </form>
                 <button onClick={onBack} className="w-full text-center font-semibold text-black hover:underline">Back to Main Menu</button>
            </div>
        </div>
    );
};

const HeroBackground = () => (
    <div aria-hidden="true" className="absolute inset-0 w-full h-full bg-gray-900 overflow-hidden z-0">
        <svg className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-auto h-auto min-w-full min-h-full max-w-none" viewBox="0 0 1600 900" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Mountains */}
            <path d="M-100 900L555.417 375L891.5 625L1600 125V900H-100Z" fill="#1f2937"/>
            <path d="M-66.6667 900L775 208.333L1208.33 541.667L1833.33 291.667V900H-66.6667Z" fill="#111827" opacity="0.7"/>
            
             {/* Road Path with gradient */}
            <defs>
                <linearGradient id="roadGradient" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#facc15" stopOpacity="0" />
                    <stop offset="20%" stopColor="#facc15" />
                    <stop offset="80%" stopColor="#facc15" />
                    <stop offset="100%" stopColor="#facc15" stopOpacity="0"/>
                </linearGradient>
            </defs>
            <path d="M-200 775 C 200 700, 600 750, 1000 700 S 1800 600, 2000 650" stroke="url(#roadGradient)" strokeWidth="15" fill="none" strokeLinecap="round"/>

            {/* Taxi */}
            <g transform="translate(800 655) scale(1.5)">
                <path d="M -40 0 a 10 10 0 0 1 -10 -10 v -20 a 5 5 0 0 1 5 -5 h 10 l 10 -15 h 30 l 10 15 h 10 a 5 5 0 0 1 5 5 v 20 a 10 10 0 0 1 -10 10 z" fill="#facc15" />
                <path d="M-20 -35 l5 -15 h 30 l5 15 z" fill="#1f2937" />
                <circle cx="-25" cy="0" r="8" fill="#111827" />
                <circle cx="25" cy="0" r="8" fill="#111827" />
                <rect x="-10" y="-32" width="20" height="10" fill="rgba(255,255,255,0.2)" />
                {/* Happy people silhouettes */}
                <path d="M -5 -32 c 0 -3 10 -3 10 0" stroke="white" strokeWidth="1" fill="none" />
                <path d="M 10 -32 c 0 -3 10 -3 10 0" stroke="white" strokeWidth="1" fill="none" />
            </g>
        </svg>
    </div>
);

const ChooserPage = ({ setView }) => {
    const chooserOptions = [
        {
            view: 'customer',
            title: 'Sajilo Taxi',
            description: 'Book rides and track your taxi.',
            icon: (props) => <UserIcon {...props} />,
        },
        {
            view: 'superadmin',
            title: 'Admin Panel',
            description: 'Full system management.',
            icon: (props) => <DashboardIcon {...props}/>,
        },
        {
            view: 'driver',
            title: 'Driver App',
            description: 'View assigned trips.',
            icon: (props) => <SteeringWheelIcon {...props} stroke="currentColor" fill="none"/>,
        },
    ];

    return (
        <div className="relative flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-4">
            <HeroBackground />
            <div className="absolute inset-0 bg-black/60 z-10"></div>
            <main className="relative z-20 flex flex-col items-center justify-center text-center w-full flex-grow">
                <Logo />
                <p className="mt-2 text-lg font-semibold tracking-wide text-white/90">
                    Easy, Reliable, Shared
                </p>
                <div className="mt-16 w-full max-w-4xl">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                        {chooserOptions.map((option) => (
                            <button
                                key={option.view}
                                onClick={() => setView(option.view)}
                                className="group bg-white/10 border border-white/20 rounded-2xl p-6 text-left hover:bg-yellow-400/10 hover:border-yellow-400/30 backdrop-blur-md transition-all duration-300 transform hover:-translate-y-1"
                            >
                                <div className="mb-4 w-12 h-12 rounded-lg flex items-center justify-center bg-black/20 text-yellow-400 group-hover:bg-yellow-400/20 transition-colors">
                                    <option.icon className="w-7 h-7" />
                                </div>
                                <h2 className="text-xl font-bold text-white">{option.title}</h2>
                                <p className="text-white/70 mt-1">{option.description}</p>
                            </button>
                        ))}
                    </div>
                </div>
            </main>
        </div>
    );
};

// --- DATA & STATE MANAGEMENT ---
const STORAGE_KEY = 'sajilo_taxi_data';

const locationCoordinates = {
    'Gangtok': [27.3314, 88.6138], 'Pelling': [27.3165, 88.2415], 'Lachung': [27.6896, 88.7431],
    'Lachen': [27.7167, 88.5500], 'Yuksom': [27.3700, 88.2200], 'Namchi': [27.1700, 88.3500],
    'Ravangla': [27.3000, 88.3667], 'Zuluk': [27.2550, 88.7750], 'Mangan': [27.5000, 88.5333],
    'Darjeeling': [27.0410, 88.2663], 'Kalimpong': [27.0600, 88.4700], 'Kurseong': [26.8833, 88.2833],
    'Mirik': [26.9000, 88.1667], 'Siliguri': [26.7271, 88.3953], 'Bagdogra': [26.7000, 88.3167],
    'New Jalpaiguri (NJP)': [26.6833, 88.4333], 'Thimphu': [27.4667, 89.6333], 'Paro': [27.4333, 89.4167],
    'Punakha': [27.5833, 89.8667], 'Phuentsholing': [26.8500, 89.3833]
};

const initialData = {
    admins: [
        { id: 99, name: 'System Superadmin', username: 'sajilotaxi@gmail.com', password: 'admin', role: 'superadmin' },
    ],
    drivers: [
        { id: 1, name: 'Sangeeta Rai', phone: '+91 9876543210', username: 'sangeeta', password: 'password', role: 'driver' },
        { id: 2, name: 'Sunita Rai', phone: '+91 9876543211', username: 'sunita', password: 'password', role: 'driver' },
        { id: 3, name: 'Bikash Gurung', phone: '+91 9876543212', username: 'bikash', password: 'password', role: 'driver' },
        { id: 4, name: 'Pramod Chettri', phone: '+91 9876543213', username: 'pramod', password: 'password', role: 'driver' },
    ],
    cabs: [
        { id: 1, type: 'SUV (7 Seater)', vehicle: 'SK01 J 1234', from: 'Kalimpong', to: 'Gangtok', price: 400, totalSeats: 7, driverId: 1, location: locationCoordinates['Kalimpong'], destination: locationCoordinates['Gangtok'], departureTime: '09:00 AM' },
        { id: 2, type: 'Sedan (4 Seater)', vehicle: 'SK04 P 5678', from: 'Siliguri', to: 'Darjeeling', price: 600, totalSeats: 4, driverId: 2, location: locationCoordinates['Siliguri'], destination: locationCoordinates['Darjeeling'], departureTime: '09:30 AM' },
        { id: 3, type: 'Sumo (10 Seater)', vehicle: 'WB74 A 9012', from: 'Gangtok', to: 'Pelling', price: 350, totalSeats: 10, driverId: 3, location: locationCoordinates['Gangtok'], destination: locationCoordinates['Pelling'], departureTime: '10:15 AM' },
        { id: 4, type: 'SUV (7 Seater)', vehicle: 'SK01 T 4321', from: 'Gangtok', to: 'Lachung', price: 650, totalSeats: 7, driverId: 4, location: locationCoordinates['Gangtok'], destination: locationCoordinates['Lachung'], departureTime: '08:00 AM' },
    ],
    locations: Object.keys(locationCoordinates).sort(),
    pickupPoints: {
        'Gangtok': ['MG Marg', 'Deorali', 'Tadong', 'Ranipool'], 'Pelling': ['Upper Pelling', 'Lower Pelling', 'Helipad'],
        'Darjeeling': ['Chowrasta Mall', 'Darjeeling Station', 'Ghoom Monastery'], 'Kalimpong': ['Kalimpong Main Market', 'Deolo Hill', 'Durpin Dara'],
        'Siliguri': ['City Centre', 'Sevoke Road', 'NJP Station'], 'Thimphu': ['Clock Tower Square', 'Buddha Dordenma', 'Main Town'],
        'Paro': ['Paro Town', 'Airport', 'Tiger\'s Nest Base'], 'Default': ['Main Bus Stand', 'City Center', 'Near Clock Tower', 'Hotel Lobby']
    },
    trips: [],
    customers: [],
    customLocationCoordinates: {},
};

const getInitialState = () => {
    try {
        const storedValue = localStorage.getItem(STORAGE_KEY);
        if (storedValue) {
            const parsed = JSON.parse(storedValue);
            // Basic validation to ensure we have a valid state object
            if (typeof parsed === 'object' && parsed !== null && Array.isArray(parsed.admins)) {
                return { ...initialData, ...parsed };
            }
        }
    } catch (error) {
        console.error(`Error parsing or validating localStorage key "${STORAGE_KEY}", resetting to default.`, error);
        // If storage is corrupted, remove it.
        localStorage.removeItem(STORAGE_KEY);
    }
    // Return a deep copy of initialData to prevent mutation of the original object
    return JSON.parse(JSON.stringify(initialData));
};

function appReducer(state, action) {
    const getCoords = (locName, currentState) => {
        return currentState.customLocationCoordinates[locName] || locationCoordinates[locName];
    };

    switch (action.type) {
        case 'SET_STATE':
            return action.payload;
        case 'RESET_STATE':
            return JSON.parse(JSON.stringify(initialData));
        case 'ADD_CAB': {
            const cabData = action.payload;
            const newLocation = getCoords(cabData.from, state) || getCoords('Gangtok', state);
            const newDestination = getCoords(cabData.to, state) || getCoords('Gangtok', state);
            const newCab = { ...cabData, id: Date.now(), location: newLocation, destination: newDestination };
            return { ...state, cabs: [...state.cabs, newCab] };
        }
        case 'UPDATE_CAB': {
            const updatedCab = action.payload;
            return {
                ...state,
                cabs: state.cabs.map(c => {
                    if (c.id === updatedCab.id) {
                        const newCab = { ...c, ...updatedCab };
                        const newLocation = getCoords(updatedCab.from, state);
                        const newDestination = getCoords(updatedCab.to, state);
                        if (newLocation) newCab.location = newLocation;
                        if (newDestination) newCab.destination = newDestination;
                        return newCab;
                    }
                    return c;
                })
            };
        }
        case 'DELETE_CAB':
            return { ...state, cabs: state.cabs.filter(c => c.id !== action.payload) };
        case 'ADD_DRIVER':
            return { ...state, drivers: [...state.drivers, { ...action.payload, id: Date.now(), role: 'driver' }] };
        case 'UPDATE_DRIVER': {
            const updatedDriver = action.payload;
            return { ...state, drivers: state.drivers.map(d => d.id === updatedDriver.id ? { ...d, name: updatedDriver.name, phone: updatedDriver.phone, username: updatedDriver.username, password: updatedDriver.password || d.password } : d)};
        }
        case 'DELETE_DRIVER': {
            const driverId = action.payload;
            const newCabs = state.cabs.map(c => c.driverId === driverId ? { ...c, driverId: null } : c);
            const newDrivers = state.drivers.filter(d => d.id !== driverId);
            return { ...state, drivers: newDrivers, cabs: newCabs };
        }
        case 'ADD_LOCATION': {
            const { name, lat, lon } = action.payload;
             if (!name || lat === '' || lon === '') {
                alert("Location name, latitude, and longitude are required.");
                return state;
            }
            if (state.locations.includes(name)) {
                alert(`Location "${name}" already exists.`);
                return state;
            }
            const newCustomCoords = {
                ...state.customLocationCoordinates,
                [name]: [parseFloat(lat), parseFloat(lon)]
            };
            return { ...state, locations: [...state.locations, name].sort(), customLocationCoordinates: newCustomCoords };
        }
        case 'DELETE_LOCATION': {
            const loc = action.payload;
            const newPoints = { ...state.pickupPoints };
            delete newPoints[loc];
            const newCustomCoords = { ...state.customLocationCoordinates };
            delete newCustomCoords[loc];
            return { ...state, locations: state.locations.filter(l => l !== loc), pickupPoints: newPoints, customLocationCoordinates: newCustomCoords };
        }
        case 'UPDATE_LOCATION': {
            const { oldName, newName, lat, lon } = action.payload;
            if (!newName || lat === '' || lon === '') {
                alert("Location name, latitude, and longitude are required.");
                return state;
            }
            if (oldName !== newName && state.locations.includes(newName)) {
                 alert(`Error: Location "${newName}" already exists.`);
                 return state;
            }

            let newState = { ...state };
            
            // Update coordinates
            const newCustomCoords = { ...state.customLocationCoordinates };
            delete newCustomCoords[oldName]; // Remove old entry if it was custom
            newCustomCoords[newName] = [parseFloat(lat), parseFloat(lon)];
            newState.customLocationCoordinates = newCustomCoords;

            // Update locations list, points, cabs, trips if name changed
            if (oldName !== newName) {
                newState.locations = state.locations.map(l => l === oldName ? newName : l).sort();
                
                const newPickupPoints = { ...state.pickupPoints };
                if (newPickupPoints[oldName]) {
                    newPickupPoints[newName] = newPickupPoints[oldName];
                    delete newPickupPoints[oldName];
                }
                newState.pickupPoints = newPickupPoints;

                const allNewCoords = { ...locationCoordinates, ...newState.customLocationCoordinates };

                newState.cabs = state.cabs.map(cab => {
                    const newCab = { ...cab };
                    let needsUpdate = false;
                    if (cab.from === oldName) {
                        newCab.from = newName;
                        if(allNewCoords[newName]) newCab.location = allNewCoords[newName];
                        needsUpdate = true;
                    }
                    if (cab.to === oldName) {
                        newCab.to = newName;
                        if(allNewCoords[newName]) newCab.destination = allNewCoords[newName];
                        needsUpdate = true;
                    }
                    return needsUpdate ? newCab : cab;
                });

                newState.trips = state.trips.map(trip => {
                    if (trip.booking.from === oldName || trip.booking.to === oldName) {
                        const newTrip = JSON.parse(JSON.stringify(trip));
                        if (newTrip.booking.from === oldName) newTrip.booking.from = newName;
                        if (newTrip.booking.to === oldName) newTrip.booking.to = newName;
                        
                        let carUpdated = false;
                        if (newTrip.car.from === oldName) {
                            newTrip.car.from = newName;
                            if(allNewCoords[newName]) newTrip.car.location = allNewCoords[newName];
                            carUpdated = true;
                        }
                        if (newTrip.car.to === oldName) {
                             newTrip.car.to = newName;
                            if(allNewCoords[newName]) newTrip.car.destination = allNewCoords[newName];
                            carUpdated = true;
                        }
                        if(carUpdated) {
                            // Also update the main cab entry
                            newState.cabs = newState.cabs.map(c => c.id === newTrip.car.id ? newTrip.car : c);
                        }
                        return newTrip;
                    }
                    return trip;
                });
            }
            return newState;
        }
        case 'ADD_POINT': {
            const { loc, point } = action.payload;
            return { ...state, pickupPoints: { ...state.pickupPoints, [loc]: [...(state.pickupPoints[loc] || []), point] } };
        }
        case 'DELETE_POINT': {
            const { loc, point } = action.payload;
            return { ...state, pickupPoints: { ...state.pickupPoints, [loc]: state.pickupPoints[loc].filter(p => p !== point) } };
        }
        case 'ADD_CUSTOMER':
            return { ...state, customers: [...state.customers, { ...action.payload, id: Date.now() }] };
        case 'ADD_TRIP':
            return { ...state, trips: [action.payload, ...state.trips] };
        default:
            return state;
    }
}

const App = () => {
    const [state, dispatch] = useReducer(appReducer, undefined, getInitialState);
    const [view, setView] = useState('chooser');
    const [auth, setAuth] = useState({ user: null, role: null });
    const [loginError, setLoginError] = useState('');

    // --- PERSISTENCE & CROSS-TAB SYNC ---
    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }, [state]);

    useEffect(() => {
        const handleStorageChange = (event) => {
            if (event.key === STORAGE_KEY && event.newValue) {
                try {
                    const newState = JSON.parse(event.newValue);
                    dispatch({ type: 'SET_STATE', payload: newState });
                } catch (e) {
                    console.error("Failed to parse state from localStorage:", e);
                }
            }
        };
        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, []);
    
    // --- DATA API LAYER ---
    const dataApi = useMemo(() => {
        const currentState = state;
        return {
            customer: {
                getData: () => {
                    const locations = currentState.locations;
                    const availableCars = currentState.cabs.map(car => ({
                        ...car,
                        driverName: currentState.drivers.find(d => d.id === car.driverId)?.name || 'N/A'
                    }));
                    return {
                        locations,
                        pickupPoints: currentState.pickupPoints,
                        availableCars,
                        trips: currentState.trips,
                        customers: currentState.customers
                    };
                },
                getCarById: (id) => currentState.cabs.find(c => c.id === id),
                signUp: (details) => dispatch({ type: 'ADD_CUSTOMER', payload: details }),
                bookTrip: (trip) => dispatch({ type: 'ADD_TRIP', payload: trip }),
            },
            admin: {
                getData: (auth) => {
                    const allCabs = currentState.cabs.map(car => ({
                        ...car,
                        driverName: currentState.drivers.find(d => d.id === car.driverId)?.name || 'N/A'
                    }));

                    const allTrips = currentState.trips;
                    
                    const cabs = allCabs;
                    const trips = allTrips;

                    const totalSystemSeats = allCabs.reduce((sum, cab) => sum + cab.totalSeats, 0);
                    const totalBookedSeats = allTrips.reduce((sum, trip) => sum + (trip.details?.seats?.length || 0), 0);
                    const totalRevenue = allTrips.reduce((sum, trip) => sum + (Number(trip.car.price || 0) * (trip.details?.seats?.length || 0)), 0);

                    return {
                        cabs,
                        trips,
                        drivers: currentState.drivers,
                        locations: currentState.locations,
                        pickupPoints: currentState.pickupPoints,
                        admins: currentState.admins,
                        allCabs,
                        allDrivers: currentState.drivers,
                        allTrips,
                        allLocationCoordinates: { ...locationCoordinates, ...currentState.customLocationCoordinates },
                        stats: {
                            totalTrips: allTrips.length,
                            totalRevenue,
                            totalBookedSeats,
                            totalSystemSeats,
                            totalCabs: allCabs.length,
                            totalDrivers: currentState.drivers.length,
                        }
                    };
                },
                addCab: (cabData) => dispatch({ type: 'ADD_CAB', payload: cabData }),
                updateCab: (cabData) => dispatch({ type: 'UPDATE_CAB', payload: cabData }),
                deleteCab: (id) => dispatch({ type: 'DELETE_CAB', payload: id }),
                addDriver: (driverData) => dispatch({ type: 'ADD_DRIVER', payload: driverData }),
                updateDriver: (driverData) => dispatch({ type: 'UPDATE_DRIVER', payload: driverData }),
                deleteDriver: (id) => dispatch({ type: 'DELETE_DRIVER', payload: id }),
                addLocation: (data) => dispatch({ type: 'ADD_LOCATION', payload: data }),
                deleteLocation: (name) => dispatch({ type: 'DELETE_LOCATION', payload: name }),
                updateLocation: (data) => dispatch({ type: 'UPDATE_LOCATION', payload: data }),
                addPoint: (loc, point) => dispatch({ type: 'ADD_POINT', payload: { loc, point } }),
                deletePoint: (loc, point) => dispatch({ type: 'DELETE_POINT', payload: { loc, point } }),
                resetData: () => dispatch({ type: 'RESET_STATE' }),
            },
            driver: {
                getData: (driver) => {
                    const assignedCab = currentState.cabs.find(c => c.driverId === driver.id);
                    const trips = assignedCab ? currentState.trips.filter(t => t.car.id === assignedCab.id) : [];
                    return { trips };
                }
            }
        };
    }, [state]);

    // --- AUTH LOGIC ---
    const handleLogin = ({ username, password }) => {
        setLoginError('');
        const dataSource = view === 'driver' ? state.drivers : state.admins;
        const user = dataSource.find(u => u.username === username && u.password === password);

        if (user && user.role === view) {
            setAuth({ user, role: view });
        } else {
            setLoginError('Invalid username or password.');
        }
    };

    const handleLogout = () => {
        setAuth({ user: null, role: null });
        setView('chooser');
        setLoginError('');
    };

    const handleBackToChooser = () => {
        setView('chooser');
        setLoginError('');
    };

    // --- RENDER LOGIC ---
    if (auth.user) {
        switch (auth.role) {
            case 'superadmin':
                return <AdminPanel onLogout={handleLogout} auth={auth} dataApi={dataApi} />;
            case 'driver':
                return <DriverApp onLogout={handleLogout} driver={auth.user} dataApi={dataApi} />;
            default:
                handleLogout(); // Should not happen
                return null;
        }
    }

    switch (view) {
        case 'customer':
            return <CustomerApp dataApi={dataApi} onExit={handleBackToChooser}/>;
        case 'superadmin':
        case 'driver':
            return <AppLoginPage role={view} onLogin={handleLogin} onBack={handleBackToChooser} error={loginError} />;
        case 'chooser':
        default:
            return <ChooserPage setView={setView} />;
    }
};

export default App;