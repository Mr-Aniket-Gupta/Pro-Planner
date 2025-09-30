// Connections Hub Logic

// Elements
const connectionsHubModal = document.getElementById('connectionsHubModal');
const connectionsBtn = document.getElementById('connectionsBtn');
const closeConnectionsHubBtn = document.getElementById('closeConnectionsHubBtn');
const connectionsHubNav = document.getElementById('connectionsHubNav');
const connectionsHubContent = document.getElementById('connectionsHubContent');

// State
let currentHubTab = 'search';
let notificationCounts = {
    friendRequests: 0,
    sharedWithMe: 0,
    accessRequests: 0
};

// Navigation Items
const navItems = [
    { id: 'search', icon: '🔍', text: 'Search Users' },
    { id: 'requests', icon: '📥', text: 'Friend Requests', badgeId: 'requestsBadge' },
    { id: 'friends', icon: '👥', text: 'My Friends' },
    { id: 'sharing', icon: '📤', text: 'My Project Sharing' },
    { id: 'shared_with_me', icon: '🤝', text: 'Shared With Me', badgeId: 'sharedWithMeBadge' },
    { id: 'access_requests', icon: '🔑', text: 'Access Requests', badgeId: 'accessRequestsBadge' },
];

// Initialize Connections Hub
function initializeConnectionsHub() {
    if (!connectionsBtn || !connectionsHubModal) return;
    connectionsBtn.addEventListener('click', openConnectionsHub);
    closeConnectionsHubBtn.addEventListener('click', closeConnectionsHub);
    renderHubNavigation();
    fetchNotificationCounts(); // Fetch initial counts
}

// Fetch notification counts from backend
async function fetchNotificationCounts() {
    try {
        // Fetch friend requests count
        const userDataRes = await fetch('/api/userdata/notification-counts');
        if (userDataRes.ok) {
            const userData = await userDataRes.json();
            notificationCounts.friendRequests = userData.friendRequests || 0;
        }

        // Fetch project-related counts
        const projectRes = await fetch('/api/projects/notification-counts');
        if (projectRes.ok) {
            const projectData = await projectRes.json();
            notificationCounts.sharedWithMe = projectData.sharedWithMe || 0;
            notificationCounts.accessRequests = projectData.accessRequests || 0;

        }

        updateNotificationBadges();
    } catch (err) {
        console.error('Failed to fetch notification counts:', err);
    }
}

// Update notification badges in the UI
function updateNotificationBadges() {
    // Update friend requests badge
    const requestsBadge = document.getElementById('requestsBadge');
    if (requestsBadge) {
        if (notificationCounts.friendRequests > 0) {
            requestsBadge.textContent = notificationCounts.friendRequests;
            requestsBadge.classList.remove('hidden');
        } else {
            requestsBadge.classList.add('hidden');
        }
    }

    // Update shared with me badge (we'll add this to the nav)
    const sharedWithMeBadge = document.getElementById('sharedWithMeBadge');
    if (sharedWithMeBadge) {
        if (notificationCounts.sharedWithMe > 0) {
            sharedWithMeBadge.textContent = notificationCounts.sharedWithMe;
            sharedWithMeBadge.classList.remove('hidden');
        } else {
            sharedWithMeBadge.classList.add('hidden');
        }
    }

    // Update access requests badge
    const accessRequestsBadge = document.getElementById('accessRequestsBadge');
    if (accessRequestsBadge) {
        if (notificationCounts.accessRequests > 0) {
            accessRequestsBadge.textContent = notificationCounts.accessRequests;
            accessRequestsBadge.classList.remove('hidden');
        } else {
            accessRequestsBadge.classList.add('hidden');
        }
    }
}

// Open/Close Hub
function openConnectionsHub() {
    const header = document.querySelector('header');
    const headerHeight = header ? header.offsetHeight : 0;
    connectionsHubModal.style.top = `${headerHeight}px`;
    connectionsHubModal.classList.remove('hidden');
    setTimeout(() => { connectionsHubModal.style.transform = 'translateX(0)'; }, 10);
    renderHubContent(currentHubTab);
    fetchNotificationCounts(); // Refresh counts when hub opens
}
function closeConnectionsHub() {
    connectionsHubModal.style.transform = 'translateX(100%)';
    setTimeout(() => { connectionsHubModal.classList.add('hidden'); }, 300);
}

