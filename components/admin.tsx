import React, { useState, useEffect, useMemo } from 'react';
import { GoogleMap, useJsApiLoader, MarkerF, InfoWindow } from '@react-google-maps/api';
import type { 
    Cab, Admin, Driver, BookingCriteria, Trip, Stats,
    CabDetailsModalProps, AdminSidebarProps, AdminDashboardProps, AdminFleetViewProps, AdminCabsViewProps,
    AdminDriversViewProps, AdminLocationsViewProps, AdminSystemViewProps, AdminPanelProps, AuthState, OdooSale
} from '../types.ts';
import {
    PlusIcon, MenuIcon, DashboardIcon, LocationIcon, DriverIcon, InfoIcon,
    TrashIcon, EditIcon, LogoutIcon, MapIcon, SettingsIcon, TaxiIcon, ShieldCheckIcon, SafetyShieldIcon,
    WrenchScrewdriverIcon, CurrencyDollarIcon
} from './icons.tsx';
import { Logo, Modal } from './ui.tsx';
import { getOdooSalesData } from '../services/odooService.ts';

const googleMapsApiKey = (import.meta.env && import.meta.env.VITE_GOOGLE_MAPS_API_KEY) || "";

const mapContainerStyle = {
  width: '100%',
  height: '100%',
};

const mapOptions = {
    disableDefaultUI: true,
    zoomControl: true,
    mapTypeControl: true,
    streetViewControl: false,
};

// FIX: Made children optional to handle cases where it might be rendered without them, resolving the TypeScript error.
const MapLoader = ({ children }: { children?: React.ReactNode }) => {
    const { isLoaded, loadError } = useJsApiLoader({
        googleMapsApiKey,
    });

    if (loadError) return <div className="flex items-center justify-center h-full bg-danger/10 text-danger font-bold">Error loading maps</div>;
    if (!isLoaded) return <div className="flex items-center justify-center h-full bg-gray-100 font-bold">Loading Map...</div>;
    
    return <>{children}</>;
}


