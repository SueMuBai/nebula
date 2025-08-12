// 陌生人匹配模块
function initMatch() {
    const randomMatchBtn = document.getElementById('randomMatchBtn');
    
    randomMatchBtn.addEventListener('click', findRandomMatch);
}

async function findRandomMatch() {
    const randomMatchBtn = document.getElementById('randomMatchBtn');
    const originalText = randomMatchBtn.textContent;
    
    randomMatchBtn.disabled = true;
    randomMatchBtn.textContent = '匹配中...';
    
    try {
        const response = await apiRequest('/match/random', {
            method: 'POST'
        });
        
        if (response.success && response.matchedUser) {
            displayMatchResult(response.matchedUser);
        } else {
            showNotification(response.message || '暂无可匹配的用户', 'warning');
            document.getElementById('matchResult').innerHTML = `
                <div style="text-align: center; color: #6c757d; padding: 40px;">
                    <p>😔 暂时没有找到合适的匹配对象</p>
                    <p style="font-size: 14px; margin-top: 8px;">请稍后再试</p>
                </div>
            `;
        }
    } catch (error) {
        showNotification('匹配失败: ' + error.message, 'error');
    } finally {
        randomMatchBtn.disabled = false;
        randomMatchBtn.textContent = originalText;
    }
}

function displayMatchResult(matchedUser) {
    const matchResult = document.getElementById('matchResult');
    
    matchResult.innerHTML = `
        <div class="match-user">
            <h4>🎉 找到匹配对象</h4>
            <img src="${matchedUser.avatar || 'https://via.placeholder.com/80'}" alt="头像">
            <h4>${escapeHtml(matchedUser.nickname)}</h4>
            <p style="color: #6c757d; font-size: 14px;">ID: ${matchedUser.id}</p>
            <div class="match-actions">
                <button class="btn-primary" onclick="confirmMatch(${matchedUser.id}, '${escapeHtml(matchedUser.nickname)}')">确认匹配</button>
                <button class="btn-secondary" onclick="findRandomMatch()">重新匹配</button>
            </div>
        </div>
    `;
}

async function confirmMatch(userId, nickname) {
    try {
        const response = await apiRequest(`/match/confirm/${userId}`, {
            method: 'POST'
        });
        
        if (response.success) {
            if (response.pending) {
                showNotification('匹配请求已发送，等待对方确认', 'success');
                document.getElementById('matchResult').innerHTML = `
                    <div style="text-align: center; color: #6c757d; padding: 40px;">
                        <p>⏳ 等待 ${escapeHtml(nickname)} 确认匹配</p>
                        <p style="font-size: 14px; margin-top: 8px;">匹配成功后可进行24小时临时聊天</p>
                    </div>
                `;
            } else {
                showNotification('匹配成功！已建立24小时临时会话', 'success');
                document.getElementById('matchResult').innerHTML = `
                    <div style="text-align: center; padding: 40px;">
                        <p style="color: #28a745; font-size: 18px;">🎊 匹配成功！</p>
                        <p style="color: #6c757d; font-size: 14px; margin: 12px 0;">
                            与 ${escapeHtml(nickname)} 的临时会话已建立
                        </p>
                        <p style="color: #6c757d; font-size: 12px; margin-bottom: 20px;">
                            会话将在24小时后自动过期
                        </p>
                        <button class="btn-primary" onclick="startMatchChat(${userId}, '${escapeHtml(nickname)}')">
                            开始聊天
                        </button>
                    </div>
                `;
                
                // 重新加载活跃匹配
                loadActiveMatches();
            }
        } else {
            showNotification(response.message, 'error');
        }
    } catch (error) {
        showNotification('确认匹配失败: ' + error.message, 'error');
    }
}

async function loadActiveMatches() {
    try {
        const response = await apiRequest('/match/active');
        
        if (response.success) {
            displayActiveMatches(response.matches);
        }
    } catch (error) {
        console.error('Load active matches error:', error);
    }
}

function displayActiveMatches(matches) {
    const matchesList = document.getElementById('matchesList');
    
    if (!matches || matches.length === 0) {
        matchesList.innerHTML = '<div class="empty-state">暂无活跃匹配</div>';
        return;
    }
    
    matchesList.innerHTML = '';
    
    matches.forEach(match => {
        const matchItem = document.createElement('div');
        matchItem.className = 'friend-item';
        
        const timeLeft = match.timeLeft;
        const hours = Math.floor(timeLeft / (1000 * 60 * 60));
        const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
        const timeLeftText = `${hours}小时${minutes}分钟`;
        
        matchItem.innerHTML = `
            <img src="${match.avatar || 'https://via.placeholder.com/40'}" alt="头像" class="friend-avatar">
            <div class="friend-info">
                <div class="friend-name">${escapeHtml(match.nickname)} 🎲</div>
                <div class="friend-status">临时匹配 · 剩余${timeLeftText}</div>
            </div>
            <div class="friend-actions">
                <button class="btn-small btn-chat" onclick="startMatchChat(${match.userId}, '${escapeHtml(match.nickname)}')">聊天</button>
                <button class="btn-small btn-secondary" onclick="extendMatch(${match.userId})">延长</button>
            </div>
        `;
        
        matchesList.appendChild(matchItem);
    });
}

function startMatchChat(userId, nickname) {
    // 切换到聊天标签
    document.querySelector('.nav-item[data-tab="chats"]').click();
    
    // 打开聊天窗口
    setTimeout(() => {
        openChatWindow(userId, nickname + ' (临时匹配)');
    }, 100);
}

async function extendMatch(userId) {
    if (!confirm('确定要延长与此用户的临时会话吗？将延长24小时。')) return;
    
    try {
        const response = await apiRequest(`/match/extend/${userId}`, {
            method: 'POST'
        });
        
        if (response.success) {
            showNotification('临时会话已延长24小时', 'success');
            loadActiveMatches(); // 重新加载活跃匹配
        } else {
            showNotification(response.message, 'error');
        }
    } catch (error) {
        showNotification('延长会话失败: ' + error.message, 'error');
    }
}

// 定期更新活跃匹配的倒计时
setInterval(() => {
    const matchItems = document.querySelectorAll('#matchesList .friend-item');
    matchItems.forEach(item => {
        const statusEl = item.querySelector('.friend-status');
        if (statusEl && statusEl.textContent.includes('剩余')) {
            // 这里可以实现更精确的倒计时更新
            // 为了简化，我们每分钟重新加载一次活跃匹配
        }
    });
}, 60000); // 每分钟更新一次