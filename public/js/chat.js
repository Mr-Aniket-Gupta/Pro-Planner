// LinkedIn-Style Real-Time Chat System
// Enhanced with multiple chat windows, real database integration, and better UI

class ChatSystem {
  constructor() {
    this.socket = null;
    this.myUserId = null;
    this.isSocketReady = false;
    this.activeChats = new Map(); // Map of friendId -> chatWindow
    this.friends = [];
    this.currentUser = null;
    this.renderedMessageIds = new Set(); // prevent duplicates by clientId/id
    this._socketInited = false;
    this.unreadByUser = new Map();
    this.activeChatUserId = null;

    this.init();
  }

  async init() {
    await this.loadCurrentUser();
    this.setupEventListeners();
    this.loadFriends();
  }

  async loadCurrentUser() {
    try {
      const response = await fetch('/api/userdata/current-user');
      if (response.ok) {
        const res = await response.json();
        // some endpoints wrap in {success:true,...}
        this.currentUser = res._id ? res : res.data || res.user || null;
        this.myUserId = (this.currentUser && this.currentUser._id) || 'demo-user';
      }
    } catch (err) {
      console.error('Failed to load current user:', err);
      // Fallback to dummy user for demo
      this.myUserId = 'demo-user';
    }
  }

  setupEventListeners() {
    // Main chat button
    const openChatBtn = document.getElementById('openFriendChatBtn');
    if (openChatBtn) {
      openChatBtn.addEventListener('click', () => this.openMainChatWindow());
    }

    // Global click handler for closing chat windows
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('chat-close-btn')) {
        const chatId = e.target.closest('.chat-window').dataset.chatId;
        this.closeChatWindow(chatId);
      }
    });

    // Global key handler for ESC key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.closeAllChatWindows();
      }
    });
  }

  async loadFriends() {
    try {
      const response = await fetch('/api/userdata/friends');
      if (response.ok) {
        this.friends = await response.json();
      } else {
        // Fallback to dummy data
        this.friends = this.getDummyFriends();
      }
    } catch (err) {
      console.error('Failed to load friends:', err);
      this.friends = this.getDummyFriends();
    }
  }

  getDummyFriends() {
    return [
      {
        _id: '1',
    name: 'Aniket Gupta',
    online: true,
    lastMsg: 'You: Thanks a lot',
    lastTime: 'Jul 15',
        avatar: '',
    messages: [
          { fromMe: false, text: 'Hi! How are you?', time: '9:01 PM', timestamp: Date.now() - 3600000 },
          { fromMe: true, text: 'I am good, thanks!', time: '9:03 PM', timestamp: Date.now() - 3540000 },
          { fromMe: false, text: 'Great to hear!', time: '9:04 PM', timestamp: Date.now() - 3480000 }
        ]
      },
      {
        _id: '2',
    name: 'Ayush Taware',
    online: false,
    lastMsg: 'Ayush: No it\'s not fake',
    lastTime: 'Jul 15',
        avatar: '',
        messages: [
          { fromMe: true, text: 'Is this internship real?', time: '9:10 PM', timestamp: Date.now() - 7200000 },
          { fromMe: false, text: 'No it\'s not fake', time: '9:17 PM', timestamp: Date.now() - 6780000 }
        ]
      },
      {
        _id: '3',
        name: 'Priya Sharma',
        online: true,
        lastMsg: 'Priya: Project deadline is tomorrow',
        lastTime: '2:30 PM',
        avatar: '',
    messages: [
          { fromMe: false, text: 'Hey! How\'s the project going?', time: '2:25 PM', timestamp: Date.now() - 300000 },
          { fromMe: true, text: 'Going well, almost done!', time: '2:28 PM', timestamp: Date.now() - 120000 },
          { fromMe: false, text: 'Project deadline is tomorrow', time: '2:30 PM', timestamp: Date.now() - 60000 }
        ]
      }
    ];
  }

  getInitials(name) {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/);
    const first = parts[0]?.[0] || '';
    const second = parts[1]?.[0] || '';
    return (first + second).toUpperCase();
  }

  colorFromName(name) {
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    const hue = Math.abs(hash) % 360;
    return `hsl(${hue}, 70%, 45%)`;
  }

  getAvatarNode(friend, size = 40) {
    const initials = this.getInitials(friend.name || 'U');
    const color = this.colorFromName(friend.name || 'U');
    if (friend.avatar) {
      const img = document.createElement('img');
      img.src = friend.avatar;
      img.alt = friend.name || 'User';
      img.className = size <= 36 ? 'chat-avatar' : 'friend-avatar';
      img.style.width = `${size}px`;
      img.style.height = `${size}px`;
      img.onerror = () => {
        const div = document.createElement('div');
        div.className = 'avatar-fallback';
        div.textContent = initials;
        div.style.background = color;
        div.style.width = `${size}px`;
        div.style.height = `${size}px`;
        img.replaceWith(div);
      };
      return img;
    }
    const div = document.createElement('div');
    div.className = 'avatar-fallback';
    div.textContent = initials;
    div.style.background = color;
    div.style.width = `${size}px`;
    div.style.height = `${size}px`;
    return div;
  }

  initSocket() {
    if (this._socketInited) return;
    this._socketInited = true;
    try {
      this.socket = io();

      this.socket.on('connect', () => {
        this.isSocketReady = true;
        console.log('Socket connected');
        this.socket.emit('register', this.myUserId);
      });

      // ensure no duplicate handler
      this.socket.off && this.socket.off('chat:message');
      this.socket.on('chat:message', (msg) => {
        this.handleIncomingMessage(msg);
      });

      // bulk unread sync
      this.socket.off && this.socket.off('chat:bulk');
      this.socket.on('chat:bulk', (msgs) => {
        try {
          msgs.forEach((m) => {
            const key = m.clientId || m.messageId || m._id;
            if (key && !this.renderedMessageIds.has(key)) {
              this.renderedMessageIds.add(key);
            }
            const friendId = m.from === this.myUserId ? m.to : m.from;
            if (m.to === this.myUserId && friendId !== this.activeChatUserId) {
              this.unreadByUser.set(friendId, (this.unreadByUser.get(friendId) || 0) + 1);
            }
          });
          this.renderFriendsList();
        } catch (e) { console.error('bulk sync error', e); }
      });

      // unread counts
      this.socket.off && this.socket.off('chat:unreadCounts');
      this.socket.on('chat:unreadCounts', (rows) => {
        try {
          rows.forEach(r => this.unreadByUser.set(r._id, r.count));
          this.renderFriendsList();
        } catch (e) { console.error('unread counts error', e); }
      });

      // message deletion
      this.socket.off && this.socket.off('chat:messageDeleted');
      this.socket.on('chat:messageDeleted', (data) => {
        try {
          const { messageId, fromUserId, toUserId } = data;
          const friendId = fromUserId === this.myUserId ? toUserId : fromUserId;
          const friend = this.friends.find(f => f._id === friendId);
          
          if (friend) {
            // Remove message from friend's messages array
            friend.messages = friend.messages.filter(msg => msg.id !== messageId);
            
            // Update last message and time if the deleted message was the last one
            if (friend.messages.length > 0) {
              const lastMsg = friend.messages[friend.messages.length - 1];
              friend.lastMsg = lastMsg.fromMe ? `You: ${lastMsg.text}` : `${friend.name}: ${lastMsg.text}`;
              friend.lastTime = lastMsg.time;
            } else {
              friend.lastMsg = '';
              friend.lastTime = '';
            }

            // Update UI immediately
            const chatWindow = this.activeChats.get(friendId);
            if (chatWindow) {
              this.renderChatMessages(chatWindow, friend);
            }

            // Update friends list
            this.renderFriendsList();
            console.log('Message deleted by other user:', messageId);
          }
        } catch (e) { console.error('message deletion sync error', e); }
      });

      this.socket.on('disconnect', () => {
        this.isSocketReady = false;
        console.log('Socket disconnected');
      });

      this.socket.on('registered', () => {
        console.log('Socket registered successfully');
      });

    } catch (err) {
      console.error('Socket init failed:', err);
    }
  }

  handleIncomingMessage(msg) {
    if (!msg || !msg.text) {
      console.warn('Invalid message received:', msg);
      return;
    }

    const key = msg.clientId || msg.id;
    if (key && this.renderedMessageIds.has(key)) return; // dedupe
    if (key) this.renderedMessageIds.add(key);

    const isIncoming = msg.to === this.myUserId;
    const friendId = isIncoming ? msg.from : msg.to;
    const friend = this.friends.find(f => f._id === friendId);
    if (!friend) {
      console.warn('Friend not found for message:', friendId);
      return;
    }

    const time = new Date(msg.ts || Date.now()).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });

    const newMessage = {
      id: key,
      fromMe: !isIncoming,
      text: msg.text,
      time: time,
      timestamp: msg.ts || Date.now()
    };

    if (!friend.messages) friend.messages = [];
    friend.messages.push(newMessage);
    friend.lastMsg = isIncoming ? `${friend.name}: ${msg.text}` : `You: ${msg.text}`;
    friend.lastTime = time;

    // Update chat window if open
    const chatWindow = this.activeChats.get(friendId);
    if (chatWindow) {
      this.renderChatMessages(chatWindow, friend);
    }

    // unread badge if incoming and chat not active
    if (isIncoming && friendId !== this.activeChatUserId) {
      this.unreadByUser.set(friendId, (this.unreadByUser.get(friendId) || 0) + 1);
    }

    // Update friends list and unread badges
    this.renderFriendsList();
  }

  openMainChatWindow() {
    this.initSocket();
    this.createFriendsListWindow();
  }

  createFriendsListWindow() {
    // Check if friends list window already exists
    const existingWindow = document.querySelector('.friends-list-window');
    if (existingWindow) {
      existingWindow.style.zIndex = this.getHighestZIndex() + 1;
      return;
    }

    const friendsListWindow = document.createElement('div');
    friendsListWindow.className = 'friends-list-window chat-window';
    friendsListWindow.dataset.chatId = 'friends-list';

    friendsListWindow.innerHTML = `
            <div class="chat-header">
                <div class="chat-header-info">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" style="color: white;">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2" stroke="currentColor" stroke-width="2"/>
                        <circle cx="9" cy="7" r="4" stroke="currentColor" stroke-width="2"/>
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87" stroke="currentColor" stroke-width="2"/>
                        <path d="M16 3.13a4 4 0 0 1 0 7.75" stroke="currentColor" stroke-width="2"/>
                    </svg>
                    <div class="chat-user-info">
                        <div class="chat-user-name">Friends</div>
                        <div class="chat-user-status">${this.friends.length} connections</div>
                    </div>
                </div>
                <div class="chat-header-actions">
                    <button class="chat-close-btn" title="Close">×</button>
                </div>
            </div>
            <div class="chat-friends-list"></div>
        `;

    document.body.appendChild(friendsListWindow);
    this.positionChatWindow(friendsListWindow);
    this.renderFriendsList();
    this.setupFriendsListEvents(friendsListWindow);
  }

  setupFriendsListEvents(friendsListWindow) {
    const closeBtn = friendsListWindow.querySelector('.chat-close-btn');

    closeBtn.addEventListener('click', () => {
      friendsListWindow.remove();
    });

    // Make draggable
    this.makeDraggable(friendsListWindow);
  }

  createChatWindow(friendId) {
    // Check if chat window already exists
    if (this.activeChats.has(friendId)) {
      this.focusChatWindow(friendId);
      return;
    }

    const friend = this.friends.find(f => f._id === friendId);
    if (!friend) return;

    const chatWindow = this.createChatWindowElement(friend);
    this.activeChats.set(friendId, chatWindow);

    document.body.appendChild(chatWindow);
    this.positionChatWindow(chatWindow);
    // Load history first time, then render
    if (!friend._historyLoaded) {
      this.loadHistory(friendId, chatWindow).then(() => {
        this.renderChatMessages(chatWindow, friend);
      });
    } else {
      this.renderChatMessages(chatWindow, friend);
    }
    this.setupChatWindowEvents(chatWindow, friendId);

    // Focus on input
    setTimeout(() => {
      const input = chatWindow.querySelector('.chat-input');
      if (input) input.focus();
    }, 100);

    // mark active and clear unread
    this.activeChatUserId = friendId;
    this.unreadByUser.set(friendId, 0);
    this.renderFriendsList();
    this.safeSocketEmit('chat:read', { withUserId: friendId });
  }

  async loadHistory(friendId, chatWindow, cursor = null, limit = 20) {
    try {
      const params = new URLSearchParams({ withUserId: friendId, limit: String(limit) });
      if (cursor) params.set('cursor', String(cursor));
      const res = await fetch(`/api/messages/history?${params.toString()}`);
      if (!res.ok) {
        console.error('Failed to load history:', res.status, res.statusText);
        return;
      }
      const data = await res.json();
      const friend = this.friends.find(f => f._id === friendId);
      if (!friend) {
        console.error('Friend not found for history:', friendId);
        return;
      }

      // server returns newest-first; reverse to append in ascending order
      const items = (data.items || []).slice().reverse();
      friend._nextCursor = data.nextCursor || null;
      if (!friend.messages) friend.messages = [];

      // prepend older items when cursor exists, else initial load
      const mapped = items.map(m => ({
        id: m.clientId || m.messageId || m._id,
        fromMe: m.from === this.myUserId,
        text: m.text,
        time: new Date(m.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        timestamp: new Date(m.ts).getTime()
      }));

      if (cursor) {
        friend.messages = [...mapped, ...friend.messages];
      } else {
        friend.messages = [...mapped];
        friend._historyLoaded = true;
      }

      // setup infinite scroll once
      if (chatWindow && !chatWindow._scrollBound) {
        const container = chatWindow.querySelector('.chat-messages');
        if (container) {
          container.addEventListener('scroll', async () => {
            if (container.scrollTop < 24 && friend._nextCursor) {
              const oldHeight = container.scrollHeight;
              await this.loadHistory(friendId, chatWindow, friend._nextCursor, 20);
              this.renderChatMessages(chatWindow, friend);
              // keep scroll position near previous message
              const newHeight = container.scrollHeight;
              container.scrollTop = newHeight - oldHeight;
            }
          });
          chatWindow._scrollBound = true;
        }
      }
    } catch (e) {
      console.error('loadHistory error:', e);
    }
  }

  createChatWindowElement(friend) {
    const chatWindow = document.createElement('div');
    chatWindow.className = 'chat-window';
    chatWindow.dataset.chatId = friend._id;

    chatWindow.innerHTML = `
      <div class="chat-header">
        <div class="chat-header-info">
          <div class="avatar-slot"></div>
          <div class="chat-user-info">
            <div class="chat-user-name"></div>
            <div class="chat-user-status ${friend.online ? 'online' : 'offline'}">${friend.online ? '● Online' : '○ Offline'}</div>
          </div>
        </div>
        <div class="chat-header-actions">
          <button class="chat-bulk-delete-btn" title="Delete multiple messages">🗑️</button>
          <button class="chat-minimize-btn" title="Minimize">−</button>
          <button class="chat-close-btn" title="Close">×</button>
        </div>
      </div>
      <div class="chat-messages"></div>
      <div class="chat-input-container">
        <form class="chat-form">
          <input type="text" class="chat-input" placeholder="Type a message..." autocomplete="off">
          <button type="submit" class="chat-send-btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
        </form>
      </div>`;

    // Safe username text
    chatWindow.querySelector('.chat-user-name').textContent = friend.name || 'User';
    // Avatar node
    const slot = chatWindow.querySelector('.avatar-slot');
    slot.appendChild(this.getAvatarNode(friend, 36));
    
    return chatWindow;
  }

  positionChatWindow(chatWindow) {
    const existingChats = document.querySelectorAll('.chat-window');
    const offset = (existingChats.length - 1) * 20; // friends list counts too

    chatWindow.style.right = `${20 + offset}px`;
    chatWindow.style.bottom = `${100 + offset}px`;
  }

  setupChatWindowEvents(chatWindow, friendId) {
    const form = chatWindow.querySelector('.chat-form');
    const input = chatWindow.querySelector('.chat-input');
    const minimizeBtn = chatWindow.querySelector('.chat-minimize-btn');
    const bulkDeleteBtn = chatWindow.querySelector('.chat-bulk-delete-btn');

    // Send message
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const text = input.value.trim();
      if (!text) return;

      this.sendMessage(friendId, text);
      input.value = '';
    });

    // Minimize chat
    minimizeBtn.addEventListener('click', () => {
      chatWindow.classList.toggle('minimized');
    });

    // Bulk delete messages
    bulkDeleteBtn.addEventListener('click', () => {
      this.startBulkDeleteMode(chatWindow, friendId);
    });

    // Drag functionality
    this.makeDraggable(chatWindow);
  }

  makeDraggable(chatWindow) {
    const header = chatWindow.querySelector('.chat-header');
    let isDragging = false;
    let currentX;
    let currentY;
    let initialX;
    let initialY;
    let xOffset = 0;
    let yOffset = 0;

    header.addEventListener('mousedown', (e) => {
      if (e.target.classList.contains('chat-close-btn') ||
        e.target.classList.contains('chat-minimize-btn')) {
        return;
      }

      isDragging = true;
      initialX = e.clientX - xOffset;
      initialY = e.clientY - yOffset;
      chatWindow.style.cursor = 'grabbing';
    });

    document.addEventListener('mousemove', (e) => {
      if (!isDragging) return;

      e.preventDefault();
      currentX = e.clientX - initialX;
      currentY = e.clientY - initialY;
      xOffset = currentX;
      yOffset = currentY;

      chatWindow.style.transform = `translate(${currentX}px, ${currentY}px)`;
    });

    document.addEventListener('mouseup', () => {
      isDragging = false;
      chatWindow.style.cursor = 'grab';
    });
  }

  renderChatMessages(chatWindow, friend) {
    const messagesContainer = chatWindow.querySelector('.chat-messages');
    if (!messagesContainer) return;
    
    messagesContainer.innerHTML = '';

    if (!friend.messages || friend.messages.length === 0) {
      messagesContainer.innerHTML = `
        <div style="text-align: center; padding: 40px 20px; color: #6b7280; font-style: italic;">
          <div style="font-size: 14px;">No messages yet</div>
          <div style="font-size: 12px;">Start a conversation!</div>
        </div>
      `;
      return;
    }

    friend.messages.forEach(msg => {
      try {
        const messageEl = document.createElement('div');
        messageEl.className = `chat-message ${msg.fromMe ? 'sent' : 'received'}`;
        messageEl.dataset.messageId = msg.id;

        messageEl.innerHTML = `
          <div class="message-content">
            <div class="message-text">${this.escapeHtml(msg.text)}</div>
            <div class="message-time">${msg.time}</div>
            ${msg.fromMe ? '<button class="message-delete-btn" title="Delete message">×</button>' : ''}
          </div>
        `;

        // Add delete functionality for own messages
        if (msg.fromMe) {
          const deleteBtn = messageEl.querySelector('.message-delete-btn');
          deleteBtn.addEventListener('click', () => {
            this.deleteMessage(friend._id, msg.id);
          });
        }

        messagesContainer.appendChild(messageEl);
      } catch (err) {
        console.error('Error rendering message:', err, msg);
      }
    });

    // Scroll to bottom
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  async sendMessage(friendId, text) {
    const friend = this.friends.find(f => f._id === friendId);
    if (!friend) return;

    const time = new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });

    const clientId = `c_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    this.renderedMessageIds.add(clientId); // prevent echo duplicate

    const newMessage = {
      id: clientId,
      fromMe: true,
      text: text,
      time: time,
      timestamp: Date.now()
    };

    friend.messages.push(newMessage);
    friend.lastMsg = `You: ${text}`;
    friend.lastTime = time;

    // Update UI immediately
    const chatWindow = this.activeChats.get(friendId);
    if (chatWindow) {
      this.renderChatMessages(chatWindow, friend);
    }

    // Send via socket with clientId for dedupe
    this.safeSocketEmit('chat:send', { to: friendId, text, clientId });

    // Update friends list
    this.renderFriendsList();
  }

  async deleteMessage(friendId, messageId) {
    const friend = this.friends.find(f => f._id === friendId);
    if (!friend) return;

    if (!confirm('Are you sure you want to delete this message?')) {
      return;
    }

    try {
      // Use socket for real-time deletion
      if (this.socket && this.isSocketReady) {
        this.socket.emit('chat:deleteMessage', { messageId });
        
        // Listen for success/error responses
        const successHandler = (data) => {
          if (data.messageId === messageId) {
            this.removeMessageFromUI(friendId, messageId);
            this.socket.off('chat:deleteSuccess', successHandler);
          }
        };
        
        const errorHandler = (data) => {
          alert('Failed to delete message: ' + data.message);
          this.socket.off('chat:deleteError', errorHandler);
        };
        
        this.socket.on('chat:deleteSuccess', successHandler);
        this.socket.on('chat:deleteError', errorHandler);
        
        // Fallback to API if socket fails
        setTimeout(() => {
          this.socket.off('chat:deleteSuccess', successHandler);
          this.socket.off('chat:deleteError', errorHandler);
          this.deleteMessageViaAPI(friendId, messageId);
        }, 5000);
      } else {
        // Fallback to API if socket not available
        this.deleteMessageViaAPI(friendId, messageId);
      }
    } catch (err) {
      console.error('Error deleting message:', err);
      alert('Error deleting message: ' + err.message);
    }
  }

  async deleteMessageViaAPI(friendId, messageId) {
    try {
      const res = await fetch(`/api/messages/${messageId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!res.ok) {
        const error = await res.json();
        console.error('Failed to delete message:', res.status, error.message);
        alert('Failed to delete message: ' + error.message);
        return;
      }

      const data = await res.json();
      if (data.success) {
        this.removeMessageFromUI(friendId, messageId);
        console.log('Message deleted successfully via API');
      } else {
        console.error('Message deletion failed:', data.message);
        alert('Message deletion failed: ' + data.message);
      }
    } catch (err) {
      console.error('Error deleting message via API:', err);
      alert('Error deleting message: ' + err.message);
    }
  }

  removeMessageFromUI(friendId, messageId) {
    const friend = this.friends.find(f => f._id === friendId);
    if (!friend) return;

    // Remove message from friend's messages array
    friend.messages = friend.messages.filter(msg => msg.id !== messageId);
    
    // Update last message and time if the deleted message was the last one
    if (friend.messages.length > 0) {
      const lastMsg = friend.messages[friend.messages.length - 1];
      friend.lastMsg = lastMsg.fromMe ? `You: ${lastMsg.text}` : `${friend.name}: ${lastMsg.text}`;
      friend.lastTime = lastMsg.time;
    } else {
      friend.lastMsg = '';
      friend.lastTime = '';
    }

    // Update UI immediately
    const chatWindow = this.activeChats.get(friendId);
    if (chatWindow) {
      this.renderChatMessages(chatWindow, friend);
    }

    // Update friends list
    this.renderFriendsList();
  }

  renderFriendsList() {
    const friendsList = document.querySelector('.chat-friends-list');
    if (!friendsList) return;

    friendsList.innerHTML = '';

    if (!this.friends || this.friends.length === 0) {
      friendsList.innerHTML = `
        <div style="text-align: center; padding: 40px 20px; color: #6b7280; font-style: italic;">
          <div style="margin-bottom: 16px;">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" style="color: #9ca3af;">
              <path d="M17 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2" stroke="currentColor" stroke-width="2"/>
              <circle cx="9" cy="7" r="4" stroke="currentColor" stroke-width="2"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" stroke="currentColor" stroke-width="2"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75" stroke="currentColor" stroke-width="2"/>
            </svg>
          </div>
          <div style="font-size: 14px; margin-bottom: 8px;">No friends found</div>
          <div style="font-size: 12px;">Connect with users to start chatting!</div>
        </div>
      `;
      return;
    }

    this.friends.forEach(friend => {
      try {
        const friendEl = document.createElement('div');
        friendEl.className = 'chat-friend-item';
        friendEl.dataset.friendId = friend._id;

        friendEl.innerHTML = `
          <div class="avatar-slot"></div>
          <div class="friend-info">
            <div class="friend-name"></div>
            <div class="friend-last-message"></div>
          </div>
          <div class="friend-meta">
            <div class="friend-time"></div>
            <div class="friend-status ${friend.online ? 'online' : 'offline'}"></div>
          </div>
          <span class="chat-badge"></span>`;
        
        // avatar node
        const avatarSlot = friendEl.querySelector('.avatar-slot');
        if (avatarSlot) {
          avatarSlot.appendChild(this.getAvatarNode(friend, 40));
        }
        
        // safe textContent assignments to avoid HTML injection artifacts
        const nameEl = friendEl.querySelector('.friend-name');
        const lastMsgEl = friendEl.querySelector('.friend-last-message');
        const timeEl = friendEl.querySelector('.friend-time');
        
        if (nameEl) nameEl.textContent = friend.name || 'User';
        if (lastMsgEl) lastMsgEl.textContent = friend.lastMsg || '';
        if (timeEl) timeEl.textContent = friend.lastTime || '';

        friendEl.addEventListener('click', () => {
          this.createChatWindow(friend._id);
          // Close friends list window
          const friendsListWindow = document.querySelector('.friends-list-window');
          if (friendsListWindow) {
            friendsListWindow.remove();
          }
        });

        friendsList.appendChild(friendEl);

        // update unread badge
        const n = this.unreadByUser.get(friend._id) || 0;
        const badge = friendEl.querySelector('.chat-badge');
        if (badge) {
          if (n > 0) {
            badge.textContent = n > 99 ? '99+' : String(n);
            badge.style.display = 'inline-flex';
          } else {
            badge.textContent = '';
            badge.style.display = 'none';
          }
        }
      } catch (err) {
        console.error('Error rendering friend item:', err, friend);
      }
    });
  }

  focusChatWindow(friendId) {
    const chatWindow = this.activeChats.get(friendId);
    if (chatWindow) {
      chatWindow.style.zIndex = this.getHighestZIndex() + 1;
      chatWindow.classList.remove('minimized');
    }
  }

  closeChatWindow(friendId) {
    const chatWindow = this.activeChats.get(friendId);
    if (chatWindow) {
      chatWindow.remove();
      this.activeChats.delete(friendId);
    }
    if (this.activeChatUserId === friendId) this.activeChatUserId = null;
  }

  closeAllChatWindows() {
    this.activeChats.forEach((chatWindow, friendId) => {
      this.closeChatWindow(friendId);
    });
  }

  getHighestZIndex() {
    const chatWindows = document.querySelectorAll('.chat-window');
    let highest = 1000;
    chatWindows.forEach(window => {
      const zIndex = parseInt(window.style.zIndex) || 1000;
      if (zIndex > highest) highest = zIndex;
    });
    return highest;
  }

  isSocketConnected() {
    return this.socket && this.socket.connected && this.isSocketReady;
  }

  safeSocketEmit(event, data) {
    if (this.isSocketConnected()) {
      try {
        this.socket.emit(event, data);
        return true;
      } catch (err) {
        console.error(`Failed to emit ${event}:`, err);
        return false;
      }
    } else {
      console.warn(`Socket not connected, cannot emit ${event}`);
      return false;
    }
  }

  startBulkDeleteMode(chatWindow, friendId) {
    const friend = this.friends.find(f => f._id === friendId);
    if (!friend || !friend.messages || friend.messages.length === 0) {
      alert('No messages to delete');
      return;
    }

    // Add bulk delete mode class
    chatWindow.classList.add('bulk-delete-mode');
    
    // Add checkboxes to messages
    const messages = chatWindow.querySelectorAll('.chat-message');
    messages.forEach((msgEl, index) => {
      const message = friend.messages[index];
      if (message && message.fromMe) { // Only own messages can be deleted
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.className = 'message-checkbox';
        checkbox.dataset.messageId = message.id;
        msgEl.appendChild(checkbox);
      }
    });

    // Add bulk delete controls
    const bulkControls = document.createElement('div');
    bulkControls.className = 'bulk-delete-controls';
    bulkControls.innerHTML = `
      <div class="bulk-controls-content">
        <label>
          <input type="checkbox" id="select-all-messages"> Select All
        </label>
        <div class="bulk-actions">
          <button class="bulk-delete-confirm-btn">Delete Selected</button>
          <button class="bulk-delete-cancel-btn">Cancel</button>
        </div>
      </div>
    `;
    chatWindow.appendChild(bulkControls);

    // Select all functionality
    const selectAllCheckbox = bulkControls.querySelector('#select-all-messages');
    const messageCheckboxes = bulkControls.parentElement.querySelectorAll('.message-checkbox');
    
    selectAllCheckbox.addEventListener('change', () => {
      messageCheckboxes.forEach(cb => cb.checked = selectAllCheckbox.checked);
    });

    // Delete selected messages
    const deleteBtn = bulkControls.querySelector('.bulk-delete-confirm-btn');
    deleteBtn.addEventListener('click', () => {
      const selectedMessages = Array.from(messageCheckboxes)
        .filter(cb => cb.checked)
        .map(cb => cb.dataset.messageId);
      
      if (selectedMessages.length === 0) {
        alert('Please select messages to delete');
        return;
      }

      if (confirm(`Are you sure you want to delete ${selectedMessages.length} message(s)?`)) {
        this.deleteMultipleMessages(friendId, selectedMessages);
        this.exitBulkDeleteMode(chatWindow);
      }
    });

    // Cancel bulk delete
    const cancelBtn = bulkControls.querySelector('.bulk-delete-cancel-btn');
    cancelBtn.addEventListener('click', () => {
      this.exitBulkDeleteMode(chatWindow);
    });
  }

  exitBulkDeleteMode(chatWindow) {
    chatWindow.classList.remove('bulk-delete-mode');
    
    // Remove checkboxes
    const checkboxes = chatWindow.querySelectorAll('.message-checkbox');
    checkboxes.forEach(cb => cb.remove());
    
    // Remove bulk controls
    const bulkControls = chatWindow.querySelector('.bulk-delete-controls');
    if (bulkControls) bulkControls.remove();
  }

  async deleteMultipleMessages(friendId, messageIds) {
    const friend = this.friends.find(f => f._id === friendId);
    if (!friend) return;

    try {
      // Delete messages one by one
      for (const messageId of messageIds) {
        if (this.socket && this.isSocketReady) {
          this.socket.emit('chat:deleteMessage', { messageId });
        } else {
          await this.deleteMessageViaAPI(friendId, messageId);
        }
      }

      // Update UI after all deletions
      setTimeout(() => {
        this.renderChatMessages(this.activeChats.get(friendId), friend);
        this.renderFriendsList();
      }, 1000);

    } catch (err) {
      console.error('Error deleting multiple messages:', err);
      alert('Error deleting messages: ' + err.message);
    }
  }
}

// Initialize chat system when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.chatSystem = new ChatSystem();
});

// Export for global access
window.ChatSystem = ChatSystem; 