import { ScrollViewStyleReset } from 'expo-router/html';
import { type PropsWithChildren } from 'react';

/**
 * This file is web-only and used to configure the root HTML for every page.
 * The <head> doesn't support React Native web components (View, Text, etc).
 *
 * We use this to:
 * 1. Disable zooming on mobile (user-scalable=no) to prevent "focus zoom".
 * 2. Set height: 100% to prevent clipping.
 */
export default function Root({ children }: PropsWithChildren) {
    return (
        <html lang="es">
            <head>
                <meta charSet="utf-8" />
                <meta httpEquiv="X-UA-Compatible" content="IE=edge" />

                {/* 
          CRITICAL FIXES FOR MOBILE WEB:
          - width=device-width, initial-scale=1: Standard mobile viewport
          - maximum-scale=1, user-scalable=no: PREVENTS ZOOMING when typing in inputs
          - viewport-fit=cover: Allows using the notch/safe-areas
        */}
                <meta
                    name="viewport"
                    content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover"
                />

                {/* 
          Disable tap highlight on Android/iOS to make it feel more "Native" 
        */}
                <style dangerouslySetInnerHTML={{
                    __html: `
          body {
            background-color: #FAFAFA;
            /* Prevents the "rubber band" scroll effect on the body itself */
            overscroll-behavior-y: none;
          }
          /* Ensure the root element takes full height */
          #root {
            display: flex;
            flex: 1;
            height: 100%;
          }
          /* Remove default focus outlines for a cleaner app look */
          input:focus, textarea:focus, select:focus {
            outline: none;
          }
        `}} />

                {/* 
          ScrollViewStyleReset: Resets web scrolling to match React Native 
        */}
                <ScrollViewStyleReset />
            </head>
            <body>
                {children}
            </body>
        </html>
    );
}
