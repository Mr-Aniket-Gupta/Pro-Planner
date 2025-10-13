# 💬 ProPlanner Real-Time Chat System

## 🎯 Overview

ProPlanner का comprehensive real-time chat system है जो LinkedIn-style messaging interface provide करता है। यह system users को seamless team communication और collaboration की सुविधा देता है।

## 🚀 Core Features

### 🧑‍🤝‍🧑 Advanced Friends List Panel
- **📋 Dynamic Friends List**: Shows all connected friends/users you can message
- **🟢 Real-time Status**: Online/offline indicators with colored dots
- **💬 Last Message Preview**: Shows the last message and timestamp
- **👤 Avatar System**: Auto-generated initials-based avatars with color coding
- **🔍 Search Functionality**: Filter friends by name or last message
- **📊 Unread Count**: Shows unread message count for each friend
- **⏰ Last Seen**: Displays when user was last active

### 💬 Popup Chat Windows
- **🪟 Multiple Chat Windows**: Open multiple chat conversations simultaneously
- **🖱️ Draggable Windows**: Click and drag chat windows anywhere on screen
- **📱 Minimize/Maximize**: Minimize chat windows to save space
- **❌ Close Functionality**: Easy close button for each chat window
- **📱 Responsive Design**: Adapts to different screen sizes
- **🎨 LinkedIn-style UI**: Professional messaging interface
- **⌨️ Keyboard Shortcuts**: ESC key to close all chat windows

### 🔄 Real-Time Chat Features
- **⚡ WebSocket Integration**: Real-time messaging using Socket.IO
- **📨 Instant Message Delivery**: Messages appear instantly without page refresh
- **📚 Message History**: Persistent chat history within session
- **⌨️ Typing Indicators**: Shows when someone is typing (planned feature)
- **⏰ Message Timestamps**: Each message shows exact time
- **✅ Message Status**: Read receipts and delivery status
- **🗑️ Message Deletion**: Delete your own messages
- **📧 Email Fallback**: Email notifications when users are offline

### 📱 Responsive Design
- **📱 Mobile Optimized**: Full-screen chat on mobile devices
- **📱 Tablet Friendly**: Optimized layout for tablet screens
- **🖥️ Desktop Experience**: Multiple floating windows on desktop
- **👆 Touch Friendly**: Large touch targets for mobile users
- **⌨️ Keyboard Support**: ESC key to close all chat windows
- **🎯 Gesture Support**: Swipe gestures for mobile navigation

### 🔐 Security & Authentication
- **🔑 Session-based**: Uses existing authentication system
- **✅ User Validation**: Only authenticated users can access chat
- **👥 Friend-only Messaging**: Can only message connected friends
- **🛡️ Input Sanitization**: Prevents XSS attacks
- **🔒 Message Encryption**: Secure message transmission
- **🚫 Rate Limiting**: Prevents spam and abuse

## 🛠️ Technical Implementation

### 🏗️ Frontend Architecture
```javascript
class ChatSystem {
    constructor() {
        this.socket = null;
        this.myUserId = null;
        this.activeChats = new Map();
        this.friends = [];
        this.unreadCounts = new Map();
        this.isInitialized = false;
    }
    
    // Core chat management methods
    async init() {
        // Initialize socket connection and load friends
    }
    
    createChatWindow(friendId) {
        // Create new chat window for friend
    }
    
    sendMessage(friendId, text) {
        // Send message to specific friend
    }
    
    renderChatMessages(chatWindow, friend) {
        // Render message history in chat window
    }
    
    handleIncomingMessage(message) {
        // Process incoming real-time messages
    }
    
    updateUnreadCounts() {
        // Update unread message counts
    }
}
```

### 🔌 Backend API Endpoints

| Method | Endpoint | Description | Parameters |
|--------|----------|-------------|------------|
| `GET` | `/api/userdata/current-user` | Get current user info | - |
| `GET` | `/api/userdata/friends` | Get friends list for chat | - |
| `GET` | `/api/messages/history/:userId` | Get chat history with user | `userId` |
| `POST` | `/api/messages/mark-read` | Mark messages as read | `messageIds[]` |
| `DELETE` | `/api/messages/:messageId` | Delete specific message | `messageId` |

### ⚡ Socket.IO Events

#### 📤 Outgoing Events
- `register` - Register user with socket connection
- `chat:send` - Send message to friend
- `chat:read` - Mark messages as read
- `chat:deleteMessage` - Delete a message

