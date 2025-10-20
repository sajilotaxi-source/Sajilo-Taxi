

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
  otpEnabled?: boolean;
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
  imageUrl?: string;
  // Denormalized/computed properties for UI convenience
  driverName?: string;
  driverPhone?: string;
  availableSeats?: number;
  // Maintenance fields
  lastServiceDate?: string;
  insuranceExpiryDate?: string;
  notes?: string;
  // Real-time tracking fields
  speedKmph?: number;
  etaMinutes?: number;
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
    driverId: number | null;
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

// --- APP METADATA ---
export interface AppMeta {
    dataVersion: string;
    cacheVersion: string;
    buildTime: string;
    lastDeployedBy: string;
}

// --- API & DATA-RELATED TYPES ---

// A version of Cab enriched with non-optional driver data from the API
export type EnrichedCab = Cab & { driverName: string; driverPhone: string; };

// A version of Cab ready for display, including client-calculated seat availability
export type DisplayCab = EnrichedCab & { availableSeats: number; };

// Defines the entire data access layer for strict type-checking
export interface DataApi {
    customer: {
        getData: () => {
            locations: string[];
            pickupPoints: PickupPoints;
            availableCars: EnrichedCab[];
            trips: Trip[];
        };
        getCarById: (id: number) => EnrichedCab | undefined;
        findByPhone: (phone: string) => Customer | undefined;
        signUp: (details: { name: string; phone: string; email: string; }) => Customer;
        bookTrip: (trip: Trip) => void;
    };
    admin: {
        getData: (auth: AuthState) => {
            cabs: (Cab & { driverName: string })[];
            trips: Trip[];
            drivers: Driver[];
            locations: string[];
            pickupPoints: PickupPoints;
            allDrivers: Driver[];
            allTrips: Trip[];
            stats: Stats;
        };
        addCab: (data: Omit<Cab, 'id' | 'location' | 'destination' | 'driverName' | 'driverPhone' | 'availableSeats'>) => Promise<void>;
        updateCab: (data: Omit<Cab, 'location' | 'destination' | 'driverName' | 'driverPhone' | 'availableSeats'>) => Promise<void>;
        deleteCab: (id: number) => Promise<void>;
        addDriver: (data: Omit<Driver, 'id' | 'role'>) => Promise<void>;
        updateDriver: (data: Omit<Driver, 'role'>) => Promise<void>;
        deleteDriver: (id: number) => Promise<void>;
        addLocation: (data: { name: string; lat: number; lon: number }) => Promise<void>;
        deleteLocation: (name: string) => Promise<void>;
        addPoint: (location: string, point: string) => Promise<void>;
        deletePoint: (location: string, point: string) => Promise<void>;
        resetData: () => Promise<void>;
        updateAdminPassword: (details: { id: number; newPassword: string }) => Promise<void>;
    };
    driver: {
        getData: (driver: Driver) => {
            trips: Trip[];
            activeTrips: { [cabId: number]: boolean };
        };
        startTrip: (cabId: number) => void;
        stopTrip: (cabId: number) => void;
    };
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

export interface BookingPageProps {
    locations: string[];
    availableCars: EnrichedCab[];
    onBook: (car: Cab, details: BookingCriteria) => void;
    trips: Trip[];
    onNavigateToAbout: () => void;
    onNavigateToContact: () => void;
    onNavigateToLogin: () => void;
    onNavigateHome: () => void;
}

export interface SeatSelectionPageProps {
    car: Cab;
    bookingDetails: BookingCriteria;
    pickupPoints: PickupPoints;
    onConfirm: (details: SeatSelectionDetails) => void;
    onBack: () => void;
    trips: Trip[];
    onNavigateHome: () => void;
}

export interface CustomerAuthPageProps {
    onAuthSuccess: (customer: Customer) => void;
    onBack: () => void;
    dataApi: DataApi;
    onNavigateHome: () => void;
}

export interface PaymentPageProps {
    car: Cab;
    bookingDetails: BookingCriteria & SeatSelectionDetails;
    onConfirm: () => void;
    onBack: () => void;
    customer: Customer | null;
    onNavigateHome: () => void;
}

export interface TripTrackingPageProps {
    trip: Trip;
    onBack: () => void;
    onNavigateHome: () => void;
}

export interface AboutUsPageProps {
    onBack: () => void;
    onNavigateHome: () => void;
}

export interface CustomerAppProps {
    dataApi: DataApi;
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
    onAdd: (cabData: Omit<Cab, 'id' | 'location' | 'destination'>) => Promise<void>;
    onDelete: (id: number) => Promise<void>;
    onUpdate: (cabData: Omit<Cab, 'location' | 'destination'>) => Promise<void>;
}

export interface AdminDriversViewProps {
    drivers: Driver[];
    onAdd: (driverData: Omit<Driver, 'id' | 'role'>) => Promise<void>;
    onDelete: (id: number) => Promise<void>;
    onUpdate: (driverData: Omit<Driver, 'role'>) => Promise<void>;
}

export interface AdminLocationsViewProps {
    locations: string[];
    pickupPoints: PickupPoints;
    onAddLocation: (locationData: { name: string; lat: number; lon: number }) => Promise<void>;
    onDeleteLocation: (name: string) => Promise<void>;
    onAddPoint: (location: string, point: string) => Promise<void>;
    onDeletePoint: (location: string, point: string) => Promise<void>;
}

export interface AdminSystemViewProps {
    onReset: () => Promise<void>;
    auth: AuthState & { user: Admin };
    onUpdatePassword: (details: { id: number; newPassword: string }) => void;
}

export interface AdminPanelProps {
    onLogout: () => void;
    auth: AuthState & { user: Admin };
    dataApi: DataApi;
}

export interface DriverAppProps {
    onLogout: () => void;
    driver: Driver;
    dataApi: DataApi;
}

export interface AppLoginPageProps {
    role: 'superadmin' | 'driver';
    onLogin: (credentials: { username: string, password?: string, otp?: string }) => Promise<{ otpRequired: boolean, username?: string }>;
    error: string;
    auth: AuthState | null;
    appMeta: AppMeta | null;
    onReset: () => Promise<void>;
}

// --- ODOO INTEGRATION ---
export interface OdooSale {
  id: number;
  customerName: string;
  phone: string;
  amountPaid: number;
  vehicleNo: string;
  driverName: string;
  commission: number;
  amountPayable: number;
  from: string;
  to: string;
  date: string;
}