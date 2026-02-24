# Uhub Notification System

A comprehensive alert and notification system for the Uhub application that provides real-time notifications for various system events and chat messages.

## Features

### 🔔 Notification Types

#### System Notifications (Bell Dropdown)
- **Complaints**: New complaints filed and status updates
- **Suggestions**: New suggestions submitted
- **IT Requests**: New IT requests and status updates
- **Calendar Events**: New events and updates
- **Payment Status**: Payment due dates and status changes
- **Attendance**: New attendance records
- **Tasks**: Task assignments and status updates
- **Expenses**: Expense submissions and status updates

#### Chat Popups (Center Screen)
- **Team Chat Messages**: Messages from team conversations
- **Individual Chat Messages**: Direct messages from other users
- **Auto-dismiss**: Automatically disappears after 5 seconds

### 🎯 Key Features

- **Real-time Updates**: Uses Supabase real-time subscriptions
- **Priority-based**: High, Medium, Low priority levels with color coding
- **Auto-cleanup**: Notifications auto-remove after 10 seconds
- **Unread Count**: Tracks unread notifications with badge
- **Responsive Design**: Works on all screen sizes
- **Smooth Animations**: Framer Motion powered transitions
- **Role-based**: Only shows relevant notifications based on user role

## Architecture

### Components

```
src/components/notifications/
├── NotificationContainer.jsx    # Main container component
├── NotificationBell.jsx         # Bell icon with dropdown
├── ChatPopup.jsx               # Center screen chat popups
└── index.js                    # Export file
```

### Context

```
src/context/
└── NotificationContext.jsx      # Centralized notification state management
```

### Services

```
src/services/
└── notificationService.js       # Extended notification types (calendar, payments, etc.)
```

## Implementation

### 1. Provider Setup

The `NotificationProvider` is added to the app hierarchy in `App.js`:

```jsx
<NotificationProvider>
  <ChatProvider>
    {/* Your app components */}
  </ChatProvider>
</NotificationProvider>
```

### 2. Layout Integration

The notification system is integrated into the main layout header:

```jsx
import { NotificationContainer } from "./notifications";

// In Layout.jsx header
<div className="flex items-center gap-4">
  <NotificationContainer />
  <DarkModeToggle />
  <UserDropdown />
</div>
```

### 3. Real-time Subscriptions

The system automatically sets up real-time subscriptions for:

- Database table changes (INSERT/UPDATE)
- Chat message notifications
- User status changes
- Conversation updates

## Usage

### Basic Usage

```jsx
import { useNotifications } from '../context/NotificationContext';

const MyComponent = () => {
  const { addNotification, addChatPopup } = useNotifications();

  // Add a system notification
  addNotification({
    type: 'info',
    title: 'Success',
    message: 'Operation completed successfully',
    priority: 'medium'
  });

  // Add a chat popup
  addChatPopup({
    type: 'chat_message',
    title: 'New Message',
    message: 'Hello from John!',
    conversationId: 'conv-123',
    senderId: 'user-456'
  });
};
```

### Notification Types

```jsx
// Available notification types
const types = [
  'complaint',
  'complaint_update', 
  'suggestion',
  'it_request',
  'it_request_update',
  'calendar',
  'payment',
  'attendance',
  'task',
  'expense'
];
```

### Priority Levels

```jsx
// Available priority levels
const priorities = ['high', 'medium', 'low'];

// Each priority has different colors:
// High: Red
// Medium: Yellow  
// Low: Blue
```

## Customization

### Styling

The notification system uses Tailwind CSS classes and can be customized by modifying:

- `NotificationBell.jsx` - Bell dropdown styling
- `ChatPopup.jsx` - Popup appearance and animations
- `NotificationContext.jsx` - Auto-removal timing

### Timing

```jsx
// In NotificationContext.jsx
// System notifications auto-remove after 10 seconds
setTimeout(() => {
  removeNotification(id);
}, 10000);

// Chat popups auto-remove after 5 seconds  
setTimeout(() => {
  removeChatPopup(id);
}, 5000);
```

### Adding New Notification Types

1. **Update NotificationContext.jsx**:
```jsx
// Add new subscription
const newTypeSub = supabase
  .channel('new_type_notifications')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public', 
    table: 'new_table'
  }, (payload) => {
    addNotification({
      type: 'new_type',
      title: 'New Item',
      message: 'Description here',
      priority: 'medium',
      data: payload.new
    });
  })
  .subscribe();
```

2. **Update NotificationBell.jsx**:
```jsx
// Add icon and color mapping
case 'new_type':
  return <NewIcon className="w-5 h-5 text-green-500" />;

case 'new_type':
  return 'border-green-200 bg-green-50';
```

## Testing

### Demo Component

Use the `NotificationDemo` component to test all notification types:

```jsx
import NotificationDemo from '../components/notifications/NotificationDemo';

// In your page
<NotificationDemo />
```

### Manual Testing

1. **System Notifications**: Click the bell icon to see notifications
2. **Chat Popups**: Send a message in chat to trigger popup
3. **Real-time**: Make database changes to see live updates

## Database Requirements

The notification system requires these tables with real-time enabled:

- `complaints`
- `suggestions` 
- `it_requests`
- `events` (calendar)
- `payments`
- `attendance`
- `tasks`
- `expenses`
- `messages` (chat)
- `conversation_participants`

## Browser Support

- Modern browsers with ES6+ support
- Requires WebSocket support for real-time features
- Responsive design for mobile and desktop

## Performance Considerations

- Notifications are limited to prevent memory issues
- Auto-cleanup prevents accumulation
- Real-time subscriptions are properly managed
- Efficient state updates with React hooks

## Troubleshooting

### Common Issues

1. **Notifications not appearing**: Check if NotificationProvider is properly wrapped
2. **Real-time not working**: Verify Supabase real-time is enabled
3. **Chat popups not showing**: Check conversation participation logic
4. **Memory leaks**: Ensure cleanup functions are called

### Debug Mode

Enable debug logging in the browser console:

```jsx
// In NotificationContext.jsx
console.log('Notification added:', notification);
console.log('Chat popup added:', popup);
```

## Future Enhancements

- [ ] Push notifications for mobile
- [ ] Email notifications
- [ ] Notification preferences per user
- [ ] Sound alerts
- [ ] Desktop notifications
- [ ] Notification history
- [ ] Bulk actions (mark all read, etc.)

## Contributing

When adding new notification types:

1. Follow the existing pattern
2. Add proper TypeScript types if applicable
3. Include proper error handling
4. Add tests for new functionality
5. Update this documentation

## License

This notification system is part of the Uhub project and follows the same licensing terms.
