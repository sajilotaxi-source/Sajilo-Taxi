// This file handles sending transactional SMS for booking confirmations using the MSG91 service.
//
// IMPORTANT: To enable this functionality, you must set the following environment variables
// in your deployment environment (e.g., Vercel):
// - MSG91_AUTH_KEY: Your MSG91 authentication key.
// - MSG91_SENDER_ID: Your DLT-approved Sender ID.
// - MSG91_CONFIRMATION_FLOW_ID: Your MSG91 Flow ID for booking confirmations.
//
// If these variables are not found, the service will fall back to simulating the
// actions in the server console logs.

const MSG91_AUTH_KEY = process.env.MSG91_AUTH_KEY;
const MSG91_SENDER_ID = process.env.MSG91_SENDER_ID;
const MSG91_CONFIRMATION_FLOW_ID = process.env.MSG91_CONFIRMATION_FLOW_ID;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  const { action, ...body } = req.body;
  
  if (action === 'send-booking-confirmation') {
    const { phone, customerName, vehicle, from, to, date, time } = body;
    
    if (!phone || !customerName || !vehicle || !from || !to || !date || !time) {
        return res.status(400).json({ error: 'Missing required booking details for SMS confirmation.' });
    }

    // --- Simulation Logic ---
    if (!MSG91_AUTH_KEY || !MSG91_CONFIRMATION_FLOW_ID || !MSG91_SENDER_ID) {
      console.warn('*** MSG91 SIMULATION: Booking Confirmation Not Configured. ***');
      const message = `Hi ${customerName}, your booking for ${vehicle} from ${from} to ${to} on ${date} at ${time} is confirmed. Thank you for choosing Sajilo Taxi.`;
      console.log(`*** Sending to ${phone}: ${message} ***`);
      return res.status(200).json({ success: true, simulated: true });
    }
    
    // --- Real MSG91 API Call using Flow ---
    try {
        const payload = {
            template_id: MSG91_CONFIRMATION_FLOW_ID,
            sender: MSG91_SENDER_ID,
            recipients: [{
                mobiles: `91${phone}`,
                // These variable names MUST match the variables in your MSG91 Flow template
                name: customerName,
                vehicle: vehicle,
                from: from,
                to: to,
                date: date,
                time: time,
            }]
        };
        const response = await fetch('https://control.msg91.com/api/v5/flow/', {
            method: 'POST',
            headers: {
                'authkey': MSG91_AUTH_KEY,
                'Content-Type': 'application/json',
                'accept': 'application/json'
            },
            body: JSON.stringify(payload)
        });
        
        const data = await response.json();
        if (data.type !== 'success') {
            throw new Error(data.message || 'MSG91 Flow API Error');
        }

        return res.status(200).json({ success: true });

    } catch (error) {
        console.error('MSG91 send-booking-confirmation error:', error);
        return res.status(500).json({ error: 'Failed to send booking confirmation.' });
    }
  }

  return res.status(400).json({ error: 'Invalid action.' });
}