// Render Navigation
function renderHubNavigation() {
    connectionsHubNav.innerHTML = navItems.map(item => `
        <a href="#" class="hub-nav-item flex items-center p-2 rounded-lg hover:bg-gray-200 text-gray-700 relative" data-tab="${item.id}">
            <span class="text-xl">${item.icon}</span>
            <span class="ml-3 hidden md:block">${item.text}</span>
            ${item.badgeId ? `<span id="${item.badgeId}" class="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 font-bold hidden">0</span>` : ''}
        </a>
    `).join('');
    connectionsHubNav.querySelectorAll('.hub-nav-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            currentHubTab = item.getAttribute('data-tab');
            renderHubContent(currentHubTab);
            // Refresh counts when switching to access requests tab
            if (currentHubTab === 'access_requests') {
                fetchNotificationCounts();
            }
        });
    });
}

// Debounce helper
function debounce(fn, delay) {
    let timeout;
    return function (...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => fn.apply(this, args), delay);
    };
}

// Render content for each tab (functions unchanged, just comments cleaned)
// --- User Search Section (with all users list) ---
async function renderUserSearchSection() {
    connectionsHubContent.innerHTML = `
        <h2 class="text-xl font-bold text-blue-700 mb-4">Search Users</h2>
        <input id="userSearchInput" type="text" placeholder="Search users by name or email..." class="w-full border border-blue-200 p-3 rounded-xl bg-blue-50 mb-4" />
                <div id="userSearchResults" class="space-y-2"></div>
            `;
    const input = document.getElementById('userSearchInput');
    const resultsDiv = document.getElementById('userSearchResults');
    resultsDiv.innerHTML = '<div class="text-blue-400 text-center">Loading users...</div>';
    let allUsers = [];
    let friends = [];
    // Fetch all users and friends on load
    try {
        const res = await fetch('/api/userdata/search-users', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ q: '' })
        });
        allUsers = await res.json();
        const res2 = await fetch('/api/userdata/connections');
        if (res2.ok) friends = await res2.json();
    } catch (err) {
        resultsDiv.innerHTML = '<div class="text-red-500 text-center">Failed to load users.</div>';
        return;
    }
    // Helper to render the list
    function renderList(users) {
        if (!users.length) {
            resultsDiv.innerHTML = '<div class="text-gray-400 text-center">No users found.</div>';
            return;
        }
        resultsDiv.innerHTML = users.map(user => {
            const email = user.emails && user.emails[0] ? user.emails[0].email : '';
            const isFriend = friends.some(f => f._id === user._id);
            return `<div class="flex items-center justify-between bg-blue-50 rounded-xl px-4 py-2">
                <div>
                    <div class="font-semibold text-blue-700">${user.name}</div>
                    <div class="text-xs text-gray-500">${email}</div>
                </div>
                ${isFriend ? '<span class="bg-green-500 text-white px-3 py-1 rounded-xl font-semibold">Friends</span>' : `<button class="connectBtn bg-blue-500 text-white px-3 py-1 rounded-xl font-semibold hover:bg-blue-600 transition" data-userid="${user._id}">Connect</button>`}
            </div>`;
        }).join('');
        // Connect button logic
        Array.from(resultsDiv.getElementsByClassName('connectBtn')).forEach(btn => {
            btn.addEventListener('click', async function () {
                btn.disabled = true;
                btn.innerText = 'Sending...';
                try {
                    const res = await fetch('/api/userdata/send-connection-request', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ toUserId: btn.getAttribute('data-userid') })
                    });
                    if (res.ok) {
                        btn.innerText = 'Sent!';
                        btn.classList.add('bg-green-500');
                        // Note: The recipient will get the count updated via WebSocket
                    } else {
                        btn.innerText = 'Error';
                    }
                } catch {
                    btn.innerText = 'Error';
                }
            });
        });
    }
    // Initial render: show all users
    renderList(allUsers);
    // Filter on input
    input.addEventListener('input', function () {
        const q = input.value.trim().toLowerCase();
        if (!q) {
            renderList(allUsers);
            return;
        }
        const filtered = allUsers.filter(user =>
            user.name.toLowerCase().includes(q) ||
            (user.emails && user.emails[0] && user.emails[0].email.toLowerCase().includes(q))
        );
        renderList(filtered);
    });
}

