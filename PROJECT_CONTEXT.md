# AgendaVE Project Context

## Overview
AgendaVE is a cross-platform React Native (Expo) application for booking services with providers. It includes client and provider flows, authentication, booking, ratings, and provider management. The backend uses Supabase (PostgreSQL + Auth) with SQL migrations and RPCs.

## Tech Stack
- App: Expo (React Native), TypeScript, expo-router
- UI: Custom Themed components in `components/` with `Colors.ts`
- State/Auth: Context in `contexts/AuthContext.tsx`
- Backend: Supabase SDK (`lib/supabase.ts`), SQL migrations in `database/migrations/`
- Logging: `lib/logger.ts`

## Directory Map (key parts)
- `app/_layout.tsx`: Root providers, navigation stacks
- `app/(auth)/*`: Authentication screens and layout redirect logic
- `app/(tabs)/*`: Main tabbed experience (home, profile, etc.)
- `app/(booking)/*`: Booking flow screens (service, time, confirmation)
- `app/(provider)/*`: Provider dashboard (business, availability, employees)
- `components/ui/*`: Reusable UI components (Calendar, TimeSlots, Buttons, Cards, Toast, etc.)
- `lib/booking-service.ts`: Core booking domain logic and Supabase access
- `lib/auth.ts`: Auth helpers for signup/signin/signout
- `contexts/AuthContext.tsx`: App-wide auth state, signIn/signUp/signOut

## Navigation and Auth Flow
- Root: `app/_layout.tsx` wraps app in `AuthProvider`, theme, and `Stack`.
- Auth gate:
  - `app/(tabs)/_layout.tsx` redirects unauthenticated users to `/(auth)/login`.
  - `app/(auth)/_layout.tsx` redirects authenticated users to `/(tabs)`.
- Logout: `ProfileScreen` calls `signOut()`; navigation is not manual (layout redirects when `user === null`).

## Booking Flow
- Screens:
  - `service-selection.tsx`: choose service
  - `time-selection.tsx`: select date/time
  - `booking-confirmation.tsx`: confirm
- Calendar: `components/ui/Calendar.tsx`
  - Shows availability and booked states; internal legend removed (duplicate).
- Time slots: `components/ui/TimeSlots.tsx`
  - Displays available times; legend removed to avoid duplication.
- Auto-scroll: After selecting a date in `time-selection.tsx`, the view auto-scrolls to time slots.

## Provider Dashboard
- `app/(provider)/my-business.tsx`
  - Business info edit, services list with activation toggle, availability view.
  - Metrics added:
    - Monthly revenue via `BookingService.getProviderRevenueThisMonth()`
    - Monthly appointments count via `BookingService.getMonthlyAppointmentsCount()`

## Booking Domain Logic (`lib/booking-service.ts`)
- Provider/services CRUD and reads
- Availability (provider and employee) and slots calculation
- Appointments CRUD and status updates
- Reviews create/update and provider rating recalculation (RPC `update_provider_rating_secure`)
- Favorites (providers) for clients
- Metrics:
  - `getProviderRevenueThisMonth(userId?)` sums completed appointments' service prices in current month
  - `getMonthlyAppointmentsCount(userId?)` counts provider appointments in current month excluding cancelled

## Supabase
- Config: `lib/supabase.ts`
- Auth: handled via SDK in `lib/auth.ts`, wrapped by `AuthContext`
- SQL: migrations and fix scripts in `database/` and `supabase/migrations/`

## Theming and UI
- Colors and tokens: `constants/Colors.ts`
- Themed components: `ThemedText`, `ThemedView`, etc.
- Safe areas: `components/ui/SafeAreaView.tsx`

## Error Handling & Logging
- `lib/logger.ts` with categories (e.g., SERVICE)
- `lib/errorHandling.tsx` for UI-level patterns

## Recent Changes (this session)
- Removed duplicate legends:
  - `components/ui/Calendar.tsx`
  - `components/ui/TimeSlots.tsx`
- Fixed double-login navigation on logout by removing manual `router.replace` in `app/(tabs)/profile.tsx`.
- Added auto-scroll to time slots after date selection in `app/(booking)/time-selection.tsx`.
- Added provider metrics (revenue this month, monthly appointments) using new `BookingService` methods and rendered in `my-business.tsx`.

## Conventions
- File/module names and functions are in English/Spanish mixed, UI copy in Spanish.
- Types first, explicit returns on public functions; avoid deep nesting.
- Use `DesignTokens` from `Colors.ts` for spacing/typography.

## Integration Notes
- Availability and slot APIs expect ISO `YYYY-MM-DD` dates and `HH:MM` times.
- Revenue assumes services have `price_amount` and `price_currency`.
- Auth-dependent methods require a Supabase session; ensure `AuthProvider` wraps the app.

## Where to Extend
- Payments: integrate a processor; persist payments linked to appointments.
- Notifications: `lib/notification-service.ts` is available for push.
- Analytics: add more KPIs in provider dashboard (conversion, no-shows, utilization).
- Calendar: support range views and week navigation.
