// Initialize Web Speech API for voice input (namespaced to avoid globals clash)
window._aiRecognition = (typeof window._aiRecognition !== 'undefined') ? window._aiRecognition : null;
window._aiIsRecording = (typeof window._aiIsRecording !== 'undefined') ? window._aiIsRecording : false;
function initializeAIBot() {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        window._aiRecognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
        window._aiRecognition.continuous = false;
        window._aiRecognition.interimResults = false;
        // Support both Hindi and English dynamically
        window._aiRecognition.lang = (window._aiSpeechLang || 'en-US');
        window._aiRecognition.maxAlternatives = 1;

        window._aiRecognition.onresult = function (event) {
            const transcript = event.results[0][0].transcript;
            const input = document.getElementById('aiMessageInput');
            if (input) input.value = transcript;
            stopVoiceRecording();
        };

        window._aiRecognition.onerror = function (event) {
            console.error('Speech recognition error:', event.error);
            // Handle specific errors more gracefully
            if (event.error === 'no-speech') {
                showAlert && showAlert({ icon: 'warning', title: 'No Speech Detected', text: "We couldn't hear you. Please try speaking again." });
                // Optional auto-restart
                if (window._autoRestartNoSpeech) {
                    try {
                        startVoiceRecording();
                        return;
                    } catch (_) { }
                }
            } else if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
                showAlert && showAlert({ icon: 'error', title: 'Microphone Blocked', text: 'Please allow microphone access in your browser settings and try again.' });
            } else {
                showAlert && showAlert({ icon: 'error', title: 'Voice Error', text: 'Voice recognition failed: ' + event.error });
            }
            stopVoiceRecording();
        };

        window._aiRecognition.onend = function () {
            stopVoiceRecording();
        };
    }
}

// Toggles voice input on/off
function toggleVoiceInput() {
    if (typeof window._aiIsRecording === 'undefined') {
        console.error('isRecording variable not initialized');
        return;
    }
    window._aiIsRecording ? stopVoiceRecording() : startVoiceRecording();
}

// Starts recording user voice input
function startVoiceRecording() {
    if (!window._aiRecognition) {
        console.error('Recognition not available');
        showAlert({ icon: 'error', title: 'Not Supported', text: 'Voice recognition is not supported in your browser.' });
        return;
    }

    try {
        // Check mic permissions
        if (navigator.permissions && navigator.permissions.query) {
            navigator.permissions.query({ name: 'microphone' }).then(result => {
                if (result.state === 'denied') {
                    showAlert && showAlert({ icon: 'error', title: 'Microphone Blocked', text: 'Please allow microphone access in your browser settings.' });
                }
            }).catch(() => { });
        }

        // Optional inactivity timeout (e.g., 6 seconds)
        if (window._voiceInactivityTimer) {
            clearTimeout(window._voiceInactivityTimer);
        }

        // Determine language based on user selection or content
        try {
            const langSelect = document.getElementById('aiLanguageSelect');
            const preferred = langSelect ? langSelect.value : null;
            if (preferred === 'hi') window._aiRecognition.lang = 'hi-IN';
            else if (preferred === 'en') window._aiRecognition.lang = 'en-US';
            else window._aiRecognition.lang = (window._aiSpeechLang || 'en-US');
        } catch (_) { }

        window._aiRecognition.start();
        window._aiIsRecording = true;

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

        // Show a subtle loader indicator in status
        if (voiceStatusText) {
            voiceStatusText.innerHTML = 'Listening<span class="inline-flex ml-2"><span class="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce"></span><span class="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce ml-1" style="animation-delay:0.1s"></span><span class="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce ml-1" style="animation-delay:0.2s"></span></span>';
        }

        // Auto-stop if no speech within X seconds
        window._voiceInactivityTimer = setTimeout(() => {
            if (window._aiIsRecording) {
                window._aiRecognition.stop();
                showAlert && showAlert({ icon: 'warning', title: 'No Speech Detected', text: "We couldn't hear you. Please try speaking again." });
            }
        }, window._voiceMaxWaitMs || 6000);
    } catch (error) {
        console.error('Error starting voice recognition:', error);
        showAlert({ icon: 'error', title: 'Voice Error', text: 'Could not start voice recognition: ' + error.message });
    }
}

