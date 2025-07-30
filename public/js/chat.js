// Friend Chat Modal Logic

const dummyFriends = [
  {
    id: '1',
    name: 'Aniket Gupta',
    online: true,
    lastMsg: 'You: Thanks a lot',
    lastTime: 'Jul 15',
    messages: [
      { fromMe: false, text: 'Hi! How are you?', time: '9:01 PM' },
      { fromMe: true, text: 'I am good, thanks!', time: '9:03 PM' },
      { fromMe: false, text: 'Great to hear!', time: '9:04 PM' }
    ]
  },
  {
    id: '2',
    name: 'Ayush Taware',
    online: false,
    lastMsg: 'Ayush: No it\'s not fake',
    lastTime: 'Jul 15',
    messages: [
      { fromMe: true, text: 'Is this internship real?', time: '9:10 PM' },
      { fromMe: false, text: 'No it\'s not fake', time: '9:17 PM' }
    ]
  }
];

let selectedFriendId = null;

// Open and close chat modal
const openChatBtn = document.getElementById('openFriendChatBtn');
const chatModal = document.getElementById('friendChatModal');
const closeChatBtn = document.getElementById('closeFriendChatModalBtn');

if (openChatBtn) {
  openChatBtn.addEventListener('click', () => {
    chatModal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    renderChatFriendsList();
  });
}
if (closeChatBtn) {
  closeChatBtn.addEventListener('click', () => {
    chatModal.classList.add('hidden');
    document.body.style.overflow = '';
    clearChatArea();
  });
}

// Show friend list
function renderChatFriendsList() {
  const ul = document.getElementById('chatFriendsList');
  ul.innerHTML = '';
  dummyFriends.forEach(friend => {
    const li = document.createElement('li');
    li.className = 'chat-friend-item' + (friend.id === selectedFriendId ? ' active' : '');
    li.innerHTML = `
      <div class="flex-1 min-w-0">
        <div class="chat-friend-name">${friend.name}${friend.online ? ' <span style=\'color:#22c55e;font-size:1.1em;\'>●</span>' : ''}</div>
        <div class="chat-friend-lastmsg">${friend.lastMsg}</div>
      </div>
      <div class="chat-friend-time">${friend.lastTime}</div>
    `;
    li.addEventListener('click', () => {
      selectedFriendId = friend.id;
      renderChatFriendsList();
      renderChatArea(friend);
    });
    ul.appendChild(li);
  });
}

// Show chat area for selected friend
function renderChatArea(friend) {
  document.getElementById('chatFriendAvatar').style.display = 'none';
  document.getElementById('chatFriendName').innerText = friend.name;
  document.getElementById('chatFriendStatus').innerText = friend.online ? 'Online' : 'Offline';
  const chatDiv = document.getElementById('chatMessages');
  chatDiv.innerHTML = '';
  friend.messages.forEach(msg => {
    const bubble = document.createElement('div');
    bubble.className = 'chat-bubble' + (msg.fromMe ? ' me' : '');
    bubble.innerHTML = `
      <div class="chat-bubble-msg">${msg.text}</div>
      <span class="chat-bubble-time">${msg.time}</span>
    `;
    chatDiv.appendChild(bubble);
  });
  chatDiv.scrollTop = chatDiv.scrollHeight;
}

// Clear chat area
function clearChatArea() {
  document.getElementById('chatFriendAvatar').style.display = 'none';
  document.getElementById('chatFriendName').innerText = 'Select a friend';
  document.getElementById('chatFriendStatus').innerText = '';
  document.getElementById('chatMessages').innerHTML = '';
  selectedFriendId = null;
}

// Send message
const chatForm = document.getElementById('chatMessageForm');
if (chatForm) {
  chatForm.addEventListener('submit', function (e) {
    e.preventDefault();
    const input = document.getElementById('chatMessageInput');
    const text = input.value.trim();
    if (!text || !selectedFriendId) return;
    const friend = dummyFriends.find(f => f.id === selectedFriendId);
    if (!friend) return;
    const now = new Date();
    const time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    friend.messages.push({ fromMe: true, text, time });
    friend.lastMsg = 'You: ' + text;
    friend.lastTime = time;
    input.value = '';
    renderChatArea(friend);
    renderChatFriendsList();
  });
}

// Search friends
const chatFriendSearch = document.getElementById('chatFriendSearch');
if (chatFriendSearch) {
  chatFriendSearch.addEventListener('input', function () {
    const q = this.value.toLowerCase();
    const ul = document.getElementById('chatFriendsList');
    ul.innerHTML = '';
    dummyFriends.filter(f => f.name.toLowerCase().includes(q) || f.lastMsg.toLowerCase().includes(q)).forEach(friend => {
      const li = document.createElement('li');
      li.className = 'chat-friend-item' + (friend.id === selectedFriendId ? ' active' : '');
      li.innerHTML = `
        <div class="relative">
          <img src="${friend.avatar}" alt="Avatar" class="chat-friend-avatar" />
          ${friend.online ? '<span class="chat-friend-online"></span>' : ''}
        </div>
        <div class="flex-1 min-w-0">
          <div class="chat-friend-name">${friend.name}</div>
          <div class="chat-friend-lastmsg">${friend.lastMsg}</div>
        </div>
        <div class="chat-friend-time">${friend.lastTime}</div>
      `;
      li.addEventListener('click', () => {
        selectedFriendId = friend.id;
        renderChatFriendsList();
        renderChatArea(friend);
      });
      ul.appendChild(li);
    });
  });
} 