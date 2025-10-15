import React, { useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import type { 
    Cab, Trip, Customer, BookingCriteria, SeatSelectionDetails, PickupPoints, EnrichedCab,
    BookingPageProps, SeatSelectionPageProps,
    PaymentPageProps, TripTrackingPageProps, AboutUsPageProps, CustomerAppProps
} from '../types.ts';
// FIX: Import `CheckCircleIcon` to resolve usage error.
import {
    ClockIcon, BackArrowIcon, UserIcon, PlusIcon, MinusIcon, EmailIcon,
    SteeringWheelIcon, SeatIcon, CreditCardIcon, WalletIcon, PhoneIcon,
    SparklesIcon, DriverIcon, SwapIcon, SafetyShieldIcon, PriceTagIcon, QuoteIcon,
    MenuIcon, XIcon, CheckCircleIcon
} from './icons.tsx';
import { Logo, Modal } from './ui.tsx';
import { CustomerAuthPage } from './auth.tsx';

const getPointsForLocation = (location: string, allPoints: PickupPoints) => {
    return allPoints[location] || allPoints['Default'];
}

const BookingPage = ({ locations, availableCars, onBook, trips, onNavigateToAbout, onNavigateToLogin, onNavigateHome }: BookingPageProps) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [bookingCriteria, setBookingCriteria] = useState<BookingCriteria>(() => {
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
    
    const [viewingPolicy, setViewingPolicy] = useState<'payment' | 'terms' | 'refund' | null>(null);

    const policies = {
        payment: {
            title: 'Payment Policy',
            content: [
                { heading: 'Accepted Payment Methods', text: 'We accept payments via Razorpay, supporting credit/debit cards, UPI, net banking, and popular wallets in India.' },
                { heading: 'Payment Confirmation', text: 'All bookings/orders are confirmed only after successful payment through Razorpay.' },
                { heading: 'Security', text: 'All transactions are securely processed via Razorpay. We do not store any card or banking details.' },
                { heading: 'Payment Failures', text: 'In case of payment failure or decline, please retry or contact Razorpay support. The company is not liable for failures caused by banking or network issues.' },
                { heading: 'Taxes & Fees', text: 'All applicable GST or transaction fees are included in the total displayed at checkout.' },
                { heading: 'Support', text: 'For any payment or refund issues, contact sajilotaxi@gmail.com / 7478356030' },
            ],
        },
        terms: {
            title: 'Terms and Conditions',
            content: [
                { heading: 'Acceptance', text: 'By using our services/website, you agree to these terms.' },
                { heading: 'Service Usage', text: 'Services/products must be used for lawful purposes only.' },
                { heading: 'Order Confirmation', text: 'All bookings/orders are subject to availability and confirmed after payment.' },
                { heading: 'Pricing & Changes', text: 'Prices are as displayed and subject to change without prior notice. Once payment is made, the price is fixed for that transaction.' },
                { heading: 'Intellectual Property', text: 'All content, logos, and media are property of Sajilo Taxi and cannot be reused without permission.' },
                { heading: 'Liability', text: 'We are not liable for indirect or consequential losses arising from use of our services.' },
                { heading: 'Governing Law', text: 'These terms are governed by Indian laws. Any disputes will be subject to the courts of Siliguri, West Bengal.' },
            ],
        },
        refund: {
            title: 'Refund Policy',
            content: [
                { heading: 'Refund Eligibility', text: 'Refunds are provided if: The service/product is not delivered. Technical errors occur during payment via Razorpay.' },
                { heading: 'Non-Refundable', text: 'Refunds are not available for: Change of mind or personal preference. Partial usage of services/products.' },
                { heading: 'Refund Process', text: 'Requests must be submitted within 7 days of purchase to sajilotaxi@gmail.com / 7478356030. Refunds will be processed via Razorpay to the original payment method. Processing may take 5–7 business days depending on the bank/payment method.' },
                { heading: 'Cancellations', text: 'Orders canceled before service delivery will follow the above rules.' },
                { heading: 'Support', text: 'For any payment or refund issues, contact sajilotaxi@gmail.com / 7478356030' },
            ],
        },
    };

    const { from, to, date, seats } = bookingCriteria;
    
    const setFrom = (newFrom: string) => setBookingCriteria(c => ({...c, from: newFrom}));
    const setTo = (newTo: string) => setBookingCriteria(c => ({...c, to: newTo}));
    const setDate = (newDate: string) => setBookingCriteria(c => ({...c, date: newDate}));
    const handleSeatChange = (amount: number) => {
        setBookingCriteria(c => ({ ...c, seats: Math.max(1, Math.min(10, c.seats + amount)) }))
    };
    
    const handleSwapLocations = () => {
        setBookingCriteria(c => ({ ...c, from: c.to, to: c.from }));
    };

    const handlePopularRouteChange = (from: string, to: string) => {
        setBookingCriteria(c => ({ ...c, from, to }));
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDestinationClick = (destination: string) => {
        setBookingCriteria(c => ({ ...c, to: destination }));
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const whyChooseUsItems = [
        { icon: DriverIcon, title: "Professional Drivers", text: "Verified, experienced, and courteous local drivers." },
        { icon: SafetyShieldIcon, title: "Safety First", text: "Well-maintained vehicles with a focus on your safety." },
        { icon: SparklesIcon, title: "Easy Booking", text: "Book in seconds with our simple and intuitive interface." },
        { icon: PriceTagIcon, title: "Transparent Pricing", text: "No hidden fees. The price you see is what you pay." }
    ];

    const popularRoutes = [
        { from: 'Gangtok', to: 'Siliguri' },
        { from: 'Darjeeling', to: 'Pelling' },
        { from: 'Kalimpong', to: 'Gangtok' },
        { from: 'Siliguri', to: 'Darjeeling' },
    ];

    const testimonials = [
        { quote: "Booking with Sajilo Taxi was a breeze! The driver was on time, the car was clean, and the journey was fantastic. Highly recommended!", name: "Ananya S.", from: "Mumbai" },
        { quote: "The best taxi service in Sikkim. Very professional and reliable. Made our family trip so much easier.", name: "Rajesh K.", from: "Delhi" },
        { quote: "I travel frequently for work and Sajilo Taxi is my go-to. Always punctual and the drivers know the routes perfectly.", name: "Priya G.", from: "Kolkata" }
    ];
    
    const destinations = [
        { name: "Gangtok", image: "https://images.unsplash.com/photo-1603565437435-322a577a1b83?q=80&w=1974&auto=format&fit=crop" },
        { name: "Pelling", image: "https://images.unsplash.com/photo-1626915015387-b605c453f65e?q=80&w=1932&auto=format&fit=crop" },
        { name: "Lachung", image: "https://images.unsplash.com/photo-1620353130369-f88755677a28?q=80&w=1964&auto=format&fit=crop" },
        { name: "Darjeeling", image: "https://images.unsplash.com/photo-1619129999918-971c01f609a5?q=80&w=1935&auto=format&fit=crop" }
    ];


    const filteredCars = useMemo(() => {
        return availableCars
            .map(car => {
                const tripsForThisCarOnThisDate = trips.filter(t => t.car.id === car.id && t.booking.date === date);
                const seatsAlreadyBooked = tripsForThisCarOnThisDate.reduce((sum, t) => sum + (t.details?.selectedSeats?.length || 0), 0);
                const availableSeats = car.totalSeats - seatsAlreadyBooked;
                return { ...car, availableSeats };
            })
            .filter(car => car.from === from && car.to === to && car.availableSeats >= seats);
    }, [availableCars, from, to, seats, date, trips]);
    
    const bookingDetailsForCar = { from, to, date, seats };

    return (
        <div className="min-h-screen flex flex-col bg-light-gray">
            <header className="bg-black/90 backdrop-blur-md p-4 border-b-2 border-primary/30 sticky top-0 z-20">
                <div className="flex justify-between items-center">
                    <button onClick={onNavigateHome} aria-label="Go to homepage"><Logo /></button>

                    {/* Desktop Nav */}
                    <nav className="hidden md:flex items-center gap-4">
                        <a 
                            href="/driver-onboarding"
                            className="font-bold text-black bg-primary hover:bg-yellow-500 transition-colors px-4 py-2 rounded-lg"
                        >
                            Become a Sajilo Hero
                        </a>
                        <a 
                            href="https://littlemonktravels.com/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-bold text-black bg-primary hover:bg-yellow-500 transition-colors px-4 py-2 rounded-lg"
                        >
                            From Taxi to Tour
                        </a>
                        <button 
                            onClick={onNavigateToAbout} 
                            className="font-bold text-black bg-primary hover:bg-yellow-500 transition-colors px-4 py-2 rounded-lg"
                        >
                            About Us
                        </button>
                        <button 
                            onClick={onNavigateToLogin}
                            className="font-bold text-black bg-primary hover:bg-yellow-500 transition-colors px-4 py-2 rounded-lg"
                        >
                            Signup or Login
                        </button>
                    </nav>

                    {/* Mobile Menu Button */}
                    <div className="md:hidden">
                        <button 
                            onClick={() => setIsMenuOpen(!isMenuOpen)} 
                            className="p-2 rounded-md text-white hover:bg-white/10 transition-colors"
                            aria-label="Toggle menu"
                        >
                            {isMenuOpen ? <XIcon className="h-6 w-6" /> : <MenuIcon className="h-6 w-6" />}
                        </button>
                    </div>
                </div>
                
                {/* Mobile Menu Panel */}
                {isMenuOpen && (
                    <nav className="md:hidden mt-4 animate-fade-in">
                        <ul className="flex flex-col gap-2">
                            <li><a href="/driver-onboarding" className="block text-center font-bold text-black bg-primary hover:bg-yellow-500 transition-colors px-4 py-3 rounded-lg">Become a Sajilo Hero</a></li>
                            <li><a href="https://littlemonktravels.com/" target="_blank" rel="noopener noreferrer" className="block text-center font-bold text-black bg-primary hover:bg-yellow-500 transition-colors px-4 py-3 rounded-lg">From Taxi to Tour</a></li>
                            <li><button onClick={() => { onNavigateToAbout(); setIsMenuOpen(false); }} className="w-full text-center font-bold text-black bg-primary hover:bg-yellow-500 transition-colors px-4 py-3 rounded-lg">About Us</button></li>
                            <li><button onClick={() => { onNavigateToLogin(); setIsMenuOpen(false); }} className="w-full text-center font-bold text-black bg-primary hover:bg-yellow-500 transition-colors px-4 py-3 rounded-lg">Signup or Login</button></li>
                        </ul>
                    </nav>
                )}
            </header>
            
            <div className="flex-grow w-full max-w-7xl mx-auto p-4 lg:p-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-1">
                        <div className="bg-white border-2 border-gray-200 shadow-xl rounded-xl p-6 sticky top-28">
                            <h2 className="text-2xl font-bold text-dark mb-4">Book Your Ride</h2>
                            <form className="space-y-4">
                                <div>
                                    <label htmlFor="from" className="block text-sm font-bold text-dark mb-1">From</label>
                                    <select id="from" value={from} onChange={e => setFrom(e.target.value)} className="block w-full px-3 py-3 bg-white text-dark border-2 border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary font-semibold">
                                        {locations.map(location => <option key={location} value={location}>{location}</option>)}
                                    </select>
                                </div>
                                <div className="h-0 relative text-center">
                                    <button
                                        type="button"
                                        onClick={handleSwapLocations}
                                        className="p-2 bg-white border-2 border-gray-400 rounded-full hover:bg-gray-100 transition-colors absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10"
                                        aria-label="Swap locations"
                                    >
                                        <SwapIcon className="h-5 w-5 text-dark" />
                                    </button>
                                </div>
                                <div>
                                    <label htmlFor="to" className="block text-sm font-bold text-dark mb-1">To</label>
                                    <select id="to" value={to} onChange={e => setTo(e.target.value)} className="block w-full px-3 py-3 bg-white text-dark border-2 border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary font-semibold">
                                        {locations.map(location => <option key={location} value={location}>{location}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label htmlFor="date" className="block text-sm font-bold text-dark mb-1">Date</label>
                                    <input type="date" id="date" value={date} min={new Date().toISOString().split('T')[0]} onChange={(e) => setDate(e.target.value)}
                                        className="block w-full px-3 py-3 bg-white text-dark border-2 border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary font-semibold" />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-dark mb-1">Seats</label>
                                    <div className="flex items-center justify-between bg-white border-2 border-gray-400 rounded-lg p-1">
                                        <button type="button" onClick={() => handleSeatChange(-1)} className="p-2 text-dark hover:bg-gray-200 rounded-md" aria-label="Decrease seats"><MinusIcon /></button>
                                        <span className="font-bold text-xl text-dark">{seats}</span>
                                        <button type="button" onClick={() => handleSeatChange(1)} className="p-2 text-dark hover:bg-gray-200 rounded-md" aria-label="Increase seats"><PlusIcon /></button>
                                    </div>
                                </div>
                            </form>
                        </div>
                    </div>
                    
                    <div className="lg:col-span-2">
                        <h2 className="text-2xl font-bold text-dark mb-4">Available Departures</h2>
                         {filteredCars.length > 0 ? (
                            <div className="space-y-4">
                                {filteredCars.map(car => (
                                    <div key={car.id} className="bg-white border-2 border-gray-200 shadow-lg rounded-xl p-4 transition-all duration-300 hover:shadow-xl hover:scale-[1.02] flex flex-col sm:flex-row gap-4">
                                        <img 
                                            src={car.imageUrl || 'https://placehold.co/128x96/f8f9fa/333333?text=Sajilo+Taxi'} 
                                            alt={car.type}
                                            className="w-full sm:w-32 h-32 sm:h-24 object-cover rounded-lg border border-gray-300 flex-shrink-0"
                                        />
                                        <div className="flex-grow flex flex-col">
                                            <div className="flex-grow">
                                                <div className="flex justify-between">
                                                     <div>
                                                        <p className="font-bold text-lg text-dark">{car.type}</p>
                                                        <p className="text-sm text-gray-600">Vehicle: {car.vehicle}</p>
                                                    </div>
                                                    <div className="flex flex-col items-end text-right">
                                                        <p className="font-bold text-xl text-dark">₹{car.price}<span className="text-base font-normal text-gray-600">/seat</span></p>
                                                        <div className="flex items-center gap-2 text-dark mt-1">
                                                            <ClockIcon className="h-5 w-5"/>
                                                            <p className="font-bold">{car.departureTime}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                                <p className="text-sm text-gray-600 mt-1">Driver: {car.driverName}</p>
                                            </div>
                                            <div className="mt-4 pt-4 border-t border-gray-200 flex justify-between items-center">
                                                <div className="flex items-center gap-2 font-semibold text-success">
                                                    <SeatIcon className="h-5 w-5"/>
                                                    <span>{car.availableSeats} / {car.totalSeats} Seats Available</span>
                                                </div>
                                                <button onClick={() => onBook(car, bookingDetailsForCar)} className="bg-primary text-black font-bold py-2 px-6 rounded-lg hover:bg-yellow-500 transition-transform transform hover:scale-105">
                                                    Select Seats
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="bg-white border-2 border-gray-200 shadow-lg rounded-xl p-8 text-center">
                                <p className="font-bold text-dark">No scheduled cabs found.</p>
                                <p className="text-gray-600">Please try adjusting your route, date, or number of seats.</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="mt-16 space-y-16">
                    <section>
                        <h2 className="text-3xl font-bold text-dark text-center mb-8">Why Choose Sajilo Taxi?</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                            {whyChooseUsItems.map(item => (
                                <div key={item.title} className="bg-white border-2 border-gray-200 shadow-lg rounded-xl p-6 text-center">
                                    <div className="inline-block bg-primary p-3 rounded-full border-2 border-dark mb-4">
                                        <item.icon className="h-8 w-8 text-dark" />
                                    </div>
                                    <h3 className="text-xl font-bold text-dark mb-2">{item.title}</h3>
                                    <p className="text-gray-700">{item.text}</p>
                                </div>
                            ))}
                        </div>
                    </section>
                    
                    <section>
                        <h2 className="text-3xl font-bold text-dark text-center mb-8">Popular Routes</h2>
                        <div className="flex flex-wrap justify-center gap-4">
                            {popularRoutes.map(route => (
                                <button 
                                    key={`${route.from}-${route.to}`} 
                                    onClick={() => handlePopularRouteChange(route.from, route.to)}
                                    className="bg-secondary text-white font-bold py-2 px-6 rounded-lg hover:bg-blue-700 transition-transform transform hover:scale-105"
                                >
                                    {route.from} → {route.to}
                                </button>
                            ))}
                        </div>
                    </section>
                    
                    <section>
                        <h2 className="text-3xl font-bold text-dark text-center mb-8">Explore Our Destinations</h2>
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                            {destinations.map(dest => (
                                <button 
                                    key={dest.name} 
                                    onClick={() => handleDestinationClick(dest.name)}
                                    className="relative group aspect-square rounded-xl shadow-lg overflow-hidden transition-transform duration-300 ease-in-out hover:scale-105"
                                >
                                    <img 
                                        src={dest.image} 
                                        alt={dest.name} 
                                        loading="lazy"
                                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 ease-in-out group-hover:scale-110" 
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
                                    <div className="relative w-full h-full flex items-end p-4">
                                        <h3 className="text-white font-bold text-2xl text-shadow">{dest.name}</h3>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </section>
                    
                    <section>
                        <h2 className="text-3xl font-bold text-dark text-center mb-8">What Our Customers Say</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {testimonials.map((t, i) => (
                                <div key={i} className="bg-white border-2 border-gray-200 shadow-lg rounded-xl p-6">
                                    <QuoteIcon className="h-8 w-8 text-primary mb-4" />
                                    <p className="text-gray-700 italic mb-4">"{t.quote}"</p>
                                    <p className="font-bold text-dark text-right">- {t.name}, <span className="font-normal text-gray-600">{t.from}</span></p>
                                </div>
                            ))}
                        </div>
                    </section>
                </div>
            </div>
            <footer className="w-full max-w-7xl mx-auto text-dark py-6 px-4 lg:px-8">
                 <div className="bg-white border-2 border-gray-200 shadow-xl rounded-xl p-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center md:text-left">
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
                                <a href="tel:+917478356030" className="flex items-center justify-center md:justify-start gap-2 text-secondary hover:underline">
                                    <PhoneIcon className="h-5 w-5 flex-shrink-0"/>
                                    <span>+91 7478356030 / +91 9735054817</span>
                                </a>
                                <a href="mailto:sajilotaxi@gmail.com" className="flex items-center justify-center md:justify-start gap-2 text-secondary hover:underline">
                                    <EmailIcon className="h-5 w-5 flex-shrink-0"/>
                                    <span>sajilotaxi@gmail.com</span>
                                </a>
                            </div>
                        </div>
                         <div>
                            <h3 className="font-bold text-lg mb-2">Company</h3>
                            <div className="space-y-2">
                                <button onClick={onNavigateToAbout} className="text-secondary hover:underline text-left w-full text-center md:text-left">
                                    About Us
                                </button>
                            </div>
                        </div>
                    </div>
                    <div className="mt-6 pt-6 border-t border-gray-200 text-center">
                        <div className="flex flex-wrap justify-center items-center gap-x-6 gap-y-2">
                            <button onClick={() => setViewingPolicy('payment')} className="font-semibold text-gray-600 hover:text-secondary">Payment Policy</button>
                            <button onClick={() => setViewingPolicy('terms')} className="font-semibold text-gray-600 hover:text-secondary">Terms & Conditions</button>
                            <button onClick={() => setViewingPolicy('refund')} className="font-semibold text-gray-600 hover:text-secondary">Refund Policy</button>
                        </div>
                        <p className="text-sm text-gray-600 mt-4">© {new Date().getFullYear()} Sajilo Taxi. All rights reserved.</p>
                    </div>
                </div>
            </footer>

            <Modal
              isOpen={!!viewingPolicy}
              onClose={() => setViewingPolicy(null)}
              title={viewingPolicy ? policies[viewingPolicy].title : ''}
            >
              {viewingPolicy && (
                <div className="space-y-4 text-gray-700">
                  {policies[viewingPolicy].content.map((item, index) => (
                    <div key={index}>
                      <h4 className="font-bold text-dark">{item.heading}</h4>
                      <p>{item.text}</p>
                    </div>
                  ))}
                </div>
              )}
            </Modal>
            
        </div>
    );
};

const getSeatLayout = (totalSeats: number) => {
    switch (totalSeats) {
        case 4: return [['F1'], ['M1', 'M2', 'M3']]; // Standard Sedan: 4 seats
        case 6: return [['F1', 'F2'], ['M1', 'M2'], ['B1', 'B2']]; // 6-seater (2-2-2 layout)
        case 7: return [['F1', 'F2'], ['M1', 'M2', 'M3'], ['B1', 'B2']]; // 7-seater (2-3-2 layout)
        case 8: return [['F1', 'F2'], ['M1', 'M2', 'M3'], ['L1', 'L2', 'L3']]; // 8-seater (2-3-3 layout)
        case 10: return [['F1', 'F2'], ['M1', 'M2', 'M3'], ['B1', 'B2', 'B3'], ['VB1', 'VB2']]; // 10-seater (2-3-3-2 layout)
        default: return [['F1'], ['M1', 'M2', 'M3']]; // Default to 4-seat layout
    }
};

const SeatSelectionPage = ({ car, bookingDetails, pickupPoints, onConfirm, onBack, trips, onNavigateHome }: SeatSelectionPageProps) => {
    const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
    const [selectedPickup, setSelectedPickup] = useState('');
    const [selectedDrop, setSelectedDrop] = useState('');

    const bookedSeats = useMemo(() => {
        if (!trips) return [];
        const tripsForThisCarOnThisDate = trips.filter(t => t.car.id === car.id && t.booking.date === bookingDetails.date);
        return tripsForThisCarOnThisDate.flatMap(t => t.details.selectedSeats);
    }, [trips, car.id, bookingDetails.date]);

    const layout = getSeatLayout(car.totalSeats);
    const seatsToSelect = bookingDetails.seats;
    const pickupOptions = getPointsForLocation(bookingDetails.from, pickupPoints);
    const dropOptions = getPointsForLocation(bookingDetails.to, pickupPoints);

    useEffect(() => { if (pickupOptions.length > 0) setSelectedPickup(pickupOptions[0]); }, [bookingDetails.from, pickupOptions]);
    useEffect(() => { if (dropOptions.length > 0) setSelectedDrop(dropOptions[0]); }, [bookingDetails.to, dropOptions]);

    const handleSeatClick = (seatId: string) => {
        if (bookedSeats.includes(seatId)) return;
        setSelectedSeats(current => {
            if (current.includes(seatId)) return current.filter(s => s !== seatId);
            if (current.length < seatsToSelect) return [...current, seatId];
            return [ ...current.slice(1), seatId ]; // Replace the oldest selection
        });
    };
    
    const canConfirm = selectedSeats.length === seatsToSelect && selectedPickup && selectedDrop;

    return (
        <div className="min-h-screen flex flex-col bg-light-gray">
            <header className="bg-black/90 backdrop-blur-md p-4 border-b-2 border-primary/30 sticky top-0 z-10 flex items-center">
                <button onClick={onBack} className="p-2 rounded-full text-white hover:bg-white/10 transition-colors" aria-label="Go back"><BackArrowIcon className="h-6 w-6"/></button>
                <div className="flex-grow text-center"><button onClick={onNavigateHome} aria-label="Go to homepage"><Logo /></button></div><div className="w-10"></div>
            </header>
            <main className="flex-grow p-4 flex flex-col items-center">
                 <div className="bg-white border-2 border-gray-200 w-full max-w-md mx-auto p-6 rounded-2xl shadow-xl">
                    <h2 className="text-2xl font-bold text-dark text-center">Select Your Seats</h2>
                    <p className="text-dark font-semibold mb-6 text-center">Please select {seatsToSelect} seat(s). ({selectedSeats.length}/{seatsToSelect} selected)</p>

                    <div className="w-full max-w-xs mx-auto border-2 border-gray-300 rounded-lg p-4 bg-gray-100">
                        <div className="flex justify-end pr-4 mb-4"><div className="flex flex-col items-center"><SteeringWheelIcon className="h-8 w-8 text-gray-400" /><span className="text-xs font-bold text-gray-400">DRIVER</span></div></div>
                        <div className="space-y-4">
                            {layout.map((row, rowIndex) => (
                                <div key={rowIndex} className="flex justify-around">
                                    {row.map(seatId => {
                                        const isSelected = selectedSeats.includes(seatId);
                                        const isBooked = bookedSeats.includes(seatId);
                                        return (
                                            <button key={seatId} onClick={() => handleSeatClick(seatId)} disabled={isBooked} aria-label={isBooked ? `${seatId} (Booked)` : `Select seat ${seatId}`}
                                                className={`p-2 rounded-lg transition-all transform hover:scale-110 flex flex-col items-center justify-center w-16 h-16 ${ isBooked ? 'bg-gray-300 cursor-not-allowed' : isSelected ? 'bg-primary' : 'bg-white border-2 border-dark hover:bg-gray-200'}`}>
                                                <SeatIcon className={`h-8 w-8 ${ isBooked ? 'text-gray-500' : isSelected ? 'text-dark' : 'text-dark'}`} />
                                                <span className={`text-xs font-bold mt-1 ${ isBooked ? 'text-gray-500' : isSelected ? 'text-dark' : 'text-dark'}`}>{seatId}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            ))}
                        </div>
                    </div>

                     <div className="w-full mt-8 space-y-4">
                        <div>
                            <label htmlFor="pickup-point" className="block text-sm font-bold text-dark mb-1">Select Pickup Point</label>
                            <select id="pickup-point" value={selectedPickup} onChange={e => setSelectedPickup(e.target.value)} className="block w-full px-3 py-3 bg-white text-dark border-2 border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary font-semibold">
                                {pickupOptions.map(point => <option key={point} value={point}>{point}</option>)}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="drop-point" className="block text-sm font-bold text-dark mb-1">Select Drop Point</label>
                            <select id="drop-point" value={selectedDrop} onChange={e => setSelectedDrop(e.target.value)} className="block w-full px-3 py-3 bg-white text-dark border-2 border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary font-semibold">
                                {dropOptions.map(point => <option key={point} value={point}>{point}</option>)}
                            </select>
                        </div>
                    </div>
                </div>
            </main>
             <footer className="p-4 sticky bottom-0 bg-transparent">
                <div className="max-w-md mx-auto">
                    <button onClick={() => onConfirm({ selectedSeats: selectedSeats, pickup: selectedPickup, drop: selectedDrop })} disabled={!canConfirm} className="w-full bg-primary text-dark font-bold py-3 px-4 rounded-xl hover:bg-yellow-500 transition-transform transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-300">
                        Continue
                    </button>
                </div>
            </footer>
        </div>
    );
};

const PaymentPage = ({ car, bookingDetails, onConfirm, onBack, customer, onNavigateHome }: PaymentPageProps) => {
    const totalPrice = (car.price || 0) * (bookingDetails?.seats || 1);
    const [isProcessing, setIsProcessing] = useState(false);
    const [paymentError, setPaymentError] = useState('');

    const handleOnlinePayment = async () => {
        setIsProcessing(true);
        setPaymentError('');

        try {
            const response = await fetch('/api/razorpay', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'create-order', amount: totalPrice }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || 'Failed to create payment order.');
            }

            const order = await response.json();
            
            const options = {
                key: order.key,
                amount: order.amount,
                currency: order.currency,
                name: "Sajilo Taxi",
                description: `Booking for ${bookingDetails.seats} seat(s)`,
                order_id: order.id,
                handler: function (response: any) {
                    onConfirm();
                },
                prefill: {
                    name: customer?.name || 'Sajilo Customer',
                    email: customer?.email || '',
                    contact: customer?.phone || ''
                },
                notes: {
                    from: bookingDetails.from,
                    to: bookingDetails.to,
                    date: bookingDetails.date,
                    carId: car.id
                },
                theme: {
                    color: "#FFC107"
                },
                modal: {
                    ondismiss: function() {
                        setIsProcessing(false);
                    }
                }
            };

            const rzp = new window.Razorpay(options);
            rzp.open();

        } catch (error: any) {
            console.error("Payment Error:", error);
            setPaymentError(error.message || 'An unexpected error occurred. Please try again.');
            setIsProcessing(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col bg-light-gray">
            <header className="bg-black/90 backdrop-blur-md p-4 border-b-2 border-primary/30 sticky top-0 z-10 flex items-center">
                <button onClick={onBack} className="p-2 rounded-full text-white hover:bg-white/10 transition-colors"><BackArrowIcon className="h-6 w-6"/></button>
                <div className="flex-grow text-center"><button onClick={onNavigateHome} aria-label="Go to homepage"><Logo /></button></div><div className="w-10"></div>
            </header>
            <main className="flex-grow p-4 flex flex-col items-center justify-center text-center">
                <div className="w-full max-w-sm mx-auto bg-white border-2 border-gray-200 p-8 rounded-2xl shadow-xl">
                    <h2 className="text-2xl font-bold text-dark">Complete Your Payment</h2>
                    <div className="bg-primary/20 border-2 border-primary rounded-lg p-4 my-6">
                        <p className="text-dark/80 text-lg">Total Amount</p>
                        <p className="text-4xl font-bold text-dark">₹{totalPrice.toLocaleString()}</p>
                    </div>
                    {paymentError && <p className="text-center font-semibold text-danger bg-danger/10 border border-danger rounded-lg p-2 mb-4">{paymentError}</p>}
                    <div className="space-y-3">
                        <button onClick={onConfirm} className="w-full bg-secondary text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 transition-transform transform hover:scale-105 flex items-center justify-center gap-3"><WalletIcon className="h-6 w-6"/><span>Pay on Arrival</span></button>
                        <button onClick={handleOnlinePayment} disabled={isProcessing} className="w-full bg-primary text-dark font-bold py-3 px-4 rounded-lg hover:bg-yellow-500 transition-transform transform hover:scale-105 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-wait">
                            {isProcessing ? (
                                <div className="w-6 h-6 border-2 border-dark border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                                <><CreditCardIcon className="h-6 w-6"/><span>Pay with Card</span></>
                            )}
                        </button>
                    </div>
                </div>
            </main>
        </div>
    );
};

const BookingConfirmationPage = ({ trip, onComplete, onNavigateHome }: { trip: Trip; onComplete: () => void; onNavigateHome: () => void; }) => {
    if (!trip) return null;

    const { car, details } = trip;
    const totalPrice = (car.price || 0) * (details.selectedSeats.length || 0);

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-light-gray">
            <div className="w-full max-w-md mx-auto bg-white border-2 border-gray-200 p-6 rounded-2xl shadow-xl text-center">
                <button onClick={onNavigateHome} aria-label="Go to homepage"><Logo /></button>
                <div className="my-4 text-success"><CheckCircleIcon className="h-16 w-16 mx-auto" /></div>
                <h1 className="text-2xl font-bold text-dark">Thank you for booking with us!</h1>
                
                <div className="text-left bg-gray-50 border border-gray-200 rounded-lg p-4 my-6 space-y-2">
                    <h2 className="text-lg font-bold text-dark border-b border-gray-200 pb-2 mb-2">Booking Details:</h2>
                    <p><span className="font-semibold text-gray-700">Cab No:</span> <span className="font-bold text-dark">{car.vehicle}</span></p>
                    <p><span className="font-semibold text-gray-700">Driver Name:</span> <span className="font-bold text-dark">{car.driverName}</span></p>
                    <p><span className="font-semibold text-gray-700">Driver Phone:</span> <span className="font-bold text-dark">{car.driverPhone}</span></p>
                    <p><span className="font-semibold text-gray-700">Seats Booked:</span> <span className="font-bold text-dark">{details.selectedSeats.join(', ')}</span></p>
                    <p className="font-bold text-xl mt-2 pt-2 border-t border-gray-200"><span className="font-semibold text-base text-gray-700">Amount:</span> <span className="text-dark">₹{totalPrice.toLocaleString()}</span></p>
                </div>

                <p className="text-dark/80">Your ride is confirmed. Our driver will contact you shortly before pickup.</p>
                
                <button onClick={onComplete} className="w-full mt-8 bg-primary text-dark font-bold py-3 px-4 rounded-xl hover:bg-yellow-500">
                    Book Another Ride
                </button>
            </div>
        </div>
    );
};


const TripTrackingPage = ({ car, trip, onBack, onNavigateHome }: TripTrackingPageProps) => {
    const position = car.location;
    const destination = car.destination;
    const route: [number, number][] = [position, destination];

    return (
        <div className="h-screen flex flex-col">
            <header className="bg-black p-4 shadow-md z-20 flex items-center border-b-2 border-primary">
                <button onClick={onBack} className="p-2 rounded-full text-white hover:bg-white/10 transition-colors"><BackArrowIcon className="h-6 w-6"/></button>
                <div className="flex-grow text-center"><button onClick={onNavigateHome} aria-label="Go to homepage"><Logo /></button></div><div className="w-10"></div>
            </header>
            <div className="flex-grow relative">
                <MapContainer center={position} zoom={13} scrollWheelZoom={false} className="absolute inset-0">
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    <Marker position={position}><Popup>{trip.details.pickup}</Popup></Marker>
                    <Marker position={destination}><Popup>{trip.details.drop}</Popup></Marker>
                    <Polyline pathOptions={{ color: 'black', weight: 4 }} positions={route} />
                </MapContainer>
                <div className="absolute bottom-0 left-0 right-0 p-4 z-10">
                     <div className="bg-white/80 backdrop-blur-lg border border-gray-300 rounded-2xl p-4 flex items-center gap-4 max-w-md mx-auto shadow-2xl">
                        <div className="bg-dark rounded-full p-3"><UserIcon className="h-8 w-8 text-primary" /></div>
                        <div>
                            <p className="font-bold text-lg text-dark">{car.driverName}</p>
                            <p className="text-dark">{car.driverPhone}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const AboutUsPage = ({ onBack, onNavigateHome }: AboutUsPageProps) => (
    <div className="min-h-screen flex flex-col bg-light-gray">
        <header className="bg-black/90 backdrop-blur-md p-4 border-b-2 border-primary/30 sticky top-0 z-10 flex items-center">
            <button onClick={onBack} className="p-2 rounded-full text-white hover:bg-white/10 transition-colors" aria-label="Go back"><BackArrowIcon className="h-6 w-6"/></button>
            <div className="flex-grow text-center"><button onClick={onNavigateHome} aria-label="Go to homepage"><Logo /></button></div><div className="w-10"></div>
        </header>
        <main className="flex-grow p-4 lg:p-8">
            <div className="max-w-4xl mx-auto bg-white border-2 border-gray-200 p-6 sm:p-8 rounded-2xl shadow-xl">
                <h1 className="text-3xl sm:text-4xl font-bold text-dark text-center mb-2">Sajilo Taxi</h1>
                <p className="text-lg text-gray-700 mb-8 text-center leading-relaxed">
                    At Sajilo Taxi, our commitment to customer satisfaction and professionalism is what we live by.
                </p>

                <div className="space-y-6 text-gray-800 text-left leading-relaxed">
                    <div>
                        <h2 className="text-2xl font-bold text-dark mb-2">IDEA</h2>
                        <p>"Sajilo", a native Nepali word meaning "Easy" is the core idea and driving force of our business. Sajilo Taxi is not just a Taxi Service, it's an idea - "To make community easy(Sajilo) for the people and the communities of Sikkim and North Bengal."</p>
                        <p className="mt-2">When you book with Sajilo Taxi, you get the peace of mind of travelling to your destination with ease - worry free and whenever you want.</p>
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-dark mb-2">SAJILO TAXI APP</h2>
                        <p>We started because we believe technology is driving the future and no one should be left behind. Our people have access to phones, internet and are interested to try the future. That's why we built an app that will help everyone book a Taxi instantly at ease of their phones! No intermediaries, no hassles. Passengers can pay directly in-app, thus making it easier to book online and travel without worrying about cash or change.</p>
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-dark mb-2">VALUES</h2>
                        <p>Our mission is to eliminate the hassles of everyday passenger transportation - going through noisy Taxi Stands, unconfirmed bookings, shady drivers, unregularized operations, absence of code of conduct and ethics, and several other nuances.</p>
                        <p className="mt-2">Our drivers are trained, monitored, tracked. Each booking is confirmed and the passenger is assured of the seat. We comply with all government norms for vehicle operation and care about passenger safety. We are a company with a set of rules and guidelines that every operator and stakeholder must comply with.</p>
                    </div>
                </div>

                <p className="text-center mt-8 font-semibold text-gray-700">Experience Sajilo Taxi's quality service, rest assured, we will do our best to exceed your expectations.</p>
                <p className="text-center mt-2 font-bold text-dark">Sajilo Taxi. Made with <span className="text-danger">❤</span> in India!</p>
            </div>
        </main>
    </div>
);


export const CustomerApp = ({ dataApi }: CustomerAppProps) => {
    const [page, setPage] = useState('booking'); // booking, seatSelection, login, payment, tracking, about, confirmation
    const [bookingDetails, setBookingDetails] = useState<BookingCriteria | null>(null);
    const [selectedCar, setSelectedCar] = useState<Cab | null>(null);
    const [finalBookingDetails, setFinalBookingDetails] = useState<SeatSelectionDetails | null>(null);
    const [loggedInUser, setLoggedInUser] = useState<Customer | null>(null);
    const [confirmedTrip, setConfirmedTrip] = useState<Trip | null>(null);
    
    const { locations, pickupPoints, availableCars, trips } = dataApi.customer.getData();

    const handleBookCar = (car: Cab, details: BookingCriteria) => {
        setSelectedCar(car);
        setBookingDetails(details);
        setPage('seatSelection');
    };
    
    const handleSeatConfirm = (details: SeatSelectionDetails) => {
        setFinalBookingDetails(details);
        if (loggedInUser) {
            setPage('payment');
        } else {
            setPage('login');
        }
    };
    
    const handleAuthSuccess = (customer: Customer) => {
        setLoggedInUser(customer);
        setPage('payment');
    };

    const handlePaymentConfirm = async () => {
        if (!selectedCar || !bookingDetails || !finalBookingDetails || !loggedInUser) return;
        
        const freshCarData = dataApi.customer.getCarById(selectedCar.id) || selectedCar;
        const trip: Trip = {
            id: Date.now(),
            customer: loggedInUser,
            car: freshCarData as EnrichedCab,
            booking: bookingDetails,
            details: finalBookingDetails,
            timestamp: new Date().toISOString()
        };
        dataApi.customer.bookTrip(trip);
        setConfirmedTrip(trip);

        // Send confirmation SMS (fire-and-forget)
        try {
            fetch('/api/otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'send-booking-confirmation',
                    phone: loggedInUser.phone.replace(/[^0-9]/g, '').slice(-10), // Ensure 10-digit number
                    customerName: loggedInUser.name,
                    vehicle: freshCarData.vehicle,
                    from: bookingDetails.from,
                    to: bookingDetails.to,
                    date: new Date(bookingDetails.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric'}),
                    time: freshCarData.departureTime
                })
            });
        } catch (error) {
            console.error("Failed to send booking confirmation SMS:", error);
        }

        setPage('confirmation');
    };

    const resetBooking = () => {
        setPage('booking'); 
        setBookingDetails(null); 
        setSelectedCar(null);
        setFinalBookingDetails(null); 
        setLoggedInUser(null);
        setConfirmedTrip(null);
    };
    
    const renderBookingPage = () => (
        <BookingPage 
            locations={locations} 
            availableCars={availableCars} 
            onBook={handleBookCar} 
            trips={trips} 
            onNavigateToAbout={() => setPage('about')} 
            onNavigateToLogin={() => setPage('login')}
            onNavigateHome={resetBooking}
        />
    );

    switch(page) {
        case 'booking': return renderBookingPage();
        case 'seatSelection': 
            if (!selectedCar || !bookingDetails) return renderBookingPage();
            return <SeatSelectionPage car={selectedCar} bookingDetails={bookingDetails} pickupPoints={pickupPoints} onConfirm={handleSeatConfirm} onBack={() => setPage('booking')} trips={trips} onNavigateHome={resetBooking} />;
        case 'login': return <CustomerAuthPage onAuthSuccess={handleAuthSuccess} onBack={() => setPage(finalBookingDetails ? 'seatSelection' : 'booking')} dataApi={dataApi} onNavigateHome={resetBooking} />;
        case 'payment': 
             if (!selectedCar || !bookingDetails || !finalBookingDetails) return renderBookingPage();
            return <PaymentPage car={selectedCar} bookingDetails={{...bookingDetails, ...finalBookingDetails}} onConfirm={handlePaymentConfirm} onBack={() => setPage('seatSelection')} customer={loggedInUser} onNavigateHome={resetBooking} />;
        case 'tracking': 
            if (!selectedCar || !finalBookingDetails) return renderBookingPage();
            return <TripTrackingPage car={selectedCar} trip={{ details: finalBookingDetails }} onBack={resetBooking} onNavigateHome={resetBooking} />;
        case 'about': return <AboutUsPage onBack={() => setPage('booking')} onNavigateHome={resetBooking} />;
        case 'confirmation':
            if (!confirmedTrip) return renderBookingPage();
            return <BookingConfirmationPage trip={confirmedTrip} onComplete={resetBooking} onNavigateHome={resetBooking} />;
        default: return renderBookingPage();
    }
};