
// In a real application, this data would come from a secure database.
// For this self-contained example, we'll define it here, mirroring initialData.
const admins = [
    { id: 99, name: 'System Superadmin', username: 'sajilotaxi@gmail.com', password: 'admin', role: 'superadmin' },
];
const drivers = [
    { id: 1, name: 'Sangeeta Rai', phone: '+91 9876543210', username: 'sangeeta', password: 'password', role: 'driver' },
    { id: 2, name: 'Sunita Rai', phone: '+91 9876543211', username: 'sunita', password: 'password', role: 'driver' },
    { id: 3, name: 'Bikash Gurung', phone: '+91 9876543212', username: 'bikash', password: 'password', role: 'driver' },
    { id: 4, name: 'Pramod Chettri', phone: '+91 9876543213', username: 'pramod', password: 'password', role: 'driver' },
];

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    const { username, password, role } = req.body;

    if (!username || !password || !role) {
      return res.status(400).json({ error: 'Missing username, password, or role.' });
    }

    const dataSource = role === 'driver' ? drivers : admins;
    const user = dataSource.find(u => u.username === username && u.password === password);

    if (user && user.role === role) {
      // In a real app, you would return a token (e.g., JWT), not the full user object with password.
      // For this example, we'll return the user object without the password to improve security.
      const { password: _, ...userWithoutPassword } = user;
      return res.status(200).json({ success: true, user: userWithoutPassword });
    } else {
      return res.status(401).json({ success: false, error: 'Invalid username or password.' });
    }

  } catch (error) {
    console.error('Error in login API:', error);
    res.status(500).json({ error: 'An internal server error occurred.' });
  }
}
