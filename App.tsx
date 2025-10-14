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
const EmailIcon = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
        <polyline points="22,6 12,13 2,6"></polyline>
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
const TargetIcon = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <circle cx="12" cy="12" r="10"></circle>
        <circle cx="12" cy="12" r="6"></circle>
        <circle cx="12" cy="12" r="2"></circle>
    </svg>
);
const CheckCircleIcon = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
        <polyline points="22 4 12 14.01 9 11.01"></polyline>
    </svg>
);


// --- UI HELPERS ---
const Logo = ({ className = '' }) => (
    <div className={`inline-flex items-center bg-yellow-400 p-1 border-2 border-black ${className}`}>
      <span className="text-3xl font-bold tracking-tighter text-black pr-2">sajilo</span>
      <div className="flex flex-col items-center justify-center bg-gray-200/80 px-1 py-0.5 rounded-sm">
        <TaxiIcon className="h-6 w-6 text-black"/>
        <span className="text-[0.6rem] font-bold text-black tracking-widest -mt-1">TAXI</span>
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
                headers: { 'Content-Type': 'application/json' },
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
        <div className="space-y-2 pb-4 mb-4 border-b border-black/20">
            <label className="block text-sm font-bold text-black">Plan with AI</label>
            <div className="flex gap-2">
                <input
                    type="text"
                    value={prompt}
                    onChange={e => setPrompt(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handlePlanTrip()}
                    placeholder="e.g., Gangtok to Pelling for 2 people tomorrow"
                    className="flex-grow w-full px-3 py-2 bg-white text-black border-2 border-black/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent font-semibold"
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
            {error && <p className="text-red-600 text-sm font-semibold mt-1">{error}</p>}
        </div>
    );
};


