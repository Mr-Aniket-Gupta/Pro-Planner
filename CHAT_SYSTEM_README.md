# LinkedIn-Style Real-Time Chat System

## 🚀 Features Implemented

### 🧑‍🤝‍🧑 Friend Chat List Panel
- **Dynamic Friends List**: Shows all connected friends/users you can message
- **Real-time Status**: Online/offline indicators with colored dots
- **Last Message Preview**: Shows the last message and timestamp
- **Avatar System**: Auto-generated initials-based avatars with color coding
- **Search Functionality**: Filter friends by name or last message

### 💬 Popup Chat Windows
- **Multiple Chat Windows**: Open multiple chat conversations simultaneously
- **Draggable Windows**: Click and drag chat windows anywhere on screen
- **Minimize/Maximize**: Minimize chat windows to save space
- **Close Functionality**: Easy close button for each chat window
- **Responsive Design**: Adapts to different screen sizes

### 🔄 Real-Time Chat Features
- **WebSocket Integration**: Real-time messaging using Socket.IO
- **Instant Message Delivery**: Messages appear instantly without page refresh
- **Message History**: Persistent chat history within session
- **Typing Indicators**: Shows when someone is typing (future enhancement)
- **Message Timestamps**: Each message shows exact time
 - **Message Deletion**: Delete own messages with real-time sync
 - **Bulk Delete**: Select and delete multiple own messages at once

### 📱 Responsive Design
- **Mobile Optimized**: Full-screen chat on mobile devices
- **Tablet Friendly**: Optimized layout for tablet screens
- **Desktop Experience**: Multiple floating windows on desktop
- **Touch Friendly**: Large touch targets for mobile users
- **Keyboard Support**: ESC key to close all chat windows

### 🔐 Security & Authentication
- **Session-based**: Uses existing authentication system
- **User Validation**: Only authenticated users can access chat
- **Friend-only Messaging**: Can only message connected friends
- **Input Sanitization**: Prevents XSS attacks

## 🛠️ Technical Implementation

### Frontend Architecture
```javascript
class ChatSystem {
    constructor() {
        this.socket = null;
        this.myUserId = null;
        this.activeChats = new Map();
        this.friends = [];
    }
    
    // Methods for chat management
    async init()
    createChatWindow(friendId)
    sendMessage(friendId, text)
    renderChatMessages(chatWindow, friend)
}
```

### REST API Endpoints
- `GET /api/userdata/current-user` - Get current user info for chat
- `GET /api/userdata/friends` - Get friends list for chat
- `GET /api/messages/history?withUserId=<id>&cursor=<ms>&limit=<n>` - Paginated conversation history
- `GET /api/messages/unread-counts` - Unread counts grouped by sender
- `DELETE /api/messages/:messageId` - Delete a message you sent

### Socket.IO Events
- `register` - Register the current userId with the socket
- `chat:send` - Send a message to a friend `{ to, text, clientId }`
- `chat:message` - Receive an incoming or echo message `{ id|clientId, from, to, text, ts }`
- `chat:bulk` - Receive unread messages on connect (bulk sync)
- `chat:unreadCounts` - Receive unread counts per sender `[ { _id: senderId, count } ]`
- `chat:read` - Mark messages in a conversation as read `{ withUserId }`
- `chat:deleteMessage` - Request deletion of a message `{ messageId }`
- `chat:messageDeleted` - Broadcast after a message is deleted `{ messageId, fromUserId, toUserId }`
- `chat:deleteSuccess` - Acknowledgement to the requester on successful delete `{ messageId }`
- `chat:deleteError` - Error acknowledgement to the requester `{ message }`

### CSS Features
- **Modern Design**: LinkedIn-inspired UI with gradients and shadows
- **Smooth Animations**: CSS transitions and keyframe animations
- **Dark Theme Support**: Automatic dark mode detection
- **Custom Scrollbars**: Styled scrollbars for better UX
- **Loading States**: Spinner animations for loading states

## 🎨 UI Components

