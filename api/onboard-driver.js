// This file acts as a secure, server-side handler for new driver applications.
// In a real-world application, this function would use an email service (like SendGrid or AWS SES)
// to format and send the received data and attachments to an internal email address.
// For this demonstration, it logs the complete application to the server console.

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    const { formData, files } = req.body;

    if (!formData || !files) {
      return res.status(400).json({ error: 'Missing form data or files.' });
    }

    // --- SIMULATION OF SENDING EMAIL ---
    console.log("*******************************************");
    console.log("*** NEW DRIVER ONBOARDING APPLICATION   ***");
    console.log("*******************************************");
    console.log(`Email simulated for: onboardingwithsajilo@gmail.com`);
    console.log("-------------------------------------------");
    console.log("APPLICANT DETAILS:");
    console.log(`  - Name: ${formData.fullName}`);
    console.log(`  - Phone: ${formData.phone}`);
    console.log(`  - Email: ${formData.email}`);
    console.log(`  - Vehicle Number: ${formData.vehicleNumber}`);
    console.log(`  - Vehicle Type: ${formData.vehicleType}`);
    console.log(`  - Experience: ${formData.experience} years`);
    console.log("-------------------------------------------");
    console.log("DOCUMENTS RECEIVED:");

    for (const key in files) {
      const file = files[key];
      // Log the file name and a truncated portion of its Base64 data to confirm receipt without flooding the console.
      console.log(`  - [${key.toUpperCase()}]: ${file.name} (${(file.data.length / 1024).toFixed(2)} KB)`);
    }
    
    console.log("*******************************************");
    console.log("*** END OF APPLICATION                  ***");
    console.log("*******************************************");
    // --- END OF SIMULATION ---

    res.status(200).json({ success: true, message: 'Application received successfully.' });

  } catch (error) {
    console.error('Error in onboard-driver API:', error);
    res.status(500).json({ error: 'An internal server error occurred.' });
  }
}