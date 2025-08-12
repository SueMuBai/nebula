// 认证模块
function initAuth() {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const showRegisterBtn = document.getElementById('showRegister');
    const showLoginBtn = document.getElementById('showLogin');
    const logoutBtn = document.getElementById('logoutBtn');
    
    // 登录表单提交
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = new FormData(loginForm);
        const phone = formData.get('phone');
        const password = formData.get('password');
        
        if (!phone || !password) {
            showNotification('请填写完整信息', 'error');
            return;
        }
        
        try {
            const response = await apiRequest('/user/login', {
                method: 'POST',
                body: JSON.stringify({ phone, password })
            });
            
            if (response.success) {
                authToken = response.token;
                currentUser = {
                    id: response.userId,
                    nickname: response.nickname,
                    phone: phone
                };
                
                // 保存到本地存储
                localStorage.setItem('authToken', authToken);
                localStorage.setItem('currentUser', JSON.stringify(currentUser));
                
                showNotification('登录成功', 'success');
                showMainPage();
            } else {
                showNotification(response.message, 'error');
            }
        } catch (error) {
            showNotification('登录失败: ' + error.message, 'error');
        }
    });
    
    // 注册表单提交
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = new FormData(registerForm);
        const phone = formData.get('phone');
        const password = formData.get('password');
        const nickname = formData.get('nickname');
        
        if (!phone || !password || !nickname) {
            showNotification('请填写完整信息', 'error');
            return;
        }
        
        if (!/^1[3-9]\d{9}$/.test(phone)) {
            showNotification('请输入有效的手机号', 'error');
            return;
        }
        
        if (password.length < 6) {
            showNotification('密码至少6位', 'error');
            return;
        }
        
        try {
            const response = await apiRequest('/user/register', {
                method: 'POST',
                body: JSON.stringify({ phone, password, nickname })
            });
            
            if (response.success) {
                showNotification('注册成功，请登录', 'success');
                showPage(loginPage);
                registerForm.reset();
            } else {
                showNotification(response.message, 'error');
            }
        } catch (error) {
            showNotification('注册失败: ' + error.message, 'error');
        }
    });
    
    // 显示注册页面
    showRegisterBtn.addEventListener('click', (e) => {
        e.preventDefault();
        showPage(registerPage);
    });
    
    // 显示登录页面
    showLoginBtn.addEventListener('click', (e) => {
        e.preventDefault();
        showPage(loginPage);
    });
    
    // 退出登录
    logoutBtn.addEventListener('click', async () => {
        try {
            await apiRequest('/user/logout', {
                method: 'POST'
            });
        } catch (error) {
            console.error('Logout error:', error);
        }
        
        // 清除本地数据
        localStorage.removeItem('authToken');
        localStorage.removeItem('currentUser');
        authToken = null;
        currentUser = null;
        
        // 关闭WebSocket连接
        if (wsConnection) {
            wsConnection.close();
            wsConnection = null;
        }
        
        showNotification('已退出登录', 'success');
        showPage(loginPage);
    });
}