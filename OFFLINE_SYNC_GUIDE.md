# Offline Farm Sync - Implementation Guide

## Overview

The CCSA Mobile app now supports **offline farm registration** with automatic synchronization. Users can add farms in areas without network connectivity, and the data will be automatically synced when internet connection is restored.

## Key Features

### 1. **Offline Farm Storage**
- Farm data is saved locally using AsyncStorage when no network is available
- Each offline farm gets a unique ID and timestamp
- Full farm data including GPS polygon coordinates is preserved

### 2. **Automatic Sync**
- Background network monitoring detects when connectivity is restored
- Automatic sync attempts when network becomes available
- Queued farms are processed sequentially
- Failed syncs are retried automatically (up to 5 attempts)

### 3. **Visual Indicators**
- **Network Status Badge**: Shows "Online" (green) or "Offline Mode" (red)
- **Pending Sync Counter**: Displays number of farms waiting to sync
- **Sync Status Modal**: Detailed view of all offline farms and their sync status

### 4. **Sync Status Tracking**
Each offline farm has one of these statuses:
- **Pending**: Waiting to be synced
- **Syncing**: Currently being uploaded to server
- **Synced**: Successfully uploaded (automatically removed from queue)
- **Failed**: Sync attempt failed (can be manually retried)

## Files Created/Modified

### New Files

1. **`src/services/offlineSyncService.js`**
   - Core offline sync logic
   - Network monitoring and auto-sync
   - Queue management for offline farms
   - Retry logic for failed syncs

2. **`src/components/SyncStatusModal.js`**
   - UI component for viewing sync status
   - Shows all pending, synced, and failed farms
   - Manual retry and clear options
   - Real-time sync statistics

### Modified Files

1. **`src/screens/AddFarmScreen.js`**
   - Added network status monitoring
   - Offline detection and local storage
   - Online/offline submission logic
   - Sync status integration

## How It Works

### Farm Addition Flow

```
User fills farm form
    ↓
Check network connectivity
    ↓
    ├── Online → Try API submission
    │       ├── Success → Show success alert
    │       └── Fail → Save offline as fallback
    │
    └── Offline → Save to local storage
            ↓
        Show "Saved Offline" alert
```

### Automatic Sync Flow

```
Network becomes available
    ↓
Auto-sync triggered
    ↓
Load pending farms from queue
    ↓
For each farm:
    ├── Update status to "syncing"
    ├── Submit to API
    ├── Success → Mark as "synced" → Remove from queue
    └── Fail → Mark as "failed" → Keep in queue
    ↓
Show sync results notification
```

## User Experience

### When Adding a Farm Offline

1. User fills out farm form as normal
2. Submit button shows "Save Offline" instead of "Add Farm"
3. On submission:
   - "Saved Offline" alert appears
   - User can choose to:
     - View sync status
     - Add another farm
     - Return to farmer details

### When Network Restores

1. Automatic sync starts in background
2. User sees notification: "Successfully synced X farm(s)"
3. Pending sync counter updates automatically

### Sync Status Modal

Accessible via the pending sync badge, shows:
- Network status (Online/Offline)
- Last sync timestamp
- Statistics: Pending, Synced, Failed counts
- List of all offline farms with:
  - Farmer name
  - Farm details (crop, size)
  - Status badge
  - Error message (if failed)
  - Retry button (for failed farms)

## API Integration

### Data Structure

Offline farms are stored with this structure:

```javascript
{
  id: "offline_1730419200000_abc123",
  farmerId: "farmer_id",
  farmData: {
    farmSize: "5.2",
    primaryCrop: "Maize",
    farmPolygon: [{latitude, longitude, timestamp, accuracy}],
    // ... all other farm fields
  },
  farmer: {
    firstName: "John",
    lastName: "Doe",
    // ... farmer info for display
  },
  timestamp: "2025-11-01T10:30:00.000Z",
  status: "pending",
  retryCount: 0,
  lastError: null
}
```

### Sync Process

1. **Load Queue**: Get all pending/failed farms with retryCount < 5
2. **Sequential Processing**: Submit farms one at a time (500ms delay between)
3. **Status Updates**: Track each farm's sync status
4. **Error Handling**: Capture and store error messages
5. **Cleanup**: Remove successfully synced farms from queue

## Testing Checklist

### Offline Mode Testing

- [ ] Add farm with network disabled → Should save offline
- [ ] Check offline farm appears in sync status modal
- [ ] Verify "Saved Offline" alert shows correct options
- [ ] Confirm form can be filled without network

### Auto-Sync Testing

- [ ] Add farm offline
- [ ] Enable network connection
- [ ] Verify auto-sync notification appears
- [ ] Check farm syncs successfully
- [ ] Confirm farm removed from offline queue

### Failed Sync Testing

- [ ] Add farm offline
- [ ] Stop API server
- [ ] Enable network and trigger sync
- [ ] Verify farm marked as "failed" with error message
- [ ] Test manual retry button
- [ ] Confirm retry limit (5 attempts max)

### Edge Cases

- [ ] Add multiple farms offline
- [ ] Test sync with intermittent connectivity
- [ ] Add farm online, then offline, then online again
- [ ] Fill form offline, submit when online (should work directly)
- [ ] Test form validation in offline mode

## Configuration

### Retry Settings

Maximum retry attempts: **5** (configurable in `offlineSyncService.js`)

```javascript
f.retryCount < 5 // Max retry attempts
```

### Sync Delay

Delay between farm syncs: **500ms** (configurable)

```javascript
await new Promise(resolve => setTimeout(resolve, 500));
```

### Storage Keys

- Offline farms: `@offline_farms`
- Sync status: `@sync_status`
- Last sync time: `@last_sync`

## Benefits

### For Users
- ✅ No data loss in areas without network
- ✅ Continue working without interruption
- ✅ Automatic sync when connectivity returns
- ✅ Clear visibility of sync status
- ✅ Manual retry for failed syncs

### For the System
- ✅ Resilient to network failures
- ✅ Prevents API timeouts and errors
- ✅ Reduces user frustration
- ✅ Better data capture in rural areas
- ✅ Automatic recovery from failures

## Future Enhancements

Potential improvements:
1. **Farmer Registration Offline**: Extend offline support to farmer registration
2. **Conflict Resolution**: Handle cases where data changes on server before sync
3. **Batch Sync**: Upload multiple farms in a single API call
4. **Sync Priority**: Allow users to prioritize which farms sync first
5. **Data Compression**: Reduce storage size for offline data
6. **Export/Import**: Allow manual export of offline data as backup

## Troubleshooting

### Sync Not Starting
- Check network status indicator
- Verify farms are in "pending" status
- Check retry count hasn't exceeded 5
- Try manual sync from sync status modal

### Farms Stuck in "Syncing"
- Force close and restart app
- Check API server is running
- Verify authentication token is valid

### Failed Syncs
- Read error message in sync status modal
- Check server logs for API errors
- Verify farm data meets validation requirements
- Use manual retry button

### Clear All Offline Data
⚠️ **Use with caution** - This permanently deletes all offline farms

```javascript
await offlineSyncService.clearAllOfflineData();
```

## Dependencies

Required packages (already installed):
- `@react-native-async-storage/async-storage`: v2.2.0
- `@react-native-community/netinfo`: v11.4.1

## Support

For issues or questions:
1. Check sync status modal for error details
2. Review app logs for error messages
3. Verify network connectivity
4. Contact development team with:
   - Error message from sync status
   - Number of failed farms
   - Network conditions when issue occurred
