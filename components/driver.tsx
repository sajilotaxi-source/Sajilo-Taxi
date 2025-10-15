

import React from 'react';
import type { DriverAppProps, Customer } from '../types.ts';
import { LogoutIcon, TaxiIcon, UserIcon, PhoneIcon, SeatIcon } from './icons.tsx';
import { Logo } from './ui.tsx';

export const DriverApp = ({ onLogout, driver, dataApi }: DriverAppProps) => {
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
    const totalSeatsBooked = trips.reduce((sum, trip) => sum + trip.details.selectedSeats.length, 0);

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
                            {trips.map(trip => {
                                const customer = trip.customer as Customer; // Type assertion
                                return (
                                <div key={trip.id} className="bg-white p-3 rounded-lg border-2 border-black/80 shadow-sm">
                                    <div className="flex items-start gap-3">
                                        <div className="mt-1 text-black"><UserIcon className="h-6 w-6" /></div>
                                        <div className="flex-grow">
                                            <p className="font-bold text-black">{customer.name}</p>
                                            <a href={`tel:${customer.phone}`} className="text-sm text-black hover:underline flex items-center gap-1"><PhoneIcon className="h-3 w-3" />{customer.phone}</a>
                                        </div>
                                        <div className="text-right flex-shrink-0 bg-black text-yellow-400 px-3 py-1.5 rounded-lg">
                                            <div className="flex items-center gap-1.5 font-bold"><SeatIcon className="h-4 w-4" /><span className="text-sm">{trip.details.selectedSeats.join(', ')}</span></div>
                                        </div>
                                    </div>
                                    <div className="text-sm space-y-1.5 mt-2 pt-2 border-t border-black/20">
                                         <p><span className="font-semibold text-green-700">Pickup:</span> {trip.details.pickup}</p>
                                         <p><span className="font-semibold text-red-700">Drop:</span> {trip.details.drop}</p>
                                    </div>
                                </div>
                            )})}
                        </div>
                    </div>
                     <button onClick={() => alert('Trip Started!')} className="w-full mt-2 bg-yellow-400 text-black font-bold py-3 px-4 rounded-xl border-2 border-black hover:bg-yellow-500 transition-colors">Start Trip</button>
                </div>
            </main>
        </div>
    );
};
