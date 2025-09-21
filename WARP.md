# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

AgendaVE is a modern React Native mobile application built with Expo for booking services in Venezuela. It's a marketplace connecting clients with service providers (similar to Booksy) featuring role-based authentication, appointment management, and a comprehensive booking system.

## Architecture

### Tech Stack
- **Framework**: React Native with Expo SDK 53
- **Language**: TypeScript with strict mode
- **Backend**: Supabase (PostgreSQL + Auth + Real-time)
- **Navigation**: Expo Router (file-based routing)
- **State Management**: React Context (AuthContext)
- **Styling**: Custom design system with design tokens
- **Storage**: AsyncStorage (mobile) / localStorage (web)

### Project Structure
```
app/
├── (auth)/          # Authentication screens (login, register, register-owner)
├── (tabs)/          # Main app screens with role-based tab navigation
├── (booking)/       # Booking flow screens (provider-detail, book-service)
└── _layout.tsx      # Root layout with AuthProvider

components/
├── ui/              # Reusable UI components (Button, Card, Calendar, etc.)
├── ThemedText.tsx   # Themed text component
└── ThemedView.tsx   # Themed view component

contexts/
└── AuthContext.tsx  # Authentication context and user management

lib/
├── supabase.ts      # Supabase client and TypeScript types
├── auth.ts          # Authentication service layer
└── *.sql           # Database schema and migration files

constants/
└── Colors.ts        # Comprehensive design system and color tokens
```

### User Roles & Navigation
The app has role-based navigation:
- **Clients**: Home, Explore, My Bookings, Profile
- **Providers**: Home, Appointments, Services, Calendar, Profile
- **Shared**: Profile screen for both roles

Navigation is dynamically rendered based on `user.profile?.role` in `app/(tabs)/_layout.tsx`.

## Common Commands

### Development
```bash
# Start development server
npm start
# or for specific platforms
npm run android
npm run ios
npm run web

# Clear cache and restart
npx expo start --clear

# Type checking
npx tsc --noEmit
```

### Database & Backend
```bash
# Database schema is in lib/database-schema.sql
# To apply changes, run SQL in Supabase dashboard SQL Editor

# Check database structure
# Use lib/check-database-structure.sql

# Fix user profiles (development)
# Use lib/fix-user-profile.sql
```

### Linting
```bash
npm run lint
```

### Testing
```bash
# No testing framework currently configured
# Tests should be added with Jest/React Native Testing Library
```

## Database Schema

The app uses Supabase with these main tables:
- **profiles** - User profiles with role information
- **providers** - Extended provider/business information
- **services** - Services offered by providers
- **appointments** - Booking/appointment records
- **availabilities** - Provider availability schedules
- **reviews** - User reviews and ratings

All tables have Row Level Security (RLS) enabled with appropriate policies.

## Environment Setup

1. **Supabase Configuration**:
   ```bash
   cp env.example .env
   ```
   Edit `.env` with your Supabase credentials:
   ```
   EXPO_PUBLIC_SUPABASE_URL=your_project_url
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   ```

2. **Database Setup**: Execute `lib/database-schema.sql` in Supabase SQL Editor

3. **Run Application**:
   ```bash
   npm install
   npx expo start
   ```

## Design System

The app uses a comprehensive design system defined in `constants/Colors.ts`:

### Color Palette
- **Primary**: Blue-based palette (#3b82f6)
- **Secondary**: Yellow/amber palette (#f59e0b)  
- **Semantic**: Success (green), Warning (yellow), Error (red), Info (blue)
- **Grays**: Modern gray scale from 50-950

### Design Tokens
- **Spacing**: Based on 4px increments (xs: 4px → 6xl: 64px)
- **Typography**: 6 font sizes with consistent weights and line heights
- **Radius**: 8 border radius options from xs (4px) to full (9999px)
- **Elevation**: Shadow system with 5 levels

### Component System
Reusable components in `components/ui/`:
- `Button` - Comprehensive button with variants, sizes, loading states
- `Card` - Container with elevation variants
- `Calendar` - Custom calendar with availability states
- `EmptyState` - Consistent empty state presentation

## Authentication Flow

1. **Entry Point**: `app/_layout.tsx` wraps app with `AuthProvider`
2. **Auth Context**: `contexts/AuthContext.tsx` manages authentication state
3. **Route Protection**: 
   - `(auth)/_layout.tsx` - Redirects to tabs if authenticated
   - `(tabs)/_layout.tsx` - Redirects to login if not authenticated
4. **Role-Based UI**: Navigation tabs conditionally rendered based on user role

## File Patterns & Conventions

### Routing
- Use Expo Router file-based routing
- Group related screens in folders: `(auth)`, `(tabs)`, `(booking)`
- Layout files (`_layout.tsx`) define navigation structure

### Components
- Prefix themed components with "Themed" (ThemedText, ThemedView)
- UI components in `components/ui/` folder
- Use TypeScript interfaces for props
- Apply design tokens from `constants/Colors.ts`

### Styling
- Use StyleSheet.create for performance
- Apply design tokens consistently
- Support both light and dark themes (system defined)
- Use absolute paths with `@/` alias (configured in tsconfig.json)

## Development Notes

### Known Issues
- Some SQL files reference user IDs that may need updating for new installations
- Authentication email confirmation flow may need adjustment based on Supabase settings

### State Management
- Authentication state managed via React Context
- No global state management library (Redux/Zustand) currently used
- Consider adding state management for complex booking flows

### Performance Considerations
- Uses Expo's new architecture (newArchEnabled: true)
- AsyncStorage for persistent data
- Optimized with React.memo where appropriate

### Platform Support
- iOS and Android native apps
- Web support via Expo Web
- Responsive design considerations for different screen sizes

## Key Integration Points

### Supabase Integration
- Client configured in `lib/supabase.ts` with platform-specific storage
- Real-time subscriptions available but not currently implemented
- Row Level Security policies enforce data access rules

### Push Notifications
- Table structure exists (`device_push_tokens`) but implementation pending
- Expo Notifications package included in dependencies

### Future Enhancements
The codebase is structured to support:
- Payment system integration
- Geolocation features
- Real-time chat
- Advanced analytics and reporting

## Troubleshooting

### Common Issues
1. **Supabase Connection**: Verify environment variables and project status
2. **Profile Creation**: Check database triggers and RLS policies
3. **Navigation**: Ensure user profile has correct role assignment
4. **Build Errors**: Clear cache with `npx expo start --clear`

### Debug Logs
Authentication flow includes comprehensive console logs prefixed with color-coded tags for easier debugging.

## Code Style

- Use TypeScript strict mode
- Follow React/React Native best practices
- Consistent error handling with try/catch blocks
- Descriptive variable and function names
- Comment complex business logic
- Use absolute imports with @ alias prefix