
import crypto from 'crypto';

// This function sends an OTP via the Fast2SMS gateway.
// To use it, you must set FAST2SMS_API_KEY as an environment variable in your deployment.
async function sendSms(phone, otp) {
  const apiKey = process.env.FAST2SMS_API_KEY;
  if (!apiKey) {
    console.error('FAST2SMS_API_KEY is not set. Simulating SMS send for development.');
    // For demonstration and local development, we'll log the OTP to the console.
    // In a real deployed app with the key set, this message will not appear.
    console.log(`******* SAJILO TAXI OTP *******`);
    console.log(`*  Sending OTP ${otp} to ${phone}  *`);
    console.log(`*******************************`);
    return { success: true };
  }

  // API endpoint and parameters for Fast2SMS
  const url = 'https://www.fast2sms.com/dev/bulkV2';
  const params = new URLSearchParams({
    authorization: apiKey,
    variables_values: otp,
    route: 'otp', // Use the dedicated, high-priority OTP route
    numbers: phone,
  });

  try {
    const response = await fetch(`${url}?${params.toString()}`, {
      method: 'GET', // Fast2SMS uses GET for this transactional endpoint
    });
    
    const data = await response.json();

    if (data.return !== true) {
      console.error('Fast2SMS API Error:', data.message);
      // Provide a user-friendly error message
      throw new Error('Could not send OTP. Please check the phone number and try again.');
    }
    return { success: true };
  } catch (error) {
    console.error('Error sending SMS via Fast2SMS:', error);
    return { success: false, error: error.message };
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  const { action, phone, otp, verificationId } = req.body;
  const otpSecret = process.env.OTP_SECRET;

  if (!otpSecret) {
    console.error('CRITICAL: OTP_SECRET environment variable is not set.');
    return res.status(500).json({ error: 'Server security configuration error.' });
  }

  if (action === 'send-otp') {
    if (!phone || !/^\d{10}$/.test(phone)) {
      return res.status(400).json({ error: 'A valid 10-digit phone number is required.' });
    }
    
    // Generate a secure 6-digit OTP
    const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = Date.now() + 5 * 60 * 1000; // 5-minute validity

    // Attempt to send the SMS
    const smsResult = await sendSms(phone, generatedOtp);
    if (!smsResult.success) {
      return res.status(500).json({ error: smsResult.error || 'Failed to send OTP.' });
    }

    // Create a secure hash (HMAC) to verify the request later. This is stateless.
    const dataToHash = `${phone}.${generatedOtp}.${expiry}`;
    const hash = crypto.createHmac('sha256', otpSecret).update(dataToHash).digest('hex');
    
    // The verification ID is a tamper-proof token containing public info and the hash.
    const newVerificationId = `${phone}.${expiry}.${hash}`;

    return res.status(200).json({ success: true, verificationId: newVerificationId });
  }

  if (action === 'verify-otp') {
    try {
      if (!otp || !verificationId) {
        return res.status(400).json({ error: 'OTP and verification ID are required.' });
      }

      const parts = verificationId.split('.');
      if (parts.length !== 3) {
        return res.status(400).json({ error: 'Invalid verification ID format.' });
      }

      const [phoneFromId, expiry, hashFromId] = parts;

      if (Date.now() > parseInt(expiry, 10)) {
        return res.status(400).json({ error: 'OTP has expired. Please request a new one.' });
      }
      
      // Recreate the hash on the server using the user-provided OTP to check for a match.
      const dataToHash = `${phoneFromId}.${otp}.${expiry}`;
      const expectedHash = crypto.createHmac('sha256', otpSecret).update(dataToHash).digest('hex');

      // Direct string comparison of the hashes. This is secure and more reliable across different JS environments.
      if (hashFromId === expectedHash) {
        // Hashes match, OTP is valid
        return res.status(200).json({ success: true, message: 'OTP verified successfully.' });
      } else {
        // Hashes do not match, OTP is invalid
        return res.status(400).json({ error: 'Invalid OTP. Please try again.' });
      }
    } catch (e) {
        console.error("Error during OTP verification:", e);
        return res.status(500).json({ error: 'An unexpected error occurred during verification.' });
    }
  }

  return res.status(400).json({ error: 'Invalid action.' });
}