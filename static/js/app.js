// 全局变量
let currentUser = null;
let authToken = null;
let wsConnection = null;
let currentChatId = null;

// API 基础地址
const API_BASE = 'http://localhost:8080/api';

// DOM 元素
const loginPage = document.getElementById('loginPage');
const registerPage = document.getElementById('registerPage');
const mainPage = document.getElementById('mainPage');
const modal = document.getElementById('modal');

// 工具函数
function showPage(page) {
    document.querySelectorAll('.page').forEach(p => p.classList.add('hidden'));
    page.classList.remove('hidden');
}

function showModal(content) {
    document.getElementById('modalBody').innerHTML = content;
    modal.classList.remove('hidden');
}

function hideModal() {
    modal.classList.add('hidden');
}

function formatTime(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 24 * 60 * 60 * 1000) {
        return date.toLocaleTimeString('zh-CN', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
    } else {
        return date.toLocaleDateString('zh-CN', { 
            month: '2-digit', 
            day: '2-digit' 
        });
    }
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 12px 24px;
        border-radius: 6px;
        color: white;
        font-size: 14px;
        z-index: 2000;
        animation: slideIn 0.3s ease;
    `;
    
    switch (type) {
        case 'success':
            notification.style.backgroundColor = '#28a745';
            break;
        case 'error':
            notification.style.backgroundColor = '#dc3545';
            break;
        case 'warning':
            notification.style.backgroundColor = '#ffc107';
            notification.style.color = '#212529';
            break;
        default:
            notification.style.backgroundColor = '#007bff';
    }
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// API 请求函数
async function apiRequest(url, options = {}) {
    const config = {
        headers: {
            'Content-Type': 'application/json',
            ...options.headers
        },
        ...options
    };
    
    if (authToken) {
        config.headers['Authorization'] = `Bearer ${authToken}`;
    }
    
    try {
        const response = await fetch(`${API_BASE}${url}`, config);
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || '请求失败');
        }
        
        return data;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

// 标签切换
function initTabs() {
    const navItems = document.querySelectorAll('.nav-item');
    const tabContents = document.querySelectorAll('.tab-content');
    
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const tabName = item.dataset.tab;
            
            // 更新导航状态
            navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');
            
            // 更新内容显示
            tabContents.forEach(content => content.classList.remove('active'));
            document.getElementById(`${tabName}Tab`).classList.add('active');
            
            // 根据标签加载相应内容
            switch (tabName) {
                case 'chats':
                    loadRecentChats();
                    break;
                case 'friends':
                    loadFriends();
                    break;
                case 'groups':
                    loadGroups();
                    break;
                case 'match':
                    loadActiveMatches();
                    break;
            }
        });
    });
}

// 模态框事件
function initModal() {
    const modalClose = document.querySelector('.modal-close');
    
    modalClose.addEventListener('click', hideModal);
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            hideModal();
        }
    });
}

// WebSocket 连接
function connectWebSocket() {
    if (!authToken) return;
    
    const wsUrl = `ws://localhost:8080/chat?token=${authToken}`;
    wsConnection = new WebSocket(wsUrl);
    
    wsConnection.onopen = () => {
        console.log('WebSocket connected');
        showNotification('连接成功', 'success');
    };
    
    wsConnection.onmessage = (event) => {
        try {
            const message = JSON.parse(event.data);
            handleWebSocketMessage(message);
        } catch (error) {
            console.error('WebSocket message error:', error);
        }
    };
    
    wsConnection.onclose = () => {
        console.log('WebSocket disconnected');
        // 尝试重新连接
        setTimeout(() => {
            if (authToken) {
                connectWebSocket();
            }
        }, 5000);
    };
    
    wsConnection.onerror = (error) => {
        console.error('WebSocket error:', error);
        showNotification('连接错误', 'error');
    };
}

function handleWebSocketMessage(message) {
    switch (message.type) {
        case 'text':
        case 'voice':
        case 'img':
            handleIncomingMessage(message);
            break;
        case 'delivery_confirmation':
            handleDeliveryConfirmation(message);
            break;
        case 'error':
            showNotification(message.message, 'error');
            break;
    }
}

function handleIncomingMessage(message) {
    // 如果当前正在与发送者聊天，直接显示消息
    if (currentChatId == message.from) {
        displayMessage(message, false);
    }
    
    // 更新聊天列表
    updateChatListItem(message.from, message.content, message.timestamp);
    
    // 播放提示音
    playNotificationSound();
}

function handleDeliveryConfirmation(message) {
    if (message.success) {
        console.log('Message delivered successfully');
    }
}

function playNotificationSound() {
    // 简单的提示音实现
    const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEaAz2V1/HT1');
    audio.volume = 0.3;
    audio.play().catch(() => {
        // 忽略播放失败
    });
}

// 初始化应用
function initApp() {
    // 检查本地存储的令牌
    const storedToken = localStorage.getItem('authToken');
    const storedUser = localStorage.getItem('currentUser');
    
    if (storedToken && storedUser) {
        authToken = storedToken;
        currentUser = JSON.parse(storedUser);
        showMainPage();
    } else {
        showPage(loginPage);
    }
    
    // 初始化各个模块
    initAuth();
    initTabs();
    initModal();
    initChat();
    initFriends();
    initGroups();
    initMatch();
}

function showMainPage() {
    showPage(mainPage);
    updateUserInfo();
    connectWebSocket();
    loadRecentChats();
}

function updateUserInfo() {
    if (currentUser) {
        document.getElementById('userName').textContent = currentUser.nickname || '用户';
        if (currentUser.avatar) {
            document.getElementById('userAvatar').src = currentUser.avatar;
        }
    }
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', initApp);