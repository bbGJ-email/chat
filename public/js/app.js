// 使用Supabase实现的实时聊天应用JavaScript代码

// DOM元素引用
const nameModal = document.getElementById('name-modal');
const nicknameInput = document.getElementById('nickname-input');
const confirmNameBtn = document.getElementById('confirm-name-btn');
const currentUserElement = document.getElementById('current-user');
const changeNameBtn = document.getElementById('change-name-btn');
const chatMessages = document.getElementById('chat-messages');
const messageForm = document.getElementById('message-form');
const messageInput = document.getElementById('message-input');
const sendBtn = document.getElementById('send-btn');
const userList = document.getElementById('user-list');

// 全局变量
let currentUser = null;
let supabaseClient = null;
const STORAGE_KEYS = {
    CURRENT_USER: 'chat_room_current_user'
};

// 初始化Supabase客户端
function initSupabase() {
    const SUPABASE_URL = 'https://xjysauofkebdsixnruok.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhqeXNhdW9ma2ViZHNpeG5ydW9rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQzOTUwOTcsImV4cCI6MjA3OTk3MTA5N30.FQlUMUUiARvSjzZ8_cvJbtggH6pl6482DBd6UcEtjxg';
    
    try {
        supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        console.log('Supabase客户端初始化成功');
        return true;
    } catch (error) {
        console.error('Supabase客户端初始化失败:', error);
        return false;
    }
}

// 初始化应用
function initApp() {
    // 初始化Supabase
    if (!initSupabase()) {
        alert('Supabase连接失败，无法使用实时聊天功能！');
    }
    
    // 尝试从localStorage恢复当前用户
    try {
        const savedUser = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
        if (savedUser) {
            currentUser = savedUser;
            currentUserElement.textContent = `当前用户: ${currentUser}`;
            hideNameModal();
            messageInput.disabled = false;
            sendBtn.disabled = false;
            
            // 恢复消息历史
            loadMessagesFromSupabase();
            // 开始监听新消息
            startRealtimeListeners();
            // 更新用户列表
            updateUserList();
        } else {
            // 显示昵称设置模态框
            showNameModal();
        }
    } catch (error) {
        console.error('初始化应用失败:', error);
        showNameModal();
    }
    
    // 绑定事件监听器
    bindEventListeners();
    
    // 添加清除聊天记录按钮
    addClearChatButton();
    
    // 为输入框添加自动调整高度的事件监听器
    messageInput.addEventListener('input', autoResizeTextarea);
    messageInput.addEventListener('keydown', (e) => {
        // 允许Shift+Enter换行，Enter发送消息
        if (e.key === 'Enter' && !e.shiftKey) {
            // 不阻止默认行为，让form的submit处理
        } else if (e.key === 'Enter' && e.shiftKey) {
            // 允许Shift+Enter插入换行
            setTimeout(autoResizeTextarea.bind(messageInput), 0);
        }
    });
    
    // 初始化输入框样式
    messageInput.style.minHeight = '40px';
    messageInput.style.maxHeight = '120px';
    messageInput.style.overflowY = 'hidden';
    messageInput.style.resize = 'none';
}

// 显示昵称设置模态框
function showNameModal() {
    nameModal.style.display = 'flex';
    nicknameInput.focus();
}

// 隐藏昵称设置模态框
function hideNameModal() {
    nameModal.style.display = 'none';
}

// 绑定事件监听器
function bindEventListeners() {
    // 确认昵称
    confirmNameBtn.addEventListener('click', handleNameConfirmation);
    nicknameInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleNameConfirmation();
        }
    });
    
    // 更改昵称按钮
    changeNameBtn.addEventListener('click', showNameModal);
    
    // 发送消息表单
    messageForm.addEventListener('submit', handleMessageSubmit);
    
    // 消息输入框自动调整高度
    messageInput.addEventListener('input', autoResizeTextarea);
    
    // ESC键关闭模态框
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && nameModal.style.display === 'flex' && currentUser) {
            hideNameModal();
        }
    });
}

