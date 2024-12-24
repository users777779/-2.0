import { ElMessage } from 'element-plus'

export class AppError extends Error {
  constructor(
    message: string,
    public readonly code?: string,
  ) {
    super(message)
    this.name = 'AppError'
  }
}

export const handleError = (error: Error | AppError | unknown, context?: string): void => {
  if (error instanceof AppError) {
    console.error(`[${error.code}] ${error.message}`)
    ElMessage.error(error.message)
  } else if (error instanceof Error) {
    console.error(context ? `Error in ${context}: ${error.message}` : error.message)
    ElMessage.error(error.message)
  } else {
    console.error('Unknown error:', error)
    ElMessage.error('发生未知错误')
  }
}
