# Real-Time Collaborative Editing

Your project now supports real-time collaborative editing with presence tracking! Multiple users can edit prototypes simultaneously and see each other's changes in real-time.

## ✅ Features Implemented

### 1. Presence Tracking
- **Who's Online**: See who's currently viewing each prototype
- **Active Editors**: Know who's actively editing
- **Visual Indicators**: Avatar badges showing online users
- **Real-time Updates**: Presence updates instantly when users join/leave

### 2. Collaborative Editing Indicators
- **"X is editing"**: Shows when someone is actively editing
- **Multiple Editors**: Displays count when multiple people are editing
- **Field-Level Tracking**: Can track which specific field is being edited (future enhancement)

### 3. Real-Time Synchronization
- **Instant Updates**: Changes appear immediately for all users
- **No Conflicts**: Last write wins (with potential for conflict resolution in future)
- **Seamless Experience**: No page refresh needed

## 🎯 How It Works

### Presence System
```
User Opens Prototype
    ↓
Joins Presence Channel
    ↓
Broadcasts Presence (name, editing state)
    ↓
Other Users See Presence Update
    ↓
User Leaves → Presence Removed
```

### Editing Flow
```
User Starts Editing
    ↓
Presence Updated (isEditing: true)
    ↓
Other Users See "X is editing"
    ↓
User Makes Changes → Saved to Supabase
    ↓
Realtime Broadcasts Change
    ↓
All Users See Update Instantly
    ↓
User Stops Editing → Presence Updated (isEditing: false)
```

## 📁 Files Created/Modified

### New Files:
- `src/hooks/usePresence.ts` - Presence tracking hook
- `src/components/PresenceIndicator.tsx` - UI component showing online users

### Modified Files:
- `src/hooks/useRealtimePrototype.ts` - Added presence integration
- `src/components/PrototypeView.tsx` - Added presence indicators
- `src/components/CreatePrototype.tsx` - Added presence tracking for editors

## 🎨 UI Components

### PresenceIndicator Component
Shows:
- **Online Users**: Count and avatars of users viewing
- **Active Editors**: "X is editing" badge when someone is editing
- **User Avatars**: Initials in colored circles

### Visual Indicators
- **Green Badge**: "Live" connection status
- **Blue Badge**: "X is editing" when someone is actively editing
- **Gray Badge**: Online user count
- **Avatar Circles**: Visual representation of online users

## 🔧 Technical Implementation

### Presence Hook (`usePresence`)
```typescript
const { presences, presenceUsers, isConnected, setEditing } = usePresence(
  channelName,
  userId,
  userName
);
```

**Features:**
- Tracks user presence in a channel
- Broadcasts join/leave events
- Updates editing state
- Syncs with other users' presence

### Integration Points

1. **PrototypeView**: Shows presence when viewing a prototype
2. **CreatePrototype**: Shows presence when editing an existing prototype
3. **Realtime Hooks**: Automatically include presence tracking

## 📊 User Experience

### For Viewers
- See who else is viewing the same prototype
- Know when someone is editing
- See changes appear in real-time

### For Editors
- See other editors working on the same prototype
- Know when others are editing
- Changes sync automatically

## 🚀 Usage Examples

### Basic Presence Tracking
```typescript
// In a component
const userId = `user-${crypto.randomUUID()}`;
const userName = 'John Doe';

const { presenceUsers, setEditing } = usePresence(
  `prototype-presence-${prototypeId}`,
  userId,
  userName
);

// Mark as editing
setEditing(true, 'step-1');

// Stop editing
setEditing(false);
```

### Displaying Presence
```typescript
<PresenceIndicator 
  users={presenceUsers} 
  currentUserId={userId} 
/>
```

## 🎯 Current Capabilities

### ✅ Working Now
- Presence tracking (who's online)
- Editing state tracking (who's editing)
- Real-time updates when users join/leave
- Visual indicators in UI
- Automatic synchronization

### 🔮 Future Enhancements
- **Field-Level Editing**: Track which specific field is being edited
- **Conflict Resolution**: Handle simultaneous edits gracefully
- **Cursors**: Show where other users are editing (like Google Docs)
- **User Names**: Allow users to set their display names
- **Typing Indicators**: Show when someone is typing
- **Edit History**: Track who made what changes

## 🔒 Privacy & Security

- **User IDs**: Generated per session (can be replaced with auth user IDs)
- **User Names**: Default to "User XXXX" (can be customized)
- **Presence Data**: Only visible to users viewing the same prototype
- **No Personal Data**: Only displays presence, not personal information

## 🐛 Troubleshooting

### Presence not showing?
- Check Realtime connection status (green "Live" badge)
- Verify Supabase Realtime is enabled
- Check browser console for errors
- Ensure channel name is correct

### Users not appearing?
- Make sure multiple users are viewing the same prototype
- Check that presence channel is subscribed
- Verify user IDs are unique

### Editing state not updating?
- Ensure `setEditing()` is called when editing starts/stops
- Check that presence hook is properly initialized
- Verify channel subscription status

## 📝 Configuration

### User Identification
Currently uses:
- **User ID**: Generated UUID stored in localStorage
- **User Name**: Defaults to "User XXXX" or from localStorage

To customize:
```typescript
// Set user ID
localStorage.setItem('userId', 'your-user-id');

// Set user name
localStorage.setItem('userName', 'Your Name');
```

### Channel Names
- **Prototype Presence**: `prototype-presence-{prototypeId}`
- **Home Presence**: (can be added for homepage)

## 🎉 Benefits

- **Collaboration**: Multiple users can work together
- **Awareness**: Know who's working on what
- **Real-time**: See changes as they happen
- **Transparency**: Understand team activity
- **Efficiency**: No need to refresh or check for updates

---

**Status**: ✅ Real-Time Collaborative Editing Active!

Open multiple browser tabs or have multiple users access the same prototype to see collaborative editing in action!

