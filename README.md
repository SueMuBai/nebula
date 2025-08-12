# Nebula 星云精简版

基于 Java Spring Boot + WebSocket + SQLite 的轻量级即时通讯系统

## 🎯 功能特性

### 核心功能
- ✅ **用户管理**: 手机号注册/登录，JWT认证，个人信息维护
- ✅ **好友系统**: 搜索添加好友（ID/手机号），好友请求处理，双向好友关系
- ✅ **实时聊天**: WebSocket实时消息，消息状态追踪（已送达/已读）
- ✅ **陌生人匹配**: 随机推荐算法，双盲连接机制，24小时临时会话
- ✅ **群聊系统**: 创建/解散群组（≤200人），成员权限管理，群消息广播

### 技术特色
- 🚀 **轻量级单机方案**: 使用SQLite嵌入式数据库，无需复杂部署
- 📱 **现代化前端**: 响应式设计，支持桌面和移动端
- 🔒 **安全认证**: JWT token认证，密码加密存储
- ⚡ **高性能**: WebSocket长连接，消息实时推送
- 🧹 **自动清理**: 定时清理过期临时会话

## 🏗️ 技术架构

### 后端技术栈
- **语言**: Java 21
- **框架**: Spring Boot 3.2.5
- **数据库**: SQLite (嵌入式)
- **通信**: WebSocket + HTTP RESTful API
- **认证**: JWT + Spring Security
- **构建工具**: Maven

### 前端技术栈
- **语言**: HTML5 + CSS3 + JavaScript ES6
- **样式**: 原生CSS，响应式设计
- **通信**: WebSocket API + Fetch API
- **架构**: 模块化设计，事件驱动

### 数据库设计
```sql
-- 用户表
users (id, phone, password, nickname, avatar, status, created_at)

-- 好友关系表
friendships (user_a, user_b, status, remark, created_at)

-- 消息表（按月分表）
messages_YYYYMM (id, sender, receiver, type, content, status, timestamp)

-- 群组表
groups (id, name, owner, create_time)

-- 群成员表
group_members (group_id, user_id, role, joined_at)
```

## 🚀 快速开始

### 环境要求
- Java 21 或更高版本
- Maven 3.6 或更高版本

### 安装依赖
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install openjdk-21-jdk maven

# CentOS/RHEL
sudo yum install java-21-openjdk maven

# 验证安装
java --version
mvn --version
```

### 启动应用

1. **使用启动脚本**（推荐）:
```bash
./start.sh
```

2. **手动启动**:
```bash
# 编译项目
mvn clean compile

# 启动应用
mvn spring-boot:run
```

### 访问应用
- **前端页面**: http://localhost:8080/index.html
- **API接口**: http://localhost:8080/api
- **WebSocket**: ws://localhost:8080/chat

## 📱 使用说明

### 用户注册登录
1. 打开前端页面
2. 点击"没有账号？立即注册"
3. 填写手机号、密码、昵称完成注册
4. 使用注册的账号登录

### 添加好友
1. 点击"通讯录"标签
2. 点击"添加好友"按钮
3. 输入对方手机号或用户ID搜索
4. 发送好友请求，等待对方同意

### 开始聊天
1. 在"通讯录"中点击好友的"聊天"按钮
2. 或在"聊天"列表中选择会话
3. 输入消息并发送
4. 支持实时消息推送

### 陌生人匹配
1. 点击"陌生人匹配"标签
2. 点击"随机匹配"找到陌生人
3. 确认匹配建立24小时临时会话
4. 可以延长会话时间

### 群聊功能
1. 点击"群聊"标签
2. 点击"创建群聊"
3. 输入群名，选择好友成员
4. 创建后可进行群聊

## 🔌 API 接口文档

### 用户认证
```http
POST /api/user/register    # 用户注册
POST /api/user/login       # 用户登录
POST /api/user/logout      # 用户登出
GET  /api/user/profile     # 获取用户信息
PUT  /api/user/profile     # 更新用户信息
```

### 好友管理
```http
POST /api/friends/search   # 搜索用户
POST /api/friends/request  # 发送好友请求
POST /api/friends/approve  # 处理好友请求
GET  /api/friends/requests # 获取好友请求列表
GET  /api/friends/list     # 获取好友列表
```

### 聊天功能
```http
GET  /api/chat/history     # 获取聊天记录
GET  /api/chat/recent      # 获取最近聊天
POST /api/chat/read        # 标记消息已读
GET  /api/chat/unread-count # 获取未读消息数
```

### WebSocket 消息格式
```javascript
// 发送消息
{
  "type": "text",
  "to": 2002,
  "content": "Hello",
  "messageType": 0
}