// --- Friend Requests Section ---
async function renderFriendRequestsSection() {
    connectionsHubContent.innerHTML = `<h2 class="text-xl font-bold text-blue-700 mb-4">Friend Requests</h2>
        <div id="friendRequestsList" class="space-y-2"></div>`;
    const listDiv = document.getElementById('friendRequestsList');
    listDiv.innerHTML = '<div class="text-blue-400 text-center">Loading...</div>';
    try {
        const res = await fetch('/api/userdata/pending-requests');
        const requests = await res.json();
        if (!requests.length) {
            listDiv.innerHTML = '<div class="text-gray-400 text-center">No pending requests.</div>';
            return;
        }
        listDiv.innerHTML = requests.map(user => {
            const email = user.emails && user.emails[0] ? user.emails[0].email : '';
            return `<div class="flex items-center justify-between bg-yellow-50 rounded-xl px-4 py-2">
                <div>
                    <div class="font-semibold text-blue-700">${user.name}</div>
                    <div class="text-xs text-gray-500">${email}</div>
                </div>
                <button class="acceptBtn bg-green-500 text-white px-3 py-1 rounded-xl font-semibold hover:bg-green-600 transition" data-userid="${user._id}">Accept</button>
            </div>`;
        }).join('');
        // Accept button logic
        Array.from(listDiv.getElementsByClassName('acceptBtn')).forEach(btn => {
            btn.addEventListener('click', async function () {
                btn.disabled = true;
                btn.innerText = 'Accepting...';
                try {
                    const res = await fetch('/api/userdata/accept-connection-request', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ fromUserId: btn.getAttribute('data-userid') })
                    });
                    if (res.ok) {
                        btn.innerText = 'Accepted!';
                        btn.classList.add('bg-blue-500');
                        await renderFriendRequestsSection();
                        await fetchNotificationCounts(); // Refresh friend request counts
                    } else {
                        btn.innerText = 'Error';
                    }
                } catch {
                    btn.innerText = 'Error';
                }
            });
        });
    } catch (err) {
        listDiv.innerHTML = '<div class="text-red-500 text-center">Failed to load requests.</div>';
    }
}

// --- My Friends Section (with friend public projects & access request) ---
async function renderMyFriendsSection() {
    connectionsHubContent.innerHTML = `<h2 class="text-xl font-bold text-blue-700 mb-4">My Friends</h2>
        <div id="friendsList" class="space-y-2"></div>`;
    const listDiv = document.getElementById('friendsList');
    listDiv.innerHTML = '<div class="text-blue-400 text-center">Loading...</div>';
    try {
        const res = await fetch('/api/userdata/connections');
        const friends = await res.json();
        if (!friends.length) {
            listDiv.innerHTML = '<div class="text-gray-400 text-center">No friends yet.</div>';
            return;
        }
        listDiv.innerHTML = friends.map(user => {
            const email = user.emails && user.emails[0] ? user.emails[0].email : '';
            return `<div class="flex items-center justify-between bg-green-50 rounded-xl px-4 py-2 cursor-pointer friend-row" data-userid="${user._id}">
                <div>
                    <div class="font-semibold text-blue-700">${user.name}</div>
                    <div class="text-xs text-gray-500">${email}</div>
                </div>
                <button class="removeFriendBtn text-red-500 hover:text-red-700 text-sm font-bold" data-userid="${user._id}">Remove</button>
            </div>`;
        }).join('');
        // Remove button logic
        Array.from(listDiv.getElementsByClassName('removeFriendBtn')).forEach(btn => {
            btn.addEventListener('click', async function (e) {
                e.stopPropagation();
                if (!confirm('Are you sure you want to remove this friend?')) return;
                btn.disabled = true;
                btn.innerText = 'Removing...';
                try {
                    const res = await fetch('/api/userdata/remove-connection', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ userId: btn.getAttribute('data-userid') })
                    });
                    if (res.ok) {
                        btn.innerText = 'Removed!';
                        await renderMyFriendsSection();
                    } else {
                        btn.innerText = 'Error';
                    }
                } catch {
                    btn.innerText = 'Error';
                }
            });
        });
        // Friend row click logic (show public projects)
        Array.from(listDiv.getElementsByClassName('friend-row')).forEach(row => {
            row.addEventListener('click', async function (e) {
                if (e.target.classList.contains('removeFriendBtn')) return;
                const userId = row.getAttribute('data-userid');
                await showFriendPublicProjectsModal(userId);
            });
        });
    } catch (err) {
        listDiv.innerHTML = '<div class="text-red-500 text-center">Failed to load friends.</div>';
    }
}

