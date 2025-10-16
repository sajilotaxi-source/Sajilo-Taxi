// This AI-powered feature has been disabled.
export default async function handler(req, res) {
  res.setHeader('Allow', ['POST']);
  return res.status(410).json({ error: 'This feature is no longer available.' });
}
