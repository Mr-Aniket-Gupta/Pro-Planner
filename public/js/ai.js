// Initialize Web Speech API for voice input
function initializeAIBot() {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';

        recognition.onresult = function (event) {
            const transcript = event.results[0][0].transcript;
            const input = document.getElementById('aiMessageInput');
            if (input) input.value = transcript;
            stopVoiceRecording();
        };

        recognition.onerror = function (event) {
            console.error('Speech recognition error:', event.error);
            stopVoiceRecording();
            showAlert({ icon: 'error', title: 'Voice Error', text: 'Voice recognition failed: ' + event.error });
        };

        recognition.onend = function () {
            stopVoiceRecording();
        };
    }
}

// Toggles voice input on/off
function toggleVoiceInput() {
    if (typeof isRecording === 'undefined') {
        console.error('isRecording variable not initialized');
        return;
    }
    isRecording ? stopVoiceRecording() : startVoiceRecording();
}

// Starts recording user voice input
function startVoiceRecording() {
    if (!recognition) {
        console.error('Recognition not available');
        showAlert({ icon: 'error', title: 'Not Supported', text: 'Voice recognition is not supported in your browser.' });
        return;
    }

    try {
        recognition.start();
        isRecording = true;

        // Update UI to show recording status
        const micIcon = document.getElementById('micIcon');
        const stopIcon = document.getElementById('stopIcon');
        const voiceStatus = document.getElementById('voiceStatus');
        const voiceStatusText = document.getElementById('voiceStatusText');
        const voiceBtn = document.getElementById('voiceBtn');

        if (micIcon) micIcon.style.display = 'none';
        if (stopIcon) stopIcon.style.display = 'block';
        if (voiceStatus) voiceStatus.classList.remove('hidden');
        if (voiceStatusText) voiceStatusText.textContent = 'Listening... Speak now!';
        if (voiceBtn) voiceBtn.classList.add('text-red-500', 'recording');
    } catch (error) {
        console.error('Error starting voice recognition:', error);
        showAlert({ icon: 'error', title: 'Voice Error', text: 'Could not start voice recognition: ' + error.message });
    }
}

// Stops the voice recording and resets UI
function stopVoiceRecording() {
    if (recognition && isRecording) recognition.stop();
    isRecording = false;

    // Reset UI to default
    const micIcon = document.getElementById('micIcon');
    const stopIcon = document.getElementById('stopIcon');
    const voiceStatus = document.getElementById('voiceStatus');
    const voiceBtn = document.getElementById('voiceBtn');

    if (micIcon) micIcon.style.display = 'block';
    if (stopIcon) stopIcon.style.display = 'none';
    if (voiceStatus) voiceStatus.classList.add('hidden');
    if (voiceBtn) voiceBtn.classList.remove('text-red-500', 'recording');
}

// Opens the AI chat modal
function openAiBotModal() {
    const modal = document.getElementById('aiBotModal');
    if (modal) {
        modal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    } else {
        alert('AI Bot modal not found. Please refresh the page.');
    }
}
window.openAiBotModal = openAiBotModal;

// Sends user's message to backend AI API
async function sendAiMessage() {
    window.showLoader && window.showLoader();

    try {
        const messageInput = document.getElementById('aiMessageInput');
        const message = messageInput.value.trim();

        if (!message) {
            showAlert({ icon: 'warning', title: 'Empty Message', text: 'Please enter a message to send.' });
            return;
        }

        addMessageToChat('user', message);
        messageInput.value = '';
        const typingId = addTypingIndicator();

        let projectContext = '';
        if (selectedProjectIndex !== null && projects[selectedProjectIndex]) {
            const project = projects[selectedProjectIndex];
            projectContext = `Current Project: ${project.name} - ${project.desc}`;
        }

        const response = await fetch('/api/userdata/ai/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message, projectContext })
        });

        const data = await response.json();
        removeTypingIndicator(typingId);

        if (data.success) {
            addMessageToChat('ai', data.response);
        } else {
            addMessageToChat('ai', 'Sorry, I encountered an error. Please try again later.');
        }
    } catch (err) {
        showAlert && showAlert({ icon: 'error', title: 'Error', text: err.message || 'AI response failed!' });
        console.error(err);
    } finally {
        window.hideLoader && window.hideLoader();
    }
}
window.sendAiMessage = sendAiMessage;

// Appends user/AI message to chat UI
function addMessageToChat(sender, message) {
    const chatArea = document.getElementById('aiChatArea');
    const messageDiv = document.createElement('div');
    messageDiv.className = 'flex items-start gap-3';

    if (sender === 'user') {
        messageDiv.innerHTML = `
            <div class="flex-1"></div>
            <div class="bg-blue-100 rounded-xl p-3 max-w-xs">
                <p class="text-sm text-blue-700">${message}</p>
            </div>
            <div class="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="#fff" stroke-width="2"/>
                    <circle cx="12" cy="7" r="4" stroke="#fff" stroke-width="2"/>
                </svg>
            </div>
        `;
    } else {
        const formattedMessage = formatAIResponse(message);
        messageDiv.innerHTML = `
            <div class="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" fill="#9333ea"/>
                </svg>
            </div>
            <div class="bg-white border border-purple-200 rounded-xl p-4 max-w-md shadow-sm">
                <div class="prose prose-sm max-w-none">
                    ${formattedMessage}
                </div>
            </div>
        `;
    }

    chatArea.appendChild(messageDiv);
    chatArea.scrollTop = chatArea.scrollHeight;
}

