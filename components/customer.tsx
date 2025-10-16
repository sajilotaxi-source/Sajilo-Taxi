import React, { useState, useEffect, useMemo } from 'react';
import { GoogleMap, useJsApiLoader, MarkerF, InfoWindow, Polyline } from '@react-google-maps/api';
import type { 
    Cab, Trip, Customer, BookingCriteria, SeatSelectionDetails, PickupPoints, EnrichedCab,
    BookingPageProps, SeatSelectionPageProps,
    PaymentPageProps, TripTrackingPageProps, AboutUsPageProps, CustomerAppProps
} from '../types.ts';
// FIX: Import `CheckCircleIcon` to resolve usage error.
import {
    ClockIcon, BackArrowIcon, UserIcon, PlusIcon, MinusIcon, EmailIcon,
    SteeringWheelIcon, SeatIcon, CreditCardIcon, WalletIcon, PhoneIcon,
    DriverIcon, SwapIcon, SafetyShieldIcon, PriceTagIcon, QuoteIcon,
    MenuIcon, XIcon, CheckCircleIcon, TaxiIcon
} from './icons.tsx';
import { Logo, Modal } from './ui.tsx';
import { CustomerAuthPage } from './auth.tsx';

const googleMapsApiKey = (import.meta.env && import.meta.env.VITE_GOOGLE_MAPS_API_KEY) || "";

const getPointsForLocation = (location: string, allPoints: PickupPoints) => {
    return allPoints[location] || allPoints['Default'];
}