const BookingPage = ({ locations, availableCars, onBook, trips, onNavigateToAbout }) => {
    const [bookingCriteria, setBookingCriteria] = useState(() => {
        const initialRoute = { from: 'Kalimpong', to: 'Gangtok' };
        if (availableCars && availableCars.length > 0) {
            const firstValidCar = availableCars.find(c => locations.includes(c.from) && locations.includes(c.to));
            if (firstValidCar) {
                initialRoute.from = firstValidCar.from;
                initialRoute.to = firstValidCar.to;
            }
        } else {
            if (!locations.includes(initialRoute.from) && locations.length > 0) initialRoute.from = locations[0];
            if (!locations.includes(initialRoute.to) && locations.length > 1) initialRoute.to = locations.find(l => l !== initialRoute.from) || locations[1];
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
        if (plan.from && locations.includes(plan.from)) updates.from = plan.from;
        if (plan.to && locations.includes(plan.to)) updates.to = plan.to;
        const today = new Date(); today.setHours(0,0,0,0);
        const planDate = new Date(plan.date);
        if (plan.date && /^\d{4}-\d{2}-\d{2}$/.test(plan.date) && planDate >= today) updates.date = plan.date;
        if (plan.seats && typeof plan.seats === 'number' && plan.seats > 0 && plan.seats <= 10) updates.seats = plan.seats;
        if (Object.keys(updates).length > 0) setBookingCriteria(c => ({...c, ...updates}));
    };

    const filteredCars = useMemo(() => {
        return availableCars
            .map(car => {
                const tripsForThisCarOnThisDate = trips.filter(t => t.car.id === car.id && t.booking.date === date);
                const seatsAlreadyBooked = tripsForThisCarOnThisDate.reduce((sum, t) => sum + (t.details?.seats?.length || 0), 0);
                const availableSeats = car.totalSeats - seatsAlreadyBooked;
                return { ...car, availableSeats };
            })
            .filter(car => car.from === from && car.to === to && car.availableSeats >= seats);
    }, [availableCars, from, to, seats, date, trips]);
    
    const bookingDetailsForCar = { from, to, date, seats };

    return (
        <div className="min-h-screen flex flex-col bg-gray-100">
            <header className="bg-yellow-400 p-4 border-b-2 border-black sticky top-0 z-20 flex justify-between items-center">
                <Logo />
                <button 
                    onClick={onNavigateToAbout} 
                    className="font-bold text-black hover:bg-black/10 transition-colors px-4 py-2 rounded-lg"
                >
                    About Us
                </button>
            </header>
            
            <div className="flex-grow w-full max-w-7xl mx-auto p-4 lg:p-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-1">
                        <div className="bg-yellow-400 border-2 border-black rounded-xl p-6 sticky top-24">
                            <h2 className="text-2xl font-bold text-black mb-4">Book Your Ride</h2>
                            <GeminiTripPlanner locations={locations} onPlanGenerated={handlePlanGenerated} />
                            <form className="space-y-4">
                                <div>
                                    <label htmlFor="from" className="block text-sm font-bold text-black mb-1">From</label>
                                    <select id="from" value={from} onChange={e => setFrom(e.target.value)} className="block w-full px-3 py-3 bg-white text-black border-2 border-black/80 rounded-lg focus:outline-none focus:ring-2 focus:ring-black font-semibold">
                                        {locations.map(location => <option key={location} value={location}>{location}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label htmlFor="to" className="block text-sm font-bold text-black mb-1">To</label>
                                    <select id="to" value={to} onChange={e => setTo(e.target.value)} className="block w-full px-3 py-3 bg-white text-black border-2 border-black/80 rounded-lg focus:outline-none focus:ring-2 focus:ring-black font-semibold">
                                        {locations.map(location => <option key={location} value={location}>{location}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label htmlFor="date" className="block text-sm font-bold text-black mb-1">Date</label>
                                    <input type="date" id="date" value={date} min={new Date().toISOString().split('T')[0]} onChange={(e) => setDate(e.target.value)}
                                        className="block w-full px-3 py-3 bg-white text-black border-2 border-black/80 rounded-lg focus:outline-none focus:ring-2 focus:ring-black font-semibold" />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-black mb-1">Seats</label>
                                    <div className="flex items-center justify-between bg-white border-2 border-black/80 rounded-lg p-1">
                                        <button type="button" onClick={() => handleSeatChange(-1)} className="p-2 text-black hover:bg-gray-200 rounded-md" aria-label="Decrease seats"><MinusIcon /></button>
                                        <span className="font-bold text-xl text-black">{seats}</span>
                                        <button type="button" onClick={() => handleSeatChange(1)} className="p-2 text-black hover:bg-gray-200 rounded-md" aria-label="Increase seats"><PlusIcon /></button>
                                    </div>
                                </div>
                            </form>
                        </div>
                    </div>
                    
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
                                            <div className="flex items-center gap-2 font-semibold text-green-700">
                                                <SeatIcon className="h-5 w-5"/>
                                                <span>{car.availableSeats} / {car.totalSeats} Seats Available</span>
                                            </div>
                                            <button onClick={() => onBook(car, bookingDetailsForCar)} className="bg-black text-yellow-400 font-bold py-2 px-6 rounded-lg border-2 border-black hover:bg-gray-800 transition-colors">
                                                Select Seats
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="bg-white border-2 border-black rounded-xl p-8 text-center">
                                <p className="font-bold text-black">No scheduled cabs found.</p>
                                <p className="text-gray-600">Please try adjusting your route, date, or number of seats.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            <footer className="w-full max-w-7xl mx-auto text-black py-6 px-4 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center md:text-left bg-white border-2 border-black rounded-xl p-6">
                    <div>
                        <h3 className="font-bold text-lg mb-2">Our Office</h3>
                        <address className="not-italic leading-relaxed text-gray-700">
                            Jila Parishad Road, Pradhan Para, East Salugara,<br/> 
                            Pincode: 734001<br/>
                            Infront of Sanskriti Building
                        </address>
                    </div>
                    <div>
                        <h3 className="font-bold text-lg mb-2">Contact Us</h3>
                        <div className="space-y-2">
                            <a href="tel:+917478356030" className="flex items-center justify-center md:justify-start gap-2 hover:underline text-gray-700">
                                <PhoneIcon className="h-5 w-5 flex-shrink-0"/>
                                <span>+91 7478356030 / +91 9735054817</span>
                            </a>
                            <a href="mailto:sajilotaxi@gmail.com" className="flex items-center justify-center md:justify-start gap-2 hover:underline text-gray-700">
                                <EmailIcon className="h-5 w-5 flex-shrink-0"/>
                                <span>sajilotaxi@gmail.com</span>
                            </a>
                        </div>
                    </div>
                     <div>
                        <h3 className="font-bold text-lg mb-2">Company</h3>
                        <div className="space-y-2">
                            <button onClick={onNavigateToAbout} className="hover:underline text-gray-700 text-left w-full text-center md:text-left">
                                About Us
                            </button>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
};

const getSeatLayout = (totalSeats) => {
    switch (totalSeats) {
        case 4: return [['F1'], ['M1', 'M2', 'M3']];
        case 7: return [['F1'], ['M1', 'M2', 'M3'], ['B1', 'B2', 'B3']];
        case 10: return [['F1', 'F2'], ['M1', 'M2', 'M3', 'M4'], ['B1', 'B2', 'B3', 'B4']];
        default: return [['F1'], ['M1', 'M2', 'M3']]; 
    }
};

const SeatSelectionPage = ({ car, bookingDetails, pickupPoints, onConfirm, onBack, trips }) => {
    const [selectedSeats, setSelectedSeats] = useState([]);
    const [selectedPickup, setSelectedPickup] = useState('');
    const [selectedDrop, setSelectedDrop] = useState('');

    const bookedSeats = useMemo(() => {
        if (!trips) return [];
        const tripsForThisCarOnThisDate = trips.filter(t => t.car.id === car.id && t.booking.date === bookingDetails.date);
        return tripsForThisCarOnThisDate.flatMap(t => t.details.seats);
    }, [trips, car.id, bookingDetails.date]);

    const layout = getSeatLayout(car.totalSeats);
    const seatsToSelect = bookingDetails.seats;
    const pickupOptions = getPointsForLocation(bookingDetails.from, pickupPoints);
    const dropOptions = getPointsForLocation(bookingDetails.to, pickupPoints);

    useEffect(() => { if (pickupOptions.length > 0) setSelectedPickup(pickupOptions[0]); }, [bookingDetails.from, pickupOptions]);
    useEffect(() => { if (dropOptions.length > 0) setSelectedDrop(dropOptions[0]); }, [bookingDetails.to, dropOptions]);

    const handleSeatClick = (seatId) => {
        if (bookedSeats.includes(seatId)) return;
        setSelectedSeats(current => {
            if (current.includes(seatId)) return current.filter(s => s !== seatId);
            if (current.length < seatsToSelect) return [...current, seatId];
            return [ ...current.slice(1), seatId ]; // Replace the oldest selection
        });
    };
    
    const canConfirm = selectedSeats.length === seatsToSelect && selectedPickup && selectedDrop;

    return (
        <div className="min-h-screen flex flex-col bg-gray-100">
            <header className="bg-yellow-400 p-4 border-b-2 border-black sticky top-0 z-10 flex items-center">
                <button onClick={onBack} className="p-2 rounded-full hover:bg-black/10 transition-colors" aria-label="Go back"><BackArrowIcon className="h-6 w-6 text-black"/></button>
                <div className="flex-grow text-center"><Logo /></div><div className="w-10"></div>
            </header>
            <main className="flex-grow p-4 flex flex-col items-center">
                 <div className="bg-white w-full max-w-md mx-auto p-6 rounded-2xl border-2 border-black shadow-lg">
                    <h2 className="text-2xl font-bold text-black text-center">Select Your Seats</h2>
                    <p className="text-black font-semibold mb-6 text-center">Please select {seatsToSelect} seat(s). ({selectedSeats.length}/{seatsToSelect} selected)</p>

                    <div className="w-full max-w-xs mx-auto border-2 border-black/50 rounded-lg p-4 bg-gray-100">
                        <div className="flex justify-end pr-4 mb-4"><div className="flex flex-col items-center"><SteeringWheelIcon className="h-8 w-8 text-black/50" /><span className="text-xs font-bold text-black/50">DRIVER</span></div></div>
                        <div className="space-y-4">
                            {layout.map((row, rowIndex) => (
                                <div key={rowIndex} className="flex justify-around">
                                    {row.map(seatId => {
                                        const isSelected = selectedSeats.includes(seatId);
                                        const isBooked = bookedSeats.includes(seatId);
                                        return (
                                            <button key={seatId} onClick={() => handleSeatClick(seatId)} disabled={isBooked} aria-label={isBooked ? `${seatId} (Booked)` : `Select seat ${seatId}`}
                                                className={`p-2 rounded-lg transition-all transform hover:scale-110 ${ isBooked ? 'bg-gray-300 cursor-not-allowed' : isSelected ? 'bg-black' : 'bg-white border-2 border-black hover:bg-gray-200'}`}>
                                                <SeatIcon className={`h-8 w-8 ${ isBooked ? 'text-gray-500' : isSelected ? 'text-yellow-400' : 'text-black'}`} />
                                            </button>
                                        );
                                    })}
                                </div>
                            ))}
                        </div>
                    </div>

                     <div className="w-full mt-8 space-y-4">
                        <div>
                            <label htmlFor="pickup-point" className="block text-sm font-bold text-black mb-1">Select Pickup Point</label>
                            <select id="pickup-point" value={selectedPickup} onChange={e => setSelectedPickup(e.target.value)} className="block w-full px-3 py-3 bg-white text-black border-2 border-black/80 rounded-lg focus:outline-none focus:ring-2 focus:ring-black font-semibold">
                                {pickupOptions.map(point => <option key={point} value={point}>{point}</option>)}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="drop-point" className="block text-sm font-bold text-black mb-1">Select Drop Point</label>
                            <select id="drop-point" value={selectedDrop} onChange={e => setSelectedDrop(e.target.value)} className="block w-full px-3 py-3 bg-white text-black border-2 border-black/80 rounded-lg focus:outline-none focus:ring-2 focus:ring-black font-semibold">
                                {dropOptions.map(point => <option key={point} value={point}>{point}</option>)}
                            </select>
                        </div>
                    </div>
                </div>
            </main>
             <footer className="p-4 sticky bottom-0 bg-gray-100/80 backdrop-blur-sm">
                <div className="max-w-md mx-auto">
                    <button onClick={() => onConfirm({ seats: selectedSeats, pickup: selectedPickup, drop: selectedDrop })} disabled={!canConfirm} className="w-full bg-yellow-400 text-black font-bold py-3 px-4 rounded-xl border-2 border-black hover:bg-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-300">
                        Continue
                    </button>
                </div>
            </footer>
        </div>
    );
};

const CustomerLoginPage = ({ onSignIn, onCreateAccount, onBack, message, error }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const canSignIn = email.trim() && password.trim();

    return (
        <div className="min-h-screen flex flex-col bg-gray-100">
            <header className="bg-yellow-400 p-4 border-b-2 border-black sticky top-0 z-10 flex items-center">
                <button onClick={onBack} className="p-2 rounded-full hover:bg-black/10 transition-colors" aria-label="Go back"><BackArrowIcon className="h-6 w-6 text-black"/></button>
                <div className="flex-grow text-center"><Logo /></div><div className="w-10"></div>
            </header>
            <main className="flex-grow p-4 flex flex-col items-center justify-center">
                <div className="w-full max-w-sm mx-auto bg-white p-8 rounded-2xl border-2 border-black shadow-lg">
                    <h2 className="text-3xl font-bold text-black text-center">Sign In</h2>
                    {message && <p className="text-center font-semibold text-green-700 bg-green-100 border border-green-700 rounded-lg p-2 my-4">{message}</p>}
                    {error && <p className="text-center font-semibold text-red-700 bg-red-100 border border-red-700 rounded-lg p-2 my-4">{error}</p>}
                    <form onSubmit={(e) => { e.preventDefault(); onSignIn({ email, password }); }} className="space-y-4 mt-6">
                        <div>
                            <label className="block text-sm font-bold text-black mb-1">Email or Phone</label>
                            <input type="text" value={email} onChange={e => setEmail(e.target.value)} required className="block w-full px-3 py-3 bg-white text-black border-2 border-black/80 rounded-lg focus:outline-none focus:ring-2 focus:ring-black font-semibold" placeholder="Enter your email or phone" />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-black mb-1">Password</label>
                            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required className="block w-full px-3 py-3 bg-white text-black border-2 border-black/80 rounded-lg focus:outline-none focus:ring-2 focus:ring-black font-semibold" placeholder="Enter your password" />
                        </div>
                        <button type="submit" disabled={!canSignIn} className="w-full !mt-6 bg-yellow-400 text-black font-bold py-3 px-4 rounded-xl border-2 border-black hover:bg-yellow-500 disabled:opacity-50">Sign In</button>
                    </form>
                    <div className="text-center mt-6">
                        <p className="text-black">Don't have an account? <button onClick={onCreateAccount} className="font-bold text-black hover:underline">Create Account</button></p>
                    </div>
                </div>
            </main>
        </div>
    );
};

const CustomerSignUpPage = ({ onSignUp, onBack }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const canSignUp = email.trim() && password.trim() && name.trim() && phone.trim();

    return (
        <div className="min-h-screen flex flex-col bg-gray-100">
            <header className="bg-yellow-400 p-4 border-b-2 border-black sticky top-0 z-10 flex items-center">
                <button onClick={onBack} className="p-2 rounded-full hover:bg-black/10 transition-colors"><BackArrowIcon className="h-6 w-6 text-black"/></button>
                <div className="flex-grow text-center"><Logo /></div><div className="w-10"></div>
            </header>
            <main className="flex-grow p-4 flex flex-col items-center justify-center">
                <div className="w-full max-w-sm mx-auto bg-white p-8 rounded-2xl border-2 border-black shadow-lg">
                    <h2 className="text-3xl font-bold text-black text-center">Create Account</h2>
                    <form onSubmit={(e) => { e.preventDefault(); onSignUp({ email, password, name, phone }); }} className="space-y-4 mt-6">
                        <input type="text" value={name} onChange={e => setName(e.target.value)} required className="block w-full px-3 py-3 bg-white text-black border-2 border-black/80 rounded-lg font-semibold" placeholder="Full Name" />
                        <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} required className="block w-full px-3 py-3 bg-white text-black border-2 border-black/80 rounded-lg font-semibold" placeholder="Phone Number" />
                        <input type="email" value={email} onChange={e => setEmail(e.target.value)} required className="block w-full px-3 py-3 bg-white text-black border-2 border-black/80 rounded-lg font-semibold" placeholder="Email Address" />
                        <input type="password" value={password} onChange={e => setPassword(e.target.value)} required className="block w-full px-3 py-3 bg-white text-black border-2 border-black/80 rounded-lg font-semibold" placeholder="Password" />
                        <button type="submit" disabled={!canSignUp} className="w-full !mt-6 bg-yellow-400 text-black font-bold py-3 px-4 rounded-xl border-2 border-black hover:bg-yellow-500 disabled:opacity-50">Create Account</button>
                    </form>
                </div>
            </main>
        </div>
    );
};

const PaymentPage = ({ car, bookingDetails, onConfirm, onBack }) => {
    const totalPrice = (car.price || 0) * (bookingDetails?.seats || 1);

    return (
        <div className="min-h-screen flex flex-col bg-gray-100">
            <header className="bg-yellow-400 p-4 border-b-2 border-black sticky top-0 z-10 flex items-center">
                <button onClick={onBack} className="p-2 rounded-full hover:bg-black/10 transition-colors"><BackArrowIcon className="h-6 w-6 text-black"/></button>
                <div className="flex-grow text-center"><Logo /></div><div className="w-10"></div>
            </header>
            <main className="flex-grow p-4 flex flex-col items-center justify-center text-center">
                <div className="w-full max-w-sm mx-auto bg-white p-8 rounded-2xl border-2 border-black shadow-lg">
                    <h2 className="text-2xl font-bold text-black">Complete Your Payment</h2>
                    <div className="bg-yellow-400 border-2 border-black rounded-lg p-4 my-6">
                        <p className="text-black/80 text-lg">Total Amount</p>
                        <p className="text-4xl font-bold text-black">₹{totalPrice.toLocaleString()}</p>
                    </div>
                    <div className="space-y-3">
                        <button onClick={onConfirm} className="w-full bg-black text-yellow-400 font-bold py-3 px-4 rounded-lg border-2 border-black hover:bg-gray-800 flex items-center justify-center gap-3"><WalletIcon className="h-6 w-6"/><span>Pay on Arrival</span></button>
                        <button onClick={onConfirm} className="w-full bg-white text-black font-bold py-3 px-4 rounded-lg border-2 border-black hover:bg-gray-200 flex items-center justify-center gap-3"><CreditCardIcon className="h-6 w-6"/><span>Pay with Card</span></button>
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
                <button onClick={onBack} className="p-2 rounded-full hover:bg-black/10 transition-colors"><BackArrowIcon className="h-6 w-6 text-black"/></button>
                <div className="flex-grow text-center"><Logo /></div><div className="w-10"></div>
            </header>
            <div className="flex-grow relative">
                <MapContainer center={position} zoom={13} scrollWheelZoom={false} className="absolute inset-0">
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    <Marker position={position}><Popup>{trip.details.pickup}</Popup></Marker>
                    <Marker position={destination}><Popup>{trip.details.drop}</Popup></Marker>
                    <Polyline pathOptions={{ color: 'black', weight: 4 }} positions={route} />
                </MapContainer>
                <div className="absolute bottom-0 left-0 right-0 p-4 z-10">
                     <div className="bg-white border-2 border-black rounded-2xl p-4 flex items-center gap-4 max-w-md mx-auto shadow-lg">
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

const AboutUsPage = ({ onBack }) => (
    <div className="min-h-screen flex flex-col bg-gray-100">
        <header className="bg-yellow-400 p-4 border-b-2 border-black sticky top-0 z-10 flex items-center">
            <button onClick={onBack} className="p-2 rounded-full hover:bg-black/10 transition-colors" aria-label="Go back"><BackArrowIcon className="h-6 w-6 text-black"/></button>
            <div className="flex-grow text-center"><Logo /></div><div className="w-10"></div>
        </header>
        <main className="flex-grow p-4 lg:p-8">
            <div className="max-w-4xl mx-auto bg-white p-6 sm:p-8 rounded-2xl border-2 border-black shadow-lg">
                <h1 className="text-3xl sm:text-4xl font-bold text-black text-center mb-6">About Sajilo Taxi</h1>
                
                <p className="text-lg text-gray-700 mb-8 text-center leading-relaxed">
                    Your trusted partner for exploring the breathtaking landscapes of Sikkim, Darjeeling, Kalimpong, and Bhutan. We are a Sikkim-based transport company dedicated to making your travel simple, safe, and memorable.
                </p>

                <div className="space-y-8">
                    <div>
                        <h2 className="text-2xl font-bold text-black flex items-center gap-3 mb-3">
                            <TargetIcon className="h-7 w-7 text-yellow-500"/>
                            Our Mission
                        </h2>
                        <p className="text-gray-700 leading-relaxed">
                            To provide a seamless, reliable, and affordable taxi booking experience for both locals and tourists. We aim to connect destinations with a service that prioritizes customer satisfaction, safety, and punctuality.
                        </p>
                    </div>
                    
                    <div>
                        <h2 className="text-2xl font-bold text-black flex items-center gap-3 mb-3">
                            <CheckCircleIcon className="h-7 w-7 text-green-600"/>
                            Why Choose Us?
                        </h2>
                        <ul className="list-none space-y-3 text-gray-700 leading-relaxed">
                            <li className="flex items-start gap-3"><CheckCircleIcon className="h-6 w-6 text-green-600 flex-shrink-0 mt-1" /><span><strong>AI-Powered Planning:</strong> Use natural language to plan your trip instantly with our smart booking assistant.</span></li>
                            <li className="flex items-start gap-3"><CheckCircleIcon className="h-6 w-6 text-green-600 flex-shrink-0 mt-1" /><span><strong>Wide Coverage:</strong> We serve an extensive network of popular and remote destinations across the region.</span></li>
                            <li className="flex items-start gap-3"><CheckCircleIcon className="h-6 w-6 text-green-600 flex-shrink-0 mt-1" /><span><strong>Professional Drivers:</strong> Our drivers are experienced, licensed, and knowledgeable about local routes and conditions.</span></li>
                            <li className="flex items-start gap-3"><CheckCircleIcon className="h-6 w-6 text-green-600 flex-shrink-0 mt-1" /><span><strong>Transparent Pricing:</strong> No hidden fees. See the price per seat before you book.</span></li>
                            <li className="flex items-start gap-3"><CheckCircleIcon className="h-6 w-6 text-green-600 flex-shrink-0 mt-1" /><span><strong>Real-Time Tracking:</strong> Track your cab's location live for peace of mind.</span></li>
                            <li className="flex items-start gap-3"><CheckCircleIcon className="h-6 w-6 text-green-600 flex-shrink-0 mt-1" /><span><strong>Flexible Options:</strong> From shared cabs to private vehicles, we have a solution for every travel need.</span></li>
                        </ul>
                    </div>
                </div>
            </div>
        </main>
    </div>
);


const CustomerApp = ({ dataApi }) => {
    const [page, setPage] = useState('booking'); // booking, seatSelection, login, signup, payment, tracking, about
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
        if (loggedInUser) {
            setPage('payment');
        } else {
            setPage('login');
        }
    };
    
    const handleSignInSuccess = (credentials) => {
        setLoginError('');
        const { email, password } = credentials;
        const foundCustomer = customers.find(c => (c.email === email || c.phone === email) && c.password === password);
        if(foundCustomer) {
            setLoggedInUser(foundCustomer);
            setPage('payment');
            setLoginMessage('');
        } else {
            setLoginError('Invalid credentials. Please try again.');
        }
    };

    const handleSignUpSuccess = (userDetails) => {
        dataApi.customer.signUp(userDetails);
        setLoginMessage('Account created! Please sign in.');
        setPage('login');
    };

    const handlePaymentConfirm = () => {
        const freshCarData = dataApi.customer.getCarById(selectedCar.id) || selectedCar;
        const trip = {
            id: Date.now(),
            customer: loggedInUser || { name: 'Guest', phone: 'N/A' },
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
        case 'booking': return <BookingPage locations={locations} availableCars={availableCars} onBook={handleBookCar} trips={trips} onNavigateToAbout={() => setPage('about')} />;
        case 'seatSelection': return <SeatSelectionPage car={selectedCar} bookingDetails={bookingDetails} pickupPoints={pickupPoints} onConfirm={handleSeatConfirm} onBack={() => setPage('booking')} trips={trips} />;
        case 'login': return <CustomerLoginPage onSignIn={handleSignInSuccess} onCreateAccount={() => setPage('signup')} onBack={() => setPage(finalBookingDetails ? 'seatSelection' : 'booking')} message={loginMessage} error={loginError} />;
        case 'signup': return <CustomerSignUpPage onSignUp={handleSignUpSuccess} onBack={() => setPage('login')} />;
        case 'payment': return <PaymentPage car={selectedCar} bookingDetails={{...bookingDetails, ...finalBookingDetails}} onConfirm={handlePaymentConfirm} onBack={() => setPage('seatSelection')} />;
        case 'tracking': return <TripTrackingPage car={selectedCar} trip={{ details: finalBookingDetails }} onBack={resetBooking} />;
        case 'about': return <AboutUsPage onBack={() => setPage('booking')} />;
        default: return <BookingPage locations={locations} availableCars={availableCars} onBook={handleBookCar} trips={trips} onNavigateToAbout={() => setPage('about')} />;
    }
};

// --- ADMIN PANEL COMPONENTS ---
const Modal = ({ isOpen, onClose, title, children }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-md rounded-lg border-2 border-black shadow-lg">
                <header className="flex items-center justify-between p-4 border-b-2 border-black/20">
                    <h3 className="text-xl font-bold text-black">{title}</h3>
                    <button onClick={onClose} className="p-1 rounded-full text-black hover:bg-gray-200"><XIcon className="h-6 w-6"/></button>
                </header>
                <div className="p-6">{children}</div>
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
                <div className="h-48 border-2 border-black rounded-lg overflow-hidden">
                     <MapContainer center={cab.location} zoom={13} scrollWheelZoom={false} className="h-full w-full">
                        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                        <Marker position={cab.location} />
                    </MapContainer>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-100 p-3 rounded-lg text-center border border-black/20">
                        <p className="text-black font-bold text-2xl">₹{totalEarnings.toLocaleString()}</p>
                        <p className="text-black font-semibold text-sm">Total Earnings</p>
                    </div>
                    <div className="bg-gray-100 p-3 rounded-lg text-center border border-black/20">
                        <p className="text-black font-bold text-2xl">{bookedSeats} / {cab.totalSeats}</p>
                        <p className="text-black font-semibold text-sm">Booked Seats (Latest)</p>
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
    
    return (
        <div className={`fixed lg:relative lg:translate-x-0 inset-y-0 left-0 z-40 bg-black text-white w-64 lg:w-24 transition-transform duration-300 ease-in-out flex flex-col items-center ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
            <div className="p-4 lg:py-6"><Logo /></div>
            <nav className="flex flex-col items-stretch lg:items-center space-y-2 mt-8 flex-grow w-full px-2">
                {navItems.map(item => (
                    <button key={item.id} onClick={() => { setView(item.id); onClose(); }} title={item.label}
                        className={`flex items-center lg:justify-center gap-4 lg:gap-0 p-3 rounded-lg transition-colors w-full ${currentView === item.id ? 'bg-yellow-400 text-black' : 'hover:bg-gray-800'}`}>
                        <item.icon className="h-6 w-6 flex-shrink-0"/>
                        <span className="lg:hidden font-bold">{item.label}</span>
                    </button>
                ))}
            </nav>
            <div className="p-2 w-full">
                 <button onClick={onLogout} title="Logout"
                    className="flex items-center lg:justify-center gap-4 lg:gap-0 p-3 rounded-lg text-gray-400 hover:bg-gray-800 hover:text-white w-full">
                    <LogoutIcon className="h-6 w-6 flex-shrink-0"/>
                    <span className="lg:hidden font-bold">Logout</span>
                </button>
            </div>
        </div>
    );
};

const AdminDashboard = ({ stats, trips, setView }) => {
     const actionItems = [
        { label: 'Add Cab', icon: TaxiIcon, view: 'cabs' },
        { label: 'Add Driver', icon: DriverIcon, view: 'drivers' },
        { label: 'Add Location', icon: LocationIcon, view: 'locations' },
    ];

    return (
    <div>
        <header><h1 className="text-3xl font-bold text-black">Dashboard</h1></header>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 my-8">
            {actionItems.map(item => (
                <button key={item.view} onClick={() => setView(item.view)} className="bg-white p-4 rounded-xl border-2 border-black text-black text-left font-bold flex items-center gap-3 hover:bg-gray-100 transition-colors">
                    <span className="bg-yellow-400 p-2 rounded-lg border-2 border-black"><item.icon className="h-6 w-6"/></span>
                    <span>{item.label}</span>
                </button>
            ))}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 mb-8">
            <div className="bg-white border-2 border-black rounded-xl p-4 text-center">
                <p className="text-4xl font-bold text-black">{stats.totalTrips}</p><p className="font-semibold text-black mt-1">Total Trips</p>
            </div>
            <div className="bg-white border-2 border-black rounded-xl p-4 text-center">
                <p className="text-4xl font-bold text-black">₹{stats.totalRevenue.toLocaleString()}</p><p className="font-semibold text-black mt-1">Revenue</p>
            </div>
            <div className="bg-white border-2 border-black rounded-xl p-4 text-center">
                <p className="text-4xl font-bold text-black">{stats.totalBookedSeats}<span className="text-2xl font-normal text-gray-600">/{stats.totalSystemSeats}</span></p>
                <p className="font-semibold text-black mt-1">Booked Seats</p>
            </div>
            <div className="bg-white border-2 border-black rounded-xl p-4 text-center">
                <p className="text-4xl font-bold text-black">{stats.totalCabs}</p><p className="font-semibold text-black mt-1">Total Cabs</p>
            </div>
             <div className="bg-white border-2 border-black rounded-xl p-4 text-center">
                <p className="text-4xl font-bold text-black">{stats.totalDrivers}</p><p className="font-semibold text-black mt-1">Total Drivers</p>
            </div>
        </div>

        <div>
            <h2 className="text-2xl font-bold text-black mb-4">Recent Bookings</h2>
            <div className="bg-white border-2 border-black rounded-xl p-4 space-y-3">
                {trips.length > 0 ? trips.slice(0, 5).map(trip => (
                    <div key={trip.id} className="flex flex-wrap justify-between items-start border-b-2 border-black/10 pb-3 last:border-b-0 gap-2">
                        <div>
                            <p className="font-bold text-black">{trip.booking.from} to {trip.booking.to}</p>
                            <p className="text-sm text-gray-700">{trip.car.type} ({trip.car.vehicle}) by {trip.car.driverName}</p>
                            {trip.customer && <p className="text-sm font-semibold text-black mt-1">{trip.customer.name} ({trip.customer.phone})</p> }
                        </div>
                        <div className="text-right flex-shrink-0">
                            <p className="font-bold text-lg text-black">₹{(Number(trip.car.price || 0) * (trip.details?.seats?.length || 0)).toLocaleString()}</p>
                            <p className="text-sm text-gray-700">{trip.details?.seats?.length || 0} seat(s) booked</p>
                        </div>
                    </div>
                )) : <p className="text-black p-4 text-center">No recent bookings found.</p>}
            </div>
        </div>
    </div>
)};

const AdminFleetView = ({ cabs }) => (
    <div>
        <header><h1 className="text-3xl font-bold text-black mb-8">Fleet Overview</h1></header>
        <div className="h-[70vh] bg-white border-2 border-black rounded-xl overflow-hidden">
            <MapContainer center={[27.33, 88.61]} zoom={9} scrollWheelZoom={true} className="h-full w-full">
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                {cabs.map(cab => (
                    <Marker key={cab.id} position={cab.location}>
                        <Popup><div className="font-bold">{cab.vehicle}</div><div>{cab.driverName}</div></Popup>
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
    const [formState, setFormState] = useState({ type: '', vehicle: '', totalSeats: '4', price: '', driverId: '', from: '', to: '', departureTime: '' });

    const unassignedDrivers = drivers.filter(d => !cabs.some(c => c.driverId === d.id));
    const availableDriversForEdit = editingCab ? [...unassignedDrivers, drivers.find(d => d.id === editingCab.driverId)].filter(Boolean) : unassignedDrivers;

    const openAddModal = () => { setEditingCab(null); setFormState({ type: '', vehicle: '', totalSeats: '4', price: '', driverId: '', from: '', to: '', departureTime: '' }); setIsModalOpen(true); };
    const openDetailsModal = (cab) => { setSelectedCabForDetails(cab); setIsDetailsModalOpen(true); };
    const openEditModal = (cab) => {
        setEditingCab(cab);
        setFormState({
            type: cab.type, vehicle: cab.vehicle, totalSeats: String(cab.totalSeats), price: String(cab.price),
            driverId: cab.driverId ? String(cab.driverId) : '', from: cab.from || '', to: cab.to || '', departureTime: cab.departureTime || ''
        });
        setIsModalOpen(true);
    };

    const handleChange = (e) => setFormState(s => ({ ...s, [e.target.name]: e.target.value }));

    const handleSubmit = (e) => {
        e.preventDefault();
        const cabData = { ...formState, totalSeats: parseInt(formState.totalSeats, 10), price: parseInt(formState.price, 10), driverId: parseInt(formState.driverId, 10) || null };
        if (editingCab) { onUpdate({ ...cabData, id: editingCab.id }); } else { onAdd(cabData); }
        setIsModalOpen(false);
    };

    return (
        <div>
            <header className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-black">Manage Cabs</h1>
                <button onClick={openAddModal} className="bg-black text-yellow-400 font-bold py-2 px-4 rounded-lg flex items-center gap-2 hover:bg-gray-800"><PlusIcon/> Add Cab</button>
            </header>
            <div className="bg-white border-2 border-black rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="border-b-2 border-black bg-gray-50"><tr><th className="p-4">Vehicle</th><th className="p-4">Route</th><th className="p-4">Departure</th><th className="p-4">Driver</th><th className="p-4"></th></tr></thead>
                        <tbody>
                            {cabs.map(cab => (
                                <tr key={cab.id} className="border-b border-black/10 last:border-b-0">
                                    <td className="p-4 font-semibold text-black">{cab.vehicle}<br/><span className="font-normal text-sm text-gray-600">{cab.type}</span></td>
                                    <td className="p-4 text-black">{cab.from} to {cab.to}</td>
                                    <td className="p-4 text-black">{cab.departureTime}</td>
                                    <td className="p-4 text-black">{cab.driverName || 'Unassigned'}</td>
                                    <td className="p-4 text-right whitespace-nowrap">
                                        <button onClick={() => openDetailsModal(cab)} className="text-gray-600 hover:text-black p-2"><InfoIcon className="h-5 w-5"/></button>
                                        <button onClick={() => openEditModal(cab)} className="text-blue-600 hover:text-blue-800 p-2"><EditIcon className="h-5 w-5"/></button>
                                        <button onClick={() => onDelete(cab.id)} className="text-red-600 hover:text-red-800 p-2"><TrashIcon className="h-5 w-5"/></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingCab ? 'Edit Cab' : 'Add New Cab'}>
                <form onSubmit={handleSubmit} className="space-y-4">
                     <input name="type" type="text" value={formState.type} onChange={handleChange} required className="w-full p-2 border-2 border-black/80 rounded bg-white" placeholder="Cab Type, e.g., SUV (7 Seater)"/>
                     <input name="vehicle" type="text" value={formState.vehicle} onChange={handleChange} required className="w-full p-2 border-2 border-black/80 rounded bg-white" placeholder="Vehicle No., e.g., SK01 J 1234"/>
                     <select name="from" value={formState.from} onChange={handleChange} required className="w-full p-2 border-2 border-black/80 rounded bg-white"><option value="" disabled>From Location</option>{locations.map(loc => <option key={loc} value={loc}>{loc}</option>)}</select>
                     <select name="to" value={formState.to} onChange={handleChange} required className="w-full p-2 border-2 border-black/80 rounded bg-white"><option value="" disabled>To Location</option>{locations.map(loc => <option key={loc} value={loc}>{loc}</option>)}</select>
                     <input name="departureTime" type="text" value={formState.departureTime} onChange={handleChange} required className="w-full p-2 border-2 border-black/80 rounded bg-white" placeholder="Departure Time, e.g., 09:00 AM"/>
                     <input name="totalSeats" type="number" value={formState.totalSeats} onChange={handleChange} required className="w-full p-2 border-2 border-black/80 rounded bg-white" placeholder="Total Seats"/>
                     <input name="price" type="number" value={formState.price} onChange={handleChange} required className="w-full p-2 border-2 border-black/80 rounded bg-white" placeholder="Price per Seat"/>
                     <select name="driverId" value={formState.driverId} onChange={handleChange} required className="w-full p-2 border-2 border-black/80 rounded bg-white"><option value="">Assign Driver</option>{(editingCab ? availableDriversForEdit : unassignedDrivers).map(d => <option key={d.id} value={d.id}>{d.name}</option>)}</select>
                     <button type="submit" className="w-full bg-yellow-400 text-black font-bold py-3 px-4 rounded-xl border-2 border-black hover:bg-yellow-500">{editingCab ? 'Update Cab' : 'Add Cab'}</button>
                </form>
            </Modal>
            {selectedCabForDetails && <CabDetailsModal isOpen={isDetailsModalOpen} onClose={() => setIsDetailsModalOpen(false)} cab={selectedCabForDetails} allTrips={allTrips} />}
        </div>
    );
};

const AdminDriversView = ({ drivers, onAdd, onDelete, onUpdate }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingDriver, setEditingDriver] = useState(null);
    const [name, setName] = useState(''); const [phone, setPhone] = useState(''); const [username, setUsername] = useState(''); const [password, setPassword] = useState('');
    const resetForm = () => { setEditingDriver(null); setName(''); setPhone(''); setUsername(''); setPassword(''); };
    const openAddModal = () => { resetForm(); setIsModalOpen(true); };
    const openEditModal = (driver) => { setEditingDriver(driver); setName(driver.name); setPhone(driver.phone); setUsername(driver.username); setPassword(''); setIsModalOpen(true); };
    const handleSubmit = e => { e.preventDefault(); if (editingDriver) { onUpdate({ name, phone, username, password, id: editingDriver.id }); } else { onAdd({ name, phone, username, password }); } setIsModalOpen(false); };

    return (
        <div>
            <header className="flex justify-between items-center mb-8"><h1 className="text-3xl font-bold text-black">Manage Drivers</h1><button onClick={openAddModal} className="bg-black text-yellow-400 font-bold py-2 px-4 rounded-lg flex items-center gap-2 hover:bg-gray-800"><PlusIcon/> Add Driver</button></header>
            <div className="bg-white border-2 border-black rounded-xl overflow-hidden"><div className="overflow-x-auto"><table className="w-full text-left">
                <thead className="border-b-2 border-black bg-gray-50"><tr><th className="p-4">Name</th><th className="p-4">Phone</th><th className="p-4">Username</th><th className="p-4"></th></tr></thead>
                <tbody>{drivers.map(driver => (<tr key={driver.id} className="border-b border-black/10 last:border-b-0">
                    <td className="p-4 font-semibold text-black">{driver.name}</td><td className="p-4 text-black">{driver.phone}</td><td className="p-4 text-black">{driver.username}</td>
                    <td className="p-4 text-right whitespace-nowrap"><button onClick={() => openEditModal(driver)} className="text-blue-600 p-2"><EditIcon/></button><button onClick={() => onDelete(driver.id)} className="text-red-600 p-2"><TrashIcon/></button></td>
                </tr>))}</tbody>
            </table></div></div>
             <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingDriver ? "Edit Driver" : "Add New Driver"}>
                <form onSubmit={handleSubmit} className="space-y-4">
                     <input type="text" value={name} onChange={e => setName(e.target.value)} required className="w-full p-2 border-2 border-black/80 rounded" placeholder="Full Name"/>
                     <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} required className="w-full p-2 border-2 border-black/80 rounded" placeholder="Phone Number"/>
                     <input type="text" value={username} onChange={e => setUsername(e.target.value)} required className="w-full p-2 border-2 border-black/80 rounded" placeholder="Username"/>
                     <input type="password" value={password} onChange={e => setPassword(e.target.value)} required={!editingDriver} className="w-full p-2 border-2 border-black/80 rounded" placeholder={editingDriver ? "Leave blank to keep current" : "Password"}/>
                     <button type="submit" className="w-full bg-yellow-400 text-black font-bold py-3 px-4 rounded-xl border-2 border-black hover:bg-yellow-500">{editingDriver ? "Update Driver" : "Add Driver"}</button>
                </form>
            </Modal>
        </div>
    );
};

const AdminLocationsView = ({ locations, pickupPoints, onAddLocation, onDeleteLocation, onAddPoint, onDeletePoint }) => {
    const [selectedLocation, setSelectedLocation] = useState(locations[0]);
    const [newPoint, setNewPoint] = useState(''); const [newLocation, setNewLocation] = useState('');
    useEffect(() => { if (!locations.includes(selectedLocation) && locations.length > 0) setSelectedLocation(locations[0]); }, [locations, selectedLocation]);
    const handleAddPoint = (e) => { e.preventDefault(); onAddPoint(selectedLocation, newPoint); setNewPoint(''); };
    const handleAddLocation = (e) => { e.preventDefault(); onAddLocation({ name: newLocation, lat: 27.0, lon: 88.0 }); setNewLocation(''); };

    return (
        <div>
            <header className="mb-8"><h1 className="text-3xl font-bold text-black">Manage Locations</h1></header>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-1 space-y-4">
                    <h2 className="text-xl font-bold text-black">Service Locations</h2>
                    <form onSubmit={handleAddLocation} className="flex gap-2"><input type="text" value={newLocation} onChange={e => setNewLocation(e.target.value)} required className="flex-grow p-2 border-2 border-black rounded" placeholder="New location name"/><button type="submit" className="bg-black text-yellow-400 p-2 rounded-lg"><PlusIcon/></button></form>
                     <div className="bg-white border-2 border-black rounded-lg p-2 space-y-1 min-h-[40vh]">
                        {locations.map(loc => (
                            <div key={loc} className={`flex justify-between items-center p-2 rounded-md cursor-pointer ${selectedLocation === loc ? 'bg-black text-yellow-400' : 'text-black hover:bg-gray-100'}`} onClick={() => setSelectedLocation(loc)}>
                                <span className="font-semibold">{loc}</span>
                                <button onClick={(e) => {e.stopPropagation(); onDeleteLocation(loc);}} className={`p-1 ${selectedLocation === loc ? 'text-yellow-400 hover:text-white' : 'text-red-600 hover:text-red-800'}`}><TrashIcon className="h-4 w-4"/></button>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="md:col-span-2 space-y-4">
                    <h2 className="text-xl font-bold text-black">Pickup/Drop Points for <span className="text-yellow-600">{selectedLocation}</span></h2>
                    <form onSubmit={handleAddPoint} className="flex gap-2"><input type="text" value={newPoint} onChange={e => setNewPoint(e.target.value)} required className="flex-grow p-2 border-2 border-black rounded" placeholder="Add new point"/><button type="submit" className="bg-black text-yellow-400 p-2 rounded-lg"><PlusIcon/></button></form>
                     <div className="bg-white border-2 border-black rounded-lg p-2 space-y-1 min-h-[40vh]">
                        {(pickupPoints[selectedLocation] || []).map(point => (
                            <div key={point} className="flex justify-between items-center p-2 rounded-md text-black">
                                <span className="font-semibold">{point}</span>
                                <button onClick={() => onDeletePoint(selectedLocation, point)} className="text-red-600 hover:text-red-800 p-1"><TrashIcon className="h-4 w-4"/></button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

const AdminSystemView = ({ onReset }) => {
    const [isConfirmOpen, setIsConfirmOpen] = useState(false); const [confirmText, setConfirmText] = useState('');
    const handleReset = () => { if (confirmText === 'RESET') { onReset(); setIsConfirmOpen(false); } };
    return (
        <div>
            <header className="mb-8"><h1 className="text-3xl font-bold text-black">System Settings</h1></header>
            <div className="bg-white border-2 border-red-500 rounded-lg p-6">
                <h2 className="text-xl font-bold text-red-700">Danger Zone</h2>
                <p className="text-gray-700 mt-2 mb-4">This action will delete all bookings, customers, and custom configurations, resetting the application to its original state. This cannot be undone.</p>
                <button onClick={() => setIsConfirmOpen(true)} className="bg-red-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-red-700">Reset Application Data</button>
            </div>
            <Modal isOpen={isConfirmOpen} onClose={() => setIsConfirmOpen(false)} title="Confirm Data Reset">
                <div className="space-y-4">
                    <p className="text-black">To confirm, please type <code className="bg-black/10 p-1 rounded font-mono text-black">RESET</code> in the box below.</p>
                    <input type="text" value={confirmText} onChange={(e) => setConfirmText(e.target.value)} className="w-full p-2 border-2 border-black rounded font-mono bg-white" placeholder="RESET"/>
                    <div className="flex justify-end gap-4 pt-2">
                        <button onClick={() => setIsConfirmOpen(false)} className="bg-gray-200 text-black font-bold py-2 px-4 rounded-lg hover:bg-gray-300">Cancel</button>
                        <button onClick={handleReset} disabled={confirmText !== 'RESET'} className="bg-red-600 text-white font-bold py-2 px-4 rounded-lg disabled:bg-red-300">Yes, Reset Data</button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};


const AdminPanel = ({ onLogout, auth, dataApi }) => {
    const [view, setView] = useState('dashboard');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    
    const { cabs, drivers, trips, locations, pickupPoints, allDrivers, allTrips, stats } = dataApi.admin.getData(auth);

    const handlers = {
        addCab: (p) => dataApi.admin.addCab(p), deleteCab: (p) => dataApi.admin.deleteCab(p), updateCab: (p) => dataApi.admin.updateCab(p),
        addDriver: (p) => dataApi.admin.addDriver(p), deleteDriver: (p) => dataApi.admin.deleteDriver(p), updateDriver: (p) => dataApi.admin.updateDriver(p),
        addLocation: (p) => dataApi.admin.addLocation(p), deleteLocation: (p) => dataApi.admin.deleteLocation(p), updateLocation: (p) => dataApi.admin.updateLocation(p),
        addPoint: (l, p) => dataApi.admin.addPoint(l, p), deletePoint: (l, p) => dataApi.admin.deletePoint(l, p),
        resetData: () => dataApi.admin.resetData(),
    };

    const renderView = () => {
        switch(view) {
            case 'fleet': return <AdminFleetView cabs={cabs} />;
            case 'cabs': return <AdminCabsView cabs={cabs} drivers={allDrivers} locations={locations} allTrips={allTrips} onAdd={handlers.addCab} onDelete={handlers.deleteCab} onUpdate={handlers.updateCab} />;
            case 'drivers': return <AdminDriversView drivers={drivers} onAdd={handlers.addDriver} onDelete={handlers.deleteDriver} onUpdate={handlers.updateDriver} />;
            case 'locations': return <AdminLocationsView locations={locations} pickupPoints={pickupPoints} onAddLocation={handlers.addLocation} onDeleteLocation={handlers.deleteLocation} onAddPoint={handlers.addPoint} onDeletePoint={handlers.deletePoint}/>;
            case 'system': return <AdminSystemView onReset={handlers.resetData} />;
            case 'dashboard': default: return <AdminDashboard stats={stats} trips={trips} setView={setView}/>;
        }
    };
    
    return (
        <div className="flex h-screen app-container bg-gray-100 overflow-hidden relative">
            {isSidebarOpen && <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={() => setIsSidebarOpen(false)} aria-hidden="true"></div>}
            <AdminSidebar currentView={view} setView={setView} onLogout={onLogout} isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
            <main className="flex-1 flex flex-col overflow-y-auto">
                <header className="bg-white p-4 shadow-sm flex justify-between items-center lg:hidden sticky top-0 z-20 border-b">
                    <button onClick={() => setIsSidebarOpen(true)} className="p-2 -ml-2 text-black"><MenuIcon className="h-6 w-6"/></button>
                    <Logo />
                    <div className="w-6"></div>
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
            <div className="flex-1"><Logo /></div>
            <div className="flex-1 flex justify-end">
                <button onClick={onLogout} className="p-2 rounded-full hover:bg-black/10" aria-label="Logout"><LogoutIcon className="h-6 w-6 text-black"/></button>
            </div>
        </header>
    );

    if (!trips || trips.length === 0) {
        return (
            <div className="min-h-screen bg-gray-100">
                <AppHeader />
                <main className="p-4 flex items-center justify-center flex-grow" style={{minHeight: 'calc(100vh - 80px)'}}>
                    <div className="text-center p-8 bg-white rounded-2xl border-2 border-black">
                        <TaxiIcon className="h-16 w-16 mx-auto text-black/20 mb-4" />
                        <h2 className="text-2xl font-bold text-black">No active trips.</h2>
                        <p className="text-black">You're all set for today!</p>
                    </div>
                </main>
            </div>
        );
    }
    
    const firstTrip = trips[0];
    const totalSeatsBooked = trips.reduce((sum, trip) => sum + trip.details.seats.length, 0);

    return (
        <div className="min-h-screen flex flex-col bg-gray-100">
            <AppHeader />
            <main className="p-4 flex-grow">
                <div className="w-full max-w-md mx-auto space-y-4">
                    <div className="bg-white p-4 rounded-xl border-2 border-black">
                        <h3 className="text-lg font-bold text-black mb-2 text-center">Today's Trip</h3>
                        <div className="flex justify-between items-center text-md font-semibold text-black bg-gray-100 p-3 rounded-lg border border-black/20">
                            <span>{firstTrip.booking.from}</span><TaxiIcon className="h-5 w-5 text-black flex-shrink-0 mx-2"/><span>{firstTrip.booking.to}</span>
                        </div>
                        <div className="text-center text-sm text-black font-semibold mt-1">{firstTrip.car.departureTime} &middot; {firstTrip.car.vehicle}</div>
                    </div>

                    <div className="border-t-2 border-black/10 pt-4">
                        <h4 className="text-lg font-bold text-black mb-3">Passenger Manifest ({totalSeatsBooked} seats)</h4>
                        <div className="space-y-3 max-h-[55vh] overflow-y-auto pr-1">
                            {trips.map(trip => (
                                <div key={trip.id} className="bg-white p-3 rounded-lg border-2 border-black/80 shadow-sm">
                                    <div className="flex items-start gap-3">
                                        <div className="mt-1 text-black"><UserIcon className="h-6 w-6" /></div>
                                        <div className="flex-grow">
                                            <p className="font-bold text-black">{trip.customer.name}</p>
                                            <a href={`tel:${trip.customer.phone}`} className="text-sm text-black hover:underline flex items-center gap-1"><PhoneIcon className="h-3 w-3" />{trip.customer.phone}</a>
                                        </div>
                                        <div className="text-right flex-shrink-0 bg-black text-yellow-400 px-3 py-1.5 rounded-lg">
                                            <div className="flex items-center gap-1.5 font-bold"><SeatIcon className="h-4 w-4" /><span className="text-sm">{trip.details.seats.join(', ')}</span></div>
                                        </div>
                                    </div>
                                    <div className="text-sm space-y-1.5 mt-2 pt-2 border-t border-black/20">
                                         <p><span className="font-semibold text-green-700">Pickup:</span> {trip.details.pickup}</p>
                                         <p><span className="font-semibold text-red-700">Drop:</span> {trip.details.drop}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                     <button onClick={() => alert('Trip Started!')} className="w-full mt-2 bg-yellow-400 text-black font-bold py-3 px-4 rounded-xl border-2 border-black hover:bg-yellow-500 transition-colors">Start Trip</button>
                </div>
            </main>
        </div>
    );
};

// --- AUTH & MAIN APP ROUTER ---
const AppLoginPage = ({ role, onLogin, error }) => {
    const [username, setUsername] = useState(''); const [password, setPassword] = useState('');
    const titleMap = { superadmin: 'Admin Panel', driver: 'Driver Login' };
    const handleSubmit = (e) => { e.preventDefault(); onLogin({ username, password }); };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-yellow-400">
            <div className="w-full max-w-sm mx-auto">
                <div className="text-center mb-6"><Logo /></div>
                <div className="bg-white p-8 rounded-2xl border-2 border-black shadow-lg">
                    <h2 className="text-3xl font-bold text-black text-center">{titleMap[role] || 'Login'}</h2>
                    {error && <p className="text-center font-semibold text-red-700 bg-red-100 border border-red-700 rounded-lg p-2 my-4">{error}</p>}
                    <form onSubmit={handleSubmit} className="space-y-4 mt-6">
                        <input type="text" value={username} onChange={e => setUsername(e.target.value)} required className="block w-full px-3 py-3 bg-white text-black border-2 border-black/80 rounded-lg font-semibold" placeholder="Username"/>
                        <input type="password" value={password} onChange={e => setPassword(e.target.value)} required className="block w-full px-3 py-3 bg-white text-black border-2 border-black/80 rounded-lg font-semibold" placeholder="Password"/>
                        <button type="submit" className="w-full !mt-6 bg-yellow-400 text-black font-bold py-3 px-4 rounded-xl border-2 border-black hover:bg-yellow-500">Login</button>
                    </form>
                </div>
            </div>
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
    admins: [{ id: 99, name: 'System Superadmin', username: 'sajilotaxi@gmail.com', password: 'admin', role: 'superadmin' }],
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
        'Siliguri': ['City Centre', 'Sevoke Road', 'NJP Station'], 'Default': ['Main Bus Stand', 'City Center']
    },
    trips: [], customers: [], customLocationCoordinates: {},
};

const getInitialState = () => {
    try {
        const storedValue = localStorage.getItem(STORAGE_KEY);
        if (storedValue) { const parsed = JSON.parse(storedValue); if (typeof parsed === 'object' && parsed !== null && Array.isArray(parsed.admins)) return { ...initialData, ...parsed }; }
    } catch (error) { localStorage.removeItem(STORAGE_KEY); }
    return JSON.parse(JSON.stringify(initialData));
};

function appReducer(state, action) {
    const getCoords = (locName, currentState) => currentState.customLocationCoordinates[locName] || locationCoordinates[locName];
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
        case 'ADD_CUSTOMER': return { ...state, customers: [...state.customers, { ...action.payload, id: Date.now() }] };
        case 'ADD_TRIP': return { ...state, trips: [action.payload, ...state.trips] };
        default: return state;
    }
}

const App = () => {
    const [state, dispatch] = useReducer(appReducer, undefined, getInitialState);
    
    const getInitialView = () => {
        const path = window.location.pathname.toLowerCase();
        if (path.startsWith('/admin')) return 'superadmin';
        if (path.startsWith('/driver')) return 'driver';
        return 'customer';
    };

    const [view, setView] = useState(getInitialView);
    const [auth, setAuth] = useState({ user: null, role: null });
    const [loginError, setLoginError] = useState('');

    useEffect(() => { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }, [state]);
    useEffect(() => {
        const handleStorage = (e) => { if (e.key === STORAGE_KEY && e.newValue) dispatch({ type: 'SET_STATE', payload: JSON.parse(e.newValue) }); };
        window.addEventListener('storage', handleStorage);
        return () => window.removeEventListener('storage', handleStorage);
    }, []);
    
    const dataApi = useMemo(() => ({
        customer: {
            getData: () => ({ locations: state.locations, pickupPoints: state.pickupPoints, availableCars: state.cabs.map(c => ({...c, driverName: state.drivers.find(d => d.id === c.driverId)?.name || 'N/A'})), trips: state.trips, customers: state.customers }),
            getCarById: (id) => state.cabs.find(c => c.id === id),
            signUp: (d) => dispatch({ type: 'ADD_CUSTOMER', payload: d }),
            bookTrip: (t) => dispatch({ type: 'ADD_TRIP', payload: t }),
        },
        admin: {
            getData: () => {
                const allCabs = state.cabs.map(c => ({...c, driverName: state.drivers.find(d => d.id === c.driverId)?.name || 'N/A'}));
                const allTrips = state.trips;
                const totalRevenue = allTrips.reduce((s, t) => s + (Number(t.car.price || 0) * (t.details?.seats?.length || 0)), 0);
                return { cabs: allCabs, trips: allTrips, drivers: state.drivers, locations: state.locations, pickupPoints: state.pickupPoints, allDrivers: state.drivers, allTrips, stats: { totalTrips: allTrips.length, totalRevenue, totalBookedSeats: allTrips.reduce((s, t) => s + (t.details?.seats?.length || 0), 0), totalSystemSeats: allCabs.reduce((s, c) => s + c.totalSeats, 0), totalCabs: allCabs.length, totalDrivers: state.drivers.length }};
            },
            addCab: (d) => dispatch({ type: 'ADD_CAB', payload: d }), updateCab: (d) => dispatch({ type: 'UPDATE_CAB', payload: d }), deleteCab: (id) => dispatch({ type: 'DELETE_CAB', payload: id }),
            addDriver: (d) => dispatch({ type: 'ADD_DRIVER', payload: d }), updateDriver: (d) => dispatch({ type: 'UPDATE_DRIVER', payload: d }), deleteDriver: (id) => dispatch({ type: 'DELETE_DRIVER', payload: id }),
            addLocation: (d) => dispatch({ type: 'ADD_LOCATION', payload: d }), deleteLocation: (n) => dispatch({ type: 'DELETE_LOCATION', payload: n }),
            addPoint: (l, p) => dispatch({ type: 'ADD_POINT', payload: { loc: l, point: p } }), deletePoint: (l, p) => dispatch({ type: 'DELETE_POINT', payload: { loc: l, point: p } }),
            resetData: () => dispatch({ type: 'RESET_STATE' }),
        },
        driver: {
            getData: (driver) => {
                const cab = state.cabs.find(c => c.driverId === driver.id);
                return { trips: cab ? state.trips.filter(t => t.car.id === cab.id) : [] };
            }
        }
    }), [state]);

    const handleLogin = async ({ username, password }) => {
        setLoginError('');
        try {
            const response = await fetch('/api/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username, password, role: view }) });
            const data = await response.json();
            if (response.ok && data.success) { setAuth({ user: data.user, role: view }); } else { setLoginError(data.error || 'Invalid username or password.'); }
        } catch (error) { setLoginError('Could not connect to the server.'); }
    };
    const handleLogout = () => { setAuth({ user: null, role: null }); setLoginError(''); };

    if (auth.user) {
        if (auth.role === 'superadmin') return <AdminPanel onLogout={handleLogout} auth={auth} dataApi={dataApi} />;
        if (auth.role === 'driver') return <DriverApp onLogout={handleLogout} driver={auth.user} dataApi={dataApi} />;
    }

    if (view === 'superadmin' || view === 'driver') return <AppLoginPage role={view} onLogin={handleLogin} error={loginError} />;
    
    return <CustomerApp dataApi={dataApi} />;
};

export default App;