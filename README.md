注：开源时记得更换自己的supabase，否则无法使用，然后直接部署即可使用
# 实时聊天应用

这是一个使用Supabase实现实时通信的聊天应用。用户可以在不同浏览器、不同设备之间进行实时聊天，消息会立即同步到所有在线用户。

## 功能特点

- ✅ 实时消息发送和接收
- ✅ 多用户支持，跨浏览器/设备通信
- ✅ 实时在线用户列表显示
- ✅ 持久化消息历史记录
- ✅ 响应式设计，适配各种设备
- ✅ 用户友好的界面，包含动画效果
- ✅ 支持设置和更换昵称
- ✅ 消息按时间顺序显示并区分发送者
- ✅ Shift+Enter换行支持

## 技术栈

- **前端**: HTML5, CSS3, JavaScript (ES6+)
- **实时通信**: Supabase Realtime API
- **数据存储**: Supabase PostgreSQL
- **样式**: 纯CSS实现，无需外部框架

## Supabase配置

### 当前项目配置

应用已配置使用以下Supabase项目：
- URL: https://xjysauofkebdsixnruok.supabase.co
- API密钥已集成在代码中

### 必要的数据表

应用需要Supabase中创建两个数据表：

1. **messages表**：存储聊天消息
   ```sql
   CREATE TABLE messages (
     id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
     nickname TEXT NOT NULL,
     content TEXT NOT NULL,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );
   ```

2. **users表**：存储用户信息
   ```sql
   CREATE TABLE users (
     id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
     nickname TEXT NOT NULL UNIQUE,
     last_active TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );
   ```

### 重要配置要求

要使应用正常工作，请确保在Supabase控制台中：
1. 创建了上述两个数据表
2. 为表设置了正确的权限策略，允许匿名用户进行读/写操作
3. 启用了messages表的Realtime复制功能，选择Insert事件

## 如何使用

1. **运行应用**：
   - 双击`public/index.html`文件，或在浏览器中打开该文件
   - 首次使用时，需要设置一个昵称
   - 开始聊天！

2. **测试实时功能**：
   - 在多个浏览器标签页或多个设备上打开应用
   - 使用不同的昵称登录
   - 发送消息，观察消息如何实时同步到所有窗口

## 功能使用说明

- **设置昵称**：首次打开应用时会提示设置昵称，或点击顶部的"更换昵称"按钮
- **发送消息**：在底部输入框中输入消息，按Enter键发送
- **多行消息**：按住Shift+Enter可以在输入框中插入换行
- **查看在线用户**：右侧边栏显示最近5分钟内活跃的用户列表
- **清除本地记录**：点击"清除本地记录"按钮可以清空当前页面的聊天记录（不影响其他用户）

## 项目结构

```
fangzheng/
├── public/                  # 公共资源文件
│   ├── css/                 # CSS样式文件
│   │   └── style.css        # 主样式文件
│   ├── js/                  # JavaScript文件
│   │   └── app.js           # 主要JavaScript代码，包含Supabase集成
│   └── index.html           # 主HTML页面
├── server/                  # 后端相关文件（当前未使用）
└── README.md                # 项目说明文档
```

## 技术实现细节

### 实时消息机制

- 使用Supabase Realtime API监听数据库变更
- 当有新消息插入时，所有连接的客户端立即收到通知
- 消息按时间戳排序，确保显示顺序正确

### 用户在线状态

- 用户加入时创建或更新用户记录
- 定期更新用户的最后活跃时间
- 用户列表显示最近5分钟内活跃的用户

### 错误处理

- 完善的错误捕获和提示机制
- 网络问题时提供友好的用户反馈
- 自动重试关键操作

## 注意事项

1. **隐私与安全**：
   - 当前实现使用匿名访问，所有用户都可以查看所有消息
   - 在生产环境中，建议添加用户认证和授权机制

2. **数据保留**：
   - 消息存储在Supabase数据库中，理论上会永久保留
   - 应用每次加载最新的100条消息

3. **Supabase限制**：
   - 免费层级的Supabase项目有API调用限制
   - 如遇连接问题，请检查Supabase项目状态

## 故障排除

1. **无法连接到Supabase**：
   - 检查网络连接
   - 刷新页面尝试重新连接
   - 查看浏览器控制台的错误信息

2. **消息不同步**：
   - 确认Supabase的Realtime功能已正确配置
   - 检查数据表权限设置

3. **用户列表不更新**：
   - 用户列表每30秒自动更新一次
   - 确保users表配置正确

## 浏览器兼容性

支持所有现代浏览器：
- Chrome (最新版本)
- Firefox (最新版本)
- Safari (最新版本)
- Edge (最新版本)

## 许可证

本项目仅供学习和演示使用。
