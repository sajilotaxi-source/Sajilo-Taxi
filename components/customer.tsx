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
    MenuIcon, XIcon, CheckCircleIcon
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
                { heading: 'Taxes & Fees', text: