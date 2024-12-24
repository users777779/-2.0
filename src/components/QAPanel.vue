<template>
  <div class="qa-panel">
    <div class="qa-header">
      <h3>智能问答</h3>
      <el-tooltip content="点击查看可以询问的问题类型">
        <el-button type="primary" link @click="showQuestionTypes">
          <el-icon><QuestionFilled /></el-icon>
          我可以问什么?
        </el-button>
      </el-tooltip>
    </div>

    <div class="qa-content" ref="qaContent">
      <div v-for="(msg, index) in messages" :key="index" :class="['message', msg.type]">
        <div class="message-content">{{ msg.content }}</div>
      </div>
    </div>

    <div class="qa-input">
      <el-input
        v-model="question"
        placeholder="请输入您的问题..."
        :disabled="loading"
        @keyup.enter="handleAsk"
      >
        <template #append>
          <el-button :loading="loading" @click="handleAsk">
            <el-icon><Position /></el-icon>
            提问
          </el-button>
        </template>
      </el-input>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import { Position, QuestionFilled } from '@element-plus/icons-vue'
import { qaService } from '@/services/qaService'

interface Message {
  content: string
  type: 'user' | 'assistant'
}

const loading = ref(false)
const question = ref('')
const messages = ref<Message[]>([])
const qaContent = ref<HTMLElement>()

const showQuestionTypes = () => {
  ElMessage({
    type: 'info',
    duration: 8000,
    showClose: true,
    message: `您可以询问以下类型的问题：
1. 鱼类的基本信息，如："请介绍一下梭水鱼"
2. 鱼类的特征，如："梭水鱼有什么特点？"
3. 鱼类的栖息地，如："梭水鱼生活在哪里？"
4. 鱼类的分类信息，如："梭水鱼属于什么目？"
5. 鱼类之间的关系，如："与梭水鱼相关的鱼类有哪些？"
6. 特定地区的鱼类，如："青岛有哪些鱼类？"`,
  })
}

const scrollToBottom = async () => {
  await nextTick()
  if (qaContent.value) {
    qaContent.value.scrollTop = qaContent.value.scrollHeight
  }
}

const handleAsk = async () => {
  if (!question.value.trim()) {
    ElMessage.warning('请输入问题')
    return
  }

  const userQuestion = question.value
  messages.value.push({
    content: userQuestion,
    type: 'user',
  })

  question.value = ''
  loading.value = true

  try {
    const response = await qaService.ask(userQuestion)
    messages.value.push({
      content: response.answer,
      type: 'assistant',
    })
    scrollToBottom()
  } catch (error) {
    console.error('提问失败:', error)
    const errorMessage = error instanceof Error ? error.message : '未知错误'
    messages.value.push({
      content: `抱歉，我遇到了一些问题：${errorMessage}。请稍后再试或换个问题。`,
      type: 'assistant',
    })
    scrollToBottom()
  } finally {
    loading.value = false
  }
}

// 添加默认欢迎消息
onMounted(() => {
  messages.value.push({
    content:
      '您好！我是知识图谱助手，很高兴为您服务。您可以点击右上角的"我可以问什么?"来了解可以询问的问题类型。',
    type: 'assistant',
  })
})
</script>

<style scoped>
.qa-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.qa-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 20px;
  border-bottom: 1px solid #eee;
}

.qa-header h3 {
  margin: 0;
  color: #333;
}

.qa-content {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
  background: #f9f9f9;
}

.message {
  margin-bottom: 12px;
  max-width: 80%;
}

.message.user {
  margin-left: auto;
}

.message-content {
  padding: 8px 12px;
  border-radius: 8px;
  line-height: 1.5;
  white-space: pre-wrap;
}

.user .message-content {
  background: #e6f7ff;
  color: #0066cc;
}

.assistant .message-content {
  background: #f0f0f0;
  color: #333;
}

.qa-input {
  padding: 12px 20px;
  border-top: 1px solid #eee;
}

:deep(.el-input-group__append) {
  padding: 0;
}

:deep(.el-input-group__append button) {
  border: none;
  margin: -1px;
  border-radius: 0 4px 4px 0;
}
</style>
