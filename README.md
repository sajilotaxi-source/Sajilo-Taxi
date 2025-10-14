
# Sajilo Taxi

**An AI-enhanced, comprehensive booking platform for a Sikkim-based transport company.**

Sajilo Taxi is a full-featured application designed to streamline the process of booking shared and private taxis in the regions of Sikkim, Darjeeling, Kalimpong, and Bhutan. The platform is built as a single, cohesive web application that serves multiple user roles: Customers, Drivers, Admins, and Super Admins, each with a tailored interface and functionality.

![Sajilo Taxi Customer App](https://storage.googleapis.com/project-screenshots/sajilo-taxi-screenshot.png)

---

## ✨ Key Features

### 👤 Customer App
- **AI Trip Planner**: Users can describe their travel needs in natural language (e.g., "Gangtok to Pelling for 2 people tomorrow"), and the booking form is automatically filled out using the Google Gemini API.
- **Cab Booking**: Easily book shared or private cabs between various locations.
- **Seat Selection**: A visual interface to select specific seats in the vehicle.
- **Pickup & Drop Points**: Choose from a list of predefined points for each location.
- **Real-time Tracking**: A live map to track the booked taxi's location.
- **User Authentication**: Simple and secure sign-up and sign-in process.

### 🛠️ Admin Panel
- **Comprehensive Dashboard**: At-a-glance view of total trips, revenue, and booked seats.
- **Fleet Overview**: A live map showing the real-time location of all cabs.
- **CRUD Operations**: Full control to Create, Read, Update, and Delete Cabs, Drivers, Locations, and Admins.
- **Role-Based Access**:
    - **Admin**: Manages their assigned set of cabs and drivers.
    - **Super Admin**: Has full system access, including managing other admins and system-wide data reset capabilities.

### 🚘 Driver App
- **Trip Manifest**: Clear view of today's assigned trips and passenger details.
- **Passenger Information**: Access to customer names, phone numbers, and seat assignments.
- **Pickup/Drop Details**: Specific pickup and drop-off points for each passenger.

### ⚙️ General
- **Progressive Web App (PWA)**: Fully installable on mobile and desktop with offline support via a service worker.
- **Responsive Design**: A seamless experience across all devices, from mobile phones to desktops.
- **Data Persistence**: Application state is saved in the browser's `localStorage`, ensuring data is not lost on page reload.

---

## 🚀 Tech Stack

- **Frontend**: React, TypeScript, Tailwind CSS, Leaflet.js (for maps)
- **AI Integration**: Google Gemini API
- **Backend/API**: Vercel Serverless Functions (for the secure Gemini API endpoint)
- **Tooling**: Babel (for in-browser JSX transpilation)

---

## 🌐 Deployment

This application is designed for easy deployment on **Vercel**.

1.  **Import Project**: Import your Git repository into Vercel.
2.  **Framework Preset**: Select **`Other`**.
3.  **Build & Output Settings**: Leave the default settings. Vercel will automatically detect the `package.json` and handle the serverless function.
4.  **Environment Variables**: Add your Google Gemini API key as an environment variable:
    - **Name**: `API_KEY`
    - **Value**: `Your-Secret-Gemini-API-Key`

Click **Deploy**, and your application will be live!

---

## 📂 Project Structure

-   `index.html`: The main entry point. Sets up the app shell, Tailwind CSS, and the import map for ES modules.
-   `index.tsx`: The main React entry point where the `App` component is rendered.
-   `App.tsx`: The core application component. It contains all UI, state management (`useReducer`), and logic for all user roles (Customer, Admin, Driver, etc.).
-   `api/plan-trip.js`: A serverless function that acts as a secure backend endpoint to communicate with the Google Gemini API, protecting the API key.
-   `sw.js`: The service worker script that enables PWA features and offline caching.
-   `manifest.json`: The configuration file for the Progressive Web App.
-   `package.json`: Defines the dependencies (`@google/genai`) required for the serverless function.
