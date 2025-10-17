// This API route is not in use. Authentication is handled by /api/auth.
// This file is populated to prevent build errors from an empty API file.
export default function handler(req, res) {
  res.status(404).json({ error: 'Endpoint not found.' });
}
