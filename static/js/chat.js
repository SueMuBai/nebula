// 聊天模块
function initChat() {
    const messageInput = document.getElementById('messageInput');
    const sendBtn = document.getElementById('sendBtn');
    const closeChatBtn = document.getElementById('closeChatBtn');
    
    // 发送消息
    sendBtn.addEventListener('click', sendMessage);
    messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });
    
    // 关闭聊天窗口
    closeChatBtn.addEventListener('click', () => {
        closeChatWindow();
    });
}

function sendMessage() {
    const messageInput = document.getElementById('messageInput');
    const content = messageInput.value.trim();
    
    if (!content || !currentChatId || !wsConnection) return;
    
    const message = {
        type: 'text',
        to: currentChatId,
        content: content,
        messageType: 0 // 0=private chat
    };
    
    try {
        wsConnection.send(JSON.stringify(message));
        
        // 显示消息（发送者视角）
        displayMessage({
            from: currentUser.id,
            to: currentChatId,
            content: content,
            timestamp: Date.now()
        }, true);
        
        messageInput.value = '';
    } catch (error) {
        showNotification('发送失败', 'error');
    }
}

function displayMessage(message, isSent) {
    const messagesContainer = document.getElementById('chatMessages');
    const messageEl = document.createElement('div');
    messageEl.className = `message ${isSent ? 'sent' : 'received'}`;
    
    const avatarUrl = isSent 
        ? (currentUser.avatar || 'https://via.placeholder.com/32')
        : 'https://via.placeholder.com/32';
    
    messageEl.innerHTML = `
        <img src="${avatarUrl}" alt="头像" class="message-avatar">
        <div class="message-bubble">
            <div class="message-content">${escapeHtml(message.content)}</div>
            <div class="message-time">${formatTime(message.timestamp)}</div>
        </div>
    `;
    
    messagesContainer.appendChild(messageEl);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function openChatWindow(userId, userName) {
    currentChatId = userId;
    
    const chatTitle = document.getElementById('chatTitle');
    const messageInput = document.getElementById('messageInput');
    const sendBtn = document.getElementById('sendBtn');
    const messagesContainer = document.getElementById('chatMessages');
    
    chatTitle.textContent = userName;
    messageInput.disabled = false;
    sendBtn.disabled = false;
    messagesContainer.innerHTML = '';
    
    // 加载聊天历史
    loadChatHistory(userId);
    
    // 标记聊天项为活跃状态
    document.querySelectorAll('.chat-item').forEach(item => {
        item.classList.remove('active');
        if (item.dataset.userId == userId) {
            item.classList.add('active');
        }
    });
}

function closeChatWindow() {
    currentChatId = null;
    
    const chatTitle = document.getElementById('chatTitle');
    const messageInput = document.getElementById('messageInput');
    const sendBtn = document.getElementById('sendBtn');
    const messagesContainer = document.getElementById('chatMessages');
    
    chatTitle.textContent = '选择一个聊天';
    messageInput.disabled = true;
    sendBtn.disabled = true;
    messageInput.value = '';
    messagesContainer.innerHTML = '<div class="empty-chat">请选择一个聊天或好友开始对话</div>';
    
    // 移除活跃状态
    document.querySelectorAll('.chat-item').forEach(item => {
        item.classList.remove('active');
    });
}

async function loadChatHistory(userId, limit = 50, offset = 0) {
    try {
        const response = await apiRequest(`/chat/history?contactId=${userId}&limit=${limit}&offset=${offset}`);
        
        if (response.success) {
            const messagesContainer = document.getElementById('chatMessages');
            messagesContainer.innerHTML = '';
            
            // 消息按时间倒序显示
            response.messages.reverse().forEach(message => {
                const isSent = message.sender == currentUser.id;
                displayMessage(message, isSent);
            });
            
            // 标记消息为已读
            if (response.messages.length > 0) {
                markMessagesAsRead(userId);
            }
        }
    } catch (error) {
        console.error('Load chat history error:', error);
        showNotification('加载聊天记录失败', 'error');
    }
}

async function loadRecentChats() {
    try {
        const response = await apiRequest('/chat/recent');
        
        if (response.success) {
            displayChatList(response.chats);
        }
    } catch (error) {
        console.error('Load recent chats error:', error);
    }
}

function displayChatList(chats) {
    const chatList = document.getElementById('chatList');
    
    if (!chats || chats.length === 0) {
        chatList.innerHTML = '<div class="empty-state">暂无聊天记录</div>';
        return;
    }
    
    chatList.innerHTML = '';
    
    chats.forEach(async (chat) => {
        // 获取联系人信息
        try {
            const userResponse = await apiRequest(`/user/profile`, {
                headers: { 'X-User-ID': chat.contactId }
            });
            
            if (userResponse.success) {
                const user = userResponse.user;
                const chatItem = createChatItem(user, chat);
                chatList.appendChild(chatItem);
            }
        } catch (error) {
            console.error('Error loading contact info:', error);
        }
    });
}

function createChatItem(user, chat) {
    const chatItem = document.createElement('div');
    chatItem.className = 'chat-item';
    chatItem.dataset.userId = user.id;
    
    chatItem.innerHTML = `
        <img src="${user.avatar || 'https://via.placeholder.com/48'}" alt="头像" class="chat-avatar">
        <div class="chat-info">
            <div class="chat-name">${escapeHtml(user.nickname)}</div>
            <div class="chat-last-message">${escapeHtml(chat.lastMessage || '')}</div>
        </div>
        <div class="chat-time">${formatTime(chat.lastMessageTime)}</div>
    `;
    
    chatItem.addEventListener('click', () => {
        openChatWindow(user.id, user.nickname);
    });
    
    return chatItem;
}

function updateChatListItem(userId, lastMessage, timestamp) {
    const existingItem = document.querySelector(`.chat-item[data-user-id="${userId}"]`);
    
    if (existingItem) {
        const lastMessageEl = existingItem.querySelector('.chat-last-message');
        const timeEl = existingItem.querySelector('.chat-time');
        
        if (lastMessageEl) lastMessageEl.textContent = lastMessage;
        if (timeEl) timeEl.textContent = formatTime(timestamp);
        
        // 移动到列表顶部
        const chatList = document.getElementById('chatList');
        chatList.insertBefore(existingItem, chatList.firstChild);
    } else {
        // 重新加载聊天列表
        loadRecentChats();
    }
}

async function markMessagesAsRead(fromUserId) {
    try {
        await apiRequest('/chat/read', {
            method: 'POST',
            body: JSON.stringify({ fromUserId })
        });
    } catch (error) {
        console.error('Mark as read error:', error);
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}