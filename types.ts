

import React from 'react';

// --- CORE DATA STRUCTURES ---

export interface User {
  id: number;
  name: string;
  phone: string;
  username: string;
  password?: string; // Should not be stored in client state long-term
  role: 'driver' | 'superadmin';
}

export interface Driver extends User {
  role: 'driver';
}

export interface Admin extends User {
  role: 'superadmin';
}

export interface Customer {
  id: number;
  name: string;
  phone: string;
  email: string;
}

export interface Cab {
  id: number;
  type: string;
  vehicle: string;
  from: string;
  to: string;
  price: number;
  totalSeats: number;
  driverId: number | null;
  location: [number, number];
  destination: [number, number];
  departureTime: string;
  // Denormalized/computed properties for UI convenience
  driverName?: string;
  driverPhone?: string;
  availableSeats?: number;
}

export interface BookingCriteria {
    from: string;
    to: string;
    date: string;
    seats: number;
}

export interface SeatSelectionDetails {
    // FIX: Renamed `seats` to `selectedSeats` to avoid a type collision with `BookingCriteria.seats`.
    selectedSeats: string[];
    pickup: string;
    drop: string;
}

export interface Trip {
    id: number;
    customer: Customer | { name: string; phone: string };
    car: Cab;
    booking: BookingCriteria;
    details: SeatSelectionDetails;
    timestamp: string;
}

export interface PickupPoints {
    [key: string]: string[];
}

export interface Stats {
    totalTrips: number;
    totalRevenue: number;
    totalBookedSeats: number;
    totalSystemSeats: number;
    totalCabs: number;
    totalDrivers: number;
}

export interface AuthState {
    user: Admin | Driver | null;
    role: 'superadmin' | 'driver' | null;
}

// --- COMPONENT PROPS ---

export interface IconProps {
    className?: string;
}

export interface LogoProps {
    className?: string;
}

export interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children?: React.ReactNode;
}

// A version of Cab with guaranteed computed properties for the UI
export type DisplayCab = Cab & { availableSeats: number; driverName: string; };

export interface BookingPageProps {
    locations: string[];
    availableCars: DisplayCab[];
    onBook: (car: Cab, details: BookingCriteria) => void;
    trips: Trip[];
    onNavigateToAbout: () => void;
    onNavigateToLogin: () => void;
}

export interface SeatSelectionPageProps {
    car: Cab;
    bookingDetails: BookingCriteria;
    pickupPoints: PickupPoints;
    onConfirm: (details: SeatSelectionDetails) => void;
    onBack: () => void;
    trips: Trip[];
}

export interface CustomerAuthPageProps {
    onAuthSuccess: (customer: Customer) => void;
    onBack: () => void;
    dataApi: any; // Consider creating a type for dataApi for full type safety
}

export interface PaymentPageProps {
    car: Cab;
    bookingDetails: BookingCriteria & SeatSelectionDetails;
    onConfirm: () => void;
    onBack: () => void;
    customer: Customer | null;
}

export interface TripTrackingPageProps {
    car: Cab;
    trip: { details: SeatSelectionDetails };
    onBack: () => void;
}

export interface AboutUsPageProps {
    onBack: () => void;
}

export interface CustomerAppProps {
    dataApi: any;
}

export interface CabDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    cab: Cab | null;
    allTrips: Trip[];
}

export interface AdminSidebarProps {
    currentView: string;
    setView: (view: string) => void;
    onLogout: () => void;
    isOpen: boolean;
    onClose: () => void;
}

export interface AdminDashboardProps {
    stats: Stats;
    trips: Trip[];
    setView: (view: string) => void;
}

export interface AdminFleetViewProps {
    cabs: Cab[];
}

export interface AdminCabsViewProps {
    cabs: Cab[];
    drivers: Driver[];
    locations: string[];
    allTrips: Trip[];
    onAdd: (cabData: Omit<Cab, 'id' | 'location' | 'destination'>) => void;
    onDelete: (id: number) => void;
    onUpdate: (cabData: Omit<Cab, 'location' | 'destination'>) => void;
}

export interface AdminDriversViewProps {
    drivers: Driver[];
    onAdd: (driverData: Omit<Driver, 'id' | 'role'>) => void;
    onDelete: (id: number) => void;
    onUpdate: (driverData: Omit<Driver, 'role'>) => void;
}

export interface AdminLocationsViewProps {
    locations: string[];
    pickupPoints: PickupPoints;
    onAddLocation: (locationData: { name: string; lat: number; lon: number }) => void;
    onDeleteLocation: (name: string) => void;
    onAddPoint: (location: string, point: string) => void;
    onDeletePoint: (location: string, point: string) => void;
}

export interface AdminSystemViewProps {
    onReset: () => void;
    auth: AuthState & { user: Admin };
    onUpdatePassword: (details: { id: number; newPassword: string }) => void;
}

export interface AdminPanelProps {
    onLogout: () => void;
    auth: AuthState & { user: Admin };
    dataApi: any;
}

export interface DriverAppProps {
    onLogout: () => void;
    driver: Driver;
    dataApi: any;
}

export interface AppLoginPageProps {
    role: 'superadmin' | 'driver';
    onLogin: (credentials: { username: string, password: string }) => void;
    error: string;
}