// 处理昵称确认
async function handleNameConfirmation() {
    const nickname = nicknameInput.value.trim();
    
    if (!nickname) {
        alert('请输入有效的昵称');
        return;
    }
    
    if (nickname.length > 20) {
        alert('昵称不能超过20个字符');
        return;
    }
    
    currentUser = nickname;
    currentUserElement.textContent = `当前用户: ${currentUser}`;
    
    // 保存当前用户到localStorage
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, currentUser);
    
    // 将用户信息保存到Supabase
    try {
        if (supabaseClient) {
            await supabaseClient.from('users').upsert({
                nickname: currentUser,
                last_active: new Date().toISOString()
            }, { onConflict: 'nickname' });
        }
    } catch (error) {
        console.error('保存用户信息到Supabase失败:', error);
    }
    
    hideNameModal();
    nicknameInput.value = '';
    
    // 启用消息输入和发送按钮
    messageInput.disabled = false;
    sendBtn.disabled = false;
    messageInput.focus();
    
    // 更新用户列表
    updateUserList();
    
    // 恢复消息历史
    loadMessagesFromSupabase();
    
    // 开始监听新消息
    startRealtimeListeners();
    
    // 添加系统消息
    addSystemMessage('您已成功加入聊天室');
}

// 从Supabase加载消息历史
async function loadMessagesFromSupabase() {
    try {
        if (!supabaseClient) return;
        
        // 清除当前消息列表
        chatMessages.innerHTML = '';
        
        // 从Supabase获取最新的100条消息
        const { data, error } = await supabaseClient
            .from('messages')
            .select('*')
            .order('created_at', { ascending: true })
            .limit(100);
        
        if (error) {
            throw error;
        }
        
        // 添加消息到聊天窗口
        data.forEach(message => {
            addMessage({
                nickname: message.nickname,
                text: message.content,
                timestamp: message.created_at
            });
        });
    } catch (error) {
        console.error('加载消息历史失败:', error);
        addSystemMessage('加载消息历史失败，请刷新页面重试');
    }
}

// 发送消息到Supabase
async function sendMessageToSupabase(message) {
    try {
        if (!supabaseClient) return;
        
        const { error } = await supabaseClient.from('messages').insert({
            nickname: message.nickname,
            content: message.text,
            created_at: message.timestamp
        });
        
        if (error) {
            throw error;
        }
    } catch (error) {
        console.error('保存消息失败:', error);
        addSystemMessage('发送消息失败，请重试');
        throw error;
    }
}

// 处理消息提交
async function handleMessageSubmit(e) {
    e.preventDefault();
    
    const messageText = messageInput.value.trim();
    
    if (!messageText || !currentUser) {
        return;
    }
    
    // 构造消息对象
    const message = {
        nickname: currentUser,
        text: messageText,
        timestamp: new Date().toISOString()
    };
    
    try {
        // 发送消息到Supabase
        await sendMessageToSupabase(message);
        
        // 清空输入框并重置高度
        messageInput.value = '';
        messageInput.style.height = 'auto';
        messageInput.focus();
    } catch (error) {
        // 如果发送失败，不添加到本地显示
        console.error('发送消息失败:', error);
    }
}

// 开始监听实时消息
function startRealtimeListeners() {
    try {
        if (!supabaseClient) return;
        
        // 监听messages表的插入事件
        const messagesSubscription = supabaseClient
            .channel('public:messages')
            .on('postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'messages' },
                payload => {
                    // 检查消息是否是当前用户发送的（避免重复显示）
                    const message = {
                        nickname: payload.new.nickname,
                        text: payload.new.content,
                        timestamp: payload.new.created_at
                    };
                    
                    // 添加消息到聊天窗口
                    addMessage(message);
                }
            )
            .subscribe(status => {
                console.log('实时订阅状态:', status);
            });
            
        // 设置定期更新用户活动状态
        setInterval(updateUserActivity, 30000);
    } catch (error) {
        console.error('启动实时监听失败:', error);
        addSystemMessage('无法建立实时连接，请刷新页面重试');
    }
}

// 更新用户活动状态
async function updateUserActivity() {
    try {
        if (!supabaseClient || !currentUser) return;
        
        await supabaseClient.from('users').upsert({
            nickname: currentUser,
            last_active: new Date().toISOString()
        }, { onConflict: 'nickname' });
    } catch (error) {
        console.error('更新用户活动状态失败:', error);
    }
}

