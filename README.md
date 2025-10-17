# Sajilo Taxi

**A comprehensive booking platform for a Sikkim-based transport company.**

Sajilo Taxi is a full-featured application designed to streamline the process of booking shared and private taxis in the regions of Sikkim, Darjeeling, Kalimpong, and Bhutan. The platform is built as a single, cohesive web application that serves multiple user roles: Customers, Drivers, and a system Administrator, each with a tailored interface and functionality accessible via dedicated URLs.

![Sajilo Taxi Customer App](https://storage.googleapis.com/project-screenshots/sajilo-taxi-screenshot.png)

---

## ✨ Key Features

### 👤 Customer App (`/`)
- **Cab Booking**: Easily book shared or private cabs between various locations.
- **Seat Selection**: A visual interface to select specific seats in the vehicle.
- **Pickup & Drop Points**: Choose from a list of predefined points for each location.
- **Real-time Tracking**: A live map to track the booked taxi's location.
- **User Authentication**: Simple and secure sign-up and sign-in process.

### 🛠️ Admin Panel (`/admin`)
- **Comprehensive Dashboard**: At-a-glance view of total trips, revenue, and booked seats.
- **Live Odoo Sales Reporting**: A dedicated sales dashboard with real-time data from your Odoo instance, including filtering and breakdowns by route, driver, and vehicle.
- **Fleet Overview**: A live map showing the real-time location of all cabs.
- **Full System Management (CRUD)**: The administrator has full control to Create, Read, Update, and Delete Cabs, Drivers, and Locations.
- **System Reset**: A danger zone feature to reset all application data to its default state for maintenance or testing purposes.

### 🚘 Driver App (`/driver`)
- **Trip Manifest**: Clear view of today's assigned trips and passenger details.
- **Passenger Information**: Access to customer names, phone numbers, and seat assignments.
- **Pickup/Drop Details**: Specific pickup and drop-off points for each passenger.

### ⚙️ General
- **Progressive Web App (PWA)**: Fully installable on mobile and desktop with offline support via a service worker.
- **Responsive Design**: A seamless experience across all devices, from mobile phones to desktops.
- **Data Persistence**: Application state is saved in the browser's `localStorage`, ensuring data is not lost on page reload.

---

## 🚀 Tech Stack

- **Frontend**: React, TypeScript, Vite, Tailwind CSS, Google Maps Platform
- **Email Service**: SendGrid
- **SMS Service**: MSG91 (for booking confirmations)
- **Backend/API**: Vercel Serverless Functions
- **ERP Integration**: Odoo (via JSON-RPC API)

---

## 🌐 Deployment

This application is designed for easy deployment on **Vercel**.

1.  **Import Project**: Import your Git repository into Vercel.
2.  **Framework Preset**: Select **`Vite`**. Vercel will automatically detect the correct settings.
3.  **Build & Output Settings**:
    - **Build Command**: `npm run build` or `vite build`
    - **Output Directory**: `dist`
4.  **Environment Variables**: To enable all features, you must configure the following environment variables in your Vercel project settings. If a variable is not provided, its corresponding feature will be safely simulated in the server logs.
    - **`VITE_GOOGLE_MAPS_API_KEY`**: Your API key from the Google Cloud Console. Required for all map features to work.
    - **`SENDGRID_API_KEY`**: Your SendGrid API key. Required for driver onboarding and customer confirmation emails.
    - **`SENDGRID_FROM_EMAIL`**: **Required.** The email address you have verified as a sender in your SendGrid account. All system emails will be sent from this address.
    - **`SENDGRID_TO_EMAIL`**: The email address where new driver onboarding applications will be sent. Defaults to `onboardingwithsajilo@gmail.com` if not set.
    - **`RAZORPAY_KEY_ID`** & **`RAZORPAY_KEY_SECRET`**: Your Razorpay keys. Required for online payments.
    - **`MSG91_AUTH_KEY`**: Your authentication key from the MSG91 dashboard (for booking confirmation SMS).
    - **`MSG91_SENDER_ID`**: Your DLT-approved Sender ID from MSG91 (e.g., `SAJLTX`) (for booking confirmation SMS).
    - **`MSG91_CONFIRMATION_FLOW_ID`**: The Flow ID for your booking confirmation template from MSG91. You must create a Flow in your MSG91 dashboard for this. The Flow should be configured to use the following variables in its message: `name`, `vehicle`, `from`, `to`, `date`, `time`.
    - **`MSG91_WHATSAPP_OTP_TEMPLATE_ID`**: **Required for customer login.** The Template ID for your WhatsApp OTP message from MSG91. This is used for verifying customer phone numbers.
    - **`VITE_ODOO_URL`**: The **client-side** URL for your Odoo instance (e.g., `https://your-company.odoo.com`).
    - **`ODOO_URL`**: The **server-side** URL for your Odoo instance. This is often the same as `VITE_ODOO_URL`.
    - **`ODOO_DB`**: The name of your Odoo database.
    - **`ODOO_USERNAME`**: The username for the Odoo user with API access.
    - **`ODOO_API_KEY`**: The API key or password for the Odoo user.

Click **Deploy**, and your application will be live!

---

## 📂 Project Structure

-   `index.html`: The main entry point and app shell.
-   `index.tsx`: The main React entry point where the `App` component is rendered.
-   `App.tsx`: The core application component. It contains all UI, state management (`useReducer`), and URL-based routing for all user roles.
-   `api/`: Directory for serverless functions (e.g., `onboard-driver.js`, `otp.js`, `odoo.js`).
-   `services/`: Directory for client-side API service modules (e.g., `odooService.ts`).
-   `sw.js`: The service worker script that enables PWA features and offline caching.
-   `package.json`: Defines dependencies and build scripts for the Vite frontend.
-   `vite.config.ts`: Configuration file for the Vite build tool.