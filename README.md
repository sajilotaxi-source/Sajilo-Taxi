

# Sajilo Taxi

**An AI-enhanced, comprehensive booking platform for a Sikkim-based transport company.**

Sajilo Taxi is a full-featured application designed to streamline the process of booking shared and private taxis in the regions of Sikkim, Darjeeling, Kalimpong, and Bhutan. The platform is built as a single, cohesive web application that serves multiple user roles: Customers, Drivers, and a system Administrator, each with a tailored interface and functionality accessible via dedicated URLs.

![Sajilo Taxi Customer App](https://storage.googleapis.com/project-screenshots/sajilo-taxi-screenshot.png)

---

## ✨ Key Features

### 👤 Customer App (`/`)
- **AI Trip Planner**: Users can describe their travel needs in natural language (e.g., "Gangtok to Pelling for 2 people tomorrow"), and the booking form is automatically filled out using the Google Gemini API.
- **Cab Booking**: Easily book shared or private cabs between various locations.
- **Seat Selection**: A visual interface to select specific seats in the vehicle.
- **Pickup & Drop Points**: Choose from a list of predefined points for each location.
- **Real-time Tracking**: A live map to track the booked taxi's location.
- **User Authentication**: Simple and secure sign-up and sign-in process.

### 🛠️ Admin Panel (`/admin`)
- **Comprehensive Dashboard**: At-a-glance view of total trips, revenue, and booked seats.
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

- **Frontend**: React, TypeScript, Vite, Tailwind CSS, Leaflet.js (for maps)
- **AI Integration**: Google Gemini API
- **Email Service**: SendGrid
- **Backend/API**: Vercel Serverless Functions

---

## 🌐 Deployment

This application is designed for easy deployment on **Vercel**.

1.  **Import Project**: Import your Git repository into Vercel.
2.  **Framework Preset**: Select **`Vite`**. Vercel will automatically detect the correct settings.
3.  **Build & Output Settings**:
    - **Build Command**: `npm run build` or `vite build`
    - **Output Directory**: `dist`
4.  **Environment Variables**: To enable all features, you must configure the following environment variables in your Vercel project settings:
    - **`API_KEY`**: Your Google Gemini API key. This is required for the AI Trip Planner.
    - **`SENDGRID_API_KEY`**: Your SendGrid API key. This is required for the driver onboarding form to send email notifications.
    - **`FAST2SMS_API_KEY`**: (Optional) Your Fast2SMS API key. If provided, the app will send real OTP and booking confirmation SMS messages. Otherwise, they will be simulated in the server logs.
    - **`RAZORPAY_KEY_ID`** & **`RAZORPAY_KEY_SECRET`**: (Optional) Your Razorpay keys. If provided, the online payment option will be fully functional.

Click **Deploy**, and your application will be live!

---

## 📂 Project Structure

-   `index.html`: The main entry point and app shell.
-   `index.tsx`: The main React entry point where the `App` component is rendered.
-   `App.tsx`: The core application component. It contains all UI, state management (`useReducer`), and URL-based routing for all user roles.
-   `api/`: Directory for serverless functions (e.g., `plan-trip.js`, `onboard-driver.js`).
-   `sw.js`: The service worker script that enables PWA features and offline caching.
-   `package.json`: Defines dependencies and build scripts for the Vite frontend.
-   `vite.config.ts`: Configuration file for the Vite build tool.