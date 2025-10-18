import sgMail from '@sendgrid/mail';

/**
 * Escapes HTML special characters in a string to prevent XSS attacks.
 * @param {string} unsafe The string to sanitize.
 * @returns {string} The sanitized string.
 */
function escapeHtml(unsafe) {
    if (typeof unsafe !== 'string') return unsafe;
    return unsafe
         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#039;");
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    const { trip } = req.body;
    
    if (!trip || !trip.customer || !trip.customer.email) {
      // Don't treat as an error, just means no email to send to.
      return res.status(200).json({ success: true, message: 'No email address provided, skipping confirmation.' });
    }

    const sendgridApiKey = process.env.SENDGRID_API_KEY;

    // A helper to format numbers as Indian Rupees
    const formatPrice = (price) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(price);
    const totalPrice = formatPrice((trip.car.price || 0) * (trip.details.selectedSeats.length || 0));

    if (!sendgridApiKey) {
      console.warn("******************************************************************");
      console.warn("*** WARNING: SENDGRID_API_KEY not found. Simulating email...   ***");
      console.warn("******************************************************************");
      console.log(`*** BOOKING CONFIRMATION EMAIL                                 ***`);
      console.log(`*** To: ${trip.customer.email}`);
      console.log(`*** Subject: Your Sajilo Taxi Booking is Confirmed!`);
      console.log(`*** Body:`);
      console.log(`    Hi ${trip.customer.name},`);
      console.log(`    Your booking from ${trip.booking.from} to ${trip.booking.to} is confirmed.`);
      console.log(`    Date: ${trip.booking.date}`);
      console.log(`    Vehicle: ${trip.car.vehicle}`);
      console.log(`    Seats: ${trip.details.selectedSeats.join(', ')}`);
      console.log(`    Total: ${totalPrice}`);
      console.log("******************************************************************");
      
      return res.status(200).json({ success: true, message: 'Confirmation sent (simulated).' });
    }

    sgMail.setApiKey(sendgridApiKey);

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: 'Poppins', sans-serif; color: #333; }
          .container { max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px; }
          .header { background-color: #000; color: #FFC107; padding: 10px; text-align: center; border-radius: 8px 8px 0 0; }
          h1 { margin: 0; }
          h2 { color: #333; }
          .details { margin: 20px 0; }
          .details td { padding: 8px 0; border-bottom: 1px solid #eee; }
          .footer { margin-top: 20px; text-align: center; font-size: 12px; color: #777; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header"><h1>Sajilo Taxi</h1></div>
          <h2>Booking Confirmed!</h2>
          <p>Hi ${escapeHtml(trip.customer.name)},</p>
          <p>Thank you for choosing Sajilo Taxi. Your ride is confirmed. Here are your booking details:</p>
          <table class="details" style="width:100%;">
            <tr><td><strong>From:</strong></td><td>${escapeHtml(trip.booking.from)}</td></tr>
            <tr><td><strong>To:</strong></td><td>${escapeHtml(trip.booking.to)}</td></tr>
            <tr><td><strong>Date:</strong></td><td>${new Date(trip.booking.date).toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric'})}</td></tr>
            <tr><td><strong>Departure Time:</strong></td><td>${escapeHtml(trip.car.departureTime)}</td></tr>
            <tr><td><strong>Vehicle:</strong></td><td>${escapeHtml(trip.car.vehicle)} (${escapeHtml(trip.car.type)})</td></tr>
            <tr><td><strong>Driver:</strong></td><td>${escapeHtml(trip.car.driverName)} (${escapeHtml(trip.car.driverPhone)})</td></tr>
            <tr><td><strong>Your Seats:</strong></td><td>${escapeHtml(trip.details.selectedSeats.join(', '))}</td></tr>
            <tr><td style="border-bottom: none;"><strong>Total Amount:</strong></td><td style="border-bottom: none;"><strong>${totalPrice}</strong></td></tr>
          </table>
          <p>Our driver will contact you shortly before pickup. We wish you a safe and pleasant journey!</p>
          <div class="footer">
            Sajilo Taxi | Jila Parishad Road, Pradhan Para, East Salugara, 734001
          </div>
        </div>
      </body>
      </html>
    `;

    const msg = {
      to: trip.customer.email,
      from: 'noreply@sajilotaxi.app', // Must be a verified sender in SendGrid
      subject: `Your Sajilo Taxi Booking is Confirmed! (From: ${escapeHtml(trip.booking.from)} to ${escapeHtml(trip.booking.to)})`,
      html: emailHtml,
    };

    await sgMail.send(msg);

    res.status(200).json({ success: true, message: 'Confirmation email sent successfully.' });

  } catch (error) {
    console.error('Error in send-confirmation API:', error);
    if (error.response) {
      console.error('SendGrid Error Body:', error.response.body);
    }
    res.status(500).json({ error: 'Failed to send confirmation email.' });
  }
}