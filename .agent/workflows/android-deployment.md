---
description: How to deploy AgendaVE to Google Play Console
---

# Android Deployment Guide (Google Play Store)

This guide takes you from 0 to having your app in the Google Play Console (Internal Testing).

## Prerequisites
1.  **Google Play Developer Account**: You need to pay a one-time fee of $25 USD.
    - [Sign up here](https://play.google.com/console/signup)
2.  **EAS CLI**: You already have this installed and logged in.

## Step 1: Create the App in Google Play Console
1.  Go to [Google Play Console](https://play.google.com/console).
2.  Click **"Create app"**.
3.  Fill in the details:
    - **App Name**: AgendaVE
    - **Default Language**: Spanish (es-419 or es-ES)
    - **App or Game**: App
    - **Free or Paid**: Free
4.  Accept the declarations and create.

## Step 2: Build the Production Bundle (AAB)
Unlike the `.apk` we used for testing, Google Play requires an `.aab` (Android App Bundle).

Run this command in your VS Code terminal:
```bash
eas build --platform android --profile production
```
- This will take a while (Cloud Build).
- When finished, it will give you a **Download Link** for an `.aab` file.
- **Download that file** to your computer.

## Step 3: Upload to Internal Testing
We recommend starting with "Internal Testing" so you can test it before the public sees it.

1.  In Google Play Console, go to **Testing > Internal testing** (in the left menu).
2.  Click **"Create new release"**.
3.  **Upload the .aab file** you downloaded in Step 2.
    - *Note: If this is your very first upload, Google might ask you to create a key. Select "Use Google Play App Signing" (Recommended).*
4.  Click **"Next"** and then **"Save"**.

## Step 4: Add Testers (Including Yourself)
1.  In the "Internal testing" tab, go to **"Testers"**.
2.  Create an email list (e.g., "Team").
3.  Add your own Gmail address (and any friends).
4.  **Copy the "Join on the web" link** and open it on your phone to download the app from the Play Store!

## Troubleshooting Common Errors
- **"Package Name already exists"**: Ensure `com.gavince1803.AgendaVE` is not taken by someone else (unlikely).
- **"Version Code already used"**: Expo handles this automatically (`autoIncrement: true` in `eas.json`), but if fails, check `app.json`.
