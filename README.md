# AgendaVE 🇻🇪

AgendaVE is a cross-platform React Native (Expo) application designed to help service providers and clients in Venezuela manage appointments efficiently, even with connectivity challenges.

## 🚀 Features

-   **Offline-First**: Browse providers and view appointments without internet connection.
-   **Smart Sync**: Actions queue up and sync automatically when connection is restored.
-   **Role-Based Access**: Distinct flows for Clients and Service Providers.
-   **Provider Dashboard**: Manage services, availability, and employees.
-   **Client Booking**: Easy service selection, calendar view, and booking management.
-   **Metrics**: Track revenue and appointment stats.
-   **Nearby Providers**: Find services near you with "Cerca de mí".
-   **Reliability System**: Providers can identify reliable clients and manage No-Shows.

## 🛠 Tech Stack

-   **Framework**: React Native (Expo)
-   **Language**: TypeScript
-   **Navigation**: Expo Router
-   **Backend**: Supabase (PostgreSQL + Auth)
-   **Styling**: Custom themed components
-   **State Management**: React Context + Local Storage

## 🏁 Getting Started

### Prerequisites

-   Node.js
-   npm or yarn
-   Expo CLI

### Installation

1.  Clone the repository:
    ```bash
    git clone <repository-url>
    cd AgendaVE
    ```

2.  Install dependencies:
    ```bash
    npm install
    ```

3.  Set up environment variables:
    Create a `.env` file in the root directory with your Supabase credentials:
    ```env
    EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
    EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
    ```

4.  Start the development server:
    npx expo start
    ```

## 🧪 Testing

To run the app on a simulator or physical device:

### Android
```bash
# Run on Android Emulator or connected device
npx expo run:android
```

### iOS
```bash
# Run on iOS Simulator (Mac only)
npx expo run:ios
```

## 🚀 Deployment

### Android (Google Play)
Please refer to the internal workflow `/android-deployment` for detailed instructions on deploying to the Google Play Console.

### Web (Vercel)
The web version is optimized for Vercel. Ensure your environment variables are correctly set in the Vercel dashboard.

## 📱 Project Structure

-   `app/`: Expo Router pages and layouts
    -   `(auth)`: Authentication screens
    -   `(tabs)`: Main application tabs
    -   `(booking)`: Booking flow
    -   `(provider)`: Provider management
-   `components/`: Reusable UI components
-   `lib/`: Business logic, services, and utilities
-   `contexts/`: Global state (Auth)
-   `database/`: SQL migrations and setup

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License.