// Stops the voice recording and resets UI
function stopVoiceRecording() {
    if (window._aiRecognition && window._aiIsRecording) window._aiRecognition.stop();
    window._aiIsRecording = false;
    if (window._voiceInactivityTimer) {
        clearTimeout(window._voiceInactivityTimer);
        window._voiceInactivityTimer = null;
    }

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

// Close AI Bot modal
function closeAiBotModal() {
    const modal = document.getElementById('aiBotModal');
    if (modal) {
        modal.classList.add('hidden');
        document.body.style.overflow = '';
    }
}
window.closeAiBotModal = closeAiBotModal;

// Global ai typing controller for interruptible animation
let aiTypewriterController = { abort: false };

function typewriterAppend(containerEl, fullHtml, onDone) {
    // Interrupt if requested
    aiTypewriterController.abort = false;
    const localController = { aborted: false };
    aiTypewriterController.current = localController;

    // Create a shadow element to parse HTML safely
    const parser = new DOMParser();
    const doc = parser.parseFromString(`<div>${fullHtml}</div>`, 'text/html');
    const nodes = Array.from(doc.body.firstChild.childNodes);

    function appendNode(node) {
        if (localController.aborted) return;
        if (node.nodeType === Node.TEXT_NODE) {
            const text = node.textContent || '';
            const span = document.createElement('span');
            containerEl.appendChild(span);
            let i = 0;
            const step = () => {
                if (localController.aborted) return;
                if (i < text.length) {
                    span.textContent += text.charAt(i++);
                    requestAnimationFrame(step);
                } else {
                    iterate();
                }
            };
            step();
        } else if (node.nodeType === Node.ELEMENT_NODE) {
            const el = document.createElement(node.tagName.toLowerCase());
            // copy attributes
            for (const attr of node.attributes) el.setAttribute(attr.name, attr.value);
            containerEl.appendChild(el);
            // recursively animate children
            const childNodes = Array.from(node.childNodes);
            let idx = 0;
            const stepChild = () => {
                if (localController.aborted) return;
                if (idx < childNodes.length) {
                    appendNodeInto(el, childNodes[idx++], stepChild);
                } else {
                    iterate();
                }
            };
            stepChild();
        } else {
            iterate();
        }
    }

    function appendNodeInto(parentEl, node, cb) {
        if (localController.aborted) return;
        if (node.nodeType === Node.TEXT_NODE) {
            const text = node.textContent || '';
            const span = document.createElement('span');
            parentEl.appendChild(span);
            let i = 0;
            const step = () => {
                if (localController.aborted) return;
                if (i < text.length) {
                    span.textContent += text.charAt(i++);
                    requestAnimationFrame(step);
                } else {
                    cb && cb();
                }
            };
            step();
        } else if (node.nodeType === Node.ELEMENT_NODE) {
            const el = document.createElement(node.tagName.toLowerCase());
            for (const attr of node.attributes) el.setAttribute(attr.name, attr.value);
            parentEl.appendChild(el);
            const childNodes = Array.from(node.childNodes);
            let idx = 0;
            const stepChild = () => {
                if (localController.aborted) return;
                if (idx < childNodes.length) {
                    appendNodeInto(el, childNodes[idx++], stepChild);
                } else {
                    cb && cb();
                }
            };
            stepChild();
        } else {
            cb && cb();
        }
    }

    let nIndex = 0;
    function iterate() {
        if (localController.aborted) return;
        if (nIndex < nodes.length) {
            appendNode(nodes[nIndex++]);
        } else {
            onDone && onDone();
        }
    }

    iterate();
}

function skipTypewriter() {
    if (aiTypewriterController && aiTypewriterController.current) {
        aiTypewriterController.current.aborted = true;
    }
}

// Sends user's message to backend AI API (with language and loading state)
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
        let typingId = addTypingIndicator();

        const sendBtn = document.getElementById('sendAiMessageBtn');
        const prevBtnHtml = sendBtn ? sendBtn.innerHTML : '';
        if (sendBtn) {
            sendBtn.disabled = true;
            sendBtn.innerHTML = '<span class="inline-flex items-center gap-2"><svg class="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path></svg> Sending...</span>';
        }

        const langSelect = document.getElementById('aiLanguageSelect');
        const language = langSelect ? langSelect.value : ((/^[\u0900-\u097F]/.test(message)) ? 'hi' : 'en');

        let projectContext = '';
        if (selectedProjectIndex !== null && projects[selectedProjectIndex]) {
            const project = projects[selectedProjectIndex];
            projectContext = `Current Project: ${project.name} - ${project.desc}`;
        }

        const response = await fetch('/api/userdata/ai/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message, projectContext, language })
        });

        const data = await response.json();
        removeTypingIndicator(typingId);

        if (data.success) {
            addMessageToChat('ai', data.response, { animate: true });
        } else {
            addMessageToChat('ai', 'Sorry, I encountered an error. Please try again later.');
        }
    } catch (err) {
        try { if (typeof removeTypingIndicator === 'function' && typeof typingId !== 'undefined') removeTypingIndicator(typingId); } catch (_) { }
        showAlert && showAlert({ icon: 'error', title: 'Error', text: err.message || 'AI response failed!' });
        console.error(err);
        // Also append a graceful AI error message into chat
        addMessageToChat('ai', 'Sorry, I could not process that request. Please try again in a moment.');
    } finally {
        window.hideLoader && window.hideLoader();
        const sendBtn = document.getElementById('sendAiMessageBtn');
        if (sendBtn) {
            sendBtn.disabled = false;
            sendBtn.innerHTML = 'Send';
        }
    }
}
window.sendAiMessage = sendAiMessage;

