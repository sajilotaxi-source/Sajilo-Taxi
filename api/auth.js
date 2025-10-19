

// This file acts as a secure, server-side handler for authentication and state management.
// It holds the application's "single source of truth" in memory.
// NOTE: This approach is a simulation for this self-contained project. The in-memory state
// WILL BE RESET if the serverless function instance is recycled (cold start).
// For a truly persistent solution, this should be replaced with a database.

import crypto from 'crypto';

// --- TOTP Utilities (RFC 4226 & 6238) ---

const base32Chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

function base32Encode(buffer) {
    let bits = 0, bitLength = 0, base32 = '';
    for (let i = 0; i < buffer.length; i++) {
        bits = (bits << 8) | buffer[i];
        bitLength += 8;
        while (bitLength >= 5) {
            base32 += base32Chars[(bits >>> (bitLength - 5)) & 31];
            bitLength -= 5;
        }
    }
    if (bitLength > 0) {
        base32 += base32Chars[(bits << (5 - bitLength)) & 31];
    }
    return base32;
}

function base32Decode(base32) {
    const charMap = {};
    for (let i = 0; i < base32Chars.length; i++) { charMap[base32Chars[i]] = i; }
    let bits = 0, bitLength = 0;
    const data = [];
    base32 = base32.toUpperCase().replace(/ /g, '');
    for (let i = 0; i < base32.length; i++) {
        const charVal = charMap[base32[i]];
        if (charVal === undefined) continue;
        bits = (bits << 5) | charVal;
        bitLength += 5;
        if (bitLength >= 8) {
            data.push((bits >>> (bitLength - 8)) & 255);
            bitLength -= 8;
        }
    }
    return Buffer.from(data);
}

function verifyOtp(secret, token, window = 1) {
    if (!secret || !token) return false;
    try {
        const decodedSecret = base32Decode(secret);
        const period = 30;
        const counter = Math.floor(Date.now() / 1000 / period);
        for (let i = -window; i <= window; i++) {
            const timeBuffer = Buffer.alloc(8);
            timeBuffer.writeBigUInt64BE(BigInt(counter + i), 0);
            const hmac = crypto.createHmac('sha1', decodedSecret);
            hmac.update(timeBuffer);
            const digest = hmac.digest();
            const offset = digest[digest.length - 1] & 0xf;
            const code = (digest.readUInt32BE(offset) & 0x7fffffff) % 1000000;
            if (code.toString().padStart(6, '0') === token) {
                return true;
            }
        }
    } catch (e) {
        console.error("OTP verification error:", e);
        return false;
    }
    return false;
}

