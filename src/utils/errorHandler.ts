// 定义错误类型
export enum ErrorType {
  DATABASE = 'DATABASE',
  NETWORK = 'NETWORK',
  NODE = 'NODE',
  GRAPH = 'GRAPH',
  UNKNOWN = 'UNKNOWN',
}

// 定义错误消息接口
interface ErrorMessage {
  title: string
  message: string
  type: 'error' | 'warning' | 'info'
  duration?: number
}

// 错误映射表
const errorMessages: Record<string, ErrorMessage> = {
  'Failed to fetch': {
    title: '网络错误',
    message: '无法连接到服务器，请检查网络连接',
    type: 'error',
    duration: 5000,
  },
  'Node not found': {
    title: '节点不存在',
    message: '请求的节点不存在或已被删除',
    type: 'warning',
    duration: 3000,
  },
  'Invalid node ID': {
    title: '无效的节点ID',
    message: '节点ID格式不正确',
    type: 'warning',
    duration: 3000,
  },
  'No data found': {
    title: '数据不存在',
    message: '未找到相关数据',
    type: 'info',
    duration: 3000,
  },
  'Database error': {
    title: '数据库错误',
    message: '数据库操作失败，请稍后重试',
    type: 'error',
    duration: 5000,
  },
}

// 错��处理函数
export const handleError = (error: unknown, defaultMessage = '操作失败'): ErrorMessage => {
  console.error('Error:', error)

  // 获取错误消息
  const errorMessage = error instanceof Error ? error.message : String(error)

  // 查找预定义的错误消息
  const predefinedError = errorMessages[errorMessage]
  if (predefinedError) {
    return predefinedError
  }

  // 返回默认错误消息
  return {
    title: '错误',
    message: defaultMessage,
    type: 'error',
    duration: 4000,
  }
}