const CabDetailsModal = ({ isOpen, onClose, cab, allTrips }: CabDetailsModalProps) => {
    if (!isOpen || !cab) return null;
    const cabTrips = allTrips.filter(trip => trip.car.id === cab.id);
    const totalEarnings = cabTrips.reduce((sum, trip) => sum + (Number(trip.car.price || 0) * (trip.details?.selectedSeats?.length || 0)), 0);
    const latestTrip = cabTrips.length > 0 ? cabTrips.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0] : null;
    const bookedSeats = latestTrip ? latestTrip.details.selectedSeats.length : 0;
    const center = { lat: cab.location[0], lng: cab.location[1] };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Details for ${cab.vehicle}`}>
            <div className="space-y-4">
                <div className="h-48 border-2 border-gray-300 rounded-lg overflow-hidden">
                     <MapLoader>
                        <GoogleMap
                            mapContainerStyle={mapContainerStyle}
                            center={center}
                            zoom={13}
                            options={mapOptions}
                        >
                            <MarkerF position={center} />
                        </GoogleMap>
                    </MapLoader>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-100 p-3 rounded-lg text-center border border-gray-200">
                        <p className="text-dark font-bold text-2xl">₹{totalEarnings.toLocaleString()}</p>
                        <p className="text-dark font-semibold text-sm">Total Earnings</p>
                    </div>
                    <div className="bg-gray-100 p-3 rounded-lg text-center border border-gray-200">
                        <p className="text-dark font-bold text-2xl">{bookedSeats} / {cab.totalSeats}</p>
                        <p className="text-dark font-semibold text-sm">Booked Seats (Latest)</p>
                    </div>
                </div>
            </div>
        </Modal>
    );
};


const AdminSidebar = ({ currentView, setView, onLogout, isOpen, onClose }: AdminSidebarProps) => {
    const navItems = [
        { id: 'dashboard', label: 'Dashboard', icon: DashboardIcon },
        { id: 'sales', label: 'Sales', icon: CurrencyDollarIcon },
        { id: 'fleet', label: 'Fleet', icon: MapIcon },
        { id: 'cabs', label: 'Cabs', icon: TaxiIcon },
        { id: 'drivers', label: 'Drivers', icon: DriverIcon },
        { id: 'locations', label: 'Locations', icon: LocationIcon },
        { id: 'maintenance', label: 'Maintenance', icon: WrenchScrewdriverIcon },
        { id: 'system', label: 'System', icon: SettingsIcon },
    ];
    
    return (
        <div className={`fixed lg:relative lg:translate-x-0 inset-y-0 left-0 z-40 bg-black text-white w-64 lg:w-24 transition-transform duration-300 ease-in-out flex flex-col items-center ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
            <div className="p-4 lg:py-6"><Logo /></div>
            <nav className="flex flex-col items-stretch lg:items-center space-y-2 mt-8 flex-grow w-full px-2">
                {navItems.map(item => (
                    <button key={item.id} onClick={() => { setView(item.id as any); onClose(); }} title={item.label}
                        className={`flex items-center lg:justify-center gap-4 lg:gap-0 p-3 rounded-lg transition-colors w-full ${currentView === item.id ? 'bg-primary text-black' : 'hover:bg-gray-800'}`}>
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

interface TripGroup {
    key: string;
    car: Cab;
    booking: BookingCriteria;
    passengers: { name: string; phone: string; seats: number }[];
    totalRevenue: number;
}

const AdminDashboard = ({ stats, trips, setView }: AdminDashboardProps) => {
    const actionItems = [
        { label: 'Add Cab', icon: TaxiIcon, view: 'cabs' },
        { label: 'Add Driver', icon: DriverIcon, view: 'drivers' },
        { label: 'Add Location', icon: LocationIcon, view: 'locations' },
    ];

    const tripsByCar = useMemo(() => {
        const today = new Date().toISOString().split('T')[0];
        const todaysTrips = trips.filter(trip => trip.booking.date === today);
        return todaysTrips.reduce<Record<string, TripGroup>>((acc, trip) => {
            const tripKey = `${trip.car.id}-${trip.booking.from}-${trip.booking.to}-${trip.car.departureTime}`;
            if (!acc[tripKey]) {
                acc[tripKey] = {
                    key: tripKey, car: trip.car, booking: trip.booking,
                    passengers: [], totalRevenue: 0,
                };
            }
            const customer = trip.customer as { name: string, phone: string };
            acc[tripKey].passengers.push({
                name: customer.name, phone: customer.phone,
                seats: trip.details.selectedSeats.length
            });
            acc[tripKey].totalRevenue += (trip.car.price || 0) * (trip.details.selectedSeats.length || 0);
            return acc;
        }, {});
    }, [trips]);

    return (
    <div>
        <header><h1 className="text-3xl font-bold text-dark">Dashboard</h1></header>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 my-8">
            {actionItems.map(item => (
                <button key={item.view} onClick={() => setView(item.view as any)} className="bg-white p-4 rounded-xl border-2 border-gray-200 text-dark text-left font-bold flex items-center gap-3 hover:bg-gray-50 transition-colors">
                    <span className="bg-primary p-2 rounded-lg border-2 border-dark/80"><item.icon className="h-6 w-6"/></span>
                    <span>{item.label}</span>
                </button>
            ))}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 mb-8">
            <div className="bg-white border-2 border-gray-200 rounded-xl p-4 text-center">
                <p className="text-4xl font-bold text-dark">{stats.totalTrips}</p><p className="font-semibold text-dark mt-1">Total Trips</p>
            </div>
            <div className="bg-white border-2 border-gray-200 rounded-xl p-4 text-center">
                <p className="text-4xl font-bold text-dark">₹{stats.totalRevenue.toLocaleString()}</p><p className="font-semibold text-dark mt-1">Revenue</p>
            </div>
            <div className="bg-white border-2 border-gray-200 rounded-xl p-4 text-center">
                <p className="text-4xl font-bold text-dark">{stats.totalBookedSeats}<span className="text-2xl font-normal text-gray-600">/{stats.totalSystemSeats}</span></p>
                <p className="font-semibold text-dark mt-1">Booked Seats</p>
            </div>
            <div className="bg-white border-2 border-gray-200 rounded-xl p-4 text-center">
                <p className="text-4xl font-bold text-dark">{stats.totalCabs}</p><p className="font-semibold text-dark mt-1">Total Cabs</p>
            </div>
             <div className="bg-white border-2 border-gray-200 rounded-xl p-4 text-center">
                <p className="text-4xl font-bold text-dark">{stats.totalDrivers}</p><p className="font-semibold text-dark mt-1">Total Drivers</p>
            </div>
        </div>

        <div>
            <h2 className="text-2xl font-bold text-dark mb-4">Today's Manifest</h2>
            {Object.keys(tripsByCar).length > 0 ? (
                <div className="flex overflow-x-auto space-x-6 pb-4 -mx-6 px-6">
                    {Object.values(tripsByCar).map((tripGroup: TripGroup) => (
                        <div key={tripGroup.key} className="bg-white border-2 border-gray-200 rounded-xl p-4 flex-shrink-0 w-full max-w-sm sm:w-80">
                            <div className="border-b-2 border-gray-200 pb-2 mb-2">
                                <h3 className="font-bold text-lg text-dark truncate">{tripGroup.car.vehicle}</h3>
                                <p className="text-sm text-gray-700 font-semibold">{tripGroup.booking.from} to {tripGroup.booking.to}</p>
                                <p className="text-xs text-gray-500">{tripGroup.car.departureTime}</p>
                            </div>
                            
                            <div className="mt-3 space-y-2.5 max-h-60 overflow-y-auto pr-2">
                                {tripGroup.passengers.map((p, index) => (
                                    <div key={index} className="flex items-start text-sm">
                                        <span className="font-semibold text-dark/80 mr-2 pt-0.5">{index + 1}.</span>
                                        <div className="flex-grow">
                                            <p className="font-bold text-dark">{p.name}</p>
                                            <p className="text-gray-600">{p.phone}</p>
                                        </div>
                                         <div className="text-right flex-shrink-0">
                                            <span className="bg-gray-100 border border-gray-300 text-dark font-bold text-xs px-2 py-0.5 rounded-full">{p.seats} seat(s)</span>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="mt-4 pt-2 border-t-2 border-gray-200 flex justify-between items-center">
                                <span className="font-bold text-dark">Total Revenue</span>
                                <span className="font-bold text-xl text-dark">₹{tripGroup.totalRevenue.toLocaleString()}</span>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="bg-white border-2 border-gray-200 rounded-xl p-8 text-center">
                    <p className="font-bold text-dark">No bookings found for today.</p>
                    <p className="text-gray-600">Check back later or view all trips by viewing cab details.</p>
                </div>
            )}
        </div>
    </div>
    );
};

const AdminFleetView = ({ cabs }: AdminFleetViewProps) => {
    const center = { lat: 27.33, lng: 88.61 };
    const [activeMarker, setActiveMarker] = useState<number | null>(null);

    return (
        <div>
            <header><h1 className="text-3xl font-bold text-dark mb-8">Fleet Overview</h1></header>
            <div className="h-[70vh] bg-white border-2 border-gray-200 rounded-xl overflow-hidden">
                <MapLoader>
                    <GoogleMap
                        mapContainerStyle={mapContainerStyle}
                        center={center}
                        zoom={9}
                        options={mapOptions}
                    >
                        {cabs.map(cab => (
                            <MarkerF
                                key={cab.id}
                                position={{ lat: cab.location[0], lng: cab.location[1] }}
                                onClick={() => setActiveMarker(cab.id)}
                            >
                                {activeMarker === cab.id && (
                                    <InfoWindow onCloseClick={() => setActiveMarker(null)}>
                                        <div>
                                            <div className="font-bold">{cab.vehicle}</div>
                                            <div>{cab.driverName}</div>
                                        </div>
                                    </InfoWindow>
                                )}
                            </MarkerF>
                        ))}
                    </GoogleMap>
                </MapLoader>
            </div>
        </div>
    );
};


const AdminCabsView = ({ cabs, drivers, locations, allTrips, onAdd, onDelete, onUpdate }: AdminCabsViewProps) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [selectedCabForDetails, setSelectedCabForDetails] = useState<Cab | null>(null);
    const [editingCab, setEditingCab] = useState<Cab | null>(null);
    const [formState, setFormState] = useState({ type: '', vehicle: '', totalSeats: '4', price: '', driverId: '', from: '', to: '', departureTime: '', imageUrl: '' });

    const unassignedDrivers = drivers.filter(d => !cabs.some(c => c.driverId === d.id));
    const availableDriversForEdit = editingCab ? [...unassignedDrivers, drivers.find(d => d.id === editingCab.driverId)].filter(Boolean) : unassignedDrivers;

    const openAddModal = () => { setEditingCab(null); setFormState({ type: '', vehicle: '', totalSeats: '4', price: '', driverId: '', from: '', to: '', departureTime: '', imageUrl: '' }); setIsModalOpen(true); };
    const openDetailsModal = (cab: Cab) => { setSelectedCabForDetails(cab); setIsDetailsModalOpen(true); };
    const openEditModal = (cab: Cab) => {
        setEditingCab(cab);
        setFormState({
            type: cab.type, vehicle: cab.vehicle, totalSeats: String(cab.totalSeats), price: String(cab.price),
            driverId: cab.driverId ? String(cab.driverId) : '', from: cab.from || '', to: cab.to || '', departureTime: cab.departureTime || '', imageUrl: cab.imageUrl || ''
        });
        setIsModalOpen(true);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setFormState(s => ({ ...s, [e.target.name]: e.target.value }));

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const cabData = { ...formState, totalSeats: parseInt(formState.totalSeats, 10), price: parseInt(formState.price, 10), driverId: parseInt(formState.driverId, 10) || null };
        if (editingCab) { onUpdate({ ...cabData, id: editingCab.id }); } else { onAdd(cabData); }
        setIsModalOpen(false);
    };

    return (
        <div>
            <header className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-dark">Manage Cabs</h1>
                <button onClick={openAddModal} className="bg-primary text-dark font-bold py-2 px-4 rounded-lg flex items-center gap-2 hover:bg-yellow-500"><PlusIcon/> Add Cab</button>
            </header>
            <div className="bg-white border-2 border-gray-200 rounded-xl overflow-hidden">
                {/* Desktop Table View */}
                <div className="overflow-x-auto hidden lg:block">
                    <table className="w-full text-left">
                        <thead className="border-b-2 border-gray-200 bg-light-gray"><tr><th className="p-4">Vehicle</th><th className="p-4">Route</th><th className="p-4">Departure</th><th className="p-4">Driver</th><th className="p-4"></th></tr></thead>
                        <tbody>
                            {cabs.map(cab => (
                                <tr key={cab.id} className="border-b border-gray-200 last:border-b-0">
                                    <td className="p-4 font-semibold text-dark">
                                        <div className="flex items-center gap-4">
                                            <img src={cab.imageUrl || 'https://placehold.co/64x48/f8f9fa/333333?text=No+Image'} alt={cab.vehicle} className="w-16 h-12 object-cover rounded-md border border-gray-300" />
                                            <div>
                                                {cab.vehicle}
                                                <br/>
                                                <span className="font-normal text-sm text-gray-600">{cab.type}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4 text-dark">{cab.from} to {cab.to}</td>
                                    <td className="p-4 text-dark">{cab.departureTime}</td>
                                    <td className="p-4 text-dark">{cab.driverName || 'Unassigned'}</td>
                                    <td className="p-4 text-right whitespace-nowrap">
                                        <button onClick={() => openDetailsModal(cab)} className="text-gray-600 hover:text-dark p-2"><InfoIcon className="h-5 w-5"/></button>
                                        <button onClick={() => openEditModal(cab)} className="text-secondary hover:text-blue-700 p-2"><EditIcon className="h-5 w-5"/></button>
                                        <button onClick={() => onDelete(cab.id)} className="text-danger hover:text-red-700 p-2"><TrashIcon className="h-5 w-5"/></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {/* Mobile Card View */}
                <div className="block lg:hidden">
                    {cabs.length > 0 ? (
                        <div className="p-4 space-y-4">
                            {cabs.map(cab => (
                                <div key={cab.id} className="bg-light-gray rounded-lg border-2 border-gray-300 p-3 space-y-3">
                                    <div className="flex gap-4 items-start">
                                        <img src={cab.imageUrl || 'https://placehold.co/96x80/f8f9fa/333333?text=No+Image'} alt={cab.vehicle} className="w-24 h-20 object-cover rounded-md border border-gray-300 flex-shrink-0" />
                                        <div className="flex-grow">
                                            <h3 className="font-bold text-dark">{cab.vehicle}</h3>
                                            <p className="text-sm text-gray-600">{cab.type}</p>
                                            <p className="text-sm font-semibold mt-1">{cab.from} to {cab.to}</p>
                                        </div>
                                    </div>
                                    <div className="border-t border-gray-300 pt-3 flex justify-between items-end">
                                        <div className="text-sm space-y-1">
                                            <p><span className="font-semibold text-gray-700">Departure:</span> {cab.departureTime}</p>
                                            <p><span className="font-semibold text-gray-700">Driver:</span> {cab.driverName || 'Unassigned'}</p>
                                        </div>
                                        <div className="flex items-center -mr-2">
                                            <button onClick={() => openDetailsModal(cab)} className="text-gray-600 hover:text-dark p-2"><InfoIcon className="h-5 w-5"/></button>
                                            <button onClick={() => openEditModal(cab)} className="text-secondary hover:text-blue-700 p-2"><EditIcon className="h-5 w-5"/></button>
                                            <button onClick={() => onDelete(cab.id)} className="text-danger hover:text-red-700 p-2"><TrashIcon className="h-5 w-5"/></button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="p-4 text-center text-gray-600">No cabs found.</p>
                    )}
                </div>
            </div>
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingCab ? 'Edit Cab' : 'Add New Cab'}>
                <form onSubmit={handleSubmit} className="space-y-4">
                     <input name="type" type="text" value={formState.type} onChange={handleChange} required className="w-full p-2 border-2 border-gray-400 rounded bg-white" placeholder="Cab Type, e.g., SUV (7 Seater)"/>
                     <input name="vehicle" type="text" value={formState.vehicle} onChange={handleChange} required className="w-full p-2 border-2 border-gray-400 rounded bg-white" placeholder="Vehicle No., e.g., SK01 J 1234"/>
                     <select name="from" value={formState.from} onChange={handleChange} required className="w-full p-2 border-2 border-gray-400 rounded bg-white"><option value="" disabled>From Location</option>{locations.map(loc => <option key={loc} value={loc}>{loc}</option>)}</select>
                     <select name="to" value={formState.to} onChange={handleChange} required className="w-full p-2 border-2 border-gray-400 rounded bg-white"><option value="" disabled>To Location</option>{locations.map(loc => <option key={loc} value={loc}>{loc}</option>)}</select>
                     <input name="departureTime" type="text" value={formState.departureTime} onChange={handleChange} required className="w-full p-2 border-2 border-gray-400 rounded bg-white" placeholder="Departure Time, e.g., 09:00 AM"/>
                     <input name="totalSeats" type="number" value={formState.totalSeats} onChange={handleChange} required className="w-full p-2 border-2 border-gray-400 rounded bg-white" placeholder="Total Seats"/>
                     <input name="price" type="number" value={formState.price} onChange={handleChange} required className="w-full p-2 border-2 border-gray-400 rounded bg-white" placeholder="Price per Seat"/>
                     <select name="driverId" value={formState.driverId} onChange={handleChange} required className="w-full p-2 border-2 border-gray-400 rounded bg-white"><option value="">Assign Driver</option>{(editingCab ? availableDriversForEdit : unassignedDrivers).map(d => d && <option key={d.id} value={d.id}>{d.name}</option>)}</select>
                     <input name="imageUrl" type="url" value={formState.imageUrl} onChange={handleChange} className="w-full p-2 border-2 border-gray-400 rounded bg-white" placeholder="Image URL (e.g., https://.../image.jpg)"/>
                     <button type="submit" className="w-full bg-primary text-dark font-bold py-3 px-4 rounded-xl hover:bg-yellow-500">{editingCab ? 'Update Cab' : 'Add Cab'}</button>
                </form>
            </Modal>
            {selectedCabForDetails && <CabDetailsModal isOpen={isDetailsModalOpen} onClose={() => setIsDetailsModalOpen(false)} cab={selectedCabForDetails} allTrips={allTrips} />}
        </div>
    );
};

const AdminDriversView = ({ drivers, onAdd, onDelete, onUpdate }: AdminDriversViewProps) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingDriver, setEditingDriver] = useState<Driver | null>(null);
    const [name, setName] = useState(''); const [phone, setPhone] = useState(''); const [username, setUsername] = useState(''); const [password, setPassword] = useState('');
    const resetForm = () => { setEditingDriver(null); setName(''); setPhone(''); setUsername(''); setPassword(''); };
    const openAddModal = () => { resetForm(); setIsModalOpen(true); };
    const openEditModal = (driver: Driver) => { setEditingDriver(driver); setName(driver.name); setPhone(driver.phone); setUsername(driver.username); setPassword(''); setIsModalOpen(true); };
    const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); if (editingDriver) { onUpdate({ name, phone, username, password, id: editingDriver.id }); } else { onAdd({ name, phone, username, password }); } setIsModalOpen(false); };

    return (
        <div>
            <header className="flex justify-between items-center mb-8"><h1 className="text-3xl font-bold text-dark">Manage Drivers</h1><button onClick={openAddModal} className="bg-primary text-dark font-bold py-2 px-4 rounded-lg flex items-center gap-2 hover:bg-yellow-500"><PlusIcon/> Add Driver</button></header>
            <div className="bg-white border-2 border-gray-200 rounded-xl overflow-hidden">
                {/* Desktop Table View */}
                <div className="overflow-x-auto hidden lg:block"><table className="w-full text-left">
                    <thead className="border-b-2 border-gray-200 bg-light-gray"><tr><th className="p-4">Name</th><th className="p-4">Phone</th><th className="p-4">Username</th><th className="p-4"></th></tr></thead>
                    <tbody>{drivers.map(driver => (<tr key={driver.id} className="border-b border-gray-200 last:border-b-0">
                        <td className="p-4 font-semibold text-dark">{driver.name}</td><td className="p-4 text-dark">{driver.phone}</td><td className="p-4 text-dark">{driver.username}</td>
                        <td className="p-4 text-right whitespace-nowrap"><button onClick={() => openEditModal(driver)} className="text-secondary p-2"><EditIcon/></button><button onClick={() => onDelete(driver.id)} className="text-danger p-2"><TrashIcon/></button></td>
                    </tr>))}</tbody>
                </table></div>
                {/* Mobile Card View */}
                <div className="block lg:hidden">
                    <div className="p-4 space-y-4">
                        {drivers.map(driver => (
                            <div key={driver.id} className="bg-light-gray rounded-lg border-2 border-gray-300 p-3">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="font-bold text-dark text-lg">{driver.name}</h3>
                                        <p className="text-sm text-gray-700">{driver.phone}</p>
                                        <p className="text-sm text-gray-700">@{driver.username}</p>
                                    </div>
                                    <div className="flex items-center -mr-2 flex-shrink-0">
                                        <button onClick={() => openEditModal(driver)} className="text-secondary p-2"><EditIcon/></button>
                                        <button onClick={() => onDelete(driver.id)} className="text-danger p-2"><TrashIcon/></button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
             <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingDriver ? "Edit Driver" : "Add New Driver"}>
                <form onSubmit={handleSubmit} className="space-y-4">
                     <input type="text" value={name} onChange={e => setName(e.target.value)} required className="w-full p-2 border-2 border-gray-400 rounded" placeholder="Full Name"/>
                     <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} required className="w-full p-2 border-2 border-gray-400 rounded" placeholder="Phone Number"/>
                     <input type="text" value={username} onChange={e => setUsername(e.target.value)} required className="w-full p-2 border-2 border-gray-400 rounded" placeholder="Username"/>
                     <input type="password" value={password} onChange={e => setPassword(e.target.value)} required={!editingDriver} className="w-full p-2 border-2 border-gray-400 rounded" placeholder={editingDriver ? "Leave blank to keep current" : "Password"}/>
                     <button type="submit" className="w-full bg-primary text-dark font-bold py-3 px-4 rounded-xl hover:bg-yellow-500">{editingDriver ? "Update Driver" : "Add Driver"}</button>
                </form>
            </Modal>
        </div>
    );
};

const AdminLocationsView = ({ locations, pickupPoints, onAddLocation, onDeleteLocation, onAddPoint, onDeletePoint }: AdminLocationsViewProps) => {
    const [selectedLocation, setSelectedLocation] = useState(locations[0]);
    const [newPoint, setNewPoint] = useState(''); const [newLocation, setNewLocation] = useState('');
    useEffect(() => { if (!locations.includes(selectedLocation) && locations.length > 0) setSelectedLocation(locations[0]); }, [locations, selectedLocation]);
    const handleAddPoint = (e: React.FormEvent) => { e.preventDefault(); onAddPoint(selectedLocation, newPoint); setNewPoint(''); };
    const handleAddLocation = (e: React.FormEvent) => { e.preventDefault(); onAddLocation({ name: newLocation, lat: 27.0, lon: 88.0 }); setNewLocation(''); };

    return (
        <div>
            <header className="mb-8"><h1 className="text-3xl font-bold text-dark">Manage Locations</h1></header>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-1 space-y-4">
                    <h2 className="text-xl font-bold text-dark">Service Locations</h2>
                    <form onSubmit={handleAddLocation} className="flex gap-2"><input type="text" value={newLocation} onChange={e => setNewLocation(e.target.value)} required className="flex-grow p-2 border-2 border-gray-400 rounded" placeholder="New location name"/><button type="submit" className="bg-primary text-dark p-2 rounded-lg"><PlusIcon/></button></form>
                     <div className="bg-white border-2 border-gray-200 rounded-lg p-2 space-y-1 min-h-[40vh]">
                        {locations.map(loc => (
                            <div key={loc} className={`flex justify-between items-center p-2 rounded-md cursor-pointer ${selectedLocation === loc ? 'bg-primary text-dark' : 'text-dark hover:bg-gray-100'}`} onClick={() => setSelectedLocation(loc)}>
                                <span className="font-semibold">{loc}</span>
                                <button onClick={(e) => {e.stopPropagation(); onDeleteLocation(loc);}} className={`p-1 ${selectedLocation === loc ? 'text-dark hover:text-danger' : 'text-danger hover:text-red-700'}`}><TrashIcon className="h-4 w-4"/></button>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="md:col-span-2 space-y-4">
                    <h2 className="text-xl font-bold text-dark">Pickup/Drop Points for <span className="text-secondary">{selectedLocation}</span></h2>
                    <form onSubmit={handleAddPoint} className="flex gap-2"><input type="text" value={newPoint} onChange={e => setNewPoint(e.target.value)} required className="flex-grow p-2 border-2 border-gray-400 rounded" placeholder="Add new point"/><button type="submit" className="bg-primary text-dark p-2 rounded-lg"><PlusIcon/></button></form>
                     <div className="bg-white border-2 border-gray-200 rounded-lg p-2 space-y-1 min-h-[40vh]">
                        {(pickupPoints[selectedLocation] || []).map(point => (
                            <div key={point} className="flex justify-between items-center p-2 rounded-md text-dark">
                                <span className="font-semibold">{point}</span>
                                <button onClick={() => onDeletePoint(selectedLocation, point)} className="text-danger hover:text-red-700 p-1"><TrashIcon className="h-4 w-4"/></button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

const AdminMaintenanceView = ({ cabs, onUpdate }: { cabs: Cab[], onUpdate: (cab: Cab) => void }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCab, setEditingCab] = useState<Cab | null>(null);
    const [formState, setFormState] = useState({ lastServiceDate: '', insuranceExpiryDate: '', notes: '' });

    const openEditModal = (cab: Cab) => {
        setEditingCab(cab);
        setFormState({
            lastServiceDate: cab.lastServiceDate || '',
            insuranceExpiryDate: cab.insuranceExpiryDate || '',
            notes: cab.notes || ''
        });
        setIsModalOpen(true);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormState(s => ({ ...s, [e.target.name]: e.target.value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingCab) {
            onUpdate({ ...editingCab, ...formState });
        }
        setIsModalOpen(false);
    };

    const isInsuranceExpiring = (dateStr?: string) => {
        if (!dateStr) return false;
        const expiryDate = new Date(dateStr);
        const today = new Date();
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(today.getDate() + 30);
        return expiryDate > today && expiryDate <= thirtyDaysFromNow;
    };

    const isInsuranceExpired = (dateStr?: string) => {
        if (!dateStr) return false;
        return new Date(dateStr) < new Date();
    };

    return (
        <div>
            <header className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-dark">Fleet Maintenance</h1>
            </header>
            <div className="bg-white border-2 border-gray-200 rounded-xl overflow-hidden">
                 {/* Desktop Table View */}
                <div className="overflow-x-auto hidden lg:block">
                    <table className="w-full text-left">
                        <thead className="border-b-2 border-gray-200 bg-light-gray">
                            <tr>
                                <th className="p-4">Vehicle</th>
                                <th className="p-4">Last Service</th>
                                <th className="p-4">Insurance Expiry</th>
                                <th className="p-4">Notes</th>
                                <th className="p-4"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {cabs.map(cab => (
                                <tr key={cab.id} className="border-b border-gray-200 last:border-b-0">
                                    <td className="p-4 font-semibold text-dark">{cab.vehicle}<br/><span className="font-normal text-sm text-gray-600">{cab.driverName || 'N/A'}</span></td>
                                    <td className="p-4 text-dark">{cab.lastServiceDate || 'N/A'}</td>
                                    <td className="p-4 font-semibold">
                                        {isInsuranceExpired(cab.insuranceExpiryDate) ? (
                                            <span className="text-danger bg-danger/10 px-2 py-1 rounded-full">{cab.insuranceExpiryDate} (Expired)</span>
                                        ) : isInsuranceExpiring(cab.insuranceExpiryDate) ? (
                                            <span className="text-yellow-600 bg-yellow-100 px-2 py-1 rounded-full">{cab.insuranceExpiryDate} (Expiring)</span>
                                        ) : (
                                            <span className="text-dark">{cab.insuranceExpiryDate || 'N/A'}</span>
                                        )}
                                    </td>
                                    <td className="p-4 text-dark truncate max-w-xs">{cab.notes || 'N/A'}</td>
                                    <td className="p-4 text-right whitespace-nowrap">
                                        <button onClick={() => openEditModal(cab)} className="text-secondary hover:text-blue-700 p-2"><EditIcon className="h-5 w-5"/></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {/* Mobile Card View */}
                <div className="block lg:hidden">
                    <div className="p-4 space-y-4">
                        {cabs.map(cab => (
                            <div key={cab.id} className="bg-light-gray rounded-lg border-2 border-gray-300 p-3">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="font-bold text-dark">{cab.vehicle}</h3>
                                        <p className="text-sm text-gray-600">{cab.driverName || 'N/A'}</p>
                                    </div>
                                    <button onClick={() => openEditModal(cab)} className="text-secondary hover:text-blue-700 p-2 -mr-2 -mt-1"><EditIcon className="h-5 w-5"/></button>
                                </div>
                                <div className="mt-3 space-y-2 text-sm">
                                    <p><span className="font-semibold text-gray-700">Last Service:</span> {cab.lastServiceDate || 'N/A'}</p>
                                    <div>
                                        <span className="font-semibold text-gray-700">Insurance: </span>
                                        {isInsuranceExpired(cab.insuranceExpiryDate) ? (
                                            <span className="text-danger font-semibold">{cab.insuranceExpiryDate} (Expired)</span>
                                        ) : isInsuranceExpiring(cab.insuranceExpiryDate) ? (
                                            <span className="text-yellow-600 font-semibold">{cab.insuranceExpiryDate} (Expiring)</span>
                                        ) : (
                                            <span className="text-dark">{cab.insuranceExpiryDate || 'N/A'}</span>
                                        )}
                                    </div>
                                    {cab.notes && <p className="pt-2 border-t border-gray-300 mt-2"><span className="font-semibold text-gray-700">Notes:</span> {cab.notes}</p>}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={`Update ${editingCab?.vehicle}`}>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-dark mb-1">Last Service Date</label>
                        <input name="lastServiceDate" type="date" value={formState.lastServiceDate} onChange={handleChange} className="w-full p-2 border-2 border-gray-400 rounded bg-white"/>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-dark mb-1">Insurance Expiry Date</label>
                        <input name="insuranceExpiryDate" type="date" value={formState.insuranceExpiryDate} onChange={handleChange} className="w-full p-2 border-2 border-gray-400 rounded bg-white"/>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-dark mb-1">Notes</label>
                        <textarea name="notes" value={formState.notes} onChange={handleChange} rows={3} className="w-full p-2 border-2 border-gray-400 rounded bg-white" placeholder="e.g., Tire rotation completed, AC checked."></textarea>
                    </div>
                    <button type="submit" className="w-full bg-primary text-dark font-bold py-3 px-4 rounded-xl hover:bg-yellow-500">Update Maintenance Info</button>
                </form>
            </Modal>
        </div>
    );
};

const AdminSalesView = () => {
    type Filter = 'today' | 'week' | 'month' | 'all';
    const [filter, setFilter] = useState<Filter>('all');
    const [sales, setSales] = useState<OdooSale[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchOdooData = async () => {
            setIsLoading(true);
            setError(null);
            
            try {
                // Determine date range based on filter
                const now = new Date();
                let dateFrom: string | undefined = undefined;
                let dateTo: string | undefined = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toISOString().split('T')[0];

                if (filter === 'today') {
                    dateFrom = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString().split('T')[0];
                } else if (filter === 'week') {
                    const weekStart = new Date(now);
                    weekStart.setDate(now.getDate() - now.getDay());
                    dateFrom = weekStart.toISOString().split('T')[0];
                } else if (filter === 'month') {
                    dateFrom = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
                } else {
                    dateFrom = undefined;
                    dateTo = undefined;
                }

                const data = await getOdooSalesData(dateFrom, dateTo);
                setSales(data);

            } catch (err: any) {
                setError(err.message || 'Failed to load data from Odoo.');
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchOdooData();
    }, [filter]);


    const formatCurrency = (amount: number) => `₹${amount.toLocaleString('en-IN')}`;

    const stats = useMemo(() => {
        const totalRevenue = sales.reduce((sum, sale) => sum + sale.amountPaid, 0);
        const totalCommission = sales.reduce((sum, sale) => sum + sale.commission, 0);
        const totalPayable = sales.reduce((sum, sale) => sum + sale.amountPayable, 0);
        return { totalRevenue, totalCommission, totalPayable, totalTrips: sales.length };
    }, [sales]);

    return (
        <div>
            <header className="flex flex-col md:flex-row justify-between md:items-center mb-8 gap-4">
                <h1 className="text-3xl font-bold text-dark">Odoo Sales Report</h1>
                <div className="flex items-center gap-2 bg-white border-2 border-gray-200 rounded-lg p-1">
                    {(['Today', 'This Week', 'This Month', 'All Time'] as const).map(f => {
                        const id = f.split(' ')[0].toLowerCase() as Filter;
                        return <button key={id} onClick={() => setFilter(id)} className={`px-4 py-1.5 rounded-md font-semibold text-sm transition-colors ${filter === id ? 'bg-primary text-dark' : 'text-dark hover:bg-gray-100'}`}>{f}</button>
                    })}
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                 <div className="bg-white border-2 border-gray-200 rounded-xl p-4 text-center">
                    <p className="text-4xl font-bold text-dark">{formatCurrency(stats.totalRevenue)}</p><p className="font-semibold text-dark mt-1">Total Revenue</p>
                </div>
                <div className="bg-white border-2 border-gray-200 rounded-xl p-4 text-center">
                    <p className="text-4xl font-bold text-dark">{stats.totalTrips}</p><p className="font-semibold text-dark mt-1">Total Trips</p>
                </div>
                <div className="bg-white border-2 border-gray-200 rounded-xl p-4 text-center">
                    <p className="text-4xl font-bold text-dark">{formatCurrency(stats.totalCommission)}</p><p className="font-semibold text-dark mt-1">Total Commission</p>
                </div>
                <div className="bg-white border-2 border-gray-200 rounded-xl p-4 text-center">
                    <p className="text-4xl font-bold text-dark">{formatCurrency(stats.totalPayable)}</p><p className="font-semibold text-dark mt-1">Total Payable</p>
                </div>
            </div>

            <div className="bg-white border-2 border-gray-200 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                    {isLoading ? (
                        <div className="p-8 text-center font-semibold">Loading data from Odoo...</div>
                    ) : error ? (
                        <div className="p-8 text-center font-semibold text-danger bg-danger/10">{error}</div>
                    ) : sales.length === 0 ? (
                        <div className="p-8 text-center font-semibold">No sales data found for the selected period.</div>
                    ) : (
                        <>
                        {/* Desktop Table View */}
                        <table className="w-full text-left hidden lg:table">
                            <thead className="border-b-2 border-gray-200 bg-light-gray">
                                <tr>
                                    <th className="p-4">Customer</th>
                                    <th className="p-4">Route</th>
                                    <th className="p-4">Vehicle No</th>
                                    <th className="p-4">Driver</th>
                                    <th className="p-4 text-right">Amount Paid</th>
                                    <th className="p-4 text-right">Commission</th>
                                    <th className="p-4 text-right">Payable</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sales.map(sale => (
                                    <tr key={sale.id} className="border-b border-gray-200 last:border-b-0">
                                        <td className="p-4 font-semibold text-dark">{sale.customerName}</td>
                                        <td className="p-4">{sale.from} → {sale.to}</td>
                                        <td className="p-4">{sale.vehicleNo}</td>
                                        <td className="p-4">{sale.driverName}</td>
                                        <td className="p-4 text-right font-semibold">{formatCurrency(sale.amountPaid)}</td>
                                        <td className="p-4 text-right text-secondary">{formatCurrency(sale.commission)}</td>
                                        <td className="p-4 text-right text-success font-bold">{formatCurrency(sale.amountPayable)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {/* Mobile Card View */}
                        <div className="block lg:hidden p-4 space-y-4">
                            {sales.map(sale => (
                                <div key={sale.id} className="bg-light-gray rounded-lg border-2 border-gray-300 p-3 space-y-3">
                                    <div>
                                        <h3 className="font-bold text-dark text-lg">{sale.customerName}</h3>
                                        <p className="font-semibold">{sale.from} → {sale.to}</p>
                                        <p className="text-sm text-gray-700">{sale.vehicleNo} ({sale.driverName})</p>
                                    </div>
                                    <div className="border-t border-gray-300 pt-3 grid grid-cols-3 gap-2 text-center">
                                        <div>
                                            <p className="text-xs font-semibold text-gray-600">Paid</p>
                                            <p className="font-bold text-dark">{formatCurrency(sale.amountPaid)}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs font-semibold text-gray-600">Commission</p>
                                            <p className="font-bold text-secondary">{formatCurrency(sale.commission)}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs font-semibold text-gray-600">Payable</p>
                                            <p className="font-bold text-success">{formatCurrency(sale.amountPayable)}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};


const AdminSystemView = ({ onReset, auth, onUpdatePassword }: AdminSystemViewProps) => {
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [confirmText, setConfirmText] = useState('');
    
    // Password change state
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [passwordSuccess, setPasswordSuccess] = useState('');
    const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

    // OTP state
    const [isOtpModalOpen, setOtpModalOpen] = useState(false);
    const [otpSecret, setOtpSecret] = useState('');
    const [otpQrCode, setOtpQrCode] = useState('');
    const [otpVerifyCode, setOtpVerifyCode] = useState('');
    const [otpError, setOtpError] = useState('');
    const [isOtpDisabling, setOtpDisabling] = useState(false);
    const [isOtpDisableModalOpen, setOtpDisableModalOpen] = useState(false);
    const [disablePassword, setDisablePassword] = useState('');
    const [disableOtp, setDisableOtp] = useState('');

    const handleReset = () => { if (confirmText === 'RESET') { onReset(); setIsConfirmOpen(false); } };
    
    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();
        setPasswordError(''); setPasswordSuccess('');
        if (newPassword !== confirmPassword) { setPasswordError("New passwords do not match."); return; }
        if (newPassword.length < 4) { setPasswordError("New password must be at least 4 characters long."); return; }
        setIsUpdatingPassword(true);
        try {
            const response = await fetch('/api/auth', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'change-password', userId: auth.user.id, currentPassword, newPassword }),
            });
            const data = await response.json();
            if (response.ok && data.success) {
                onUpdatePassword({ id: auth.user.id, newPassword: newPassword });
                setPasswordSuccess("Password updated successfully!");
                setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
                setTimeout(() => setPasswordSuccess(''), 4000);
            } else { setPasswordError(data.error || "Failed to update password."); }
        } catch (error) { setPasswordError("An error occurred. Please try again."); } 
        finally { setIsUpdatingPassword(false); }
    };

    const handleEnableOtp = async () => {
        setOtpError('');
        const res = await fetch('/api/auth', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'generate-otp-secret', adminUsername: auth.user.username })
        });
        const data = await res.json();
        if (data.success) {
            setOtpSecret(data.secret);
            setOtpQrCode(`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(data.otpauthUrl)}`);
            setOtpModalOpen(true);
        } else {
            setOtpError(data.error || 'Could not start OTP setup.');
        }
    };

    const handleVerifyOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setOtpError('');
        const res = await fetch('/api/auth', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'enable-otp', adminUsername: auth.user.username, otp: otpVerifyCode })
        });
        const data = await res.json();
        if (data.success) {
            setOtpModalOpen(false);
            auth.user.otpEnabled = true; // Manually update client state
        } else {
            setOtpError(data.error || 'Verification failed.');
        }
    };

    const handleDisableOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setOtpError('');
        setOtpDisabling(true);
        const res = await fetch('/api/auth', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'disable-otp', adminUsername: auth.user.username, password: disablePassword, otp: disableOtp })
        });
        const data = await res.json();
        if (data.success) {
            setOtpDisableModalOpen(false);
            setDisablePassword('');
            setDisableOtp('');
            auth.user.otpEnabled = false; // Manually update client state
        } else {
            setOtpError(data.error || 'Could not disable 2FA.');
        }
        setOtpDisabling(false);
    };

    return (
        <div>
            <header className="mb-8"><h1 className="text-3xl font-bold text-dark">System Settings</h1></header>

            <div className="bg-white border-2 border-gray-200 rounded-lg p-6 mb-6">
                <h2 className="text-xl font-bold text-dark mb-4">Account Security</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <h3 className="font-bold text-lg text-dark">Change Password</h3>
                         <form onSubmit={handlePasswordChange} className="space-y-4 mt-2">
                            <div><label className="block text-sm font-bold text-dark mb-1">Current Password</label><input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} required className="block w-full px-3 py-2 bg-white text-dark border-2 border-gray-400 rounded-lg font-semibold" /></div>
                            <div><label className="block text-sm font-bold text-dark mb-1">New Password</label><input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required className="block w-full px-3 py-2 bg-white text-dark border-2 border-gray-400 rounded-lg font-semibold" /></div>
                            <div><label className="block text-sm font-bold text-dark mb-1">Confirm New Password</label><input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required className="block w-full px-3 py-2 bg-white text-dark border-2 border-gray-400 rounded-lg font-semibold" /></div>
                            {passwordError && <p className="font-semibold text-danger">{passwordError}</p>}
                            {passwordSuccess && <p className="font-semibold text-success">{passwordSuccess}</p>}
                            <button type="submit" disabled={isUpdatingPassword} className="bg-secondary text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50">{isUpdatingPassword ? 'Updating...' : 'Change Password'}</button>
                        </form>
                    </div>
                    <div>
                         <h3 className="font-bold text-lg text-dark">Two-Factor Authentication (2FA)</h3>
                         <p className="text-gray-600 mt-2">Add an extra layer of security to your account.</p>
                         {auth.user.otpEnabled ? (
                            <div className="mt-4 flex items-center gap-3 bg-success/10 border border-success text-success font-semibold p-3 rounded-lg">
                                <ShieldCheckIcon className="h-6 w-6"/>
                                <span>2FA is currently enabled.</span>
                            </div>
                         ) : (
                             <div className="mt-4 flex items-center gap-3 bg-gray-100 border border-gray-400 text-gray-800 font-semibold p-3 rounded-lg">
                                <SafetyShieldIcon className="h-6 w-6"/>
                                <span>2FA is currently disabled.</span>
                            </div>
                         )}
                          <div className="mt-4">
                            {auth.user.otpEnabled ? (
                                <button onClick={() => { setOtpError(''); setOtpDisableModalOpen(true); }} className="bg-danger text-white font-bold py-2 px-4 rounded-lg hover:bg-red-700">Disable 2FA</button>
                            ) : (
                                <button onClick={handleEnableOtp} className="bg-secondary text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700">Enable 2FA</button>
                            )}
                         </div>
                    </div>
                </div>
            </div>
            
            <div className="bg-white border-2 border-danger rounded-lg p-6">
                <h2 className="text-xl font-bold text-danger">Danger Zone</h2>
                <p className="text-gray-700 mt-2 mb-4">This action will delete all bookings, customers, and custom configurations, resetting the application to its original state. This cannot be undone.</p>
                <button onClick={() => setIsConfirmOpen(true)} className="bg-danger text-white font-bold py-2 px-4 rounded-lg hover:bg-red-700">Reset Application Data</button>
            </div>

            <Modal isOpen={isOtpModalOpen} onClose={() => setOtpModalOpen(false)} title="Enable Two-Factor Authentication">
                <div className="space-y-4 text-center">
                    <p>1. Scan this QR code with your authenticator app (e.g., Google Authenticator, Authy).</p>
                    {otpQrCode && <img src={otpQrCode} alt="QR Code" className="mx-auto border-2 border-dark p-2 rounded-lg" />}
                    <p>If you cannot scan, manually enter this key:</p>
                    <code className="block bg-gray-100 p-2 rounded font-mono text-lg">{otpSecret}</code>
                    <p>2. Enter the 6-digit code from your app to verify.</p>
                    <form onSubmit={handleVerifyOtp} className="flex flex-col items-center gap-4">
                        <input type="text" value={otpVerifyCode} onChange={e => setOtpVerifyCode(e.target.value)} required maxLength={6} className="p-2 border-2 border-dark rounded font-mono text-2xl tracking-[0.2em] w-48 text-center" placeholder="_ _ _ _ _ _"/>
                        {otpError && <p className="font-semibold text-danger">{otpError}</p>}
                        <button type="submit" className="w-full bg-primary text-dark font-bold py-3 px-4 rounded-xl hover:bg-yellow-500">Verify & Enable</button>
                    </form>
                </div>
            </Modal>
            
            <Modal isOpen={isOtpDisableModalOpen} onClose={() => setOtpDisableModalOpen(false)} title="Disable Two-Factor Authentication">
                <form onSubmit={handleDisableOtp} className="space-y-4">
                    <p>For your security, please enter your password and a valid 2FA code to disable this feature.</p>
                    <div><label className="block text-sm font-bold text-dark mb-1">Password</label><input type="password" value={disablePassword} onChange={e => setDisablePassword(e.target.value)} required className="block w-full px-3 py-2 bg-white text-dark border-2 border-gray-400 rounded-lg font-semibold" /></div>
                    <div><label className="block text-sm font-bold text-dark mb-1">6-Digit Authentication Code</label><input type="text" value={disableOtp} onChange={e => setDisableOtp(e.target.value)} required maxLength={6} className="p-2 border-2 border-dark rounded w-full font-mono text-2xl tracking-[0.2em] text-center" /></div>
                    {otpError && <p className="font-semibold text-danger">{otpError}</p>}
                    <button type="submit" disabled={isOtpDisabling} className="w-full bg-danger text-white font-bold py-3 px-4 rounded-xl hover:bg-red-700 disabled:opacity-50">{isOtpDisabling ? 'Disabling...' : 'Confirm & Disable'}</button>
                </form>
            </Modal>
            
            <Modal isOpen={isConfirmOpen} onClose={() => setIsConfirmOpen(false)} title="Confirm Data Reset">
                <div className="space-y-4">
                    <p className="text-dark">To confirm, please type <code className="bg-dark/10 p-1 rounded font-mono text-dark">RESET</code> in the box below.</p>
                    <input type="text" value={confirmText} onChange={(e) => setConfirmText(e.target.value)} className="w-full p-2 border-2 border-dark rounded font-mono bg-white" placeholder="RESET"/>
                    <div className="flex justify-end gap-4 pt-2">
                        <button onClick={() => setIsConfirmOpen(false)} className="bg-gray-200 text-dark font-bold py-2 px-4 rounded-lg hover:bg-gray-300">Cancel</button>
                        <button onClick={handleReset} disabled={confirmText !== 'RESET'} className="bg-danger text-white font-bold py-2 px-4 rounded-lg disabled:bg-red-300">Yes, Reset Data</button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export const AdminPanel = ({ onLogout, auth, dataApi }: AdminPanelProps) => {
    const [view, setView] = useState('dashboard');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    
    const { cabs, drivers, trips, locations, pickupPoints, allDrivers, allTrips, stats } = dataApi.admin.getData(auth);

    const handlers = {
        addCab: (p: any) => dataApi.admin.addCab(p), deleteCab: (p: any) => dataApi.admin.deleteCab(p), updateCab: (p: any) => dataApi.admin.updateCab(p),
        addDriver: (p: any) => dataApi.admin.addDriver(p), deleteDriver: (p: any) => dataApi.admin.deleteDriver(p), updateDriver: (p: any) => dataApi.admin.updateDriver(p),
        addLocation: (p: any) => dataApi.admin.addLocation(p), deleteLocation: (p: any) => dataApi.admin.deleteLocation(p),
        addPoint: (l: any, p: any) => dataApi.admin.addPoint(l, p), deletePoint: (l: any, p: any) => dataApi.admin.deletePoint(l, p),
        resetData: () => dataApi.admin.resetData(),
        updateAdminPassword: (p: any) => dataApi.admin.updateAdminPassword(p),
    };

    const renderView = () => {
        switch(view) {
            case 'fleet': return <AdminFleetView cabs={cabs} />;
            case 'cabs': return <AdminCabsView cabs={cabs} drivers={allDrivers} locations={locations} allTrips={allTrips} onAdd={handlers.addCab} onDelete={handlers.deleteCab} onUpdate={handlers.updateCab} />;
            case 'drivers': return <AdminDriversView drivers={drivers} onAdd={handlers.addDriver} onDelete={handlers.deleteDriver} onUpdate={handlers.updateDriver} />;
            case 'locations': return <AdminLocationsView locations={locations} pickupPoints={pickupPoints} onAddLocation={handlers.addLocation} onDeleteLocation={handlers.deleteLocation} onAddPoint={handlers.addPoint} onDeletePoint={handlers.deletePoint}/>;
            case 'maintenance': return <AdminMaintenanceView cabs={cabs} onUpdate={handlers.updateCab} />;
            case 'sales': return <AdminSalesView />;
            case 'system': return <AdminSystemView onReset={handlers.resetData} auth={auth} onUpdatePassword={handlers.updateAdminPassword} />;
            case 'dashboard': default: return <AdminDashboard stats={stats} trips={trips} setView={setView}/>;
        }
    };
    
    return (
        <div className="flex h-screen app-container bg-light-gray overflow-hidden relative">
            {isSidebarOpen && <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={() => setIsSidebarOpen(false)} aria-hidden="true"></div>}
            <AdminSidebar currentView={view} setView={setView} onLogout={onLogout} isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
            <main className="flex-1 flex flex-col overflow-y-auto">
                <header className="bg-white p-4 shadow-sm flex justify-between items-center lg:hidden sticky top-0 z-20 border-b">
                    <button onClick={() => setIsSidebarOpen(true)} className="p-2 -ml-2 text-dark"><MenuIcon className="h-6 w-6"/></button>
                    <Logo />
                    <div className="w-6"></div>
                </header>
                <div className="p-4 md:p-6 flex-grow">{renderView()}</div>
            </main>
        </div>
    );
};