// --- In-memory Data Store (Single Source of Truth) ---

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
    admins: [{ id: 99, name: 'System Superadmin', username: 'sajilotaxi@gmail.com', password: 'admin', role: 'superadmin', otpEnabled: false, otpSecret: null }],
    drivers: [
        { id: 1, name: 'Sangeeta Rai', phone: '+91 9876543210', username: 'sangeeta', password: 'Saj1loDr!ver$2025', role: 'driver' },
        { id: 2, name: 'Sunita Rai', phone: '+91 9876543211', username: 'sunita', password: 'Saj1loDr!ver$2025', role: 'driver' },
        { id: 3, name: 'Bikash Gurung', phone: '+91 9876543212', username: 'bikash', password: 'Saj1loDr!ver$2025', role: 'driver' },
        { id: 4, name: 'Pramod Chettri', phone: '+91 9876543213', username: 'pramod', password: 'Saj1loDr!ver$2025', role: 'driver' },
        { id: 5, name: 'Test Driver', phone: '+91 1234567890', username: 'testdriver', password: 'Saj1loT3st!ng$2025', role: 'driver' },
    ],
    cabs: [
        { id: 1, type: 'SUV (7 Seater)', vehicle: 'SK01 J 1234', from: 'Kalimpong', to: 'Gangtok', price: 400, totalSeats: 7, driverId: 1, location: locationCoordinates['Kalimpong'], destination: locationCoordinates['Gangtok'], departureTime: '09:00 AM', imageUrl: 'https://images.unsplash.com/photo-1554224311-39a092c6126c?q=80&w=870&auto=format&fit=crop' },
        { id: 2, type: 'Sedan (4 Seater)', vehicle: 'SK04 P 5678', from: 'Siliguri', to: 'Darjeeling', price: 600, totalSeats: 4, driverId: 2, location: locationCoordinates['Siliguri'], destination: locationCoordinates['Darjeeling'], departureTime: '09:30 AM', imageUrl: 'https://images.unsplash.com/photo-1580273916550-4852b64d123c?q=80&w=764&auto=format&fit=crop' },
        { id: 3, type: 'Sumo (10 Seater)', vehicle: 'WB74 A 9012', from: 'Gangtok', to: 'Pelling', price: 350, totalSeats: 10, driverId: 3, location: locationCoordinates['Gangtok'], destination: locationCoordinates['Pelling'], departureTime: '10:15 AM', imageUrl: 'https://imgd.aeplcdn.com/1280x720/n/cw/ec/40432/scorpio-classic-exterior-right-front-three-quarter-15.jpeg?isig=0&q=80' },
        { id: 4, type: 'SUV (8 Seater)', vehicle: 'SK01 T 4321', from: 'Gangtok', to: 'Lachung', price: 650, totalSeats: 8, driverId: 4, location: locationCoordinates['Gangtok'], destination: locationCoordinates['Lachung'], departureTime: '08:00 AM', imageUrl: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?q=80&w=870&auto=format&fit=crop' },
    ],
    locations: Object.keys(locationCoordinates).sort(),
    pickupPoints: {
        'Gangtok': ['MG Marg', 'Deorali', 'Tadong', 'Ranipool'], 'Pelling': ['Upper Pelling', 'Lower Pelling', 'Helipad'],
        'Darjeeling': ['Chowrasta Mall', 'Darjeeling Station', 'Ghoom Monastery'], 'Kalimpong': ['Kalimpong Main Market', 'Deolo Hill', 'Durpin Dara'],
        'Siliguri': ['City Centre', 'Sevoke Road', 'NJP Station'], 'Default': ['Main Bus Stand', 'City Center']
    },
    trips: [], customers: [], customLocationCoordinates: {}, activeTrips: {},
};

let appData = JSON.parse(JSON.stringify(initialData));

// This is a server-side replica of the client's appReducer to ensure state logic is identical.
function serverReducer(state, action) {
    const { type, payload } = action;
    const getCoords = (locName, currentState) => currentState.customLocationCoordinates[locName] || locationCoordinates[locName];
    switch (type) {
        case 'RESET_STATE': return JSON.parse(JSON.stringify(initialData));
        case 'ADD_CAB': { const cab = payload; const loc = getCoords(cab.from, state); const dest = getCoords(cab.to, state); return { ...state, cabs: [...state.cabs, { ...cab, id: Date.now(), location: loc, destination: dest }] }; }
        case 'UPDATE_CAB': return { ...state, cabs: state.cabs.map(c => c.id === payload.id ? { ...c, ...payload, location: getCoords(payload.from, state), destination: getCoords(payload.to, state) } : c) };
        case 'DELETE_CAB': return { ...state, cabs: state.cabs.filter(c => c.id !== payload) };
        case 'ADD_DRIVER': return { ...state, drivers: [...state.drivers, { ...payload, id: Date.now(), role: 'driver' }] };
        case 'UPDATE_DRIVER': return { ...state, drivers: state.drivers.map(d => d.id === payload.id ? { ...d, name: payload.name, phone: payload.phone, username: payload.username, password: payload.password || d.password } : d) };
        case 'DELETE_DRIVER': return { ...state, drivers: state.drivers.filter(d => d.id !== payload), cabs: state.cabs.map(c => c.driverId === payload ? { ...c, driverId: null } : c) };
        case 'ADD_LOCATION': { const { name, lat, lon } = payload; if (state.locations.includes(name)) return state; const newCoords = { ...state.customLocationCoordinates, [name]: [parseFloat(lat), parseFloat(lon)] }; return { ...state, locations: [...state.locations, name].sort(), customLocationCoordinates: newCoords }; }
        case 'DELETE_LOCATION': { const loc = payload; const newPoints = { ...state.pickupPoints }; delete newPoints[loc]; const newCoords = { ...state.customLocationCoordinates }; delete newCoords[loc]; return { ...state, locations: state.locations.filter(l => l !== loc), pickupPoints: newPoints, customLocationCoordinates: newCoords }; }
        case 'ADD_POINT': { const { loc, point } = payload; return { ...state, pickupPoints: { ...state.pickupPoints, [loc]: [...(state.pickupPoints[loc] || []), point] } }; }
        case 'DELETE_POINT': { const { loc, point } = payload; return { ...state, pickupPoints: { ...state.pickupPoints, [loc]: state.pickupPoints[loc].filter(p => p !== point) } }; }
        case 'ADD_CUSTOMER': return { ...state, customers: [...state.customers, payload] };
        case 'ADD_TRIP': return { ...state, trips: [payload, ...state.trips] };
        default: return state;
    }
}