// 添加消息到聊天窗口
function addMessage(data) {
    const messageDiv = document.createElement('div');
    const isCurrentUser = data.nickname === currentUser;
    
    messageDiv.className = `message ${isCurrentUser ? 'user-message' : 'other-message'}`;
    
    const formattedTime = formatTime(data.timestamp);
    
    messageDiv.innerHTML = `
        <div class="message-header">
            ${data.nickname} <span style="font-weight: normal; color: #888; font-size: 0.8em;">${formattedTime}</span>
        </div>
        <div class="message-content">${escapeHtml(data.text)}</div>
    `;
    
    chatMessages.appendChild(messageDiv);
    
    // 自动滚动到底部
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// 添加系统消息
function addSystemMessage(text) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'system-message';
    messageDiv.textContent = text;
    
    chatMessages.appendChild(messageDiv);
    
    // 自动滚动到底部
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// 更新用户列表
async function updateUserList() {
    try {
        if (!supabaseClient) {
            // 如果Supabase不可用，至少显示当前用户
            userList.innerHTML = '';
            const li = document.createElement('li');
            li.textContent = currentUser ? `${currentUser} (您)` : '未登录';
            if (currentUser) {
                li.style.fontWeight = 'bold';
                li.style.color = '#4a6fa5';
            }
            userList.appendChild(li);
            return;
        }
        
        // 从Supabase获取最近活动的用户（过去5分钟内活跃）
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
        const { data, error } = await supabaseClient
            .from('users')
            .select('nickname')
            .gte('last_active', fiveMinutesAgo);
        
        if (error) {
            throw error;
        }
        
        // 更新UI
        userList.innerHTML = '';
        const users = data.map(item => item.nickname);
        
        // 确保当前用户在列表中
        if (currentUser && !users.includes(currentUser)) {
            users.push(currentUser);
        }
        
        users.forEach(user => {
            const li = document.createElement('li');
            li.textContent = user === currentUser ? `${user} (您)` : user;
            
            // 为当前用户添加特殊样式
            if (user === currentUser) {
                li.style.fontWeight = 'bold';
                li.style.color = '#4a6fa5';
            }
            
            userList.appendChild(li);
        });
    } catch (error) {
        console.error('更新用户列表失败:', error);
        // 出错时至少显示当前用户
        userList.innerHTML = '';
        const li = document.createElement('li');
        li.textContent = currentUser ? `${currentUser} (您)` : '未登录';
        if (currentUser) {
            li.style.fontWeight = 'bold';
            li.style.color = '#4a6fa5';
        }
        userList.appendChild(li);
    }
}

// 格式化时间
function formatTime(timestamp) {
    const date = new Date(timestamp);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
}

// HTML转义
function escapeHtml(text) {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// 模拟用户在线状态（定期更新活动时间）
function setupUserActivityTracker() {
    // 定期更新用户列表
    setInterval(() => {
        updateUserList();
    }, 30000); // 每30秒更新一次
}

// 添加清除聊天记录按钮
function addClearChatButton() {
    const chatHeader = document.querySelector('.chat-header');
    const clearBtn = document.createElement('button');
    clearBtn.id = 'clear-chat-btn';
    clearBtn.textContent = '清除本地记录';
    clearBtn.style.cssText = `
        padding: 5px 15px;
        background-color: #e74c3c;
        color: white;
        border: none;
        border-radius: 20px;
        cursor: pointer;
        font-size: 0.9rem;
        transition: all 0.3s ease;
        margin-left: 10px;
    `;
    
    clearBtn.addEventListener('click', () => {
        if (confirm('确定要清除本地显示的聊天记录吗？这不会影响其他用户看到的消息。')) {
            // 清空UI
            chatMessages.innerHTML = '<div class="system-message">本地聊天记录已清除</div>';
        }
    });
    
    chatHeader.appendChild(clearBtn);
}

// 清除聊天历史（仅本地显示）
function clearChatHistory() {
    // 清空UI
    chatMessages.innerHTML = '<div class="system-message">本地聊天记录已清除</div>';
}

// 自动调整输入框高度
function autoResizeTextarea() {
    this.style.height = 'auto';
    this.style.height = (this.scrollHeight) + 'px';
    
    // 设置最大高度限制
    const maxHeight = 120; // 最大高度120px
    if (this.scrollHeight > maxHeight) {
        this.style.height = maxHeight + 'px';
        this.style.overflowY = 'auto';
    } else {
        this.style.overflowY = 'hidden';
    }
}

// 清理不活跃用户（在实际应用中可能需要更复杂的逻辑）
async function cleanupInactiveUsers() {
    // 应用关闭前更新用户最后活跃时间
    try {
        if (supabaseClient && currentUser) {
            await supabaseClient.from('users').upsert({
                nickname: currentUser,
                last_active: new Date().toISOString()
            }, { onConflict: 'nickname' });
        }
    } catch (error) {
        console.error('更新用户状态失败:', error);
    }
}

// 页面加载完成后初始化应用
document.addEventListener('DOMContentLoaded', () => {
    initApp();
    setupUserActivityTracker();
    
    // 页面关闭前清理
    window.addEventListener('beforeunload', () => {
        cleanupInactiveUsers();
    });
});