#### 📥 Incoming Events
- `registered` - Confirmation of successful registration
- `chat:message` - Receive incoming message
- `chat:bulk` - Bulk load unread messages
- `chat:unreadCounts` - Update unread message counts
- `chat:messageDeleted` - Notification of message deletion
- `chat:deleteSuccess` - Confirmation of message deletion
- `chat:deleteError` - Error in message deletion

### 🎨 CSS Features & Styling
- **🎨 Modern Design**: LinkedIn-inspired UI with gradients and shadows
- **✨ Smooth Animations**: CSS transitions and keyframe animations
- **🌙 Dark Theme Support**: Automatic dark mode detection
- **📜 Custom Scrollbars**: Styled scrollbars for better UX
- **⏳ Loading States**: Spinner animations for loading states
- **📱 Responsive Breakpoints**: Mobile-first responsive design
- **🎭 Hover Effects**: Interactive hover states for better UX
- **🔤 Typography**: Professional font styling and hierarchy

## 🎨 UI Components

### 💬 Chat Window Structure
```
┌─────────────────────────────────┐
│ 👤 Friend Name ● Online    [−] [×] │
├─────────────────────────────────┤
│                                 │
│    💬 Message bubbles           │
│    with timestamps              │
│    and read receipts            │
│                                 │
├─────────────────────────────────┤
│ [Message input...] [📤 Send]    │
└─────────────────────────────────┘
```

### 👥 Friends List Structure
```
┌─────────────────────────────────┐
│ 👥 Friends (3 connections)   [×] │
├─────────────────────────────────┤
│ 🟢 Aniket Gupta (2)             │
│    You: Thanks a lot            │
│    Jul 15, 2:30 PM              │
├─────────────────────────────────┤
│ ⚪ Ayush Taware                 │
│    Ayush: No it's not fake      │
│    Jul 15, 1:45 PM              │
├─────────────────────────────────┤
│ 🔴 Priya Sharma (1)             │
│    Priya: Can we meet tomorrow? │
│    Jul 15, 12:20 PM             │
└─────────────────────────────────┘
```

### 📱 Mobile Chat Interface
```
┌─────────────────────────────────┐
│ ← Back  👤 Friend Name    [⋮]   │
├─────────────────────────────────┤
│                                 │
│    💬 Full-screen messages      │
│    with swipe gestures          │
│    and touch-friendly UI        │
│                                 │
├─────────────────────────────────┤
│ [Message input...] [📤]         │
└─────────────────────────────────┘
```

## 📱 Mobile Responsiveness

### 📱 Mobile Layout
- **🖥️ Full Screen**: Chat windows take full screen on mobile
- **📱 Slide-in Animation**: Smooth slide-in from bottom
- **👆 Touch Optimized**: Large buttons and touch targets
- **⌨️ Keyboard Handling**: Input field adjusts for mobile keyboard
- **🎯 Gesture Support**: Swipe gestures for navigation
- **📱 Status Bar**: Mobile-friendly status indicators

### 📱 Tablet Layout
- **📐 Adaptive Sizing**: Chat windows scale appropriately
- **🪟 Multi-window Support**: Limited to 2-3 windows on tablet
- **👆 Touch Gestures**: Swipe to close, pinch to resize
- **🔄 Orientation Support**: Landscape and portrait modes
- **📱 Split View**: Side-by-side chat windows on larger tablets

### 🖥️ Desktop Layout
- **🪟 Multiple Windows**: Unlimited chat windows
- **🖱️ Drag & Drop**: Full drag and drop functionality
- **⌨️ Keyboard Shortcuts**: ESC to close, Tab to navigate
- **🖱️ Right-click Menus**: Context menus for advanced options
- **📏 Resizable Windows**: Custom window sizing

## 🔧 Configuration

### 🌐 Environment Variables
```env
# Database Configuration
MONGODB_URI=your_mongodb_connection_string

# Authentication
SESSION_SECRET=your_session_secret
JWT_SECRET=your_jwt_secret

# Email Configuration (for offline notifications)
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password

# Server Configuration
PORT=3000
NODE_ENV=development
```