// --- API Handler ---

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', ['POST']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }

    try {
        const { action, payload, ...body } = req.body;
        const adminUser = appData.admins.find(a => a.username === (body.username || body.adminUsername));

        // --- AUTHENTICATION ACTIONS ---
        if (action === 'login') {
            const { username, password, role } = body;
            if (!username || !password || !role) return res.status(400).json({ error: 'Missing username, password, or role.' });
            
            const dataSource = role === 'driver' ? appData.drivers : appData.admins;
            const user = dataSource.find(u => u.username === username && u.password === password);

            if (user && user.role === role) {
                if (user.role === 'superadmin' && user.otpEnabled) {
                    return res.status(200).json({ success: true, otpRequired: true, username: user.username });
                }
                const { password: _, otpSecret: __, ...userWithoutPassword } = user;
                return res.status(200).json({ success: true, user: userWithoutPassword });
            } else {
                return res.status(401).json({ success: false, error: 'Invalid username or password.' });
            }
        }
        
        if (action === 'login-otp') {
            const { username, otp } = body;
            if (!username || !otp) return res.status(400).json({ error: 'Missing username or OTP.' });
            const user = appData.admins.find(u => u.username === username);
            if (user && user.otpEnabled && verifyOtp(user.otpSecret, otp)) {
                const { password: _, otpSecret: __, ...userWithoutPassword } = user;
                return res.status(200).json({ success: true, user: userWithoutPassword });
            } else {
                return res.status(401).json({ success: false, error: 'Invalid OTP code.' });
            }
        }

        if (action === 'change-password') {
            const { userId, currentPassword, newPassword } = body;
            if (!userId || !currentPassword || !newPassword) return res.status(400).json({ error: 'Missing required fields for password change.' });
            const admin = appData.admins.find(a => a.id === userId);
            if (!admin) return res.status(404).json({ success: false, error: 'User not found.' });
            if (admin.password !== currentPassword) return res.status(403).json({ success: false, error: 'Current password is incorrect.' });
            admin.password = newPassword;
            return res.status(200).json({ success: true, message: 'Password updated successfully.' });
        }

        if (action === 'generate-otp-secret') {
            if (!adminUser) return res.status(404).json({ error: 'Admin user not found.' });
            const secret = base32Encode(crypto.randomBytes(20));
            adminUser.otpSecret = secret; // Temporarily store for verification
            const issuer = 'SajiloTaxi';
            const otpauthUrl = `otpauth://totp/${issuer}:${adminUser.username}?secret=${secret}&issuer=${issuer}`;
            return res.status(200).json({ success: true, secret, otpauthUrl });
        }

        if (action === 'enable-otp') {
            const { otp } = body;
            if (!adminUser || !adminUser.otpSecret) return res.status(400).json({ error: 'OTP secret not generated or user not found.' });
            if (verifyOtp(adminUser.otpSecret, otp)) {
                adminUser.otpEnabled = true;
                return res.status(200).json({ success: true, message: '2FA enabled successfully.' });
            }
            return res.status(400).json({ error: 'Invalid OTP code. Please try again.' });
        }
        
        if (action === 'disable-otp') {
            const { password, otp } = body;
            if (!adminUser) return res.status(404).json({ error: 'Admin user not found.' });
            if (adminUser.password !== password) return res.status(403).json({ error: 'Incorrect password.' });
            if (!verifyOtp(adminUser.otpSecret, otp)) return res.status(400).json({ error: 'Invalid OTP code.' });

            adminUser.otpEnabled = false;
            adminUser.otpSecret = null;
            return res.status(200).json({ success: true, message: '2FA disabled successfully.' });
        }

        // --- STATE MANAGEMENT ACTIONS ---

        if (action === 'get-data') {
            return res.status(200).json({ success: true, data: appData });
        }
        
        // All other actions are assumed to be state mutations from the admin panel
        const newState = serverReducer(appData, { type: action, payload: payload });
        appData = newState; // Update the in-memory state
        return res.status(200).json({ success: true });


    } catch (error) {
        console.error('Error in auth API:', error);
        res.status(500).json({ error: 'An internal server error occurred.' });
    }
}