// Appends user/AI message to chat UI
function addMessageToChat(sender, message, options = {}) {
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
                <div class="prose prose-sm max-w-none ai-message-content"></div>
            </div>
        `;
    }

    chatArea.appendChild(messageDiv);
    chatArea.scrollTop = chatArea.scrollHeight;

    // Attach typewriter animation if AI message and requested
    if (sender !== 'user') {
        const contentEl = messageDiv.querySelector('.ai-message-content');
        if (contentEl) {
            const formattedMessage = formatAIResponse(message);
            if (options.animate) {
                let skipBound = false;
                const bindSkip = () => {
                    if (skipBound) return;
                    skipBound = true;
                    const skip = () => {
                        skipTypewriter();
                        contentEl.innerHTML = formattedMessage;
                        document.removeEventListener('keydown', skip);
                        document.removeEventListener('click', skip);
                    };
                    document.addEventListener('keydown', skip, { once: true });
                    document.addEventListener('click', skip, { once: true });
                };
                bindSkip();
                typewriterAppend(contentEl, formattedMessage, () => {
                    document.removeEventListener('keydown', skipTypewriter);
                    document.removeEventListener('click', skipTypewriter);
                });
            } else {
                contentEl.innerHTML = formattedMessage;
            }
        }
    }
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

    // Close button inside AI modal
    const closeAiBtn = document.getElementById('closeAiBotModalBtn');
    if (closeAiBtn && !closeAiBtn.hasAttribute('data-listener-added')) {
        closeAiBtn.addEventListener('click', closeAiBotModal);
        closeAiBtn.setAttribute('data-listener-added', 'true');
    }

    // Optional: click outside to close
    const aiModal = document.getElementById('aiBotModal');
    if (aiModal && !aiModal.hasAttribute('data-listener-added')) {
        aiModal.addEventListener('click', function (e) {
            if (e.target === aiModal) closeAiBotModal();
        });
        aiModal.setAttribute('data-listener-added', 'true');
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
                skipTypewriter();
                sendAiMessage();
            }
        });
        messageInput.addEventListener('input', function () {
            // If the user starts typing, skip any running animation
            skipTypewriter();
        });
    }

    const sendBtn = document.getElementById('sendAiMessageBtn');
    if (sendBtn && !sendBtn.hasAttribute('data-listener-added')) {
        sendBtn.addEventListener('click', function () { skipTypewriter(); });
        sendBtn.setAttribute('data-listener-added', 'true');
    }
});
