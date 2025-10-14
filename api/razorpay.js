// This file acts as a secure, server-side handler for creating Razorpay payment orders.
// Ensure you have set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET as environment variables in your deployment environment.
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const { action, ...body } = req.body;

  if (action === 'create-order') {
    try {
      const { amount } = body;
      if (!amount || typeof amount !== 'number' || amount <= 0) {
        return res.status(400).json({ error: 'Invalid amount provided.' });
      }

      const keyId = process.env.RAZORPAY_KEY_ID;
      const keySecret = process.env.RAZORPAY_KEY_SECRET;

      if (!keyId || !keySecret) {
        console.error("Razorpay API keys not found in environment variables.");
        return res.status(500).json({ error: 'Server payment configuration error.' });
      }

      const auth = Buffer.from(keyId + ':' + keySecret).toString('base64');
      
      const options = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${auth}`
        },
        body: JSON.stringify({
          amount: Math.round(amount * 100), // Amount in the smallest currency unit (paise for INR)
          currency: 'INR',
          receipt: `receipt_sajilo_${Date.now()}`
        })
      };

      const razorpayResponse = await fetch('https://api.razorpay.com/v1/orders', options);
      
      if (!razorpayResponse.ok) {
        const errorData = await razorpayResponse.json();
        console.error('Razorpay API Error:', errorData);
        return res.status(razorpayResponse.status).json({ error: 'Failed to create payment order.' });
      }

      const order = await razorpayResponse.json();
      
      // Send back the order details along with the public key_id for the client-side script
      return res.status(200).json({ ...order, key: keyId });

    } catch (error) {
      console.error('Error creating Razorpay order:', error);
      return res.status(500).json({ error: 'An internal server error occurred while creating the payment order.' });
    }
  } else {
    return res.status(400).json({ error: 'Invalid action specified.' });
  }
}