// --- Friend's Public Projects Modal ---
async function showFriendPublicProjectsModal(friendId) {
    let modal = document.getElementById('friendProjectsModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'friendProjectsModal';
        modal.className = 'fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50';
        document.body.appendChild(modal);
    }
    modal.innerHTML = `
            <div class="bg-white rounded-2xl shadow-xl p-6 w-full max-w-lg relative flex flex-col" style="max-height:90vh;">
                <button id="closeFriendProjectsModalBtn" class="absolute top-3 right-3 text-gray-400 hover:text-blue-500">
                    <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
                        <path d="M6 6l12 12M6 18L18 6" stroke="#3B82F6" stroke-width="2" stroke-linecap="round" />
                    </svg>
                </button>
                <h2 class="text-xl font-bold text-blue-600 mb-4 flex items-center gap-2">
                    Friend's Public Projects
                </h2>
                <div id="friendProjectsList" class="space-y-2 friend-projects-scrollable" style="max-height: 400px; overflow-y: auto;"></div>
            </div>
        `;
    modal.classList.remove('hidden');
    document.getElementById('closeFriendProjectsModalBtn').onclick = function () {
        modal.classList.add('hidden');
    };
    // Fetch and render projects
    try {
        const res = await fetch(`/api/projects/public/${friendId}`);
        const projects = await res.json();
        const listDiv = document.getElementById('friendProjectsList');
        if (!projects.length) {
            listDiv.innerHTML = '<div class="text-gray-400 text-center">No public projects.</div>';
            return;
        }
        listDiv.innerHTML = projects.map(proj => {
            return `<div class="flex items-center justify-between bg-blue-50 rounded-xl px-4 py-2">
                <div>
                    <div class="font-semibold text-blue-700">${proj.name}</div>
                    <div class="text-xs text-gray-500">${proj.description || ''}</div>
                </div>
                <div class="flex flex-col gap-2 items-end">
                    <select class="accessTypeSelect border rounded px-2 py-1 text-sm" data-projectid="${proj._id}">
                        <option value="read">Read-Only</option>
                        <option value="write">Read & Write</option>
                    </select>
                    <button class="accessBtn bg-blue-500 text-white px-3 py-1 rounded-xl font-semibold hover:bg-blue-600 transition" data-projectid="${proj._id}">Request Access</button>
                </div>
            </div>`;
        }).join('');
        // Access button logic
        Array.from(listDiv.getElementsByClassName('accessBtn')).forEach(btn => {
            btn.addEventListener('click', async function () {
                const projectId = btn.getAttribute('data-projectid');
                const select = listDiv.querySelector(`.accessTypeSelect[data-projectid='${projectId}']`);
                const access = select.value;
                btn.disabled = true;
                btn.innerText = 'Requested';
                try {
                    const res = await fetch('/api/projects/request-access', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ projectId, access })
                    });
                    if (res.ok) {
                        btn.innerText = 'Request Sent';
                        // Note: The project owner will get the count updated via WebSocket
                        // We could also emit a socket event here to notify the project owner
                        if (socket) {
                            socket.emit('access-request-sent', {
                                projectId: projectId,
                                projectOwnerId: friendId,
                                access: access
                            });
                        }
                    } else {
                        btn.innerText = 'Error';
                    }
                } catch (err) {
                    btn.innerText = 'Error';
                }
            });
        });
    } catch (err) {
        const listDiv = document.getElementById('friendProjectsList');
        listDiv.innerHTML = '<div class="text-red-500 text-center">Failed to load public projects.</div>';
    }
}

