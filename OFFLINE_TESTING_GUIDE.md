# Offline Features Testing Guide

## Quick Start

### 1. Access the Test Screen

Navigate to the offline test screen:
```
app/(main)/offline-test.tsx
```

Or add a button in your profile/settings to navigate there:
```typescript
import { router } from 'expo-router';

<Button 
  title="Test Offline Mode" 
  onPress={() => router.push('/(main)/offline-test')}
/>
```

---

## Testing Scenarios

### Scenario 1: Basic Offline Caching

**Goal:** Verify data can be cached and retrieved offline

**Steps:**
1. **Open the app** with internet connection
2. **Navigate** to offline test screen (`/(main)/offline-test`)
3. **Tap "Cachear Proveedores"** - should see success message
4. **Tap "Cachear Citas"** - should see success message
5. **Check storage info** - numbers should increase
6. **Enable Airplane Mode** on your device
7. **Tap "Probar Modo Offline"** - should show cached data available
8. **Navigate to Explore** screen - providers should load from cache
9. **Navigate to Calendar** - appointments should load from cache

**Expected Results:**
- ✅ Data loads even without internet
- ✅ Browse providers works offline
- ✅ View appointments works offline
- ✅ Storage info shows cached counts

---

### Scenario 2: Sync Queue Testing

**Goal:** Verify actions are queued when offline and sync when online

**Steps:**
1. **Cache some data** (providers, appointments)
2. **Enable Airplane Mode**
3. **Try to favorite a provider** - should queue the action
4. **Tap "Ver Cola"** in test screen - should show 1 item
5. **Try another action** (e.g., cancel appointment) - should queue
6. **Tap "Ver Cola"** - should show 2 items
7. **Disable Airplane Mode**
8. **Implement sync logic** (see Integration section below)
9. **Verify** actions were synced to server

**Expected Results:**
- ✅ Actions are queued when offline
- ✅ Queue persists across app restarts
- ✅ Queue shows correct count
- ✅ Actions sync when online (requires sync implementation)

---

### Scenario 3: Search History

**Goal:** Verify search history works offline

**Steps:**
1. **Tap "Agregar Búsquedas de Prueba"**
2. **Verify** history appears in the list
3. **Enable Airplane Mode**
4. **Navigate to Explore screen**
5. **Tap search bar** - should show history dropdown
6. **Tap a history item** - should populate search field
7. **Search for something new** - should add to history
8. **Disable Airplane Mode**
9. **History should persist** across app restarts

**Expected Results:**
- ✅ History saves locally
- ✅ History appears in dropdown
- ✅ Works without internet
- ✅ Persists across sessions

---

### Scenario 4: Power Outage Simulation (Real-World Test)

**Goal:** Test the actual Venezuela use case

**Steps:**
1. **Morning (With Power):**
   - Open app
   - Let it cache data automatically
   - Browse some providers
   - Check some appointments

2. **Afternoon (Simulated Outage):**
   - Enable Airplane Mode (simulates power outage)
   - Try to browse providers - should work
   - Try to view appointments - should work
   - Try to book appointment - should queue
   - Try to favorite provider - should queue

3. **Evening (Power Returns):**
   - Disable Airplane Mode
   - App should auto-sync queued actions
   - Verify favorite was added
   - Verify appointment was booked

**Expected Results:**
- ✅ App usable during "outage"
- ✅ All actions preserved
- ✅ Auto-sync when "power returns"
- ✅ No data loss

---

## Manual Testing Checklist

### Cache Management
- [ ] Cache providers successfully
- [ ] Cache appointments successfully
- [ ] Cache favorites successfully
- [ ] View cached data offline
- [ ] Clear cache works
- [ ] Storage info updates correctly

### Sync Queue
- [ ] Add items to queue
- [ ] View queue contents
- [ ] Queue persists app restart
- [ ] Clear queue works
- [ ] Queue count accurate

### Search History
- [ ] Add search terms
- [ ] View history in dropdown
- [ ] Clear history works
- [ ] History limited to 20 items
- [ ] Most recent appears first

### Offline Functionality
- [ ] Browse providers offline
- [ ] View appointments offline
- [ ] View favorites offline
- [ ] Calendar displays offline
- [ ] Search works with cached data

---

## Integration Testing

### Initialize Offline Storage

Add to `app/_layout.tsx`:

```typescript
import { OfflineStorage } from '@/lib/offline-storage';
import { useEffect } from 'react';

export default function RootLayout() {
  useEffect(() => {
    // Initialize offline storage
    OfflineStorage.initialize().catch(console.error);
  }, []);

  // ... rest of layout
}
```

### Auto-Cache on Data Load

Update your data fetching functions:

