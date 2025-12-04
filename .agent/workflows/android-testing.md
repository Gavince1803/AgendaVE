---
description: How to test AgendaVE on Android
---

# Testing on Android

You have three main options to test the application on Android, ranging from easiest to most robust.

## Option 1: Expo Go (Easiest & Fastest)
Best for quick testing during development. No Android Studio required.

1.  **Install Expo Go**: Download the "Expo Go" app from the Google Play Store on your Android device.
2.  **Start the Server**:
    Run the following command in your terminal:
    ```bash
    npx expo start
    ```
3.  **Scan QR Code**:
    - The terminal will display a QR code.
    - Open Expo Go on your Android phone.
    - Tap "Scan QR Code" and scan the code from your terminal.
    - The app will load on your phone.

## Option 2: Android Emulator (Requires Setup)
Best if you don't have a physical Android device or want to test on different screen sizes.

1.  **Prerequisites**: You must have Android Studio installed and an Android Virtual Device (AVD) set up.
2.  **Run on Emulator**:
    Run the following command:
    ```bash
    npm run android
    ```
    (This is an alias for `npx expo run:android`)
    - This will attempt to launch the emulator and install the app.

## Option 3: Create an APK (For Sharing/Production Testing)
Best for sharing with others or testing the "real" app experience without the Expo Go wrapper.

1.  **Install EAS CLI** (if not already installed):
    ```bash
    npm install -g eas-cli
    ```
2.  **Login to Expo**:
    ```bash
    eas login
    ```
3.  **Build for Android**:
    To create an installable APK for testing (preview profile):
    ```bash
    eas build -p android --profile preview
    ```
    - Follow the prompts.
    - Once finished, you will get a link to download the `.apk` file.
    - You can install this APK on any Android device.

## Troubleshooting
- **Network Issues**: Ensure your phone and computer are on the **same Wi-Fi network** for Option 1.
- **Tunneling**: If you have firewall issues, try running `npx expo start --tunnel`.