// --- My Project Sharing Section ---
async function renderMyProjectSharingSection() {
    connectionsHubContent.innerHTML = `<h2 class="text-xl font-bold text-blue-700 mb-4">My Project Sharing</h2>
        <div id="mySharingProjectsList" class="space-y-4"></div>`;
    const listDiv = document.getElementById('mySharingProjectsList');
    listDiv.innerHTML = '<div class="text-blue-400 text-center">Loading your projects...</div>';
    let projects = [];
    try {
        const res = await fetch('/api/projects');
        if (res.ok) projects = await res.json();
    } catch (err) {
        listDiv.innerHTML = '<div class="text-red-500 text-center">Failed to load your projects.</div>';
        return;
    }
    if (!projects.length) {
        listDiv.innerHTML = '<div class="text-gray-400 text-center">No projects found.</div>';
        return;
    }
    // For each project, fetch sharing details and render
    listDiv.innerHTML = '';
    for (const p of projects) {
        let sharingDetails = { friends: [], sharedWith: [] };
        try {
            const res = await fetch(`/api/projects/${p._id}/sharing-details`);
            if (res.ok) sharingDetails = await res.json();
        } catch { }
        // Render project card
        const card = document.createElement('div');
        card.className = 'bg-white rounded-xl shadow p-4 border border-blue-100 mb-4';
        card.innerHTML = `
            <div class='font-bold text-blue-700 text-lg mb-1'>${p.name}</div>
            <div class='text-gray-500 mb-2'>${p.desc || p.description || ''}</div>
            <div id='sharingUsersList_${p._id}' class='mb-2'></div>
        `;
        listDiv.appendChild(card);
        // Render all friends with access controls
        const usersListDiv = card.querySelector(`#sharingUsersList_${p._id}`);
        if (sharingDetails.friends.length === 0) {
            usersListDiv.innerHTML = '<div class="text-gray-400">No friends to share with.</div>';
        } else {
            usersListDiv.innerHTML = sharingDetails.friends.map(f => `
        <div class='flex items-center justify-between bg-blue-50 rounded-xl px-3 py-2 mb-1 border border-blue-100'>
            <div>
                        <span class='font-semibold text-blue-700'>${f.name}</span>
                        <span class='text-xs text-gray-500 ml-2'>${f.emails?.[0]?.email || ''}</span>
            </div>
            <div class='flex gap-2'>
                        <select class='changeAccessSelect border rounded px-2 py-1 text-sm' data-userid='${f._id}' data-projectid='${p._id}'>
                            <option value='read' ${f.access === 'read' ? 'selected' : ''}>Read</option>
                            <option value='write' ${f.access === 'write' ? 'selected' : ''}>Read & Write</option>
                </select>
                        <button class='changeAccessBtn bg-blue-500 text-white px-3 py-1 rounded-xl font-semibold hover:bg-blue-600 transition' data-userid='${f._id}' data-projectid='${p._id}'>Change</button>
                        ${f.access ? `<button class='revokeAccessBtn text-red-500 hover:text-red-700 text-sm font-bold' data-userid='${f._id}' data-projectid='${p._id}'>Revoke</button>` : ''}
            </div>
        </div>
    `).join('');
            // Change access logic (on Change button click)
            Array.from(usersListDiv.getElementsByClassName('changeAccessBtn')).forEach(btn => {
                btn.addEventListener('click', async function () {
                    const userId = this.getAttribute('data-userid');
                    const projectId = this.getAttribute('data-projectid');
                    const sel = usersListDiv.querySelector(`.changeAccessSelect[data-userid='${userId}'][data-projectid='${projectId}']`);
                    const newAccess = sel.value;
                    btn.disabled = true;
                    btn.innerText = 'Changing...';
                    try {
                        const res = await fetch('/api/projects/change-access', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ projectId, userId, access: newAccess })
                        });
                        const data = await res.json();
                        if (res.ok && data.success) {
                            await renderMyProjectSharingSection();
                            await fetchNotificationCounts(); // Refresh counts when project access is changed
                        } else {
                            btn.innerText = 'Error';
                        }
                    } catch {
                        btn.innerText = 'Error';
                    }
                    btn.disabled = false;
                    btn.innerText = 'Change';
                });
            });
            // Revoke access logic
            Array.from(usersListDiv.getElementsByClassName('revokeAccessBtn')).forEach(btn => {
                btn.addEventListener('click', async function () {
                    const userId = this.getAttribute('data-userid');
                    const projectId = this.getAttribute('data-projectid');
                    btn.disabled = true;
                    btn.innerText = 'Revoking...';
                    try {
                        const res = await fetch('/api/projects/revoke-access', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ projectId, userId })
                        });
                        const data = await res.json();
                        if (res.ok && data.success) {
                            await renderMyProjectSharingSection();
                            await fetchNotificationCounts(); // Refresh counts when project access is revoked
                        } else {
                            btn.innerText = 'Error';
                        }
                    } catch {
                        btn.innerText = 'Error';
                    }
                    btn.disabled = false;
                    btn.innerText = 'Revoke';
                });
            });
        }
    }
}

