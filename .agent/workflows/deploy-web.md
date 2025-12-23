---
description: How to deploy the AgendaVE web app to Vercel
---

# Deploying AgendaVE to Vercel

Vercel is the recommended hosting platform for Expo Web / Next.js applications.

## Prerequisites
- A Vercel account (free).
- Vercel CLI installed (`npm i -g vercel`) OR connect your GitHub repository to Vercel.

## Option 1: Automatic Deployment (Recommended via GitHub)

1.  **Push your code** to GitHub.
2.  Go to the **Vercel Dashboard** (https://vercel.com/dashboard).
3.  Click **"Add New..."** -> **"Project"**.
4.  Import your `AgendaVE` repository.
5.  **Configure Project**:
    *   **Framework Preset**: Select **Other** (or Expo if available, but "Other" works well with standard Expo output).
    *   **Build Command**: `npx expo export -p web`
    *   **Output Directory**: `dist`
    *   **Install Command**: `npm install`
6.  **Environment Variables**:
    *   Copy all your `.env` variables (SUPABASE_URL, etc.) into the Environment Variables section in Vercel.
7.  Click **Deploy**.

## Option 2: Command Line (Manual)

1.  Run the build command locally to verify:
    ```bash
    npx expo export -p web
    ```
    *(This creates a `dist` folder)*

2.  Deploy with Vercel CLI:
    ```bash
    vercel
    ```
    *   Follow the prompts.
    *   Set `dist` as the output directory when asked.

## Important Notes
*   **Routing**: Expo Router uses `dist/index.html` as the entry. Vercel automatically handles single-page app (SPA) rewrites if configured correctly. If you encounter 404s on refresh, you may need a `vercel.json` file in your root:

    ```json
    {
      "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
    }
    ```
