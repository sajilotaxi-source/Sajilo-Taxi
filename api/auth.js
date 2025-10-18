
// This file acts as a secure, server-side handler for authentication.
// NOTE: In a real-world application, this user data would be stored in and retrieved from a secure database,
// not held in memory. This approach is a simulation for this self-contained project. 2FA setups will reset
// if the serverless function instance is recycled, which is a key limitation of not using a proper database.

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

// --- In-memory Data Store ---

const users = {
    admins: [
        { id: 99, name: 'System Superadmin', username: 'sajilotaxi@gmail.com', password: 'admin', role: 'superadmin', otpEnabled: false, otpSecret: null },
    ],
    drivers: [
        { id: 1, name: 'Sangeeta Rai', phone: '+91 9876543210', username: 'sangeeta', password: 'password', role: 'driver' },
        { id: 2, name: 'Sunita Rai', phone: '+91 9876543211', username: 'sunita', password: 'password', role: 'driver' },
        { id: 3, name: 'Bikash Gurung', phone: '+91 9876543212', username: 'bikash', password: 'password', role: 'driver' },
        { id: 4, name: 'Pramod Chettri', phone: '+91 9876543213', username: 'pramod', password: 'password', role: 'driver' },
        { id: 5, name: 'Test Driver', phone: '+91 1234567890', username: 'testdriver', password: 'testpass', role: 'driver' },
    ]
};

// --- API Handler ---

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', ['POST']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }

    try {
        const { action, ...body } = req.body;
        const adminUser = users.admins.find(a => a.username === (body.username || body.adminUsername)); // Find admin user for OTP actions

        if (action === 'login') {
            const { username, password, role } = body;
            if (!username || !password || !role) return res.status(400).json({ error: 'Missing username, password, or role.' });
            
            const dataSource = role === 'driver' ? users.drivers : users.admins;
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
            const user = users.admins.find(u => u.username === username);
            if (user && user.otpEnabled && verifyOtp(user.otpSecret, otp)) {
                const { password: _, otpSecret: __, ...userWithoutPassword } = user;
                return res.status(200).json({ success: true, user: userWithoutPassword });
            } else {
                return res.status(401).json({ success: false, error: 'Invalid OTP code.' });
            }
        }

        if (action === 'sync-drivers') {
            const { drivers } = body;
            if (!Array.isArray(drivers)) {
                return res.status(400).json({ error: 'Invalid drivers data provided.' });
            }
            // Overwrite the in-memory driver list
            users.drivers = drivers;
            console.log('Server-side drivers synced:', users.drivers.map(d => d.username));
            return res.status(200).json({ success: true, message: 'Drivers synced successfully.' });
        }

        if (action === 'change-password') {
            const { userId, currentPassword, newPassword } = body;
            if (!userId || !currentPassword || !newPassword) return res.status(400).json({ error: 'Missing required fields for password change.' });
            const admin = users.admins.find(a => a.id === userId);
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

        return res.status(400).json({ error: 'Invalid action.' });

    } catch (error) {
        console.error('Error in auth API:', error);
        res.status(500).json({ error: 'An internal server error occurred.' });
    }
}