// --- Shared With Me Section (Improved UI) ---
async function renderSharedWithMeSection() {
    connectionsHubContent.innerHTML = `<h2 class="text-xl font-bold text-blue-700 mb-4">Shared With Me</h2>
        <div id="sharedWithMeList" class="space-y-3"></div>`;
    const listDiv = document.getElementById('sharedWithMeList');
    listDiv.innerHTML = '<div class="text-blue-400 text-center">Loading projects shared with you...</div>';
    try {
        const res = await fetch('/api/projects/shared-with-me');
        if (!res.ok) throw new Error('Failed to fetch shared projects.');
        const projects = await res.json();
        if (!projects.length) {
            listDiv.innerHTML = '<div class="text-gray-400 text-center">No projects have been shared with you yet.</div>';
            return;
        }
        listDiv.innerHTML = projects.map(proj => {
            // Find current user's access type
            let accessType = 'read';
            if (Array.isArray(proj.sharedWith)) {
                const userId = window.currentUserId || null;
                const myShareInfo = proj.sharedWith.find(sw => (sw.user === userId || (sw.user && sw.user._id === userId)));
                if (myShareInfo && myShareInfo.access) accessType = myShareInfo.access;
            }
            const accessText = accessType === 'write' || accessType === 'both' ? 'Read & Write' : 'Read Only';
            const accessColorClass = accessType === 'write' || accessType === 'both' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800';
            const desc = proj.description || proj.desc || 'No description provided.';
            // Truncate description to 2 lines
            const truncatedDesc = desc.length > 80 ? desc.substring(0, 80) + '...' : desc;
            return `
                <div class="bg-white rounded-xl shadow-md p-4 border border-gray-200 hover:border-blue-400 transition-all">
                    <div class="flex items-start justify-between">
                        <div class="flex-1 mr-4">
                            <div class="font-bold text-blue-800 text-lg mb-2">${proj.name}</div>
                            <div class="text-gray-600 text-sm mb-3 leading-relaxed">${truncatedDesc}</div>
                            <span class="inline-block px-2 py-1 rounded-full font-bold text-xs ${accessColorClass}">${accessText}</span>
                        </div>
                        <button class="viewDetailsBtn bg-blue-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-600 transition text-sm whitespace-nowrap" 
                                data-projectid="${proj._id}" 
                                data-name="${proj.name}" 
                                data-desc="${desc}">View Details</button>
                    </div>
                </div>
            `;
        }).join('');
        // Attach View Details button logic
        Array.from(listDiv.getElementsByClassName('viewDetailsBtn')).forEach(btn => {
            btn.addEventListener('click', function () {
                const projectId = btn.getAttribute('data-projectid');
                const projectName = btn.getAttribute('data-name');
                const projectDesc = btn.getAttribute('data-desc');
                showSimpleProjectModal(projectName, projectDesc);
            });
        });
    } catch (err) {
        listDiv.innerHTML = `<div class="text-red-500 text-center">${err.message || 'Failed to load shared projects.'}</div>`;
    }
}

// --- Show Simple Project Modal (No API calls) ---
function showSimpleProjectModal(projectName, projectDesc) {
    let modal = document.getElementById('simpleProjectModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'simpleProjectModal';
        modal.className = 'fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50';
        document.body.appendChild(modal);
    }
    
    modal.innerHTML = `
        <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 w-full max-w-lg relative flex flex-col" style="max-height:90vh;">
            <button id="closeSimpleProjectModalBtn" class="absolute top-3 right-3 text-gray-400 hover:text-blue-500">
                <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
                    <path d="M6 6l12 12M6 18L18 6" stroke="#3B82F6" stroke-width="2" stroke-linecap="round" />
                </svg>
            </button>
            <h2 class="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-4">${projectName}</h2>
            <div class="text-gray-700 dark:text-gray-300 text-base leading-relaxed">${projectDesc}</div>
        </div>
    `;
    
    // Close modal functionality
    document.getElementById('closeSimpleProjectModalBtn').onclick = function () {
        modal.classList.add('hidden');
    };
    
    // Close modal when clicking outside
    modal.onclick = function (e) {
        if (e.target === modal) {
            modal.classList.add('hidden');
        }
    };
    
    modal.classList.remove('hidden');
}

