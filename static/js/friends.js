// 好友模块
function initFriends() {
    const addFriendBtn = document.getElementById('addFriendBtn');
    
    addFriendBtn.addEventListener('click', showAddFriendModal);
}

function showAddFriendModal() {
    const modalContent = `
        <h3>添加好友</h3>
        <form id="addFriendForm">
            <div class="input-group">
                <label for="searchTerm">手机号或用户ID</label>
                <input type="text" id="searchTerm" name="searchTerm" required>
            </div>
            <div class="form-actions" style="display: flex; gap: 12px; margin-top: 20px;">
                <button type="submit" class="btn-primary">搜索</button>
                <button type="button" class="btn-secondary" onclick="hideModal()">取消</button>
            </div>
        </form>
        <div id="searchResult" style="margin-top: 20px;"></div>
    `;
    
    showModal(modalContent);
    
    // 绑定搜索表单事件
    const addFriendForm = document.getElementById('addFriendForm');
    addFriendForm.addEventListener('submit', handleSearchUser);
}

async function handleSearchUser(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const searchTerm = formData.get('searchTerm').trim();
    
    if (!searchTerm) {
        showNotification('请输入搜索内容', 'error');
        return;
    }
    
    try {
        const response = await apiRequest('/friends/search', {
            method: 'POST',
            body: JSON.stringify({ searchTerm })
        });
        
        const resultDiv = document.getElementById('searchResult');
        
        if (response.success && response.user) {
            const user = response.user;
            resultDiv.innerHTML = `
                <div class="search-result">
                    <h4>搜索结果</h4>
                    <div class="friend-item">
                        <img src="${user.avatar || 'https://via.placeholder.com/40'}" alt="头像" class="friend-avatar">
                        <div class="friend-info">
                            <div class="friend-name">${escapeHtml(user.nickname)}</div>
                            <div class="friend-status">ID: ${user.id}</div>
                        </div>
                        <div class="friend-actions">
                            <button class="btn-small btn-chat" onclick="sendFriendRequest(${user.id})">添加好友</button>
                        </div>
                    </div>
                </div>
            `;
        } else {
            resultDiv.innerHTML = `
                <div class="search-result">
                    <p style="color: #6c757d; text-align: center; padding: 20px;">
                        ${response.message || '未找到用户'}
                    </p>
                </div>
            `;
        }
    } catch (error) {
        showNotification('搜索失败: ' + error.message, 'error');
    }
}

async function sendFriendRequest(userId) {
    try {
        const response = await apiRequest('/friends/request', {
            method: 'POST',
            body: JSON.stringify({ to: userId })
        });
        
        if (response.success) {
            showNotification('好友请求已发送', 'success');
            hideModal();
        } else {
            showNotification(response.message, 'error');
        }
    } catch (error) {
        showNotification('发送好友请求失败: ' + error.message, 'error');
    }
}

async function loadFriends() {
    try {
        // 加载好友请求
        const requestsResponse = await apiRequest('/friends/requests');
        if (requestsResponse.success) {
            displayFriendRequests(requestsResponse.requests);
        }
        
        // 加载好友列表
        const friendsResponse = await apiRequest('/friends/list');
        if (friendsResponse.success) {
            displayFriendsList(friendsResponse.friends);
        }
    } catch (error) {
        console.error('Load friends error:', error);
        showNotification('加载好友信息失败', 'error');
    }
}

function displayFriendRequests(requests) {
    const requestsList = document.getElementById('requestsList');
    
    if (!requests || requests.length === 0) {
        requestsList.innerHTML = '<div class="empty-state">暂无好友请求</div>';
        return;
    }
    
    requestsList.innerHTML = '';
    
    requests.forEach(request => {
        const requestItem = document.createElement('div');
        requestItem.className = 'friend-item';
        
        requestItem.innerHTML = `
            <img src="${request.avatar || 'https://via.placeholder.com/40'}" alt="头像" class="friend-avatar">
            <div class="friend-info">
                <div class="friend-name">${escapeHtml(request.nickname)}</div>
                <div class="friend-status">请求时间: ${formatTime(request.createdAt)}</div>
            </div>
            <div class="friend-actions">
                <button class="btn-small btn-accept" onclick="handleFriendRequest(${request.fromUserId}, 'accept')">接受</button>
                <button class="btn-small btn-reject" onclick="handleFriendRequest(${request.fromUserId}, 'reject')">拒绝</button>
            </div>
        `;
        
        requestsList.appendChild(requestItem);
    });
}

function displayFriendsList(friends) {
    const friendsListContent = document.getElementById('friendsListContent');
    
    if (!friends || friends.length === 0) {
        friendsListContent.innerHTML = '<div class="empty-state">暂无好友</div>';
        return;
    }
    
    friendsListContent.innerHTML = '';
    
    friends.forEach(friend => {
        const friendItem = document.createElement('div');
        friendItem.className = 'friend-item';
        
        const statusClass = friend.status === 1 ? 'online' : '';
        const statusText = friend.status === 1 ? '在线' : '离线';
        
        friendItem.innerHTML = `
            <img src="${friend.avatar || 'https://via.placeholder.com/40'}" alt="头像" class="friend-avatar">
            <div class="friend-info">
                <div class="friend-name">${escapeHtml(friend.nickname)}</div>
                <div class="friend-status ${statusClass}">${statusText}</div>
            </div>
            <div class="friend-actions">
                <button class="btn-small btn-chat" onclick="startChatWithFriend(${friend.userId}, '${escapeHtml(friend.nickname)}')">聊天</button>
            </div>
        `;
        
        friendsListContent.appendChild(friendItem);
    });
}

async function handleFriendRequest(fromUserId, action) {
    try {
        const response = await apiRequest('/friends/approve', {
            method: 'POST',
            body: JSON.stringify({ fromUserId, action })
        });
        
        if (response.success) {
            showNotification(response.message, 'success');
            loadFriends(); // 重新加载好友列表
        } else {
            showNotification(response.message, 'error');
        }
    } catch (error) {
        showNotification('处理好友请求失败: ' + error.message, 'error');
    }
}

function startChatWithFriend(userId, nickname) {
    // 切换到聊天标签
    document.querySelector('.nav-item[data-tab="chats"]').click();
    
    // 打开聊天窗口
    setTimeout(() => {
        openChatWindow(userId, nickname);
    }, 100);
}