const BookingPage = ({ locations, availableCars, onBook, trips, onNavigateToAbout, onNavigateToLogin, onNavigateHome }: BookingPageProps) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [bookingCriteria, setBookingCriteria] = useState<BookingCriteria>(() => {
        const initialRoute = { from: 'Gangtok', to: 'Bagdogra' }; // Updated default to a common route
        if (availableCars && availableCars.length > 0) {
            const firstValidCar = availableCars.find(c => locations.includes(c.from) && locations.includes(c.to));
            if (firstValidCar) {
                initialRoute.from = firstValidCar.from;
                initialRoute.to = firstValidCar.to;
            }
        } else {
            if (!locations.includes(initialRoute.from) && locations.length > 0) initialRoute.from = locations[0];
            if (!locations.includes(initialRoute.to) && locations.length > 1) initialRoute.to = locations.find(l => l !== initialRoute.from && l.toLowerCase().includes('airport')) || locations[1];
        }
        return {
            from: initialRoute.from,
            to: initialRoute.to,
            date: new Date().toISOString().split('T')[0],
            seats: 1,
        };
    });
    
    const [viewingPolicy, setViewingPolicy] = useState<'payment' | 'terms' | 'refund' | null>(null);

    const policies = {
        payment: {
            title: 'Payment Policy',
            content: [
                { heading: 'Accepted Payment Methods', text: 'We accept payments via Razorpay, supporting credit/debit cards, UPI, net banking, and popular wallets in India.' },
                { heading: 'Payment Confirmation', text: 'All bookings/orders are confirmed only after successful payment through Razorpay.' },
                { heading: 'Security', text: 'All transactions are securely processed via Razorpay. We do not store any card or banking details.' },
                { heading: 'Payment Failures', text: 'In case of payment failure or decline, please retry or contact Razorpay support. The company is not liable for failures caused by banking or network issues.' },
                { heading: 'Taxes & Fees', text: 'All prices are inclusive of applicable taxes. Any additional tolls or state entry fees are to be paid by the customer unless specified otherwise.' },
            ],
        },
        terms: {
            title: 'Terms of Service',
            content: [
                 { heading: 'Booking Agreement', text: 'By booking a ride, you agree to our terms of service and payment policies.' },
                 { heading: 'Passenger Conduct', text: 'Passengers are expected to maintain decorum. Any illegal activities or misconduct may result in cancellation of the trip without a refund.' },
                 { heading: 'Luggage Policy', text: 'A reasonable amount of luggage is allowed per passenger. Extra charges may apply for oversized or excessive luggage.' },
            ],
        },
        refund: {
            title: 'Cancellation & Refund Policy',
            content: [
                 { heading: 'Cancellation Window', text: 'Cancellations made up to 24 hours before the scheduled departure time are eligible for a full refund.' },
                 { heading: 'Late Cancellations', text: 'Cancellations made within 24 hours of departure are non-refundable.' },
                 { heading: 'Processing Time', text: 'Refunds, where applicable, will be processed within 5-7 business days to the original payment method.' },
            ],
        },
    };

    const handleCriteriaChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setBookingCriteria(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSeatChange = (amount: number) => {
        setBookingCriteria(prev => ({
            ...prev,
            seats: Math.max(1, Math.min(10, prev.seats + amount))
        }));
    };

    const handleSwapLocations = () => {
        setBookingCriteria(prev => ({...prev, from: prev.to, to: prev.from}));
    }

    const filteredCars = useMemo(() => {
        return availableCars.filter(car => {
            const bookedSeatsForThisCar = trips
                .filter(trip => trip.car.id === car.id && trip.booking.date === bookingCriteria.date)
                .reduce((acc, trip) => acc + trip.details.selectedSeats.length, 0);
            
            const availableSeats = car.totalSeats - bookedSeatsForThisCar;

            return (
                car.from === bookingCriteria.from &&
                car.to === bookingCriteria.to &&
                availableSeats >= bookingCriteria.seats
            );
        }).map(car => {
             const bookedSeatsForThisCar = trips
                .filter(trip => trip.car.id === car.id && trip.booking.date === bookingCriteria.date)
                .reduce((acc, trip) => acc + trip.details.selectedSeats.length, 0);
            return {...car, availableSeats: car.totalSeats - bookedSeatsForThisCar};
        });
    }, [availableCars, bookingCriteria, trips]);

    const scrollToCars = () => {
        const element = document.getElementById('available-cars');
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        }
    };

    return (
        <div className="min-h-screen bg-white">
            <header className="absolute top-0 left-0 right-0 z-20 p-4">
                 <div className="container mx-auto flex justify-between items-center">
                    <button onClick={onNavigateHome} aria-label="Go to homepage"><Logo /></button>
                    <nav className="hidden md:flex items-center gap-6">
                        <a href="#available-cars" className="text-white font-bold hover:text-primary transition-colors">Find a Ride</a>
                        <button onClick={onNavigateToAbout} className="text-white font-bold hover:text-primary transition-colors">About Us</button>
                    </nav>
                     <div className="flex items-center gap-4">
                        <button onClick={onNavigateToLogin} className="text-white font-bold hover:text-primary transition-colors">
                            Admin/Driver Login
                        </button>
                        <button onClick={() => setIsMenuOpen(true)} className="md:hidden p-2 text-white"><MenuIcon className="h-6 w-6"/></button>
                     </div>
                </div>
            </header>
            
            {isMenuOpen && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 animate-fade-in" onClick={() => setIsMenuOpen(false)}>
                    <div className="bg-black w-64 h-full p-6 flex flex-col" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-8">
                           <Logo />
                           <button onClick={() => setIsMenuOpen(false)} className="text-white p-2"><XIcon/></button>
                        </div>
                        <nav className="flex flex-col gap-4 text-lg">
                            <a href="#available-cars" onClick={() => setIsMenuOpen(false)} className="text-white font-bold hover:text-primary transition-colors">Find a Ride</a>
                            <button onClick={() => { onNavigateToAbout(); setIsMenuOpen(false); }} className="text-white font-bold hover:text-primary transition-colors text-left">About Us</button>
                        </nav>
                    </div>
                </div>
            )}

            <div className="relative h-[60vh] md:h-[70vh] bg-black">
                <div className="absolute inset-0 bg-black/60 z-10"></div>
                <video autoPlay loop muted playsInline className="absolute inset-0 w-full h-full object-cover">
                     <source src="https://storage.googleapis.com/project-screenshots/sajilo-hero-bg.mp4" type="video/mp4" />
                </video>
                <div className="relative z-10 flex flex-col items-center justify-center h-full text-white text-center p-4">
                    <h1 className="text-4xl md:text-6xl font-extrabold text-shadow animate-fade-in">Your Journey Starts Here</h1>
                    <p className="mt-4 text-lg md:text-xl max-w-2xl text-shadow animate-fade-in" style={{animationDelay: '0.2s'}}>
                        Reliable shared & private taxis across Sikkim, Darjeeling & beyond. Book your seat in minutes.
                    </p>
                </div>
            </div>
            
            <div className="bg-white relative -mt-32 md:-mt-24 z-10">
                <div className="container mx-auto px-4">
                    <div className="bg-white/90 backdrop-blur-lg border-2 border-gray-200 p-6 md:p-8 rounded-2xl shadow-2xl">
                        <form onSubmit={(e) => { e.preventDefault(); scrollToCars(); }} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                            <div className="md:col-span-4 relative">
                                <label className="block text-sm font-bold text-dark mb-1">From</label>
                                <select name="from" value={bookingCriteria.from} onChange={handleCriteriaChange} required className="block w-full px-3 py-3 bg-white text-dark border-2 border-gray-400 rounded-lg font-semibold">
                                    {locations.map(loc => <option key={loc} value={loc}>{loc}</option>)}
                                </select>
                            </div>
                            <div className="hidden md:flex justify-center items-center h-full md:col-span-1">
                                <button type="button" onClick={handleSwapLocations} className="mt-6 p-2 rounded-full bg-gray-200 text-dark hover:bg-primary transition-colors"><SwapIcon className="h-5 w-5"/></button>
                            </div>
                             <div className="md:col-span-4">
                                <label className="block text-sm font-bold text-dark mb-1">To</label>
                                <select name="to" value={bookingCriteria.to} onChange={handleCriteriaChange} required className="block w-full px-3 py-3 bg-white text-dark border-2 border-gray-400 rounded-lg font-semibold">
                                     {locations.map(loc => <option key={loc} value={loc}>{loc}</option>)}
                                </select>
                            </div>
                             <div className="md:col-span-3 lg:col-span-1">
                                <label className="block text-sm font-bold text-dark mb-1">Seats</label>
                                <div className="flex items-center border-2 border-gray-400 rounded-lg">
                                    <button type="button" onClick={() => handleSeatChange(-1)} className="p-3 text-dark"><MinusIcon/></button>
                                    <input type="text" value={bookingCriteria.seats} readOnly className="w-full text-center font-bold text-lg bg-transparent" />
                                    <button type="button" onClick={() => handleSeatChange(1)} className="p-3 text-dark"><PlusIcon/></button>
                                </div>
                            </div>
                            <div className="md:col-span-12 lg:col-span-2">
                                <button type="submit" className="w-full bg-primary text-dark font-bold py-3 px-8 rounded-xl flex items-center justify-center gap-2 hover:bg-yellow-500 transition-transform transform hover:scale-105">
                                    <TaxiIcon className="h-6 w-6" />
                                    <span className="font-bold text-lg">
                                        <span className="hidden sm:inline">Find Your Ride</span>
                                        <span className="sm:hidden">Search Cabs</span>
                                    </span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>

            {filteredCars.length > 0 && (
                <div className="bg-light-gray" id="available-cars">
                    <div className="container mx-auto px-4 md:px-6 lg:px-8 py-12">
                        <h2 className="text-3xl font-bold text-center text-dark mb-8">Available Cars</h2>
                        <div className="grid grid-cols-1 gap-6">
                            {filteredCars.map(car => (
                                <div key={car.id} className="bg-white border-2 border-gray-200 rounded-xl shadow-md overflow-hidden flex flex-col md:flex-row animate-fade-in">
                                    <div className="md:w-1/3">
                                        <img src={car.imageUrl} alt={car.type} className="w-full h-48 md:h-full object-cover"/>
                                    </div>
                                    <div className="p-6 flex-grow flex flex-col">
                                        <div className="flex-grow">
                                            <h3 className="text-lg font-bold text-dark">{car.vehicle}</h3>
                                            <p className="text-gray-600">{car.type}</p>
                                            <div className="mt-4 flex items-center gap-4 text-sm text-dark">
                                                <div className="flex items-center gap-2"><ClockIcon className="h-5 w-5 text-gray-500"/>{car.departureTime} Departure</div>
                                                <div className="flex items-center gap-2"><SeatIcon className="h-5 w-5 text-gray-500"/>{car.availableSeats} Seats Left</div>
                                            </div>
                                            <div className="mt-2 flex items-center gap-2 text-sm text-dark"><DriverIcon className="h-5 w-5 text-gray-500"/>{car.driverName}</div>
                                        </div>
                                        <div className="mt-6 md:mt-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                            <p className="text-xl md:text-2xl font-bold text-dark">₹{car.price.toLocaleString()}<span className="text-sm md:text-base font-normal">/seat</span></p>
                                            <button onClick={() => onBook(car, bookingCriteria)} className="bg-secondary text-white font-bold py-3 px-6 rounded-xl hover:bg-blue-700 transition-colors">Book Now</button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
            
             <footer className="bg-black text-white">
                <div className="container mx-auto px-4 md:px-6 lg:px-8 py-12">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                        <div><Logo /><p className="text-gray-400 mt-4 text-sm">Your trusted travel partner in the Himalayas.</p></div>
                        <div><h4 className="font-bold text-lg mb-4">Quick Links</h4><ul className="space-y-2">
                            <li><button onClick={onNavigateHome} className="text-gray-400 hover:text-primary">Home</button></li>
                            <li><button onClick={onNavigateToAbout} className="text-gray-400 hover:text-primary">About Us</button></li>
                        </ul></div>
                         <div><h4 className="font-bold text-lg mb-4">Legal</h4><ul className="space-y-2">
                            <li><button onClick={() => setViewingPolicy('payment')} className="text-gray-400 hover:text-primary">Payment Policy</button></li>
                            <li><button onClick={() => setViewingPolicy('terms')} className="text-gray-400 hover:text-primary">Terms of Service</button></li>
                            <li><button onClick={() => setViewingPolicy('refund')} className="text-gray-400 hover:text-primary">Refund Policy</button></li>
                        </ul></div>
                         <div><h4 className="font-bold text-lg mb-4">Contact Us</h4><p className="text-gray-400 text-sm">Jila Parishad Road, Pradhan Para, East Salugara, 734001</p></div>
                    </div>
                     <div className="mt-8 pt-8 border-t border-gray-800 text-center text-gray-500 text-sm">
                        &copy; {new Date().getFullYear()} Sajilo Taxi. All Rights Reserved.
                    </div>
                </div>
            </footer>
            
            <Modal isOpen={!!viewingPolicy} onClose={() => setViewingPolicy(null)} title={viewingPolicy ? policies[viewingPolicy].title : ''}>
                {viewingPolicy && (
                    <div className="space-y-4">
                        {policies[viewingPolicy].content.map((item, index) => (
                            <div key={index}>
                                <h5 className="font-bold text-dark">{item.heading}</h5>
                                <p className="text-dark/80">{item.text}</p>
                            </div>
                        ))}
                    </div>
                )}
            </Modal>
        </div>
    );
};

// ... (rest of the components: SeatSelectionPage, PaymentPage, TripTrackingPage, AboutUsPage, CustomerApp)
const SeatSelectionPage = ({ car, bookingDetails, pickupPoints, onConfirm, onBack, trips, onNavigateHome }: SeatSelectionPageProps) => {
    const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
    const [pickup, setPickup] = useState('');
    const [drop, setDrop] = useState('');

    useEffect(() => {
        const fromPoints = getPointsForLocation(bookingDetails.from, pickupPoints);
        const toPoints = getPointsForLocation(bookingDetails.to, pickupPoints);
        if (fromPoints.length > 0) setPickup(fromPoints[0]);
        if (toPoints.length > 0) setDrop(toPoints[0]);
    }, [bookingDetails, pickupPoints]);
    
    const bookedSeats = useMemo(() => {
        return trips
            .filter(trip => trip.car.id === car.id && trip.booking.date === bookingDetails.date)
            .flatMap(trip => trip.details.selectedSeats);
    }, [trips, car, bookingDetails.date]);

    const handleSeatClick = (seat: string) => {
        setSelectedSeats(prev => {
            if (prev.includes(seat)) {
                return prev.filter(s => s !== seat);
            }
            if (prev.length < bookingDetails.seats) {
                return [...prev, seat];
            }
            return prev;
        });
    };
    
    const renderSeats = () => {
        let seatLayout;
        const commonClasses = "w-10 h-10 rounded-md flex items-center justify-center font-bold text-xs border-2 transition-colors";
        const getSeatClasses = (seat: string) => {
            if (bookedSeats.includes(seat)) return `${commonClasses} bg-gray-300 border-gray-400 text-gray-500 cursor-not-allowed`;
            if (selectedSeats.includes(seat)) return `${commonClasses} bg-primary border-dark text-dark cursor-pointer`;
            return `${commonClasses} bg-white border-gray-400 text-dark hover:bg-yellow-100 cursor-pointer`;
        };
        const createSeat = (seat: string) => <button key={seat} onClick={() => handleSeatClick(seat)} disabled={bookedSeats.includes(seat)} className={getSeatClasses(seat)}>{seat}</button>;

        // Example layouts based on common vehicle types
        if (car.type.toLowerCase().includes('suv')) { // 2-3-2 layout
            seatLayout = (<>
                <div className="flex justify-between">{['D', <SteeringWheelIcon className="w-10 h-10 text-gray-400"/>].map((s, i) => typeof s === 'string' ? createSeat(s) : <div key={i}>{s}</div>)}</div>
                <div className="flex justify-between">{['S1', 'S2', 'S3'].map(createSeat)}</div>
                <div className="flex justify-between">{['S4', 'S5'].map(createSeat)}</div>
            </>);
        } else if (car.type.toLowerCase().includes('sumo')) { // 2-4-4 layout
            seatLayout = (<>
                <div className="flex justify-between">{['D', <SteeringWheelIcon className="w-10 h-10 text-gray-400"/>].map((s, i) => typeof s === 'string' ? createSeat(s) : <div key={i}>{s}</div>)}</div>
                <div className="flex justify-between">{['S1', 'S2', 'S3', 'S4'].map(createSeat)}</div>
                <div className="flex justify-between">{['S5', 'S6', 'S7', 'S8'].map(createSeat)}</div>
            </>);
        } else { // Default sedan 2-2 layout
            seatLayout = (<>
                <div className="flex justify-between">{['D', <SteeringWheelIcon className="w-10 h-10 text-gray-400"/>].map((s, i) => typeof s === 'string' ? createSeat(s) : <div key={i}>{s}</div>)}</div>
                <div className="flex justify-between">{['S1', 'S2'].map(createSeat)}</div>
            </>);
        }
        return <div className="bg-gray-200 border-4 border-gray-400 rounded-xl p-4 space-y-3 max-w-xs mx-auto">{seatLayout}</div>;
    };


    const canProceed = selectedSeats.length === bookingDetails.seats && pickup && drop;

    return (
        <div className="min-h-screen flex flex-col bg-light-gray">
            <header className="bg-black/90 backdrop-blur-md p-4 border-b-2 border-primary/30 sticky top-0 z-10 flex items-center">
                <button onClick={onBack} className="p-2 rounded-full text-white hover:bg-white/10 transition-colors" aria-label="Go back"><BackArrowIcon className="h-6 w-6"/></button>
                <div className="flex-grow text-center"><button onClick={onNavigateHome} aria-label="Go to homepage"><Logo /></button></div><div className="w-10"></div>
            </header>
            <main className="flex-grow p-4">
                <div className="w-full max-w-4xl mx-auto">
                    <div className="text-center mb-6">
                        <h1 className="text-3xl font-bold text-dark">Select Your Seats</h1>
                        <p className="text-dark/80">Choose your preferred seats and pickup/drop points for your trip.</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                        <div className="bg-white border-2 border-gray-200 rounded-2xl p-6">
                            <h2 className="font-bold text-dark text-xl mb-4 text-center">Seat Layout</h2>
                            {renderSeats()}
                             <div className="flex items-center justify-center gap-6 mt-4 text-sm">
                                <div className="flex items-center gap-2"><div className="w-4 h-4 rounded bg-white border-2 border-gray-400"></div>Available</div>
                                <div className="flex items-center gap-2"><div className="w-4 h-4 rounded bg-primary border-2 border-dark"></div>Selected</div>
                                <div className="flex items-center gap-2"><div className="w-4 h-4 rounded bg-gray-300 border-2 border-gray-400"></div>Booked</div>
                            </div>
                        </div>

                        <div className="bg-white border-2 border-gray-200 rounded-2xl p-6">
                            <h2 className="font-bold text-dark text-xl mb-4">Trip Details</h2>
                            <div className="space-y-4">
                                <div><label className="block text-sm font-bold text-dark mb-1">Pickup Point (From: {bookingDetails.from})</label><select value={pickup} onChange={e => setPickup(e.target.value)} required className="block w-full px-3 py-3 bg-white text-dark border-2 border-gray-400 rounded-lg font-semibold"><option value="" disabled>Select a pickup point</option>{getPointsForLocation(bookingDetails.from, pickupPoints).map(p => <option key={p} value={p}>{p}</option>)}</select></div>
                                <div><label className="block text-sm font-bold text-dark mb-1">Drop Point (To: {bookingDetails.to})</label><select value={drop} onChange={e => setDrop(e.target.value)} required className="block w-full px-3 py-3 bg-white text-dark border-2 border-gray-400 rounded-lg font-semibold"><option value="" disabled>Select a drop point</option>{getPointsForLocation(bookingDetails.to, pickupPoints).map(p => <option key={p} value={p}>{p}</option>)}</select></div>
                            </div>
                            <div className="mt-6 bg-light-gray p-4 rounded-lg border border-gray-300">
                                <h3 className="font-bold text-dark">Your Selection</h3>
                                <div className="flex justify-between items-center mt-2"><span className="text-dark">Seats Selected:</span><span className="font-bold text-dark">{selectedSeats.length} / {bookingDetails.seats}</span></div>
                                <div className="flex justify-between items-center mt-1"><span className="text-dark">Selected Seat No(s):</span><span className="font-bold text-dark">{selectedSeats.join(', ') || 'None'}</span></div>
                            </div>
                            <button onClick={() => onConfirm({ selectedSeats, pickup, drop })} disabled={!canProceed} className="w-full mt-6 bg-primary text-dark font-bold py-3 px-4 rounded-xl hover:bg-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed">
                                Proceed to Payment
                            </button>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

const PaymentPage = ({ car, bookingDetails, onConfirm, onBack, customer, onNavigateHome }: PaymentPageProps) => {
    const [isProcessing, setIsProcessing] = useState(false);
    const totalPrice = car.price * bookingDetails.selectedSeats.length;

    const handlePayment = async () => {
        setIsProcessing(true);
        try {
            const orderResponse = await fetch('/api/razorpay', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'create-order', amount: totalPrice }),
            });
            const orderData = await orderResponse.json();
            if (!orderResponse.ok) throw new Error(orderData.error || 'Failed to create payment order.');

            const options = {
                key: orderData.key,
                amount: orderData.amount,
                currency: orderData.currency,
                name: "Sajilo Taxi",
                description: `Booking for ${car.vehicle}`,
                order_id: orderData.id,
                handler: function (response: any) {
                    console.log('Payment successful:', response);
                    onConfirm();
                },
                prefill: {
                    name: customer?.name || '',
                    email: customer?.email || '',
                    contact: customer?.phone || ''
                },
                theme: { color: "#FFC107" }
            };
            const rzp = new window.Razorpay(options);
            rzp.on('payment.failed', function (response: any) {
                console.error('Payment failed:', response.error);
                alert(`Payment failed: ${response.error.description}`);
                setIsProcessing(false);
            });
            rzp.open();

        } catch (error: any) {
            console.error("Payment initiation error:", error);
            alert(`Error: ${error.message}`);
            setIsProcessing(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col bg-light-gray">
             <header className="bg-black/90 backdrop-blur-md p-4 border-b-2 border-primary/30 sticky top-0 z-10 flex items-center">
                <button onClick={onBack} className="p-2 rounded-full text-white hover:bg-white/10 transition-colors" aria-label="Go back"><BackArrowIcon className="h-6 w-6"/></button>
                <div className="flex-grow text-center"><button onClick={onNavigateHome} aria-label="Go to homepage"><Logo /></button></div><div className="w-10"></div>
            </header>
            <main className="flex-grow p-4 flex flex-col items-center justify-center">
                <div className="w-full max-w-md mx-auto bg-white border-2 border-gray-200 p-8 rounded-2xl shadow-2xl">
                    <h1 className="text-3xl font-bold text-dark text-center">Confirm Your Booking</h1>
                    <div className="mt-6 border-t-2 border-gray-200 pt-6 space-y-2">
                         <div className="flex justify-between text-dark"><span className="font-semibold">Vehicle:</span><span>{car.vehicle}</span></div>
                         <div className="flex justify-between text-dark"><span className="font-semibold">Route:</span><span>{bookingDetails.from} to {bookingDetails.to}</span></div>
                         <div className="flex justify-between text-dark"><span className="font-semibold">Date:</span><span>{new Date(bookingDetails.date).toLocaleDateString('en-GB')}</span></div>
                         <div className="flex justify-between text-dark"><span className="font-semibold">Seats:</span><span>{bookingDetails.selectedSeats.join(', ')} ({bookingDetails.selectedSeats.length})</span></div>
                         <div className="flex justify-between text-dark"><span className="font-semibold">Price per Seat:</span><span>₹{car.price.toLocaleString()}</span></div>
                    </div>
                     <div className="mt-4 border-t-2 border-dashed border-gray-300 pt-4 flex justify-between items-baseline">
                         <span className="text-xl font-bold text-dark">Total Amount:</span>
                         <span className="text-3xl font-bold text-dark">₹{totalPrice.toLocaleString()}</span>
                    </div>
                     <button onClick={handlePayment} disabled={isProcessing} className="w-full mt-8 bg-primary text-dark font-bold py-3 px-4 rounded-xl hover:bg-yellow-500 disabled:opacity-50">
                        {isProcessing ? 'Processing...' : 'Pay & Confirm'}
                    </button>
                </div>
            </main>
        </div>
    );
};

const TripTrackingPage = ({ car, trip, onBack, onNavigateHome }: TripTrackingPageProps) => {
    const { isLoaded, loadError } = useJsApiLoader({ googleMapsApiKey });
    // FIX: Use `any` for the state type to resolve the "Cannot find namespace 'google'" error.
    // The google.maps types are not available at compile time in this project setup.
    const [directions, setDirections] = useState<any | null>(null);

    useEffect(() => {
        if (isLoaded && car.location && car.destination) {
            const directionsService = new window.google.maps.DirectionsService();
            directionsService.route(
                {
                    origin: new window.google.maps.LatLng(car.location[0], car.location[1]),
                    destination: new window.google.maps.LatLng(car.destination[0], car.destination[1]),
                    travelMode: window.google.maps.TravelMode.DRIVING,
                },
                (result, status) => {
                    if (status === window.google.maps.DirectionsStatus.OK) {
                        setDirections(result);
                    } else {
                        console.error(`error fetching directions ${result}`);
                    }
                }
            );
        }
    }, [isLoaded, car.location, car.destination]);

    const center = { lat: car.location[0], lng: car.location[1] };
    
    return (
        <div className="min-h-screen flex flex-col bg-light-gray">
             <header className="bg-black/90 backdrop-blur-md p-4 border-b-2 border-primary/30 sticky top-0 z-10 flex items-center">
                <button onClick={onBack} className="p-2 rounded-full text-white hover:bg-white/10 transition-colors" aria-label="Go back"><BackArrowIcon className="h-6 w-6"/></button>
                <div className="flex-grow text-center"><button onClick={onNavigateHome} aria-label="Go to homepage"><Logo /></button></div><div className="w-10"></div>
            </header>
            <main className="flex-grow flex flex-col">
                <div className="w-full flex-grow relative">
                    {loadError && <div>Error loading map</div>}
                    {!isLoaded && <div className="flex items-center justify-center h-full">Loading Map...</div>}
                    {isLoaded && (
                        <GoogleMap mapContainerStyle={{ width: '100%', height: '100%' }} center={center} zoom={12}>
                            <MarkerF position={center} title="Your Taxi" />
                            {directions && <Polyline path={directions.routes[0].overview_path} options={{ strokeColor: '#0D6EFD', strokeWeight: 5 }} />}
                        </GoogleMap>
                    )}
                </div>
                 <div className="p-4 bg-white border-t-2 border-gray-200">
                    <h2 className="font-bold text-xl text-dark">Your Trip to {car.to}</h2>
                    <p className="text-gray-600">You have booked seats: {trip.details.selectedSeats.join(', ')}</p>
                    <div className="mt-4 bg-light-gray p-4 rounded-lg border border-gray-300 grid grid-cols-2 gap-4">
                        <div><h3 className="font-bold text-dark">Driver</h3><p>{car.driverName}</p></div>
                        <div><h3 className="font-bold text-dark">Vehicle</h3><p>{car.vehicle}</p></div>
                         <div><h3 className="font-bold text-dark">Phone</h3><a href={`tel:${car.driverPhone}`} className="text-secondary hover:underline">{car.driverPhone}</a></div>
                    </div>
                </div>
            </main>
        </div>
    );
};

const AboutUsPage = ({ onBack, onNavigateHome }: AboutUsPageProps) => (
    <div className="min-h-screen bg-light-gray">
         <header className="bg-black/90 backdrop-blur-md p-4 border-b-2 border-primary/30 sticky top-0 z-10 flex items-center">
            <button onClick={onBack} className="p-2 rounded-full text-white hover:bg-white/10 transition-colors" aria-label="Go back"><BackArrowIcon className="h-6 w-6"/></button>
            <div className="flex-grow text-center"><button onClick={onNavigateHome} aria-label="Go to homepage"><Logo /></button></div><div className="w-10"></div>
        </header>
        <main className="container mx-auto p-4 md:p-8">
            <div className="text-center mb-12"><h1 className="text-4xl md:text-5xl font-extrabold text-dark">Your Trusted Himalayan Travel Partner</h1><p className="mt-4 text-lg text-dark/80 max-w-3xl mx-auto">Connecting destinations, creating memories. Sajilo Taxi is more than a service; it's a promise of a safe, comfortable, and reliable journey.</p></div>
            <div className="grid md:grid-cols-3 gap-8 text-center mb-12">
                <div><SafetyShieldIcon className="h-12 w-12 mx-auto text-primary mb-4"/><h3 className="text-xl font-bold text-dark">Safety First</h3><p className="text-dark/80 mt-2">Verified drivers and well-maintained vehicles ensure your journey is always safe.</p></div>
                <div><PriceTagIcon className="h-12 w-12 mx-auto text-primary mb-4"/><h3 className="text-xl font-bold text-dark">Transparent Pricing</h3><p className="text-dark/80 mt-2">No hidden charges. Enjoy fair and upfront pricing for all our routes and services.</p></div>
                <div><ClockIcon className="h-12 w-12 mx-auto text-primary mb-4" stroke="currentColor" fill="none" /><h3 className="text-xl font-bold text-dark">Punctual Service</h3><p className="text-dark/80 mt-2">We value your time. Our drivers are committed to on-time pickups and drop-offs.</p></div>
            </div>
            <div className="bg-white p-8 rounded-2xl border-2 border-gray-200"><QuoteIcon className="h-10 w-10 text-gray-300 mb-4"/><p className="text-xl md:text-2xl text-dark font-semibold leading-relaxed">"Our mission is to make travel in the beautiful yet challenging terrains of Sikkim and its neighboring regions simple, accessible, and hassle-free for everyone. We started with a single cab and a big dream, and today we are proud to serve thousands of travelers, powered by technology and a commitment to excellence."</p><p className="mt-4 font-bold text-dark">- Founder, Sajilo Taxi</p></div>
        </main>
    </div>
);

export const CustomerApp = ({ dataApi }: CustomerAppProps) => {
    type Page = 'booking' | 'seat_selection' | 'auth' | 'payment' | 'tracking' | 'about';
    const [page, setPage] = useState<Page>('booking');
    const [selectedCar, setSelectedCar] = useState<Cab | null>(null);
    const [bookingDetails, setBookingDetails] = useState<BookingCriteria | null>(null);
    const [seatSelection, setSeatSelection] = useState<SeatSelectionDetails | null>(null);
    const [customer, setCustomer] = useState<Customer | null>(null);
    const [currentTrip, setCurrentTrip] = useState<Trip | null>(null);

    const { locations, pickupPoints, availableCars, trips } = dataApi.customer.getData();

    const handleBook = (car: Cab, criteria: BookingCriteria) => {
        setSelectedCar(car);
        setBookingDetails(criteria);
        setPage('seat_selection');
    };
    const handleSeatConfirm = (details: SeatSelectionDetails) => {
        setSeatSelection(details);
        if (customer) setPage('payment'); else setPage('auth');
    };
    const handleAuthSuccess = (authedCustomer: Customer) => {
        setCustomer(authedCustomer);
        setPage('payment');
    };
    const handlePaymentConfirm = async () => {
        if (selectedCar && bookingDetails && seatSelection && customer) {
            const newTrip: Trip = {
                id: Date.now(),
                customer: customer,
                car: selectedCar,
                booking: bookingDetails,
                details: seatSelection,
                timestamp: new Date().toISOString()
            };
            dataApi.customer.bookTrip(newTrip);
            setCurrentTrip(newTrip);
            setPage('tracking');
            // Asynchronously send SMS and Email confirmations
            try {
                fetch('/api/otp', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        action: 'send-booking-confirmation',
                        phone: customer.phone,
                        customerName: customer.name,
                        vehicle: selectedCar.vehicle,
                        from: bookingDetails.from,
                        to: bookingDetails.to,
                        date: bookingDetails.date,
                        time: selectedCar.departureTime,
                    })
                });
                fetch('/api/send-confirmation', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ trip: newTrip })
                });
            } catch (e) { console.error("Failed to send notifications:", e); }
        }
    };
    const resetBookingFlow = () => {
        setPage('booking');
        setSelectedCar(null);
        setBookingDetails(null);
        setSeatSelection(null);
    };

    switch (page) {
        case 'seat_selection': return <SeatSelectionPage car={selectedCar!} bookingDetails={bookingDetails!} pickupPoints={pickupPoints} onConfirm={handleSeatConfirm} onBack={() => setPage('booking')} trips={trips} onNavigateHome={resetBookingFlow}/>;
        case 'auth': return <CustomerAuthPage onAuthSuccess={handleAuthSuccess} onBack={() => setPage('seat_selection')} dataApi={dataApi} onNavigateHome={resetBookingFlow} />;
        case 'payment': return <PaymentPage car={selectedCar!} bookingDetails={{...bookingDetails!, ...seatSelection!}} customer={customer} onConfirm={handlePaymentConfirm} onBack={() => setPage(customer ? 'seat_selection' : 'auth')} onNavigateHome={resetBookingFlow} />;
        case 'tracking': return <TripTrackingPage car={selectedCar!} trip={currentTrip!} onBack={resetBookingFlow} onNavigateHome={resetBookingFlow}/>;
        case 'about': return <AboutUsPage onBack={() => setPage('booking')} onNavigateHome={resetBookingFlow}/>;
        default: return <BookingPage locations={locations} availableCars={availableCars} onBook={handleBook} trips={trips} onNavigateToAbout={() => setPage('about')} onNavigateToLogin={() => window.location.href = '/admin'} onNavigateHome={resetBookingFlow} />;
    }
};