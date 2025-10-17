import React, { useState, useMemo } from 'react';
import type { DriverAppProps, Trip, Customer } from '../types.ts';
import { 
    LogoutIcon, TaxiIcon, UserIcon, PhoneIcon, SeatIcon, 
    ChevronDownIcon, MapPinIcon, SettingsIcon
} from './icons.tsx';

// A single passenger's details for a journey
interface PassengerInfo {
    id: number;
    customer: Customer;
    details: Trip['details'];
}

// Represents a full journey (e.g., one car driving from A to B at a specific time)
interface Journey {
    id: number; // Use the ID of the first trip in the group
    car: Trip['car'];
    booking: Trip['booking'];
    passengers: PassengerInfo[];
}

const JourneyCard = ({ journey }: { journey: Journey }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const totalSeats = journey.passengers.reduce((sum, p) => sum + p.details.selectedSeats.length, 0);

    return (
        <div className="bg-white p-4 rounded-xl border-2 border-gray-200 shadow-sm transition-all duration-300">
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full flex justify-between items-center text-left gap-4"
                aria-expanded={isExpanded}
            >
                <div className="flex-grow">
                    <div className="flex items-center gap-2 text-lg font-bold text-dark">
                        <span>{journey.booking.from}</span>
                        <TaxiIcon className="h-5 w-5 text-gray-500 flex-shrink-0" />
                        <span>{journey.booking.to}</span>
                    </div>
                    <div className="text-sm text-gray-600 font-semibold mt-1">
                        {journey.car.departureTime} &middot; {journey.car.vehicle}
                    </div>
                </div>
                <div className="flex flex-col items-end flex-shrink-0">
                     <div className="flex items-center gap-2 font-bold text-dark">
                        <UserIcon className="h-5 w-5" />
                        <span>{totalSeats}</span>
                    </div>
                    <ChevronDownIcon
                        className={`h-6 w-6 text-gray-500 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}
                    />
                </div>
            </button>
            {isExpanded && (
                <div className="mt-4 pt-4 border-t border-gray-200 space-y-3 animate-fade-in">
                    <h4 className="text-md font-bold text-dark">Passenger Manifest</h4>
                    {journey.passengers.map((p) => (
                        <div key={p.id} className="bg-light-gray p-3 rounded-lg border border-gray-300">
                            <div className="flex items-start gap-3">
                                <div className="flex-grow">
                                    <p className="font-bold text-dark">{p.customer.name}</p>
                                    <a href={`tel:${p.customer.phone}`} className="text-sm text-secondary hover:underline flex items-center gap-1.5"><PhoneIcon className="h-3 w-3" />{p.customer.phone}</a>
                                </div>
                                <div className="text-right flex-shrink-0 bg-dark text-primary px-3 py-1.5 rounded-lg">
                                    <div className="flex items-center gap-1.5 font-bold"><SeatIcon className="h-4 w-4" /><span className="text-sm">{p.details.selectedSeats.join(', ')}</span></div>
                                </div>
                            </div>
                            <div className="text-sm space-y-1.5 mt-2 pt-2 border-t border-gray-200">
                                 <div className="flex items-center gap-2"><MapPinIcon className="h-4 w-4 text-success flex-shrink-0" /><p><span className="font-semibold text-gray-700">Pickup:</span> {p.details.pickup}</p></div>
                                 <div className="flex items-center gap-2"><MapPinIcon className="h-4 w-4 text-danger flex-shrink-0" /><p><span className="font-semibold text-gray-700">Drop:</span> {p.details.drop}</p></div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

const StatCard = ({ icon: Icon, value, label }: { icon: React.FC<any>, value: string | number, label: string }) => (
    <div className="bg-white p-3 rounded-xl border-2 border-gray-200 text-center shadow-sm">
        <div className="flex items-center justify-center gap-2">
            <Icon className="h-5 w-5 text-dark" />
            <p className="text-2xl font-bold text-dark">{value}</p>
        </div>
        <p className="text-xs font-semibold text-gray-600 mt-1">{label}</p>
    </div>
);

const NoTripsView = () => (
    <div className="flex flex-col items-center justify-center text-center p-8 mt-10">
        <TaxiIcon className="h-24 w-24 text-gray-300 mb-4" />
        <h2 className="text-2xl font-bold text-dark">You're all set for today!</h2>
        <p className="text-gray-600 mt-2 max-w-xs">There are no trips assigned to you for today's date. Enjoy your day off!</p>
    </div>
);

const TripsView = ({ journeys, totalTrips, totalPassengers, totalEarnings }: { journeys: Journey[], totalTrips: number, totalPassengers: number, totalEarnings: number }) => (
    <div className="p-4 max-w-2xl mx-auto space-y-6">
        {totalTrips > 0 ? (
            <>
                <div className="grid grid-cols-3 gap-4">
                    <StatCard icon={TaxiIcon} value={totalTrips} label="Total Trips" />
                    <StatCard icon={UserIcon} value={totalPassengers} label="Passengers" />
                    <StatCard icon={SeatIcon} value={`₹${totalEarnings.toLocaleString()}`} label="Est. Earnings" />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-dark mb-3">Today's Journeys</h2>
                    <div className="space-y-4">
                        {journeys.map(journey => <JourneyCard key={journey.id} journey={journey} />)}
                    </div>
                </div>
            </>
        ) : (
            <NoTripsView />
        )}
    </div>
);

const ProfileView = ({ driver, onLogout }: { driver: DriverAppProps['driver'], onLogout: DriverAppProps['onLogout'] }) => (
    <div className="p-4 max-w-2xl mx-auto space-y-6">
        <div className="bg-white p-4 rounded-xl border-2 border-gray-200 shadow-sm">
            <h2 className="text-lg font-bold text-dark mb-3 border-b pb-2">Driver Information</h2>
            <div className="space-y-3 text-md">
                <p><span className="font-semibold text-gray-600">Name:</span> <span className="text-dark font-bold">{driver.name}</span></p>
                <p><span className="font-semibold text-gray-600">Phone:</span> <span className="text-dark font-bold">{driver.phone}</span></p>
                <p><span className="font-semibold text-gray-600">Username:</span> <span className="text-dark font-bold">{driver.username}</span></p>
            </div>
        </div>
        <div className="bg-white p-4 rounded-xl border-2 border-gray-200 shadow-sm">
            <h2 className="text-lg font-bold text-dark mb-3 border-b pb-2">Account</h2>
             <div className="space-y-2">
                <button className="w-full text-left flex items-center gap-3 p-2 rounded-lg hover:bg-light-gray text-dark font-semibold">
                    <SettingsIcon className="h-5 w-5 text-gray-500" />
                    <span>Settings</span>
                </button>
                <button onClick={onLogout} className="w-full text-left flex items-center gap-3 p-2 rounded-lg hover:bg-light-gray text-danger font-semibold">
                    <LogoutIcon className="h-5 w-5" />
                    <span>Logout</span>
                </button>
            </div>
        </div>
    </div>
);

const BottomNavBar = ({ activeTab, setActiveTab }: { activeTab: string, setActiveTab: (tab: 'trips' | 'profile') => void }) => {
    const navItems = [
        { id: 'trips', label: 'Trips', icon: TaxiIcon },
        { id: 'profile', label: 'Profile', icon: UserIcon },
    ];
    return (
        <div className="fixed bottom-0 left-0 right-0 h-16 bg-white border-t-2 border-gray-200 shadow-lg z-20">
            <div className="flex justify-around items-center h-full max-w-2xl mx-auto">
                {navItems.map(item => {
                    const isActive = activeTab === item.id;
                    return (
                        <button key={item.id} onClick={() => setActiveTab(item.id as 'trips' | 'profile')} className={`flex flex-col items-center justify-center h-full w-full transition-colors ${isActive ? 'text-primary' : 'text-gray-500 hover:text-dark'}`}>
                            <item.icon className="h-6 w-6" />
                            <span className="text-xs font-bold mt-1">{item.label}</span>
                        </button>
                    )
                })}
            </div>
        </div>
    );
};

export const DriverApp = ({ onLogout, driver, dataApi }: DriverAppProps) => {
    const [activeTab, setActiveTab] = useState<'trips' | 'profile'>('trips');
    const { trips } = dataApi.driver.getData(driver);
    const today = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' });

    const { journeys, totalTrips, totalPassengers, totalEarnings } = useMemo(() => {
        const tripsByJourney = trips.reduce<Record<string, Journey>>((acc, trip) => {
            const key = `${trip.car.id}-${trip.booking.from}-${trip.booking.to}-${trip.car.departureTime}`;
            if (!acc[key]) {
                acc[key] = { id: trip.id, car: trip.car, booking: trip.booking, passengers: [] };
            }
            acc[key].passengers.push({ id: trip.id, customer: trip.customer as Customer, details: trip.details });
            return acc;
        }, {});

        const journeyList = Object.values(tripsByJourney);
        const passengerCount = trips.reduce((sum, trip) => sum + trip.details.selectedSeats.length, 0);
        const earnings = trips.reduce((sum, trip) => sum + (trip.car.price * trip.details.selectedSeats.length), 0);
        
        return {
            journeys: journeyList,
            totalTrips: journeyList.length,
            totalPassengers: passengerCount,
            totalEarnings: earnings,
        };
    }, [trips]);
    
    const renderContent = () => {
        switch (activeTab) {
            case 'trips':
                return <TripsView journeys={journeys} totalTrips={totalTrips} totalPassengers={totalPassengers} totalEarnings={totalEarnings} />;
            case 'profile':
                return <ProfileView driver={driver} onLogout={onLogout} />;
            default:
                return null;
        }
    };

    return (
        <div className="h-screen bg-light-gray flex flex-col font-sans">
            <header className="bg-black p-4 shadow-md sticky top-0 z-10">
                <div className="max-w-2xl mx-auto">
                    <h1 className="text-xl font-bold text-white">{activeTab === 'trips' ? `Welcome, ${driver.name.split(' ')[0]}!` : 'My Profile'}</h1>
                    <p className="text-sm text-gray-300">{activeTab === 'trips' ? today : driver.phone}</p>
                </div>
            </header>
            <main className="flex-grow overflow-y-auto pb-20">
                {renderContent()}
            </main>
            <BottomNavBar activeTab={activeTab} setActiveTab={setActiveTab} />
        </div>
    );
};