// 接收消息
{
  "type": "text",
  "from": 1001,
  "to": 2002,
  "content": "Hello",
  "timestamp": 1715589000
}
```

### 陌生人匹配
```http
POST /api/match/random           # 随机匹配
POST /api/match/confirm/{userId} # 确认匹配
GET  /api/match/active          # 获取活跃匹配
POST /api/match/extend/{userId} # 延长匹配
```

### 群组管理
```http
POST   /api/groups/create        # 创建群组
POST   /api/groups/{id}/invite   # 邀请成员
GET    /api/groups/my-groups     # 获取我的群组
GET    /api/groups/{id}/members  # 获取群成员
POST   /api/groups/{id}/leave    # 退出群组
DELETE /api/groups/{id}          # 解散群组
```

## 🔧 配置说明

### 应用配置 (application.properties)
```properties
# 服务器配置
server.port=8080

# 数据库配置
spring.datasource.url=jdbc:sqlite:nebula.db
spring.datasource.driver-class-name=org.sqlite.JDBC

# JWT 配置
jwt.secret=nebulaSecretKeyForJWTTokenGeneration2024
jwt.expiration=86400000

# 文件上传配置
spring.servlet.multipart.max-file-size=10MB
spring.servlet.multipart.max-request-size=10MB
```

### 性能优化策略
- **消息批处理**: 每100ms批量入库
- **连接管理**: 使用WeakHashMap维护在线session
- **SQLite优化**: PRAGMA journal_mode=WAL
- **资源清理**: 定时清除24小时未活动临时会话

## 📂 项目结构

```
nebula/
├── src/main/java/cn/nebula/
│   ├── NebulaApplication.java      # 主启动类
│   ├── config/                     # 配置类
│   │   ├── DatabaseConfig.java    # 数据库配置
│   │   ├── SecurityConfig.java    # 安全配置
│   │   ├── WebSocketConfig.java   # WebSocket配置
│   │   └── ScheduleConfig.java    # 定时任务配置
│   ├── controller/                 # 控制器
│   │   ├── UserController.java    # 用户控制器
│   │   ├── FriendController.java  # 好友控制器
│   │   ├── ChatController.java    # 聊天控制器
│   │   ├── MatchController.java   # 匹配控制器
│   │   └── GroupController.java   # 群组控制器
│   ├── service/                    # 服务层
│   │   ├── UserService.java       # 用户服务
│   │   ├── FriendService.java     # 好友服务
│   │   ├── ChatService.java       # 聊天服务
│   │   ├── MatchService.java      # 匹配服务
│   │   └── GroupService.java      # 群组服务
│   ├── model/                      # 数据模型
│   │   ├── User.java              # 用户模型
│   │   ├── Message.java           # 消息模型
│   │   ├── Friendship.java        # 好友关系模型
│   │   └── Group.java             # 群组模型
│   ├── websocket/                  # WebSocket处理
│   │   └── ChatWebSocketHandler.java
│   └── utils/                      # 工具类
│       └── JwtUtil.java           # JWT工具
├── static/                         # 前端资源
│   ├── index.html                 # 主页面
│   ├── css/style.css              # 样式文件
│   └── js/                        # JavaScript文件
│       ├── app.js                 # 主应用逻辑
│       ├── auth.js                # 认证模块
│       ├── chat.js                # 聊天模块
│       ├── friends.js             # 好友模块
│       ├── groups.js              # 群组模块
│       └── match.js               # 匹配模块
├── pom.xml                        # Maven配置
├── start.sh                       # 启动脚本
└── README.md                      # 项目文档
```

## 🛠️ 开发说明

### 扩展建议
1. **用户量>1万**: 增加Redis缓存消息路由表
2. **文件传输**: 支持图片、语音、文件发送
3. **消息加密**: 端到端消息加密
4. **推送通知**: 集成消息推送服务
5. **多媒体**: 支持语音通话、视频通话

### 监控指标
- **在线用户数**: JVM内置监控
- **消息吞吐**: 日志统计QPS
- **数据库大小**: SQLite文件大小监控

## 📄 许可证

本项目基于 MIT 许可证开源，详情请查看 [LICENSE](LICENSE) 文件。

## 🤝 贡献

欢迎提交 Issue 和 Pull Request 来改进这个项目！

---

**享受聊天的乐趣！** 🎉