// Formats AI message content with styling for UI
function formatAIResponse(message) {
    let formatted = message;
    formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-gray-900">$1</strong>');
    formatted = formatted.replace(/\*(.*?)\*/g, '<em class="italic text-gray-700">$1</em>');
    formatted = formatted.replace(/^\* (.*$)/gm, '<li class="text-gray-700 mb-1">• $1</li>');
    formatted = formatted.replace(/^\d+\. (.*$)/gm, '<li class="text-gray-700 mb-1">$&</li>');
    formatted = formatted.replace(/(<li.*<\/li>)/gs, '<ul class="list-none space-y-1 mb-3">$1</ul>');
    formatted = formatted.replace(/\n\n/g, '</p><p class="mb-3">');
    formatted = formatted.replace(/\n/g, '<br>');
    formatted = `<p class="text-gray-800 leading-relaxed mb-3">${formatted}</p>`;
    formatted = formatted.replace(/(<strong.*?English.*?<\/strong>)/g, '<div class="bg-blue-50 border-l-4 border-blue-400 p-3 mb-3 rounded-r">$1');
    formatted = formatted.replace(/(<strong.*?Hindi.*?<\/strong>)/g, '</div><div class="bg-green-50 border-l-4 border-green-400 p-3 mb-3 rounded-r">$1');
    if (formatted.includes('bg-green-50')) formatted += '</div>';
    formatted = formatted.replace(/`([^`]+)`/g, '<code class="bg-gray-100 px-1 py-0.5 rounded text-sm font-mono">$1</code>');
    formatted = formatted.replace(/^"([^"]+)"$/gm, '<blockquote class="border-l-4 border-purple-300 pl-3 italic text-gray-600">"$1"</blockquote>');
    return formatted;
}

// Displays typing indicator while waiting for AI response
function addTypingIndicator() {
    const chatArea = document.getElementById('aiChatArea');
    const typingDiv = document.createElement('div');
    const typingId = 'typing-' + Date.now();

    typingDiv.id = typingId;
    typingDiv.className = 'flex items-start gap-3';
    typingDiv.innerHTML = `
        <div class="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" fill="#9333ea"/>
            </svg>
        </div>
        <div class="bg-purple-50 rounded-xl p-3">
            <div class="flex space-x-1">
                <div class="w-2 h-2 bg-purple-400 rounded-full animate-bounce"></div>
                <div class="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style="animation-delay: 0.1s"></div>
                <div class="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style="animation-delay: 0.2s"></div>
            </div>
        </div>
    `;

    chatArea.appendChild(typingDiv);
    chatArea.scrollTop = chatArea.scrollHeight;
    return typingId;
}

// Removes typing indicator from chat
function removeTypingIndicator(typingId) {
    const typingDiv = document.getElementById(typingId);
    if (typingDiv) typingDiv.remove();
}

// Initialize event listener for settings button
function initializeSettingsButton() {
    const settingsBtn = document.getElementById('settingsBtn');
    if (settingsBtn && !settingsBtn.hasAttribute('data-listener-added')) {
        settingsBtn.addEventListener('click', openSettingsModal);
        settingsBtn.setAttribute('data-listener-added', 'true');
    }
}

// Setup event listeners and bot initialization after DOM is ready
document.addEventListener('DOMContentLoaded', function () {
    initializeAIBot();
    initializeSettingsButton();

    const aiBotBtn = document.getElementById('aiBotBtn');
    if (aiBotBtn && !aiBotBtn.hasAttribute('data-listener-added')) {
        aiBotBtn.addEventListener('click', openAiBotModal);
        aiBotBtn.setAttribute('data-listener-added', 'true');
    }

    const settingsBtn = document.getElementById('settingsBtn');
    if (settingsBtn && typeof openSettingsModal === 'function') settingsBtn.onclick = openSettingsModal;

    const voiceBtn = document.getElementById('voiceBtn');
    if (voiceBtn && !voiceBtn.hasAttribute('data-listener-added')) {
        voiceBtn.addEventListener('click', function (e) {
            e.preventDefault();
            e.stopPropagation();
            if (typeof toggleVoiceInput === 'function') toggleVoiceInput();
        });
        voiceBtn.setAttribute('data-listener-added', 'true');
    }

    const messageInput = document.getElementById('aiMessageInput');
    if (messageInput) {
        messageInput.addEventListener('keypress', function (e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendAiMessage();
            }
        });
    }
});