### Chat Window Structure
```
┌─────────────────────────────────┐
│ 👤 Friend Name ● Online    [−] [×] │
├─────────────────────────────────┤
│                                 │
│    💬 Message bubbles           │
│    with timestamps              │
│                                 │
├─────────────────────────────────┤
│ [Message input...] [📤 Send]    │
└─────────────────────────────────┘
```

### Friends List Structure
```
┌─────────────────────────────────┐
│ 👥 Friends (3 connections)   [×] │
├─────────────────────────────────┤
│ 🟢 Aniket Gupta                 │
│    You: Thanks a lot            │
│    Jul 15                       │
├─────────────────────────────────┤
│ ⚪ Ayush Taware                 │
│    Ayush: No it's not fake      │
│    Jul 15                       │
└─────────────────────────────────┘
```

## 📱 Mobile Responsiveness

### Mobile Layout
- **Full Screen**: Chat windows take full screen on mobile
- **Slide-in Animation**: Smooth slide-in from bottom
- **Touch Optimized**: Large buttons and touch targets
- **Keyboard Handling**: Input field adjusts for mobile keyboard

### Tablet Layout
- **Adaptive Sizing**: Chat windows scale appropriately
- **Multi-window Support**: Limited to 2-3 windows on tablet
- **Touch Gestures**: Swipe to close, pinch to resize

## 🔧 Configuration

### Environment Variables
```env
MONGODB_URI=your_mongodb_connection_string
SESSION_SECRET=your_session_secret
JWT_SECRET=your_jwt_secret
```

### Socket.IO Configuration
```javascript
const io = new Server(server, { 
    cors: { origin: '*' } 
});
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- MongoDB
- Socket.IO client library

### Installation
1. Install dependencies: `npm install`
2. Set up environment variables
3. Start the server: `npm start`
4. Access chat via floating button on dashboard

### Integration Notes
- Ensure a button with id `openFriendChatBtn` exists on pages where chat should be available.
- The script `public/js/chat.js` initializes automatically on `DOMContentLoaded` and binds to the button.
- Socket.IO client is served by the app; ensure the layout includes the Socket.IO client script.

### Usage
1. **Open Friends List**: Click the chat button (💬) in bottom-right
2. **Start Chat**: Click on any friend from the list
3. **Send Messages**: Type in the input field and press Enter
4. **Manage Windows**: Drag, minimize, or close chat windows
5. **Real-time**: Messages appear instantly for both users

## 🎯 Future Enhancements

### Planned Features
- **Message Persistence**: Store messages in database
- **File Sharing**: Send images, documents, links
- **Voice Messages**: Record and send voice notes
- **Video Calls**: Integrated video calling
- **Message Reactions**: Like, heart, thumbs up reactions
- **Message Search**: Search through chat history
- **Group Chats**: Multi-user conversations
- **Message Encryption**: End-to-end encryption
- **Push Notifications**: Browser notifications for new messages
- **Message Status**: Read receipts and delivery status

### Technical Improvements
- **Message Queue**: Redis for message queuing
- **Image Optimization**: Compress and optimize images
- **Offline Support**: Service worker for offline messaging
- **Performance**: Virtual scrolling for long chat histories
- **Accessibility**: ARIA labels and keyboard navigation

## 🐛 Troubleshooting

### Common Issues
1. **Socket Connection Failed**: Check server status and network
2. **Friends Not Loading**: Verify user authentication and connections
3. **Messages Not Sending**: Check WebSocket connection status
4. **Mobile Issues**: Ensure responsive CSS is loaded

### Debug Mode
Enable debug logging:
```javascript
localStorage.setItem('chatDebug', 'true');
```

## 📄 License
This chat system is part of the ProPlanner project and follows the same license terms.

## 🤝 Contributing
1. Fork the repository
2. Create feature branch
3. Implement changes
4. Test thoroughly
5. Submit pull request

---

**Note**: This chat system is designed to work seamlessly with the existing ProPlanner project structure and authentication system.
