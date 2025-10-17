import React, { useState, useMemo } from 'react';
import type { DriverAppProps, Trip, Customer } from '../types.ts';
import { 
    LogoutIcon, TaxiIcon, UserIcon, PhoneIcon, SeatIcon, CalendarIcon, 
    CurrencyDollarIcon, ChevronDownIcon, 
    // FIX: Import `SteeringWheelIcon` to resolve usage error.
    SteeringWheelIcon
} from './icons.tsx';
import { Logo } from './ui.tsx';

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
                                 <p><span className="font-semibold text-success">Pickup:</span> {p.details.pickup}</p>
                                 <p><span className="font-semibold text-danger">Drop:</span> {p.details.drop}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};


export const DriverApp = ({ onLogout, driver, dataApi }: DriverAppProps) => {
    const { trips } = dataApi.driver.getData(driver);
    const today = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' });

    const { journeys, totalTrips, totalPassengers, totalEarnings } = useMemo(() => {
        const tripsByJourney = trips.reduce<Record<string, Journey>>((acc, trip) => {
            const key = `${trip.car.id}-${trip.booking.from}-${trip.booking.to}-${trip.car.departureTime}`;
            if (!acc[key]) {
                acc[key] = {
                    id: trip.id,
                    car: trip.car,
                    booking: trip.booking,
                    passengers: [],
                };
            }
            acc[key].passengers.push({
                id: trip.id,
                customer: trip.customer as Customer,
                details: trip.details,
            });
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
    
    const AppHeader = () => (
        <header className="bg-black p-4 shadow-md sticky top-0 z-10">
            <div className="max-w-2xl mx-auto flex justify-between items-center">
                <div>
                    <h1 className="text-xl font-bold text-white">Welcome, {driver.name.split(' ')[0]}!</h1>
                    <p className="text-sm text-gray-300">{today}</p>
                </div>
                <button onClick={onLogout} className="p-2 rounded-full text-white hover:bg-white/20" aria-label="Logout"><LogoutIcon className="h-6 w-6"/></button>
            </div>
        </header>
    );

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
        <div className="flex flex-col items-center justify-center text-center p-8">
            <TaxiIcon className="h-24 w-24 text-gray-300 mb-4" />
            <h2 className="text-2xl font-bold text-dark">You're all set for today!</h2>
            <p className="text-gray-600 mt-2 max-w-xs">There are no trips assigned to you for today's date. Enjoy your day off!</p>
        </div>
    );

    return (
        <div className="min-h-screen flex flex-col bg-light-gray font-sans">
            <AppHeader />
            <main className="p-4 flex-grow relative">
                <div className="max-w-2xl mx-auto space-y-6 pb-24">
                    {totalTrips > 0 ? (
                        <>
                            <div className="grid grid-cols-3 gap-4">
                                <StatCard icon={TaxiIcon} value={totalTrips} label="Total Trips" />
                                <StatCard icon={UserIcon} value={totalPassengers} label="Passengers" />
                                <StatCard icon={CurrencyDollarIcon} value={`₹${totalEarnings.toLocaleString()}`} label="Est. Earnings" />
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

                {totalTrips > 0 && (
                     <button
                        onClick={() => alert('Trip Started!')}
                        className="fixed bottom-6 right-6 bg-primary text-dark rounded-full p-4 shadow-lg hover:bg-yellow-500 transition-transform transform hover:scale-110 flex items-center gap-3 group"
                        aria-label="Start Trip"
                    >
                        <SteeringWheelIcon className="h-8 w-8 transition-transform group-hover:rotate-12" />
                    </button>
                )}
            </main>
        </div>
    );
};