// --- Show Shared Project Details Modal (Ensured all fields are present) ---
async function showSharedProjectDetailsModal(projectId) {
    try {
        const res = await fetch(`/api/projects/${projectId}/shared`);
        if (!res.ok) {
            alert('No access or project not found!');
            return;
        }
        const { project, access, isOwner } = await res.json();
        let modal = document.getElementById('sharedProjectDetailsModal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'sharedProjectDetailsModal';
            modal.className = 'fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50';
            document.body.appendChild(modal);
        }
        modal.innerHTML = `
            <div class="bg-white rounded-2xl shadow-xl p-4 md:p-6 w-full max-w-lg relative flex flex-col max-h-[90vh] overflow-y-auto">
                <button id="closeSharedProjectDetailsModalBtn" class="absolute top-3 right-3 text-gray-400 hover:text-blue-500">
                    <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
                        <path d="M6 6l12 12M6 18L18 6" stroke="#3B82F6" stroke-width="2" stroke-linecap="round" />
                    </svg>
                </button>
                <h2 class="text-xl font-bold text-blue-600 mb-2 flex items-center gap-2">
                    ${project.name}
                </h2>
                <input type="text" id="sharedProjectName" class="w-full border border-blue-100 p-2 rounded-xl bg-blue-50 mb-2 font-bold text-lg" value="${project.name}" ${access === 'read' && !isOwner ? 'readonly' : ''} />
                <textarea id="sharedProjectDesc" class="w-full border border-blue-100 p-2 rounded-xl bg-blue-50 mb-2" rows="2" ${access === 'read' && !isOwner ? 'readonly' : ''}>${project.description || ''}</textarea>
                <div class="mb-2">
                    <label class="text-blue-600 font-semibold mb-1 block">Quick Notes:</label>
                    <textarea id="sharedProjectNotes" rows="2" class="w-full border border-blue-100 p-2 rounded-xl bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-200" ${access === 'read' && !isOwner ? 'readonly' : ''}>${project.notes || ''}</textarea>
                </div>
                <div class="flex flex-col md:flex-row gap-2 mb-2 items-center">
                    <span class="text-blue-600 font-semibold">Progress:</span>
                    <span id="sharedProjectProgressPercent">${project.progress || 0}%</span>
                    <div class="w-full h-3 bg-blue-100 rounded-full overflow-hidden">
                        <div id="sharedProjectProgressBar" class="h-3 bg-blue-500 rounded-full transition-all" style="width:${project.progress || 0}%"></div>
                    </div>
                </div>
                <div class="flex justify-end mt-4">
                    <button id="saveSharedProjectBtn" class="bg-blue-500 text-white px-4 py-2 rounded-xl font-semibold shadow hover:bg-blue-600 transition w-full md:w-auto" ${access === 'read' && !isOwner ? 'disabled' : ''}>Save</button>
                </div>
            </div>
        `;
        document.getElementById('closeSharedProjectDetailsModalBtn').onclick = function () {
            modal.classList.add('hidden');
        };
        // Progress bar update
        document.getElementById('sharedProjectProgressBar').style.width = (project.progress || 0) + '%';
        document.getElementById('sharedProjectProgressPercent').innerText = (project.progress || 0) + '%';
        // Save logic
        const saveBtn = document.getElementById('saveSharedProjectBtn');
        if (access === 'write' || access === 'both' || isOwner) {
            saveBtn.disabled = false;
            saveBtn.onclick = async function () {
                saveBtn.disabled = true;
                saveBtn.innerText = 'Saving...';
                try {
                    const name = document.getElementById('sharedProjectName').value;
                    const description = document.getElementById('sharedProjectDesc').value;
                    const notes = document.getElementById('sharedProjectNotes').value;
                    const res = await fetch(`/api/projects/${project._id}/shared`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ name, description, notes })
                    });
                    if (res.ok) {
                        saveBtn.innerText = 'Saved!';
                        setTimeout(() => { saveBtn.innerText = 'Save'; saveBtn.disabled = false; }, 1200);
                    } else {
                        saveBtn.innerText = 'Error!';
                        setTimeout(() => { saveBtn.innerText = 'Save'; saveBtn.disabled = false; }, 1200);
                    }
                } catch (err) {
                    saveBtn.innerText = 'Error!';
                    setTimeout(() => { saveBtn.innerText = 'Save'; saveBtn.disabled = false; }, 1200);
                }
            };
        } else {
            saveBtn.disabled = true;
        }
        modal.classList.remove('hidden');
    } catch (err) {
        alert('Failed to show shared project details!');
    }
}