```typescript
// In explore screen or wherever you fetch providers
const loadProviders = async () => {
  try {
    // Try cache first (instant load)
    const cached = await OfflineStorage.getCachedProviders();
    if (cached.length > 0) {
      setProviders(cached);
    }

    // Fetch fresh data
    const fresh = await BookingService.getAllProviders();
    
    // Update UI
    setProviders(fresh);
    
    // Cache for offline use
    await OfflineStorage.cacheProviders(fresh);
  } catch (error) {
    // If fetch fails, use cache
    const cached = await OfflineStorage.getCachedProviders();
    setProviders(cached);
  }
};
```

### Queue Actions When Offline

```typescript
const toggleFavorite = async (providerId: string) => {
  try {
    // Try to sync immediately
    await BookingService.addToFavorites(providerId);
    
    // Update cache
    await OfflineStorage.addFavoriteLocally(providerId);
  } catch (error) {
    // If offline, queue the action
    await OfflineStorage.addFavoriteLocally(providerId);
    await OfflineStorage.addToSyncQueue({
      type: 'favorite_add',
      payload: { providerId }
    });
    
    // Show feedback
    Alert.alert(
      'Guardado Offline',
      'Tu acción se sincronizará cuando tengas conexión'
    );
  }
};
```

### Implement Background Sync

Create `lib/sync-manager.ts`:

```typescript
import { OfflineStorage } from './offline-storage';
import { BookingService } from './booking-service';

export class SyncManager {
  static async syncPendingActions() {
    const queue = OfflineStorage.getSyncQueue();
    
    for (const item of queue) {
      try {
        switch (item.type) {
          case 'favorite_add':
            await BookingService.addToFavorites(item.payload.providerId);
            break;
          case 'favorite_remove':
            await BookingService.removeFromFavorites(item.payload.providerId);
            break;
          case 'appointment_create':
            await BookingService.createAppointment(item.payload);
            break;
          // ... handle other types
        }
        
        // Remove from queue on success
        await OfflineStorage.removeFromSyncQueue(item.id);
      } catch (error) {
        // Increment retry count
        await OfflineStorage.updateSyncQueueRetryCount(item.id);
        
        // If too many retries, remove
        if (item.retryCount > 3) {
          await OfflineStorage.removeFromSyncQueue(item.id);
        }
      }
    }
  }
}
```

---

## Device Testing

### Android
```bash
# Start emulator
npm run android

# Or physical device
# Enable Airplane Mode in device settings
```

### iOS
```bash
# Start simulator  
npm run ios

# Enable Airplane Mode in simulator:
# Hardware > Toggle Airplane Mode
```

### Web (Limited)
```bash
npm run web

# Open DevTools > Network tab
# Select "Offline" from throttling dropdown
```

---

## Debugging Tips

### Check AsyncStorage

Install React Native Debugger or use console:

```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';

// View all keys
const keys = await AsyncStorage.getAllKeys();
console.log('Storage keys:', keys);

// View specific data
const providers = await AsyncStorage.getItem('@agendave/providers');
console.log('Cached providers:', JSON.parse(providers || '[]').length);
```

### Monitor Queue

Add this to see queue changes:

```typescript
useEffect(() => {
  const interval = setInterval(async () => {
    const info = await OfflineStorage.getStorageInfo();
    console.log('Queue count:', info.queueCount);
  }, 5000);

  return () => clearInterval(interval);
}, []);
```

### Network State

Monitor actual network state:

```typescript
import NetInfo from '@react-native-community/netinfo';

NetInfo.addEventListener(state => {
  console.log('Is connected:', state.isConnected);
  console.log('Connection type:', state.type);
});
```

---

## Common Issues

### Issue: Data not caching
**Solution:** Verify you're calling `initialize()` before using storage

### Issue: Queue not persisting
**Solution:** Check AsyncStorage permissions and available space

### Issue: Old data showing
**Solution:** Implement cache invalidation based on timestamp

### Issue: App slow offline
**Solution:** Optimize cache reads, use pagination

---

## Performance Benchmarks

Expected performance metrics:

- **Cache Write (100 providers):** < 100ms
- **Cache Read (100 providers):** < 50ms
- **Queue Write:** < 10ms
- **Queue Read:** < 5ms
- **Search History (20 items):** < 10ms

---

## Next Steps

1. ✅ Test basic offline functionality
2. ✅ Test sync queue
3. ⬜ Implement background sync
4. ⬜ Add network state indicator
5. ⬜ Add offline banner
6. ⬜ Implement cache TTL
7. ⬜ Add analytics for offline usage

---

## Resources

- AsyncStorage Docs: https://react-native-async-storage.github.io/async-storage/
- NetInfo: https://github.com/react-native-netinfo/react-native-netinfo
- Offline First: https://offlinefirst.org/

---

**Ready to test!** Start with the test screen at `app/(main)/offline-test.tsx` 🚀
