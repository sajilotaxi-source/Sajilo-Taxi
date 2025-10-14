// This file acts as a secure, server-side handler for authentication.
// NOTE: In a real-world application, this user data would be stored in and retrieved from a secure database,
// not hardcoded. This approach is a simulation for this self-contained project.
// The data here is intentionally kept separate from the client-side `initialData` to mimic a real backend,
// though in this project, it means admin changes on the client won't reflect here without a page reload
// and state reset, a limitation of not using a proper database.

const users = {
    admins: [
        { id: 99, name: 'System Superadmin', username: 'sajilotaxi@gmail.com', password: 'admin', role: 'superadmin' },
    ],
    drivers: [
        { id: 1, name: 'Sangeeta Rai', phone: '+91 9876543210', username: 'sangeeta', password: 'password', role: 'driver' },
        { id: 2, name: 'Sunita Rai', phone: '+91 9876543211', username: 'sunita', password: 'password', role: 'driver' },
        { id: 3, name: 'Bikash Gurung', phone: '+91 9876543212', username: 'bikash', password: 'password', role: 'driver' },
        { id: 4, name: 'Pramod Chettri', phone: '+91 9876543213', username: 'pramod', password: 'password', role: 'driver' },
    ]
};

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', ['POST']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }

    try {
        const { action, ...body } = req.body;

        if (action === 'login') {
            const { username, password, role } = body;
            if (!username || !password || !role) {
                return res.status(400).json({ error: 'Missing username, password, or role.' });
            }

            const dataSource = role === 'driver' ? users.drivers : users.admins;
            const user = dataSource.find(u => u.username === username && u.password === password);

            if (user && user.role === role) {
                // Return user object without the password for security.
                const { password: _, ...userWithoutPassword } = user;
                return res.status(200).json({ success: true, user: userWithoutPassword });
            } else {
                return res.status(401).json({ success: false, error: 'Invalid username or password.' });
            }
        }

        if (action === 'change-password') {
            const { userId, currentPassword, newPassword } = body;
             if (!userId || !currentPassword || !newPassword) {
                return res.status(400).json({ error: 'Missing required fields for password change.' });
            }
            
            // For this example, we only allow the superadmin to change their password
            const admin = users.admins.find(a => a.id === userId);

            if (!admin) {
                 return res.status(404).json({ success: false, error: 'User not found.' });
            }

            if (admin.password !== currentPassword) {
                return res.status(403).json({ success: false, error: 'Current password is incorrect.' });
            }
            
            // In a real DB, you would now update the password.
            // Here, we just simulate success. The client-side state will handle the update.
            // For example: users.admins.find(a => a.id === userId).password = newPassword;
            return res.status(200).json({ success: true, message: 'Password updated successfully.' });
        }

        return res.status(400).json({ error: 'Invalid action.' });

    } catch (error) {
        console.error('Error in auth API:', error);
        res.status(500).json({ error: 'An internal server error occurred.' });
    }
}
