
import crypto from 'crypto';

// This function sends an SMS via the Fast2SMS gateway.
// To use it, you must set FAST2SMS_API_KEY as an environment variable in your deployment.
async function sendSms({ phone, otp, message, type = 'otp' }) {
  const apiKey = process.env.FAST2SMS_API_KEY;
  if (!apiKey) {
    console.log(`******* SAJILO TAXI SMS SIMULATION *******`);
    if (type === 'otp') {
        console.log(`*  Type: OTP Registration`);
        console.log(`*  To: ${phone}`);
        console.log(`*  OTP: ${otp}`);
    } else { // 'confirmation'
        console.log(`*  Type: Booking Confirmation`);
        console.log(`*  To: ${phone}`);
        console.log(`*  Message: ${message}`);
    }
    console.log(`****************************************`);
    return { success: true, simulated: true };
  }

  // API endpoint and parameters for Fast2SMS
  const url = 'https://www.fast2sms.com/dev/bulkV2';
  let params;

  if (type === 'otp') {
    params = new URLSearchParams({
        authorization: apiKey,
        variables_values: otp,
        route: 'otp', // Use the dedicated, high-priority OTP route
        numbers: phone,
    });
  } else { // For booking confirmation and other transactional messages
    // IMPORTANT: For production in India, you MUST use a registered DLT template ID.
    // The message param should then contain the template ID, and you would use different parameters.
    // For this demo, we use the simpler 'q' route which may have delivery limitations.
    params = new URLSearchParams({
        authorization: apiKey,
        message: message,
        language: 'english',
        route: 'q',
        numbers: phone,
    });
  }


  try {
    const response = await fetch(`${url}?${params.toString()}`, {
      method: 'GET',
    });
    
    const data = await response.json();

    if (data.return !== true) {
      console.error('Fast2SMS API Error:', data.message);
      throw new Error('Could not send SMS. Please check the phone number and try again.');
    }
    return { success: true, simulated: false };
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
  const otpSecret = process.env.OTP_SECRET || 'a-secure-default-secret-for-sajilo-taxi-demo';

  if (action === 'send-otp') {
    if (!phone || !/^\d{10}$/.test(phone)) {
      return res.status(400).json({ error: 'A valid 10-digit phone number is required.' });
    }
    
    const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = Date.now() + 5 * 60 * 1000; // 5-minute validity

    const smsResult = await sendSms({ phone, otp: generatedOtp, type: 'otp' });
    if (!smsResult.success) {
      return res.status(500).json({ error: smsResult.error || 'Failed to send OTP.' });
    }

    const dataToHash = `${phone}.${generatedOtp}.${expiry}`;
    const hash = crypto.createHmac('sha256', otpSecret).update(dataToHash).digest('hex');
    const newVerificationId = `${phone}.${expiry}.${hash}`;

    return res.status(200).json({ success: true, verificationId: newVerificationId, simulated: smsResult.simulated });
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
      
      const dataToHash = `${phoneFromId}.${otp}.${expiry}`;
      const expectedHash = crypto.createHmac('sha256', otpSecret).update(dataToHash).digest('hex');

      if (hashFromId === expectedHash) {
        return res.status(200).json({ success: true, message: 'OTP verified successfully.' });
      } else {
        return res.status(400).json({ error: 'Invalid OTP. Please try again.' });
      }
    } catch (e) {
        console.error("Error during OTP verification:", e);
        return res.status(500).json({ error: 'An unexpected error occurred during verification.' });
    }
  }
  
  if (action === 'send-booking-confirmation') {
    const { phone, customerName, vehicle, from, to, date, time } = req.body;
    
    if (!phone || !customerName || !vehicle || !from || !to || !date || !time) {
        return res.status(400).json({ error: 'Missing required booking details for SMS confirmation.' });
    }

    const message = `Hi ${customerName}, your booking for ${vehicle} from ${from} to ${to} on ${date} at ${time} is confirmed. Thank you for choosing Sajilo Taxi.`;
    
    // In India, DLT regulations require pre-approved templates. This message is for demonstration.
    // Example DLT Template: Hi {#var#}, your booking for {#var#} from {#var#} to {#var#} on {#var#} at {#var#} is confirmed. Thank you for choosing Sajilo Taxi. - YourCompany
    
    const smsResult = await sendSms({ phone, message, type: 'confirmation' });

    if (!smsResult.success) {
      return res.status(500).json({ error: smsResult.error || 'Failed to send booking confirmation.' });
    }

    return res.status(200).json({ success: true });
  }

  return res.status(400).json({ error: 'Invalid action.' });
}