### ⚡ Socket.IO Configuration
```javascript
const io = new Server(server, { 
    cors: { 
        origin: process.env.CORS_ORIGIN || '*',
        methods: ['GET', 'POST'],
        credentials: true
    },
    transports: ['websocket', 'polling']
});

// Connection handling
io.on('connection', (socket) => {
    console.log('User connected:', socket.id);
    
    // Register user with their ID
    socket.on('register', (userId) => {
        socket.userId = userId;
        // Add to user mapping
    });
    
    // Handle disconnection
    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
        // Clean up user mapping
    });
});
```

### 🗄️ Database Schema
```javascript
// Message Schema
const MessageSchema = new mongoose.Schema({
    messageId: { type: String, unique: true },
    clientId: { type: String, unique: true },
    from: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    to: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    text: { type: String, required: true },
    ts: { type: Date, default: Date.now },
    delivered: { type: Boolean, default: false },
    read: { type: Boolean, default: false },
    readAt: { type: Date }
});
```

## 🚀 Getting Started

### 📋 Prerequisites
- **Node.js**: 18+ (recommended)
- **MongoDB**: 5.0+ (local or cloud)
- **Socket.IO**: 4.8+ (included in dependencies)
- **Modern Browser**: Chrome 60+, Firefox 55+, Safari 12+, Edge 79+

### 🛠️ Installation
```bash
# 1. Clone the repository
git clone https://github.com/aniket-gupta-2005-12-31/Pro-Planner.git
cd Pro-Planner

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env
# Edit .env file with your configuration

# 4. Start the server
npm start

# Or for development with auto-reload
npm run dev
```

### 🎯 Usage Guide

#### 1. **🔐 Authentication**
- Login to your ProPlanner account
- Ensure you have connected friends to chat with

#### 2. **💬 Access Chat System**
- Click the chat button (💬) in bottom-right corner
- Friends list panel will open

#### 3. **👥 Start Conversations**
- Click on any friend from the friends list
- Chat window will open for that friend
- Type your message and press Enter or click Send

#### 4. **🪟 Manage Chat Windows**
- **Drag**: Click and drag chat windows anywhere
- **Minimize**: Click the minimize button (-)
- **Close**: Click the close button (×)
- **Multiple**: Open multiple chat windows simultaneously

#### 5. **📱 Mobile Usage**
- Chat automatically adapts to mobile screens
- Full-screen chat experience on mobile devices
- Touch-friendly interface with large buttons

#### 6. **⚡ Real-time Features**
- Messages appear instantly for both users
- Online/offline status indicators
- Unread message counts
- Message delivery and read receipts

## 🎯 Future Enhancements

### 🚀 Planned Features

#### 📱 Core Features
- **💾 Message Persistence**: Store messages in database with full history
- **📎 File Sharing**: Send images, documents, links, and attachments
- **🎤 Voice Messages**: Record and send voice notes
- **📹 Video Calls**: Integrated video calling functionality
- **😊 Message Reactions**: Like, heart, thumbs up reactions
- **🔍 Message Search**: Search through chat history
- **👥 Group Chats**: Multi-user conversations and group management
- **🔒 Message Encryption**: End-to-end encryption for security
- **🔔 Push Notifications**: Browser notifications for new messages
- **✅ Message Status**: Read receipts and delivery status

#### 🎨 UI/UX Improvements
- **🌓 Dark/Light Theme**: Theme switching capability
- **🎨 Custom Themes**: User-customizable chat themes
- **📱 PWA Support**: Progressive Web App capabilities
- **⌨️ Keyboard Shortcuts**: Advanced keyboard navigation
- **🎭 Animations**: Enhanced micro-interactions
- **📊 Chat Analytics**: Message statistics and insights

### 🛠️ Technical Improvements

#### ⚡ Performance
- **📦 Message Queue**: Redis for message queuing and caching
- **🖼️ Image Optimization**: Compress and optimize images
- **📱 Offline Support**: Service worker for offline messaging
- **⚡ Virtual Scrolling**: Performance optimization for long chat histories
- **🔄 Message Sync**: Conflict resolution for concurrent edits

#### 🔒 Security & Privacy
- **🔐 End-to-End Encryption**: Secure message transmission
- **🛡️ Message Authentication**: Prevent message tampering
- **🔒 Privacy Controls**: User privacy settings and controls
- **🚫 Content Filtering**: Automatic content moderation
- **📊 Audit Logs**: Message audit and compliance features

