// 群聊模块
function initGroups() {
    const createGroupBtn = document.getElementById('createGroupBtn');
    
    createGroupBtn.addEventListener('click', showCreateGroupModal);
}

function showCreateGroupModal() {
    const modalContent = `
        <h3>创建群聊</h3>
        <form id="createGroupForm">
            <div class="input-group">
                <label for="groupName">群聊名称</label>
                <input type="text" id="groupName" name="groupName" required>
            </div>
            <div class="input-group">
                <label>选择成员</label>
                <div id="friendsSelector" style="max-height: 200px; overflow-y: auto; border: 1px solid #ddd; border-radius: 4px; padding: 8px;">
                    <div style="text-align: center; color: #6c757d; padding: 20px;">加载中...</div>
                </div>
            </div>
            <div class="form-actions" style="display: flex; gap: 12px; margin-top: 20px;">
                <button type="submit" class="btn-primary">创建群聊</button>
                <button type="button" class="btn-secondary" onclick="hideModal()">取消</button>
            </div>
        </form>
    `;
    
    showModal(modalContent);
    loadFriendsForGroup();
    
    // 绑定创建群聊表单事件
    const createGroupForm = document.getElementById('createGroupForm');
    createGroupForm.addEventListener('submit', handleCreateGroup);
}

async function loadFriendsForGroup() {
    try {
        const response = await apiRequest('/friends/list');
        
        if (response.success && response.friends) {
            displayFriendsSelector(response.friends);
        } else {
            document.getElementById('friendsSelector').innerHTML = 
                '<div style="text-align: center; color: #6c757d; padding: 20px;">暂无好友</div>';
        }
    } catch (error) {
        document.getElementById('friendsSelector').innerHTML = 
            '<div style="text-align: center; color: #dc3545; padding: 20px;">加载好友列表失败</div>';
    }
}

function displayFriendsSelector(friends) {
    const selector = document.getElementById('friendsSelector');
    
    if (!friends || friends.length === 0) {
        selector.innerHTML = '<div style="text-align: center; color: #6c757d; padding: 20px;">暂无好友可选择</div>';
        return;
    }
    
    selector.innerHTML = '';
    
    friends.forEach(friend => {
        const friendOption = document.createElement('div');
        friendOption.style.cssText = `
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 8px;
            border-bottom: 1px solid #f0f0f0;
            cursor: pointer;
        `;
        
        friendOption.innerHTML = `
            <input type="checkbox" id="friend_${friend.userId}" value="${friend.userId}" name="selectedFriends">
            <img src="${friend.avatar || 'https://via.placeholder.com/32'}" alt="头像" style="width: 32px; height: 32px; border-radius: 50%;">
            <label for="friend_${friend.userId}" style="flex: 1; cursor: pointer;">${escapeHtml(friend.nickname)}</label>
        `;
        
        selector.appendChild(friendOption);
    });
}

async function handleCreateGroup(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const groupName = formData.get('groupName').trim();
    const selectedFriends = formData.getAll('selectedFriends');
    
    if (!groupName) {
        showNotification('请输入群聊名称', 'error');
        return;
    }
    
    if (selectedFriends.length === 0) {
        showNotification('请至少选择一个好友', 'error');
        return;
    }
    
    try {
        const members = selectedFriends.map(id => parseInt(id));
        
        const response = await apiRequest('/groups/create', {
            method: 'POST',
            body: JSON.stringify({
                name: groupName,
                members: members
            })
        });
        
        if (response.success) {
            showNotification('群聊创建成功', 'success');
            hideModal();
            loadGroups(); // 重新加载群聊列表
        } else {
            showNotification(response.message, 'error');
        }
    } catch (error) {
        showNotification('创建群聊失败: ' + error.message, 'error');
    }
}

async function loadGroups() {
    try {
        const response = await apiRequest('/groups/my-groups');
        
        if (response.success) {
            displayGroupsList(response.groups);
        }
    } catch (error) {
        console.error('Load groups error:', error);
        showNotification('加载群聊列表失败', 'error');
    }
}

