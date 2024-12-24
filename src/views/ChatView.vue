<template>
  <div class="chat-container">
    <!-- 左侧历史记录 -->
    <div class="chat-history">
      <div class="history-header">
        <h3>历史对话</h3>
        <el-button type="primary" text @click="startNewChat">
          <el-icon><Plus /></el-icon>新对话
        </el-button>
      </div>
      <div class="history-list">
        <div
          v-for="(chat, index) in chatHistory"
          :key="index"
          class="history-item"
          :class="{ active: currentChatId === chat.id }"
          @click="switchChat(chat.id)"
        >
          <el-icon><ChatLineSquare /></el-icon>
          <span class="history-title">{{ chat.title }}</span>
          <el-dropdown trigger="click">
            <el-icon class="more-icon"><More /></el-icon>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item @click="deleteChat(chat.id)">删除对话</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </div>
    </div>

    <!-- 右侧聊天区域 -->
    <div class="chat-main">
      <div class="messages-container" ref="messagesContainer">
        <div v-for="(msg, index) in messages" :key="index" :class="['message', msg.type]">
          <div class="message-avatar">
            <el-avatar :icon="msg.type === 'user' ? User : Service" />
          </div>
          <div class="message-content">
            <div class="message-header">
              <span class="sender-name">{{ msg.type === 'user' ? '你' : 'AI助手' }}</span>
              <span class="message-time">{{ msg.time }}</span>
            </div>
            <div class="message-text">{{ msg.content }}</div>
          </div>
        </div>
        <div v-if="loading" class="message bot">
          <div class="message-avatar">
            <el-avatar :icon="Service" />
          </div>
          <div class="message-content">
            <div class="typing-indicator">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        </div>
      </div>

      <div class="chat-input-container">
        <el-input
          v-model="message"
          type="textarea"
          :rows="3"
          placeholder="请输入您的问题..."
          @keyup.enter.exact="sendMessage"
          :disabled="loading"
          resize="none"
        >
          <template #append>
            <el-tooltip content="发送消息 (Enter)" placement="top" :disabled="loading">
              <el-button type="primary" @click="sendMessage" :loading="loading">
                <el-icon><Position /></el-icon>
              </el-button>
            </el-tooltip>
          </template>
        </el-input>
        <div class="input-tips">按 Enter 发送，Shift + Enter 换行</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick, watch } from 'vue'
import { User, Service, Position, ChatLineSquare, Plus, More } from '@element-plus/icons-vue'

interface Message {
  content: string
  type: 'user' | 'bot'
  time: string
}

interface Chat {
  id: number
  title: string
  messages: Message[]
}

const message = ref('')
const loading = ref(false)
const messages = ref<Message[]>([
  {
    content: '你好！我是海洋鱼类知识助手，请问有什么可以帮助你的吗？',
    type: 'bot',
    time: new Date().toLocaleTimeString(),
  },
])
const messagesContainer = ref<HTMLElement | null>(null)
const currentChatId = ref(1)
const chatHistory = ref<Chat[]>([
  {
    id: 1,
    title: '新对话',
    messages: [],
  },
])

const mockBotResponse = async (question: string) => {
  await new Promise((resolve) => setTimeout(resolve, 1000))
  return `这是关于"${question}"的回答...`
}

const scrollToBottom = async () => {
  await nextTick()
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
  }
}

const sendMessage = async () => {
  if (!message.value.trim() || loading.value) return

  const userMessage: Message = {
    content: message.value,
    type: 'user',
    time: new Date().toLocaleTimeString(),
  }
  messages.value.push(userMessage)
  message.value = ''
  loading.value = true

  await scrollToBottom()

  try {
    const response = await mockBotResponse(userMessage.content)
    messages.value.push({
      content: response,
      type: 'bot',
      time: new Date().toLocaleTimeString(),
    })
  } catch (error) {
    console.error('Error:', error)
    messages.value.push({
      content: '抱歉，我遇到了一些问题，请稍后再试。',
      type: 'bot',
      time: new Date().toLocaleTimeString(),
    })
  } finally {
    loading.value = false
    await scrollToBottom()
  }
}

const startNewChat = () => {
  const newId = chatHistory.value.length + 1
  chatHistory.value.push({
    id: newId,
    title: `新对话 ${newId}`,
    messages: [],
  })
  currentChatId.value = newId
  messages.value = [messages.value[0]] // 保留欢迎消息
}