#### ♿ Accessibility
- **🎯 ARIA Labels**: Screen reader support
- **⌨️ Keyboard Navigation**: Full keyboard accessibility
- **🔊 Voice Commands**: Voice control for chat
- **📱 High Contrast**: High contrast mode support
- **🔤 Font Scaling**: Dynamic font size adjustment

## 🐛 Troubleshooting

### 🔧 Common Issues

#### 1. **🔌 Socket Connection Failed**
- **Cause**: Server not running or network issues
- **Solution**: Check server status and network connection
- **Debug**: Open browser console for connection errors

#### 2. **👥 Friends Not Loading**
- **Cause**: Authentication issues or no connections
- **Solution**: Verify user authentication and friend connections
- **Debug**: Check API endpoints in network tab

#### 3. **📨 Messages Not Sending**
- **Cause**: WebSocket connection issues
- **Solution**: Refresh page and reconnect
- **Debug**: Check Socket.IO connection status

#### 4. **📱 Mobile Issues**
- **Cause**: Responsive CSS not loaded
- **Solution**: Ensure CSS files are properly loaded
- **Debug**: Check mobile viewport settings

#### 5. **🔄 Real-time Updates Not Working**
- **Cause**: Socket.IO connection problems
- **Solution**: Restart server and clear browser cache
- **Debug**: Monitor WebSocket connections

### 🤖 AI Assistant Integration Notes

- If clicking the AI button does not open the modal:
  - Ensure `/js/ai.js` loads without syntax errors in DevTools console.
  - We namespace voice variables to avoid collisions: `window._aiRecognition`, `window._aiIsRecording`.
  - Verify handlers exist: `openAiBotModal`, `closeAiBotModal`, and that `#aiBotBtn` is present.

### Common Errors

- "Identifier 'recognition' has already been declared"
  - Cause: Multiple globals named `recognition` across scripts.
  - Fix: Use the namespaced properties provided by `ai.js`.

- "sendAiMessage is not defined"
  - Cause: `ai.js` failed to evaluate; functions weren’t registered on `window`.
  - Fix: Resolve earlier syntax errors; then reload the page.

### 🛠️ Debug Mode
Enable debug logging for detailed information:
```javascript
// Enable debug mode
localStorage.setItem('chatDebug', 'true');

// Check connection status
console.log('Socket connected:', chatSystem.socket?.connected);

// Monitor events
chatSystem.socket?.on('connect', () => console.log('Connected'));
chatSystem.socket?.on('disconnect', () => console.log('Disconnected'));
```

### 📊 Performance Monitoring
```javascript
// Monitor message performance
const startTime = performance.now();
// ... send message
const endTime = performance.now();
console.log(`Message sent in ${endTime - startTime} milliseconds`);
```

## 📄 License
This chat system is part of the ProPlanner project and follows the same license terms.

## 🤝 Contributing

### 🚀 How to Contribute
1. **🍴 Fork the repository**
2. **🌿 Create feature branch**: `git checkout -b feature/amazing-chat-feature`
3. **💻 Implement changes**: Follow coding standards
4. **🧪 Test thoroughly**: Test on multiple devices and browsers
5. **📝 Update documentation**: Update relevant documentation
6. **📤 Submit pull request**: Provide detailed description

### 📋 Contribution Guidelines
- **Code Style**: Follow existing code patterns
- **Testing**: Test on desktop, tablet, and mobile
- **Documentation**: Update README and inline comments
- **Performance**: Ensure no performance regressions
- **Accessibility**: Maintain accessibility standards

### 🐛 Reporting Issues
- **Bug Reports**: Use GitHub issues with detailed reproduction steps
- **Feature Requests**: Describe the feature and its benefits
- **Security Issues**: Report privately to maintainers

---

## 📝 Notes

**Important**: यह chat system ProPlanner के existing project structure और authentication system के साथ seamlessly integrate किया गया है। सभी features responsive हैं और modern web standards का पालन करते हैं।

### 🔗 Related Documentation
- [Main README.md](./README.md) - Complete project overview
- [Documentation README.md](./DOCUMENTATION_README.md) - Documentation system guide
- [API Documentation](./docs/api.md) - API reference guide
- [Deployment Guide](./docs/deployment.md) - Production deployment instructions

### 🏆 Acknowledgments
- **LinkedIn**: Design inspiration for messaging interface
- **Socket.IO**: Real-time communication library
- **MongoDB**: Database for message persistence
- **Express.js**: Backend framework
- **Modern Web Standards**: For accessibility and performance