function displayGroupsList(groups) {
    const groupsList = document.getElementById('groupsList');
    
    if (!groups || groups.length === 0) {
        groupsList.innerHTML = '<div class="empty-state">暂无群聊</div>';
        return;
    }
    
    groupsList.innerHTML = '';
    
    groups.forEach(group => {
        const groupItem = document.createElement('div');
        groupItem.className = 'group-item';
        
        const roleText = group.role === 1 ? '群主' : '成员';
        const roleClass = group.role === 1 ? 'group-owner' : 'group-member';
        
        groupItem.innerHTML = `
            <div class="group-avatar" style="width: 48px; height: 48px; border-radius: 8px; background: #007bff; color: white; display: flex; align-items: center; justify-content: center; font-size: 18px; font-weight: bold;">
                ${group.name.charAt(0)}
            </div>
            <div class="friend-info">
                <div class="friend-name">${escapeHtml(group.name)}</div>
                <div class="friend-status">${group.memberCount}人 · ${roleText}</div>
            </div>
            <div class="friend-actions">
                <button class="btn-small btn-chat" onclick="openGroupChat(${group.id}, '${escapeHtml(group.name)}')">进入群聊</button>
                <button class="btn-small btn-secondary" onclick="showGroupDetails(${group.id})">详情</button>
            </div>
        `;
        
        groupsList.appendChild(groupItem);
    });
}

function openGroupChat(groupId, groupName) {
    // 切换到聊天标签
    document.querySelector('.nav-item[data-tab="chats"]').click();
    
    // 打开群聊窗口
    setTimeout(() => {
        openChatWindow(groupId, groupName + ' (群聊)');
    }, 100);
}

async function showGroupDetails(groupId) {
    try {
        const response = await apiRequest(`/groups/${groupId}/members`);
        
        if (response.success) {
            displayGroupDetailsModal(groupId, response.members);
        } else {
            showNotification(response.message, 'error');
        }
    } catch (error) {
        showNotification('获取群组详情失败: ' + error.message, 'error');
    }
}

function displayGroupDetailsModal(groupId, members) {
    const isOwner = members.some(member => member.id == currentUser.id && member.role === 1);
    
    const membersHtml = members.map(member => {
        const roleText = member.role === 1 ? '群主' : member.role === 2 ? '管理员' : '成员';
        const statusText = member.status === 1 ? '在线' : '离线';
        const statusClass = member.status === 1 ? 'online' : '';
        
        return `
            <div class="friend-item" style="margin-bottom: 8px;">
                <img src="${member.avatar || 'https://via.placeholder.com/32'}" alt="头像" style="width: 32px; height: 32px; border-radius: 50%;">
                <div class="friend-info">
                    <div class="friend-name">${escapeHtml(member.nickname)} ${member.role === 1 ? '👑' : ''}</div>
                    <div class="friend-status ${statusClass}">${roleText} · ${statusText}</div>
                </div>
            </div>
        `;
    }).join('');
    
    const modalContent = `
        <h3>群组详情</h3>
        <div style="margin: 20px 0;">
            <h4>群成员 (${members.length}人)</h4>
            <div style="max-height: 300px; overflow-y: auto; margin-top: 12px;">
                ${membersHtml}
            </div>
        </div>
        <div class="form-actions" style="display: flex; gap: 12px; margin-top: 20px;">
            ${isOwner ? `
                <button class="btn-secondary" onclick="inviteToGroup(${groupId})">邀请成员</button>
                <button class="btn-small" style="background: #dc3545; color: white;" onclick="dissolveGroup(${groupId})">解散群组</button>
            ` : `
                <button class="btn-secondary" onclick="leaveGroup(${groupId})">退出群组</button>
            `}
            <button class="btn-secondary" onclick="hideModal()">关闭</button>
        </div>
    `;
    
    showModal(modalContent);
}

async function leaveGroup(groupId) {
    if (!confirm('确定要退出这个群组吗？')) return;
    
    try {
        const response = await apiRequest(`/groups/${groupId}/leave`, {
            method: 'POST'
        });
        
        if (response.success) {
            showNotification('已退出群组', 'success');
            hideModal();
            loadGroups();
        } else {
            showNotification(response.message, 'error');
        }
    } catch (error) {
        showNotification('退出群组失败: ' + error.message, 'error');
    }
}

async function dissolveGroup(groupId) {
    if (!confirm('确定要解散这个群组吗？此操作不可撤销！')) return;
    
    try {
        const response = await apiRequest(`/groups/${groupId}`, {
            method: 'DELETE'
        });
        
        if (response.success) {
            showNotification('群组已解散', 'success');
            hideModal();
            loadGroups();
        } else {
            showNotification(response.message, 'error');
        }
    } catch (error) {
        showNotification('解散群组失败: ' + error.message, 'error');
    }
}