// --- Access Requests Section (UI Polish) ---
async function renderAccessRequestsSection() {
    connectionsHubContent.innerHTML = `<h2 class="text-xl font-bold text-blue-700 mb-4">Access Requests</h2>
        <div id="accessRequestsList" class="space-y-2"></div>`;
    const listDiv = document.getElementById('accessRequestsList');
    listDiv.innerHTML = '<div class="text-blue-400 text-center">Loading...</div>';

    // Refresh notification counts when this section is rendered
    await fetchNotificationCounts();
    try {
        const res = await fetch('/api/projects/access-requests');
        const requests = await res.json();
        if (!requests.length) {
            listDiv.innerHTML = '<div class="text-gray-400 text-center">No project access requests.</div>';
            return;
        }
        listDiv.innerHTML = requests.map(req => {
            const project = req.project || {};
            const user = req.requestedBy || {};
            const email = user.emails && user.emails[0] ? user.emails[0].email : '';

            let actionButtons = '';
            if (req.status === 'pending') {
                actionButtons = `
                    <button class="approveAccessBtn bg-green-500 text-white px-3 py-1 rounded-lg font-semibold hover:bg-green-600 transition" data-requestid="${req._id}" data-access="${req.access}">Approve</button>
                    <button class="rejectAccessBtn bg-red-500 text-white px-3 py-1 rounded-lg font-semibold hover:bg-red-600 transition" data-requestid="${req._id}">Reject</button>
                `;
            } else {
                const statusText = req.status.charAt(0).toUpperCase() + req.status.slice(1);
                const statusColor = req.status === 'approved' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
                actionButtons = `<span class="px-3 py-1 rounded-full font-semibold ${statusColor}">${statusText}</span>`;
            }

            return `
            <div class="flex items-center justify-between bg-white border border-gray-200 rounded-xl px-4 py-3">
                <div>
                    <div class="font-semibold text-gray-800">${user.name} <span class="text-gray-500 font-normal">wants to access</span> "${project.name || ''}"</div>
                    <div class="text-xs text-gray-500 mt-1">Requested Access: <span class="font-semibold text-blue-700">${req.access === 'write' || req.access === 'both' ? 'Read & Write' : 'Read-Only'}</span></div>
                </div>
                        <div class="flex gap-2 items-center">
                    ${actionButtons}
                </div>
            </div>`;
        }).join('');

        // Re-attach logic for buttons
        Array.from(listDiv.getElementsByClassName('approveAccessBtn')).forEach(btn => {
            btn.addEventListener('click', async function () {
                btn.disabled = true;
                btn.innerText = 'Approving...';
                try {
                    const res = await fetch('/api/projects/approve-access', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ requestId: btn.getAttribute('data-requestid'), access: btn.getAttribute('data-access') })
                    });
                    if (res.ok) {
                        await renderAccessRequestsSection();
                        await fetchNotificationCounts(); // Refresh counts
                    }
                } catch (err) {
                    btn.innerText = 'Error';
                }
            });
        });
        Array.from(listDiv.getElementsByClassName('rejectAccessBtn')).forEach(btn => {
            btn.addEventListener('click', async function () {
                btn.disabled = true;
                btn.innerText = 'Rejecting...';
                try {
                    const res = await fetch('/api/projects/reject-access', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ requestId: btn.getAttribute('data-requestid') })
                    });
                    if (res.ok) {
                        await renderAccessRequestsSection();
                        await fetchNotificationCounts(); // Refresh counts
                    }
                } catch (err) {
                    btn.innerText = 'Error';
                }
            });
        });
    } catch (err) {
        listDiv.innerHTML = '<div class="text-red-500 text-center">Failed to load access requests.</div>';
    }
}

// --- Update renderHubContent to use new sections ---
async function renderHubContent(tabId) {
    // Update active nav item
    connectionsHubNav.querySelectorAll('.hub-nav-item').forEach(item => {
        item.classList.toggle('active', item.getAttribute('data-tab') === tabId);
    });
    // Render content for the selected tab
    switch (tabId) {
        case 'search':
            await renderUserSearchSection();
            break;
        case 'requests':
            await renderFriendRequestsSection();
            break;
        case 'friends':
            await renderMyFriendsSection();
            break;
        case 'sharing':
            await renderMyProjectSharingSection();
            break;
        case 'shared_with_me':
            await renderSharedWithMeSection();
            break;
        case 'access_requests':
            await renderAccessRequestsSection();
            break;
        default:
            connectionsHubContent.innerHTML = '<h2>Select a section</h2>';
    }
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', initializeConnectionsHub);

document.addEventListener('DOMContentLoaded', function () {
    const backBtn = document.getElementById('backToDashboardBtn');
    if (backBtn) {
        backBtn.addEventListener('click', function () {
            const modal = document.getElementById('connectionsHubModal');
            if (modal) {
                modal.style.transform = 'translateX(100%)';
                setTimeout(() => { modal.classList.add('hidden'); }, 300);
            }
        });
    }
});

// Real-time updates with Socket.io
let socket;
document.addEventListener('DOMContentLoaded', async function () {
    socket = io();
    let currentUserId = null;
    try {
        const res = await fetch('/api/userdata/profile');
        if (res.ok) {
            const data = await res.json();
            currentUserId = data.id;
            window.currentUserId = currentUserId;
        }
    } catch { }
    if (socket && currentUserId) {
        socket.on('project-access-changed', (data) => {
            if (data.userId === currentUserId) {
                if (currentHubTab === 'shared_with_me') {
                    renderSharedWithMeSection();
                }
                fetchNotificationCounts(); // Refresh counts on real-time updates
            }
        });

        // Listen for friend request updates
        socket.on('friend-request-sent', (data) => {
            if (data.toUserId === currentUserId) {
                fetchNotificationCounts(); // Refresh counts when new friend request is received
            }
        });

        // Listen for access request updates
        socket.on('access-request-sent', (data) => {
            if (data.projectOwnerId === currentUserId) {
                fetchNotificationCounts(); // Refresh counts when new access request is received
            }
        });
    }
});

// Add styles for navigation
const hubStyles = `
    #connectionsHubModal .hub-nav-item.active {
        background-color: #e5e7eb;
        color: #1f2937;
        font-weight: 600;
    }
`;
const styleSheet = document.createElement("style");
styleSheet.innerText = hubStyles;
document.head.appendChild(styleSheet);
