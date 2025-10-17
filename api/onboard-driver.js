import sgMail from '@sendgrid/mail';

// This file acts as a secure, server-side handler for new driver applications.
// It uses the SendGrid API to email the application details and attachments.
//
// IMPORTANT: For this to work, you MUST set the `SENDGRID_API_KEY` environment variable
// in your deployment environment (e.g., Vercel). If the key is not found, it will
// fall back to logging the application details to the server console as a simulation.

// Vercel-specific configuration to increase the body size limit for this function.
// This is necessary to handle multiple base64-encoded document uploads.
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '25mb', // Set a 25MB limit for the request body
    },
  },
};

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

    const sendgridApiKey = process.env.SENDGRID_API_KEY;

    if (!sendgridApiKey) {
      // Fallback to console logging if SendGrid API key is not configured
      console.warn("******************************************************************");
      console.warn("*** WARNING: SENDGRID_API_KEY not found. Simulating email...   ***");
      console.warn("*** To send real emails, set the SENDGRID_API_KEY env var.     ***");
      console.warn("******************************************************************");
      console.log("*** NEW DRIVER ONBOARDING APPLICATION                          ***");
      console.log("******************************************************************");
      console.log(`Email would be sent to: onboardingwithsajilo@gmail.com`);
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
        console.log(`  - [${key.toUpperCase()}]: ${file.name} (${(file.data.length / 1024).toFixed(2)} KB)`);
      }
      console.log("******************************************************************");

      return res.status(200).json({ success: true, message: 'Application received (simulated email).' });
    }

    // --- Send Email with SendGrid ---
    sgMail.setApiKey(sendgridApiKey);

    const emailHtml = `
      <h1>New Driver Onboarding Application</h1>
      <p>A new application has been submitted through the Sajilo Taxi driver onboarding portal.</p>
      <h2>Applicant Details</h2>
      <ul>
        <li><strong>Full Name:</strong> ${formData.fullName}</li>
        <li><strong>Phone Number:</strong> ${formData.phone}</li>
        <li><strong>Email Address:</strong> ${formData.email}</li>
      </ul>
      <h2>Vehicle Details</h2>
      <ul>
        <li><strong>Vehicle Number:</strong> ${formData.vehicleNumber}</li>
        <li><strong>Vehicle Type:</strong> ${formData.vehicleType}</li>
        <li><strong>Driving Experience:</strong> ${formData.experience} years</li>
      </ul>
      <hr>
      <p>All submitted documents are attached to this email.</p>
    `;

    const attachments = Object.keys(files).map(key => {
      const file = files[key];
      // The base64 data from the client includes the data URI prefix, which needs to be removed.
      const base64Content = file.data.split(';base64,').pop();
      return {
        content: base64Content,
        filename: file.name,
        type: file.type,
        disposition: 'attachment',
      };
    });

    const msg = {
      to: 'onboardingwithsajilo@gmail.com',
      // It's best practice to use a verified sender email address with SendGrid.
      from: 'noreply@sajilotaxi.app',
      subject: `New Driver Application: ${formData.fullName}`,
      html: emailHtml,
      attachments,
    };

    await sgMail.send(msg);

    res.status(200).json({ success: true, message: 'Application received successfully.' });

  } catch (error) {
    console.error('Error in onboard-driver API:', error);
    // If SendGrid returns an error, log its body for debugging
    if (error.response) {
      console.error('SendGrid Error Body:', error.response.body);
    }
    res.status(500).json({ error: 'An internal server error occurred while sending the application.' });
  }
}