const switchChat = (id: number) => {
  currentChatId.value = id
  // TODO: 加载对应对话的消息
}

const deleteChat = (id: number) => {
  chatHistory.value = chatHistory.value.filter((chat) => chat.id !== id)
  if (currentChatId.value === id) {
    currentChatId.value = chatHistory.value[0]?.id || 0
  }
}

watch(
  messages,
  () => {
    const currentChat = chatHistory.value.find((chat) => chat.id === currentChatId.value)
    if (currentChat) {
      currentChat.messages = messages.value
      if (messages.value.length > 1) {
        currentChat.title = messages.value[1].content.slice(0, 20) + '...'
      }
    }
  },
  { deep: true },
)

onMounted(() => {
  scrollToBottom()
})
</script>

<style scoped>
.chat-container {
  height: calc(100vh - 100px);
  display: flex;
  gap: 20px;
  padding: 20px;
  background: var(--el-fill-color-blank);
}

.chat-history {
  width: 260px;
  background: var(--el-bg-color);
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  box-shadow: var(--el-box-shadow-light);
}

.history-header {
  padding: 16px;
  border-bottom: 1px solid var(--el-border-color-light);
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: var(--el-bg-color);
  border-radius: 8px 8px 0 0;
}

.history-header h3 {
  margin: 0;
  font-size: 16px;
  color: var(--el-text-color-primary);
}

.history-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.history-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
  color: var(--el-text-color-primary);
}

.history-item:hover {
  background: var(--el-fill-color);
}

.history-item.active {
  background: var(--el-color-primary);
  color: white;
}

.history-item.active .el-icon {
  color: white;
}

.history-title {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 14px;
}

.more-icon {
  opacity: 0;
  transition: opacity 0.3s ease;
}

.history-item:hover .more-icon {
  opacity: 1;
}

.chat-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: var(--el-bg-color);
  border-radius: 8px;
  box-shadow: var(--el-box-shadow-light);
}

.messages-container {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.message {
  display: flex;
  gap: 12px;
  max-width: 80%;
}

.message.bot {
  align-self: flex-start;
}

.message.user {
  align-self: flex-end;
  flex-direction: row-reverse;
}

.message-content {
  background: var(--el-fill-color-blank);
  padding: 12px;
  border-radius: 8px;
  position: relative;
  box-shadow: var(--el-box-shadow-lighter);
}

.message.user .message-content {
  background: var(--el-color-primary);
  color: white;
}

.message.user .message-header,
.message.user .message-text,
.message.user .message-time {
  color: white !important;
}

.message-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
  font-size: 12px;
}

.sender-name {
  font-weight: 500;
  color: var(--el-text-color-primary);
}

.message-time {
  color: var(--el-text-color-secondary);
}

.message-text {
  color: var(--el-text-color-primary);
  line-height: 1.5;
}

.chat-input-container {
  padding: 20px;
  border-top: 1px solid var(--el-border-color-light);
  background: var(--el-bg-color);
  border-radius: 0 0 8px 8px;
}

.input-tips {
  margin-top: 8px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  text-align: right;
}

.typing-indicator {
  display: flex;
  gap: 4px;
  padding: 12px 8px;
}

.typing-indicator span {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--el-color-info);
  animation: bounce 1.4s infinite ease-in-out;
}

.typing-indicator span:nth-child(1) {
  animation-delay: -0.32s;
}

.typing-indicator span:nth-child(2) {
  animation-delay: -0.16s;
}

@keyframes bounce {
  0%,
  80%,
  100% {
    transform: scale(0);
  }
  40% {
    transform: scale(1);
  }
}

/* 自定义滚动条样式 */
.messages-container::-webkit-scrollbar,
.history-list::-webkit-scrollbar {
  width: 6px;
}

.messages-container::-webkit-scrollbar-thumb,
.history-list::-webkit-scrollbar-thumb {
  background: var(--el-border-color-lighter);
  border-radius: 3px;
}

.messages-container::-webkit-scrollbar-thumb:hover,
.history-list::-webkit-scrollbar-thumb:hover {
  background: var(--el-border-color);
}

/* 暗色主题优化 */
:root[class~='dark'] .chat-container {
  background: var(--el-bg-color);
}

:root[class~='dark'] .chat-history,
:root[class~='dark'] .chat-main {
  box-shadow: 0 0 0 1px var(--el-border-color);
}

:root[class~='dark'] .message-content {
  background: var(--el-bg-color-overlay);
}
</style>
